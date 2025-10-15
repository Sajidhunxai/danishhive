import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

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
      avatarUrl,
      birthday,
    } = req.body;
    
    const profile = await prisma.profile.update({
      where: { userId: req.user!.id },
      data: {
        ...(fullName && { fullName }),
        ...(companyName !== undefined && { companyName }),
        ...(cvrNumber !== undefined && { cvrNumber }),
        ...(bio !== undefined && { bio }),
        ...(skills && { skills: JSON.stringify(skills) }),
        ...(hourlyRate && { hourlyRate: parseFloat(hourlyRate) }),
        ...(location !== undefined && { location }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(birthday && { birthday: new Date(birthday) }),
      },
      include: {
        projects: true,
      },
    });
    
    res.json({ profile, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
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
    
    const where: any = {
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

