import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const getPendingImages = async (req: AuthRequest, res: Response) => {
  try {
      const images = await (prisma as any).profileImage.findMany({
      where: {
        status: 'pending'
      },
      include: {
        profile: {
          select: {
            fullName: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ images });
  } catch (error: unknown) {
    console.error('Error fetching pending images:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pending images',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const approveImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const { adminNotes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const image = await (prisma as any).profileImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update image status
    const updatedImage = await (prisma as any).profileImage.update({
      where: { id: imageId },
      data: {
        status: 'approved',
        approvedBy: userId,
        adminNotes: adminNotes || null,
        updatedAt: new Date()
      }
    });

    // If approved and it's an avatar, update profile
    if (image.imageType === 'portrait' && image.status === 'pending') {
      await prisma.profile.update({
        where: { userId: image.userId },
        data: {
          avatarUrl: image.fileUrl
        }
      });
    }

    res.json({ 
      message: 'Image approved successfully',
      image: updatedImage
    });
  } catch (error: unknown) {
    console.error('Error approving image:', error);
    res.status(500).json({ 
      error: 'Failed to approve image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const rejectImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    const { adminNotes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const image = await (prisma as any).profileImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const updatedImage = await (prisma as any).profileImage.update({
      where: { id: imageId },
      data: {
        status: 'rejected',
        approvedBy: userId,
        adminNotes: adminNotes || null,
        updatedAt: new Date()
      }
    });

    res.json({ 
      message: 'Image rejected successfully',
      image: updatedImage
    });
  } catch (error: unknown) {
    console.error('Error rejecting image:', error);
    res.status(500).json({ 
      error: 'Failed to reject image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

