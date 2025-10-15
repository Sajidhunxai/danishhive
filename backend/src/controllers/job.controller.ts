import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const getAllJobs = async (req: AuthRequest, res: Response) => {
  try {
    const { status, skills, location, minBudget, maxBudget, search } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (location) {
      where.location = { contains: location as string };
    }
    
    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = parseFloat(minBudget as string);
      if (maxBudget) where.budget.lte = parseFloat(maxBudget as string);
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }
    
    const jobs = await prisma.job.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                companyName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                companyName: true,
                avatarUrl: true,
                location: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Increment view count
    await prisma.job.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    
    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      budget,
      hourlyRate,
      location,
      skills,
      deadline,
      attachments,
    } = req.body;
    
    const job = await prisma.job.create({
      data: {
        clientId: req.user!.id,
        title,
        description,
        budget: budget ? parseFloat(budget) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        location,
        skills: skills ? JSON.stringify(skills) : undefined,
        deadline: deadline ? new Date(deadline) : null,
        attachments: attachments ? JSON.stringify(attachments) : undefined,
        status: 'open',
      },
      include: {
        client: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                companyName: true,
              },
            },
          },
        },
      },
    });
    
    res.status(201).json({ job, message: 'Job created successfully' });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      budget,
      hourlyRate,
      location,
      skills,
      status,
      deadline,
      attachments,
    } = req.body;
    
    // Check if job exists and user is the owner
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });
    
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (existingJob.clientId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }
    
    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(budget && { budget: parseFloat(budget) }),
        ...(hourlyRate && { hourlyRate: parseFloat(hourlyRate) }),
        ...(location && { location }),
      ...(skills && { skills: JSON.stringify(skills) }),
      ...(status && { status }),
      ...(deadline && { deadline: new Date(deadline) }),
      ...(attachments !== undefined && { attachments: attachments ? JSON.stringify(attachments) : null }),
      },
      include: {
        client: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                companyName: true,
              },
            },
          },
        },
      },
    });
    
    res.json({ job, message: 'Job updated successfully' });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if job exists and user is the owner
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });
    
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (existingJob.clientId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }
    
    await prisma.job.delete({
      where: { id },
    });
    
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

export const getMyJobs = async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        clientId: req.user!.id,
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({ jobs });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

