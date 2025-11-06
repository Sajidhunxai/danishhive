import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportedUserId, reportCategory, reportReason, description, conversationData } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reportedUserId || !reportCategory || !reportReason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedUserId }
    });

    if (!reportedUser) {
      return res.status(404).json({ error: 'Reported user not found' });
    }

    // Create report
    const report = await (prisma as any).profileReport.create({
      data: {
        reporterId: userId,
        reportedUserId,
        reportCategory,
        reportReason,
        description: description || null,
        conversationData: conversationData || null,
        status: 'pending'
      }
    });

    res.status(201).json({ 
      message: 'Report submitted successfully',
      report
    });
  } catch (error: unknown) {
    console.error('Error creating report:', error);
    res.status(500).json({ 
      error: 'Failed to create report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const reports = await (prisma as any).profileReport.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true
              }
            }
          }
        },
        reportedProfile: {
          select: {
            userId: true,
            fullName: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ reports });
  } catch (error: unknown) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reports',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const report = await (prisma as any).profileReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updatedReport = await (prisma as any).profileReport.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes: adminNotes || null,
        reviewedBy: userId,
        reviewedAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json({ 
      message: 'Report status updated successfully',
      report: updatedReport
    });
  } catch (error: unknown) {
    console.error('Error updating report status:', error);
    res.status(500).json({ 
      error: 'Failed to update report status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

