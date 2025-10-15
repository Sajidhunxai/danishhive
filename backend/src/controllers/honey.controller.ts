import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const getBalance = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
      select: {
        honeyDropsBalance: true,
      },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json({ balance: profile.honeyDropsBalance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { type, limit = 50 } = req.query;
    
    const where: any = {
      userId: req.user!.id,
    };
    
    if (type) {
      where.type = type;
    }
    
    const transactions = await prisma.honeyTransaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
    });
    
    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const purchaseHoney = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Create transaction
    const transaction = await prisma.honeyTransaction.create({
      data: {
        userId: req.user!.id,
        amount: parseInt(amount),
        type: 'purchase',
        description: `Purchased ${amount} Honey Drops`,
        paymentId: paymentId || null,
      },
    });
    
    // Update user balance
    await prisma.profile.update({
      where: { userId: req.user!.id },
      data: {
        honeyDropsBalance: { increment: parseInt(amount) },
      },
    });
    
    res.status(201).json({ transaction, message: 'Honey Drops purchased successfully' });
  } catch (error) {
    console.error('Purchase honey error:', error);
    res.status(500).json({ error: 'Failed to purchase Honey Drops' });
  }
};

export const spendHoney = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Check if user has enough balance
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.id },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    if (profile.honeyDropsBalance < amount) {
      return res.status(400).json({ error: 'Insufficient Honey Drops balance' });
    }
    
    // Create transaction
    const transaction = await prisma.honeyTransaction.create({
      data: {
        userId: req.user!.id,
        amount: -parseInt(amount),
        type: 'spend',
        description: description || 'Honey Drops spent',
      },
    });
    
    // Update user balance
    await prisma.profile.update({
      where: { userId: req.user!.id },
      data: {
        honeyDropsBalance: { decrement: parseInt(amount) },
      },
    });
    
    res.json({ transaction, message: 'Honey Drops spent successfully' });
  } catch (error) {
    console.error('Spend honey error:', error);
    res.status(500).json({ error: 'Failed to spend Honey Drops' });
  }
};

export const refundHoney = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description, originalTransactionId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Create refund transaction
    const transaction = await prisma.honeyTransaction.create({
      data: {
        userId: req.user!.id,
        amount: parseInt(amount),
        type: 'refund',
        description: description || 'Honey Drops refund',
        metadata: originalTransactionId ? JSON.stringify({ originalTransactionId }) : undefined,
      },
    });
    
    // Update user balance
    await prisma.profile.update({
      where: { userId: req.user!.id },
      data: {
        honeyDropsBalance: { increment: parseInt(amount) },
      },
    });
    
    res.json({ transaction, message: 'Honey Drops refunded successfully' });
  } catch (error) {
    console.error('Refund honey error:', error);
    res.status(500).json({ error: 'Failed to refund Honey Drops' });
  }
};

