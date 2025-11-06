import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const getTranslations = async (req: AuthRequest, res: Response) => {
  try {
    const translations = await (prisma as any).attachmentTranslation.findMany({
      include: {
        job: {
          select: {
            id: true,
            title: true,
            clientId: true
          }
        },
        assignedUser: {
          include: {
            profile: {
              select: {
                fullName: true
              }
            }
          }
        },
        requester: {
          include: {
            profile: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedTranslations = translations.map((translation: any) => ({
      id: translation.id,
      job_id: translation.jobId,
      job_title: translation.job.title,
      attachment_id: translation.attachmentId,
      original_language: translation.originalLanguage,
      target_language: translation.targetLanguage,
      notes: translation.notes,
      status: translation.status,
      assigned_to: translation.assignedTo,
      assigned_user_name: translation.assignedUser?.profile?.fullName || translation.assignedUser?.email || null,
      requested_by: translation.requestedBy,
      requester_name: translation.requester?.profile?.fullName || translation.requester?.email || null,
      translated_file_url: translation.translatedFileUrl,
      completed_at: translation.completedAt,
      created_at: translation.createdAt,
      updated_at: translation.updatedAt
    }));

    res.json({ translations: formattedTranslations });
  } catch (error: unknown) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch translations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTeamLeaders = async (req: AuthRequest, res: Response) => {
  try {
    // Get all admin users as potential team leaders
    const admins = await prisma.user.findMany({
      where: {
        isAdmin: true
      },
      include: {
        profile: {
          select: {
            fullName: true
          }
        }
      }
    });

    const teamLeaders = admins.map(admin => ({
      user_id: admin.id,
      full_name: admin.profile?.fullName || admin.email
    }));

    res.json({ teamLeaders });
  } catch (error: unknown) {
    console.error('Error fetching team leaders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team leaders',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const assignTranslation = async (req: AuthRequest, res: Response) => {
  try {
    const { translationId } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ error: 'Assigned to is required' });
    }

    // Verify the user exists and is an admin
    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedTo }
    });

    if (!assignedUser) {
      return res.status(404).json({ error: 'Assigned user not found' });
    }

    // Update translation assignment
    const translation = await (prisma as any).attachmentTranslation.update({
      where: { id: translationId },
      data: {
        assignedTo,
        status: 'assigned',
        updatedAt: new Date()
      },
      include: {
        job: {
          select: {
            title: true
          }
        },
        assignedUser: {
          include: {
            profile: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    res.json({ 
      message: 'Translation assigned successfully',
      translation: {
        id: translation.id,
        job_id: translation.jobId,
        job_title: translation.job.title,
        attachment_id: translation.attachmentId,
        assigned_to: translation.assignedTo,
        assigned_user_name: translation.assignedUser?.profile?.fullName || translation.assignedUser?.email,
        status: translation.status
      }
    });
  } catch (error: unknown) {
    console.error('Error assigning translation:', error);
    res.status(500).json({ 
      error: 'Failed to assign translation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createTranslationRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId, attachmentId, originalLanguage, targetLanguage, notes } = req.body;
    const userId = req.user?.id;

    if (!jobId || !attachmentId || !targetLanguage) {
      return res.status(400).json({ error: 'Job ID, attachment ID, and target language are required' });
    }

    // Verify the job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify the attachment exists in the job
    const attachments = job.attachments ? (typeof job.attachments === 'string' ? JSON.parse(job.attachments) : job.attachments) : [];
    const attachment = attachments.find((att: any) => att.fileId === attachmentId);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found in job' });
    }

    // Check if translation request already exists for this attachment and target language
    const existingTranslation = await (prisma as any).attachmentTranslation.findFirst({
      where: {
        jobId,
        attachmentId,
        targetLanguage,
        status: {
          not: 'cancelled'
        }
      }
    });

    if (existingTranslation) {
      return res.status(409).json({ error: 'Translation request already exists for this attachment and target language' });
    }

    // Create translation request
    const translation = await (prisma as any).attachmentTranslation.create({
      data: {
        jobId,
        attachmentId,
        originalLanguage: originalLanguage || 'unknown',
        targetLanguage,
        notes: notes || null,
        requestedBy: userId || null,
        status: 'pending'
      },
      include: {
        job: {
          select: {
            title: true
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Translation request created successfully',
      translation: {
        id: translation.id,
        job_id: translation.jobId,
        job_title: translation.job.title,
        attachment_id: translation.attachmentId,
        original_language: translation.originalLanguage,
        target_language: translation.targetLanguage,
        status: translation.status,
        created_at: translation.createdAt
      }
    });
  } catch (error: unknown) {
    console.error('Error creating translation request:', error);
    res.status(500).json({ 
      error: 'Failed to create translation request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

