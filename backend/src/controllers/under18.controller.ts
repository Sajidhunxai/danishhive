import { Response, Request } from 'express';
import prisma from '../config/database';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// This endpoint doesn't require authentication (public application form)
export const createUnder18Application = async (req: Request, res: Response) => {
  try {
    const { 
      email, 
      birthday, 
      languageSkills, 
      softwareSkills, 
      codeLanguages, 
      educationInstitution,
      cvFile,
      cvFileName
    } = req.body;

    if (!email || !birthday || !cvFile) {
      return res.status(400).json({ error: 'Email, birthday, and CV are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate birthday is in the past and indicates user is under 18
    const birthDate = new Date(birthday);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Birthday hasn't occurred this year yet
      if (age < 18) {
        // Valid under-18 application
      } else if (age > 18) {
        return res.status(400).json({ error: 'This application is only for users under 18 years old' });
      }
    } else {
      if (age < 18) {
        // Valid under-18 application
      } else if (age >= 18) {
        return res.status(400).json({ error: 'This application is only for users under 18 years old' });
      }
    }

    // Save CV file
    const fileId = randomUUID();
    const fileName = `${fileId}.pdf`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'under18-applications');
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Decode base64 file if provided
    const fileBuffer = Buffer.from(cvFile, 'base64');
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, fileBuffer);

    // Create relative path for database storage
    const relativeFilePath = path.join('under18-applications', fileName);

    // Create Under18Application record in database
    const application = await (prisma as any).under18Application.create({
      data: {
        email,
        birthday: birthDate,
        languageSkills: languageSkills || null,
        softwareSkills: softwareSkills || null,
        codeLanguages: codeLanguages || null,
        educationInstitution: educationInstitution || null,
        cvFilePath: relativeFilePath,
        cvFileName: cvFileName || fileName,
        status: 'pending'
      }
    });

    res.status(201).json({ 
      message: 'Application submitted successfully',
      applicationId: application.id
    });
  } catch (error: unknown) {
    console.error('Error creating under-18 application:', error);
    res.status(500).json({ 
      error: 'Failed to submit application',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

