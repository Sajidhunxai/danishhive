import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalApplications,
      totalContracts,
      activeContracts,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.jobApplication.count(),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'active' } }),
      prisma.honeyTransaction.aggregate({
        where: { type: 'purchase' },
        _sum: { amount: true },
      }),
    ]);
    
    const stats = {
      totalUsers,
      totalJobs,
      totalApplications,
      totalContracts,
      activeContracts,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { userType, isActive, search, page = 1, limit = 50 } = req.query;
    
    const where: any = {};
    
    if (userType) {
      where.userType = userType;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search as string } },
        { profile: { fullName: { contains: search as string } } },
      ];
    }
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.user.count({ where }),
    ]);
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, userType, isActive, isAdmin, emailVerified, phoneVerified } = req.body;
    
    const updateData: any = {};
    
    if (email) updateData.email = email;
    if (userType) updateData.userType = userType;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (emailVerified !== undefined) {
      updateData.emailVerified = emailVerified;
      if (emailVerified) {
        updateData.emailVerifiedAt = new Date();
      }
    }
    if (phoneVerified !== undefined) {
      updateData.phoneVerified = phoneVerified;
      if (phoneVerified) {
        updateData.phoneVerifiedAt = new Date();
      }
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        profile: true,
      },
    });
    
    res.json({ user, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting self
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    await prisma.user.delete({
      where: { id },
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const getAllCoupons = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.query;
    
    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({ coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};

export const createCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, discount, maxUses, expiresAt } = req.body;
    
    if (!code || !discount) {
      return res.status(400).json({ error: 'Code and discount are required' });
    }
    
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount: parseFloat(discount),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });
    
    res.status(201).json({ coupon, message: 'Coupon created successfully' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
};

export const updateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { discount, maxUses, expiresAt, isActive } = req.body;
    
    const updateData: any = {};
    
    if (discount) updateData.discount = parseFloat(discount);
    if (maxUses !== undefined) updateData.maxUses = maxUses ? parseInt(maxUses) : null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });
    
    res.json({ coupon, message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
};

export const deleteCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.coupon.delete({
      where: { id },
    });
    
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
};

export const validateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    
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
    
    res.json({ coupon, valid: true });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
};

export const useCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    
    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ error: 'Invalid coupon' });
    }
    
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }
    
    const updatedCoupon = await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        usedCount: { increment: 1 },
      },
    });
    
    res.json({ coupon: updatedCoupon, message: 'Coupon applied successfully' });
  } catch (error) {
    console.error('Use coupon error:', error);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
};

