import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
      include: {
        projects: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const {
      fullName,
      companyName,
      cvrNumber,
      bio,
      skills,
      hourlyRate,
      location,
      address,
      city,
      postalCode,
      avatarUrl,
      birthday,
      phoneNumber,
      phoneVerified,
      paymentVerified,
    } = req.body;
    
    console.log('Update profile request:', {
      userId: req.user!.id,
      fullName,
      phoneNumber,
      phoneVerified,
      address,
      city,
      postalCode,
    });
    
    // Update user fields if provided (phone verification)
    if (phoneNumber !== undefined || phoneVerified !== undefined) {
      try {
        await prisma.user.update({
          where: { id: req.user!.id },
          data: {
            ...(phoneNumber !== undefined && { phoneNumber }),
            ...(phoneVerified !== undefined && { 
              phoneVerified, 
              ...(phoneVerified && { phoneVerifiedAt: new Date() })
            }),
          },
        });
        console.log('User updated successfully');
      } catch (userError: unknown) {
        console.error('User update error:', userError);
        if (userError && typeof userError === 'object' && 'code' in userError && userError.code === 'P2002') {
          return res.status(400).json({ error: 'Dette telefonnummer er allerede registreret' });
        }
        throw userError;
      }
    }
    
    // Check if profile exists, create if not
    let profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
    });
    
    if (!profile) {
      console.log('Profile not found, creating new profile');
      profile = await prisma.profile.create({
        data: {
          userId: req.user!.id,
          fullName: fullName || 'Unknown',
          companyName,
          cvrNumber,
          bio,
          skills: skills ? JSON.stringify(skills) : undefined,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          location,
          address,
          city,
          postalCode,
          avatarUrl,
          birthday: birthday ? new Date(birthday) : undefined,
          paymentVerified: paymentVerified || false,
        },
        include: {
          projects: true,
        },
      });
    } else {
      // Update existing profile
      profile = await prisma.profile.update({
        where: { userId: req.user!.id },
        data: {
          ...(fullName && { fullName }),
          ...(companyName !== undefined && { companyName }),
          ...(cvrNumber !== undefined && { cvrNumber }),
          ...(bio !== undefined && { bio }),
          ...(skills && { skills: JSON.stringify(skills) }),
          ...(hourlyRate && { hourlyRate: parseFloat(hourlyRate) }),
          ...(location !== undefined && { location }),
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(postalCode !== undefined && { postalCode }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(birthday && { birthday: new Date(birthday) }),
          ...(paymentVerified !== undefined && { paymentVerified }),
        },
        include: {
          projects: true,
        },
      });
    }
    
    console.log('Profile updated successfully');
    res.json({ profile, message: 'Profile updated successfully' });
  } catch (error: unknown) {
    console.error('Update profile error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error && typeof error === 'object' && 'code' in error ? {
      code: error.code,
      meta: 'meta' in error ? error.meta : undefined,
      message: errorMessage,
    } : { message: errorMessage };
    console.error('Error details:', errorDetails);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const getProfileById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            userType: true,
            emailVerified: true,
            phoneVerified: true,
          },
        },
        projects: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getAllFreelancers = async (req: AuthRequest, res: Response) => {
  try {
    const { skills, location, minRate, maxRate, search } = req.query;
    
    const where: Prisma.ProfileWhereInput = {
      user: {
        userType: 'FREELANCER',
      },
    };
    
    if (location) {
      where.location = { contains: location as string };
    }
    
    if (minRate || maxRate) {
      where.hourlyRate = {};
      if (minRate) where.hourlyRate.gte = parseFloat(minRate as string);
      if (maxRate) where.hourlyRate.lte = parseFloat(maxRate as string);
    }
    
    if (search) {
      where.OR = [
        { fullName: { contains: search as string } },
        { bio: { contains: search as string } },
      ];
    }
    
    const profiles = await prisma.profile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
            phoneVerified: true,
          },
        },
        projects: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({ profiles });
  } catch (error) {
    console.error('Get freelancers error:', error);
    res.status(500).json({ error: 'Failed to fetch freelancers' });
  }
};

export const getMyProfileVerification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerified: true }
    });

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        fullName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        hourlyRate: true,
      }
    });

    const complete = Boolean(
      user &&
      profile &&
      profile.fullName &&
      profile.bio &&
      profile.location &&
      profile.hourlyRate &&
      user.phoneVerified
    );

    res.json({ complete });
  } catch (error) {
    console.error('Profile verification check error:', error);
    res.status(500).json({ error: 'Failed to check profile verification' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      clientName,
      projectUrl,
      imageUrl,
      projectType,
      startDate,
      endDate,
      technologies,
    } = req.body;
    
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const project = await prisma.project.create({
      data: {
        profileId: profile.id,
        title,
        description,
        clientName,
        projectUrl,
        imageUrl,
        projectType: projectType || 'portfolio',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        technologies: technologies ? JSON.stringify(technologies) : undefined,
      },
    });
    
    res.status(201).json({ project, message: 'Project created successfully' });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      clientName,
      projectUrl,
      imageUrl,
      projectType,
      startDate,
      endDate,
      technologies,
    } = req.body;
    
    // Check if project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: { profile: true },
    });
    
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (existingProject.profile.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(clientName !== undefined && { clientName }),
        ...(projectUrl !== undefined && { projectUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(projectType && { projectType }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(technologies !== undefined && { technologies: technologies ? JSON.stringify(technologies) : null }),
      },
    });
    
    res.json({ project, message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: { profile: true },
    });
    
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (existingProject.profile.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }
    
    await prisma.project.delete({
      where: { id },
    });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    const { image, imageType, fileName, fileSize, fileType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Validate file size (max 5MB)
    if (fileSize && fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }

    // Extract base64 data
    const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const ext = fileName ? fileName.split('.').pop() : 'jpg';
    const timestamp = Date.now();
    const imageName = `${req.user!.id}_${imageType}_${timestamp}.${ext}`;
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Save image file
    const imagePath = path.join(uploadDir, imageName);
    await fs.writeFile(imagePath, imageBuffer);
    
    // Create full URL for frontend access
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/profiles/${imageName}`;
    
    // Only update profile avatarUrl for portrait or logo images, not for project images
    if (imageType === 'portrait' || imageType === 'logo') {
      await prisma.profile.update({
        where: { userId: req.user!.id },
        data: { avatarUrl: imageUrl },
      });
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
    });

  } catch (error: unknown) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

