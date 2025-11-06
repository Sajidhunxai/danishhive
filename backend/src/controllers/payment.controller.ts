import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { randomUUID } from 'crypto';
import prisma from '../config/database';

// Apply coupon
export const applyCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found', valid: false });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ error: 'Coupon is not active', valid: false });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired', valid: false });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached', valid: false });
    }

    res.json({ coupon, valid: true, discount: Number(coupon.discount) });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
};

// Apply client coupon (for job applications)
export const applyClientCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, jobId } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ error: 'Invalid coupon', valid: false });
    }

    // Check if user is the client for this job
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.clientId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to use coupon for this job' });
      }
    }

    res.json({ coupon, valid: true, discount: Number(coupon.discount) });
  } catch (error) {
    console.error('Apply client coupon error:', error);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
};

// Verify payment method
export const verifyPaymentMethod = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has payment method
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true },
    });

    // In a real implementation, this would check with payment provider
    // For now, return success if user exists
    res.json({ 
      verified: true, 
      message: 'Payment method verified',
      userId: user?.id,
    });
  } catch (error) {
    console.error('Verify payment method error:', error);
    res.status(500).json({ error: 'Failed to verify payment method' });
  }
};

// Check payment status
export const checkPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    // In a real implementation, this would check with payment provider
    // For now, return mock status
    res.json({ 
      status: 'completed',
      paymentId,
      message: 'Payment status retrieved',
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
};

// Create escrow payment
export const createEscrowPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { contractId, amount, description } = req.body;

    if (!contractId || !amount) {
      return res.status(400).json({ error: 'Contract ID and amount are required' });
    }

    // Verify contract exists and user is authorized
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.clientId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to create payment for this contract' });
    }

    // In a real implementation, this would create a payment with payment provider
    // For now, store payment info in contract metadata
    const metadata = contract.metadata ? (typeof contract.metadata === 'string' ? JSON.parse(contract.metadata) : contract.metadata) : {};
    const payments = metadata.payments || [];
    const paymentId = randomUUID();
    
    payments.push({
      id: paymentId,
      amount: parseFloat(amount),
      status: 'pending',
      type: 'escrow',
      description: description || 'Escrow payment',
      createdAt: new Date().toISOString(),
    });

    await prisma.contract.update({
      where: { id: contractId },
      data: {
        metadata: JSON.stringify({ ...metadata, payments }),
      },
    });

    res.json({ 
      payment: {
        id: paymentId,
        contractId,
        amount: parseFloat(amount),
        status: 'pending',
        type: 'escrow',
      },
      message: 'Escrow payment created successfully',
    });
  } catch (error) {
    console.error('Create escrow payment error:', error);
    res.status(500).json({ error: 'Failed to create escrow payment' });
  }
};

// Release escrow payment
export const releaseEscrowPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { contractId, paymentId } = req.body;

    if (!contractId || !paymentId) {
      return res.status(400).json({ error: 'Contract ID and payment ID are required' });
    }

    // Verify contract and payment
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract.clientId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to release payment for this contract' });
    }

    const metadata = contract.metadata ? (typeof contract.metadata === 'string' ? JSON.parse(contract.metadata) : contract.metadata) : {};
    const payments = metadata.payments || [];
    const paymentIndex = payments.findIndex((p: any) => p.id === paymentId);

    if (paymentIndex === -1) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status
    payments[paymentIndex].status = 'completed';
    payments[paymentIndex].completedAt = new Date().toISOString();

    await prisma.contract.update({
      where: { id: contractId },
      data: {
        metadata: JSON.stringify({ ...metadata, payments }),
      },
    });

    res.json({ 
      payment: payments[paymentIndex],
      message: 'Escrow payment released successfully',
    });
  } catch (error) {
    console.error('Release escrow payment error:', error);
    res.status(500).json({ error: 'Failed to release escrow payment' });
  }
};

// Create honey purchase payment
export const createHoneyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, couponCode } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

    if (coupon && coupon.isActive) {
      discount = Number(coupon.discount);
    }
    }

    const finalAmount = amount - discount;

    // In a real implementation, this would create a payment with payment provider
    // For now, create a transaction record
    const transaction = await prisma.honeyTransaction.create({
      data: {
        userId: req.user!.id,
        amount: finalAmount,
        type: 'purchase',
        description: `Purchase of ${amount} honey drops${discount > 0 ? ` (discount: ${discount})` : ''}`,
      },
    });

    // Update user's honey balance in profile
    await prisma.profile.updateMany({
      where: { userId: req.user!.id },
      data: {
        honeyDropsBalance: { increment: Math.floor(finalAmount) },
      },
    });

    res.json({ 
      transaction,
      paymentId: transaction.id, // In real implementation, this would be from payment provider
      message: 'Honey purchase payment created successfully',
    });
  } catch (error) {
    console.error('Create honey payment error:', error);
    res.status(500).json({ error: 'Failed to create honey purchase payment' });
  }
};

