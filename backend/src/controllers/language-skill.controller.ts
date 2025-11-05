import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const getMyLanguageSkills = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;
    try {
      const languageSkills = await prisma.languageSkill.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      return res.json({ languageSkills });
    } catch (dbError: any) {
      if (dbError?.code === 'P2021' || dbError?.message?.includes('does not exist')) {
        console.warn('Language skills table does not exist yet. Run Prisma migrations.');
        return res.json({ languageSkills: [] });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Get language skills error:', error);
    res.status(500).json({ error: 'Failed to fetch language skills' });
  }
};

export const getUserLanguageSkills = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const languageSkills = await prisma.languageSkill.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ languageSkills });
  } catch (error) {
    console.error('Get user language skills error:', error);
    res.status(500).json({ error: 'Failed to fetch language skills' });
  }
};

export const createLanguageSkill = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { languageCode, languageName, proficiencyLevel } = req.body;

    if (!languageCode || !languageName) {
      return res.status(400).json({ error: 'languageCode and languageName are required' });
    }

    // Check if language already exists for this user
    const existing = await prisma.languageSkill.findFirst({
      where: {
        userId,
        languageCode,
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Language skill already exists' });
    }

    const languageSkill = await prisma.languageSkill.create({
      data: {
        userId,
        languageCode,
        languageName,
        proficiencyLevel: proficiencyLevel || 'beginner',
      },
    });

    res.status(201).json({ languageSkill });
  } catch (error) {
    console.error('Create language skill error:', error);
    res.status(500).json({ error: 'Failed to create language skill' });
  }
};

export const updateLanguageSkill = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { proficiencyLevel } = req.body;

    // Verify ownership
    const existing = await prisma.languageSkill.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Language skill not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this language skill' });
    }

    const languageSkill = await prisma.languageSkill.update({
      where: { id },
      data: {
        ...(proficiencyLevel && { proficiencyLevel }),
      },
    });

    res.json({ languageSkill });
  } catch (error) {
    console.error('Update language skill error:', error);
    res.status(500).json({ error: 'Failed to update language skill' });
  }
};

export const deleteLanguageSkill = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.languageSkill.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Language skill not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this language skill' });
    }

    await prisma.languageSkill.delete({
      where: { id },
    });

    res.json({ message: 'Language skill deleted successfully' });
  } catch (error) {
    console.error('Delete language skill error:', error);
    res.status(500).json({ error: 'Failed to delete language skill' });
  }
};

