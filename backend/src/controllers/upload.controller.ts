import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import prisma from '../config/database';

// Upload job attachment (PDF)
export const uploadJobAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { file, jobId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Extract base64 data
    const matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid file format' });
    }

    const fileType = matches[1];
    if (!fileType.includes('pdf')) {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const fileBuffer = Buffer.from(matches[2], 'base64');
    
    // Validate file size (max 10MB)
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }

    const fileId = randomUUID();
    const fileName = `${fileId}.pdf`;
    
    // Create uploads directory structure
    const uploadDir = path.join(process.cwd(), 'uploads', 'job-attachments', jobId || 'temp');
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Save file
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, fileBuffer);
    
    // Create full URL
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/uploads/job-attachments/${jobId || 'temp'}/${fileName}`;

    // If jobId is provided, update job attachments (stored as JSON)
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });
      
      if (job) {
        const attachments = job.attachments ? (typeof job.attachments === 'string' ? JSON.parse(job.attachments) : job.attachments) : [];
        attachments.push({
          fileId,
          fileName: req.body.fileName || fileName,
          filePath: `job-attachments/${jobId}/${fileName}`,
          fileSize: fileBuffer.length,
          fileUrl,
        });
        
        await prisma.job.update({
          where: { id: jobId },
          data: { attachments: JSON.stringify(attachments) },
        });
      }
    }

    res.json({
      success: true,
      fileId,
      fileName: req.body.fileName || fileName,
      fileSize: fileBuffer.length,
      fileUrl,
      message: 'File uploaded successfully',
    });
  } catch (error: unknown) {
    console.error('Upload job attachment error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

// Delete job attachment
export const deleteJobAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { fileId, jobId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'job-attachments', jobId || 'temp', `${fileId}.pdf`);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, continue
      console.log('File not found:', filePath);
    }

    // If jobId is provided, remove from job attachments
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });
      
      if (job && job.attachments) {
        const attachments = typeof job.attachments === 'string' ? JSON.parse(job.attachments) : job.attachments;
        const filtered = attachments.filter((att: any) => att.fileId !== fileId);
        
        await prisma.job.update({
          where: { id: jobId },
          data: { attachments: JSON.stringify(filtered) },
        });
      }
    }

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete job attachment error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

// Move files from temp folder to job folder
export const moveTempFilesToJob = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId, fileIds } = req.body;

    if (!jobId || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'Job ID and file IDs array are required' });
    }

    // Verify the job exists and belongs to the user
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify the user owns the job (or is admin)
    const userId = req.user?.id;
    if (job.clientId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to move files for this job' });
    }

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const tempDir = path.join(process.cwd(), 'uploads', 'job-attachments', 'temp');
    const jobDir = path.join(process.cwd(), 'uploads', 'job-attachments', jobId);
    
    // Create job directory if it doesn't exist
    await fs.mkdir(jobDir, { recursive: true });

    const movedFiles: any[] = [];
    const errors: string[] = [];

    // Get current attachments from job
    const currentAttachments = job.attachments ? (typeof job.attachments === 'string' ? JSON.parse(job.attachments) : job.attachments) : [];

    // Move each file
    for (const fileId of fileIds) {
      try {
        const tempFilePath = path.join(tempDir, `${fileId}.pdf`);
        const jobFilePath = path.join(jobDir, `${fileId}.pdf`);

        // Check if file exists in temp folder
        try {
          await fs.access(tempFilePath);
        } catch {
          // File doesn't exist in temp, check if it's already in job folder
          try {
            await fs.access(jobFilePath);
            // File already in job folder, update attachment entry
            const existingAttachment = currentAttachments.find((att: any) => att.fileId === fileId);
            if (existingAttachment) {
              existingAttachment.filePath = `job-attachments/${jobId}/${fileId}.pdf`;
              existingAttachment.fileUrl = `${baseUrl}/uploads/job-attachments/${jobId}/${fileId}.pdf`;
            }
            continue;
          } catch {
            errors.push(`File ${fileId} not found in temp or job folder`);
            continue;
          }
        }

        // Move file from temp to job folder
        await fs.rename(tempFilePath, jobFilePath);

        // Update attachment entry
        const attachmentIndex = currentAttachments.findIndex((att: any) => att.fileId === fileId);
        const fileUrl = `${baseUrl}/uploads/job-attachments/${jobId}/${fileId}.pdf`;
        
        if (attachmentIndex >= 0) {
          // Update existing attachment
          currentAttachments[attachmentIndex].filePath = `job-attachments/${jobId}/${fileId}.pdf`;
          currentAttachments[attachmentIndex].fileUrl = fileUrl;
        } else {
          // Add new attachment entry
          const stats = await fs.stat(jobFilePath);
          currentAttachments.push({
            fileId,
            fileName: `${fileId}.pdf`,
            filePath: `job-attachments/${jobId}/${fileId}.pdf`,
            fileSize: stats.size,
            fileUrl,
          });
        }

        movedFiles.push({
          fileId,
          fileUrl,
          filePath: `job-attachments/${jobId}/${fileId}.pdf`
        });
      } catch (fileError: any) {
        errors.push(`Failed to move file ${fileId}: ${fileError.message}`);
      }
    }

    // Update job attachments in database
    await prisma.job.update({
      where: { id: jobId },
      data: { attachments: JSON.stringify(currentAttachments) },
    });

    res.json({
      success: true,
      message: `Moved ${movedFiles.length} file(s) successfully`,
      movedFiles,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: unknown) {
    console.error('Move temp files to job error:', error);
    res.status(500).json({ 
      error: 'Failed to move files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

