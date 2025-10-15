import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const createApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId, coverLetter, proposedRate } = req.body;
    
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Job is not accepting applications' });
    }
    
    // Check if already applied
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_freelancerId: {
          jobId,
          freelancerId: req.user!.id,
        },
      },
    });
    
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied to this job' });
    }
    
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        freelancerId: req.user!.id,
        coverLetter,
        proposedRate: proposedRate ? parseFloat(proposedRate) : null,
        status: 'pending',
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                profile: {
                  select: {
                    fullName: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        },
        freelancer: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                hourlyRate: true,
              },
            },
          },
        },
      },
    });
    
    res.status(201).json({ application, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: {
        freelancerId: req.user!.id,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            hourlyRate: true,
            status: true,
            client: {
              select: {
                profile: {
                  select: {
                    fullName: true,
                    companyName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
    
    res.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

export const getJobApplications = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    
    // Check if job exists and user is the owner
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.clientId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view these applications' });
    }
    
    const applications = await prisma.jobApplication.findMany({
      where: {
        jobId,
      },
      include: {
        freelancer: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
            phoneVerified: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
                bio: true,
                skills: true,
                hourlyRate: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
    
    res.json({ applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

export const updateApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, coverLetter, proposedRate } = req.body;
    
    // Find the application
    const existingApplication = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: true,
      },
    });
    
    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Check authorization
    const isFreelancer = existingApplication.freelancerId === req.user!.id;
    const isClient = existingApplication.job.clientId === req.user!.id;
    const isAdmin = req.user!.isAdmin;
    
    if (!isFreelancer && !isClient && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this application' });
    }
    
    // Freelancers can only update cover letter and proposed rate
    // Clients can only update status
    const updateData: any = {};
    
    if (isFreelancer && existingApplication.status === 'pending') {
      if (coverLetter) updateData.coverLetter = coverLetter;
      if (proposedRate) updateData.proposedRate = parseFloat(proposedRate);
    }
    
    if ((isClient || isAdmin) && status) {
      updateData.status = status;
      if (status !== 'pending') {
        updateData.reviewedAt = new Date();
      }
    }
    
    const application = await prisma.jobApplication.update({
      where: { id },
      data: updateData,
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    
    res.json({ application, message: 'Application updated successfully' });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
};

export const deleteApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find the application
    const existingApplication = await prisma.jobApplication.findUnique({
      where: { id },
    });
    
    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Only freelancer who submitted or admin can delete
    if (existingApplication.freelancerId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this application' });
    }
    
    await prisma.jobApplication.delete({
      where: { id },
    });
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
};

