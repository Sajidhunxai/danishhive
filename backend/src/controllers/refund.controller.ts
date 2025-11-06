import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const refundApplicationHoneyDrops = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId, selectedApplicantId } = req.body;

    if (!jobId || !selectedApplicantId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get all applications for this job except the selected one
    const applications = await prisma.jobApplication.findMany({
      where: {
        jobId,
        freelancerId: {
          not: selectedApplicantId
        }
      },
      select: {
        freelancerId: true
      }
    });

    const refundAmount = 3; // 3 honey drops per rejected application
    const refundedUsers: string[] = [];

    // Refund honey drops to each rejected applicant
    for (const app of applications) {
      try {
        // Get user profile
        const profile = await prisma.profile.findUnique({
          where: { userId: app.freelancerId }
        });

        if (profile) {
          // Update honey drops balance
          await prisma.profile.update({
            where: { userId: app.freelancerId },
            data: {
              honeyDropsBalance: {
                increment: refundAmount
              }
            }
          });

          // Create transaction record
          await prisma.honeyTransaction.create({
            data: {
              userId: app.freelancerId,
              amount: refundAmount,
              type: 'refund',
              description: `Refund for rejected job application`,
              metadata: {
                jobId,
                applicationId: (app as any).id || 'unknown'
              }
            }
          });

          refundedUsers.push(app.freelancerId);
        }
      } catch (error) {
        console.error(`Error refunding user ${app.freelancerId}:`, error);
        // Continue with other users even if one fails
      }
    }

    res.json({ 
      message: 'Honey drops refunded successfully',
      refundedCount: refundedUsers.length,
      refundAmount,
      refundedUsers
    });
  } catch (error: unknown) {
    console.error('Error refunding honey drops:', error);
    res.status(500).json({ 
      error: 'Failed to refund honey drops',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

