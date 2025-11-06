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

// Get users with email (for admin panel)
export const getUsersWithEmail = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: {
          select: {
            fullName: true,
            avatarUrl: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response to include email and profile info
    const usersWithEmail = users.map(user => ({
      id: user.id,
      email: user.email,
      userType: user.userType,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      fullName: user.profile?.fullName || null,
      avatarUrl: user.profile?.avatarUrl || null,
      companyName: user.profile?.companyName || null,
      profile: user.profile || null,
    }));

    res.json(usersWithEmail);
  } catch (error) {
    console.error('Get users with email error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Change user role
export const changeUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ error: 'User ID and new role are required' });
    }

    const validRoles = ['FREELANCER', 'CLIENT', 'ADMIN'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        userType: newRole as any,
        isAdmin: newRole === 'ADMIN',
      },
      include: {
        profile: true,
      },
    });

    res.json({ user, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ error: 'Failed to change user role' });
  }
};

// Create admin user
export const createAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create admin user (password should be hashed in auth controller)
    // This is a simplified version - in production, use auth controller's register method
    res.json({ message: 'Admin user creation should be done through auth/register endpoint with admin privileges' });
  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
};

// Update user password (admin)
export const updateUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required' });
    }

    // Password should be hashed - this is a simplified version
    // In production, use bcrypt to hash the password
    res.json({ message: 'Password update should be done through auth/change-password endpoint' });
  } catch (error) {
    console.error('Update user password error:', error);
    res.status(500).json({ error: 'Failed to update user password' });
  }
};

// Manual verification
export const updateVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { verificationType, verified } = req.body; // verificationType: 'phone', 'mitid', 'payment'

    if (!verificationType || typeof verified !== 'boolean') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    switch (verificationType) {
      case 'phone':
        await prisma.user.update({
          where: { id: userId },
          data: {
            phoneVerified: verified,
            phoneVerifiedAt: verified ? new Date() : null
          }
        });
        break;
      case 'mitid':
        updateData.mitidVerified = verified;
        if (verified) {
          updateData.mitidVerifiedAt = new Date();
        }
        await prisma.profile.update({
          where: { userId },
          data: updateData
        });
        break;
      case 'payment':
        updateData.paymentVerified = verified;
        if (verified) {
          updateData.paymentVerifiedAt = new Date();
        }
        await prisma.profile.update({
          where: { userId },
          data: updateData
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid verification type' });
    }

    res.json({ 
      message: `${verificationType} verification updated successfully`,
      verified
    });
  } catch (error: unknown) {
    console.error('Error updating verification:', error);
    res.status(500).json({ 
      error: 'Failed to update verification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Revenue overview
export const getRevenueOverview = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    
    const selectedDate = month && year 
      ? new Date(Number(year), Number(month) - 1, 1)
      : new Date();
    
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

    // Fetch freelance earnings (completed)
    const freelanceEarnings = await prisma.earning.findMany({
      where: {
        status: 'completed',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        amount: true
      }
    });

    // Fetch pending payments
    const pendingEarnings = await prisma.earning.findMany({
      where: {
        status: 'pending',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        amount: true
      }
    });

    // Calculate totals
    const freelanceTotal = freelanceEarnings.reduce((sum: number, earning: any) => 
      sum + Number(earning.amount), 0
    );
    const pendingTotal = pendingEarnings.reduce((sum: number, earning: any) => 
      sum + Number(earning.amount), 0
    );
    const commission = freelanceTotal * 0.15; // 15% commission

    // TODO: Implement membership revenue calculation when membership table is available
    const membershipRevenue = 0;

    // Calculate next payout date (1st of next month)
    const nextPayout = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);

    res.json({
      membershipRevenue,
      freelanceRevenue: freelanceTotal,
      platformCommission: commission,
      pendingPayments: pendingTotal,
      nextPayoutDate: nextPayout.toISOString(),
      totalTransactions: freelanceEarnings.length + pendingEarnings.length
    });
  } catch (error: unknown) {
    console.error('Error fetching revenue overview:', error);
    res.status(500).json({ 
      error: 'Failed to fetch revenue overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get admin users (for contact/admin messaging)
export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        isAdmin: true,
        isActive: true
      },
      include: {
        profile: {
          select: {
            fullName: true,
            avatarUrl: true
          }
        }
      },
      take: 1 // Get first admin for messaging
    });

    if (admins.length === 0) {
      return res.status(404).json({ error: 'No admin users found' });
    }

    res.json({ 
      admin: {
        id: admins[0].id,
        email: admins[0].email,
        fullName: admins[0].profile?.fullName || admins[0].email
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

