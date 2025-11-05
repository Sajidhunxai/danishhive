import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const DEFAULT_REFERRAL_LIMIT = parseInt(process.env.REFERRAL_LIMIT_DEFAULT || '20', 10);

export const getReferralSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const referralsUsed = await prisma.referral.count({
      where: { referrerId: userId },
    });

    // If we later store a custom limit per profile, fetch it here
    const referralLimit = DEFAULT_REFERRAL_LIMIT;

    res.json({ referralLimit, referralsUsed });
  } catch (error) {
    console.error('Get referral summary error:', error);
    res.status(500).json({ error: 'Failed to fetch referral summary' });
  }
};

export const listReferrals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ referrals });
  } catch (error) {
    console.error('List referrals error:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
};

export const listReferralBonuses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const bonuses = await prisma.referralBonus.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bonuses });
  } catch (error) {
    console.error('List referral bonuses error:', error);
    res.status(500).json({ error: 'Failed to fetch referral bonuses' });
  }
};

export const createReferral = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { referredEmail } = req.body as { referredEmail?: string };

    if (!referredEmail) {
      return res.status(400).json({ error: 'referredEmail is required' });
    }

    // Enforce referral limit
    const referralsUsed = await prisma.referral.count({ where: { referrerId: userId } });
    const referralLimit = DEFAULT_REFERRAL_LIMIT;
    if (referralsUsed >= referralLimit) {
      return res.status(400).json({ error: 'Referral limit reached' });
    }

    // Create referral
    const referral = await prisma.referral.create({
      data: {
        referrerId: userId,
        referredEmail: referredEmail.trim().toLowerCase(),
        status: 'pending',
      },
    });

    res.status(201).json({ referral });
  } catch (error: any) {
    console.error('Create referral error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already referred' });
    }
    res.status(500).json({ error: 'Failed to create referral' });
  }
};


