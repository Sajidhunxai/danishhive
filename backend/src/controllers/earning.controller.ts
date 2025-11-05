import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const getMyEarnings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const earnings = await prisma.earning.findMany({
      where: { userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            clientId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend expected format
    const transformedEarnings = earnings.map(earning => ({
      id: earning.id,
      job_id: earning.jobId,
      amount: Number(earning.amount),
      currency: earning.currency,
      payment_period_start: earning.paymentPeriodStart.toISOString(),
      payment_period_end: earning.paymentPeriodEnd.toISOString(),
      payout_date: earning.payoutDate?.toISOString() || null,
      status: earning.status,
      mollie_payment_id: earning.molliePaymentId,
      description: earning.description,
      created_at: earning.createdAt.toISOString(),
      jobs: earning.job ? {
        title: earning.job.title,
        client_id: earning.job.clientId,
      } : null,
    }));

    res.json({ earnings: transformedEarnings });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
};

