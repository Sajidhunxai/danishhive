import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

// Export user data (GDPR compliance)
export const exportUserData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Fetch all user data
    const [user, profile, jobs, applications, contracts, messages, forumPosts, transactions, earnings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          emailVerifiedAt: true,
          phoneNumber: true,
          phoneVerified: true,
          phoneVerifiedAt: true,
          userType: true,
          isAdmin: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.profile.findUnique({
        where: { userId },
      }),
      prisma.job.findMany({
        where: { clientId: userId },
      }),
      prisma.jobApplication.findMany({
        where: { freelancerId: userId },
      }),
      prisma.contract.findMany({
        where: {
          OR: [
            { clientId: userId },
            { freelancerId: userId },
          ],
        },
      }),
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
      }),
      prisma.forumPost.findMany({
        where: { authorId: userId },
      }),
      prisma.honeyTransaction.findMany({
        where: { userId },
      }),
      prisma.earning.findMany({
        where: { userId },
      }),
    ]);

    const userData = {
      user,
      profile,
      jobs,
      applications,
      contracts,
      messages,
      forumPosts,
      transactions,
      earnings,
      exportedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: userData,
      message: 'User data exported successfully',
    });
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
};

// Delete user account (GDPR compliance)
export const deleteUserAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE') {
      return res.status(400).json({ error: 'Confirmation required. Send confirmation: "DELETE"' });
    }

    // Delete user (cascade will delete related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error) {
    console.error('Delete user account error:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
};


