import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import prisma from '../config/database';
import { sendRegistrationEmail, sendPasswordReset } from '../services/email.service';
import { AuthRequest } from '../middleware/auth.middleware';

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' } as any
  );
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '30d' } as any
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, userType, companyName, cvrNumber } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        userType,
        profile: {
          create: {
            fullName,
            companyName: companyName || null,
            cvrNumber: cvrNumber || null,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Send registration email
    const confirmationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${generateToken(user.id)}`;
    await sendRegistrationEmail(email, fullName, userType.toLowerCase(), confirmationUrl);

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
      },
      token,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if JWT secrets are configured
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      console.error('JWT secrets not configured');
      return res.status(500).json({ 
        error: 'Server configuration error. Please contact support.',
        details: 'JWT secrets not configured'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    let token: string;
    let refreshToken: string;
    try {
      token = generateToken(user.id);
      refreshToken = generateRefreshToken(user.id);
    } catch (tokenError: any) {
      console.error('Token generation error:', tokenError);
      return res.status(500).json({ 
        error: 'Failed to generate authentication tokens',
        details: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        isAdmin: user.isAdmin,
        profile: user.profile,
      },
      token,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Provide more detailed error messages in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Login failed'
      : 'Login failed. Please try again or contact support if the problem persists.';
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logout successful' });
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const resetToken = generateToken(user.id);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendPasswordReset(email, resetLink);

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

export const updateEmail = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newEmail } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new email is already registered
    const existingUserWithEmail = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail, emailVerified: false }, // Mark as unverified until confirmed
    });

    // TODO: Send a verification email to the new address
    // This will require generating a new token and a verification link

    res.json({ message: 'Email update initiated. Please verify your new email address.' });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        userType: true,
        isAdmin: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        profile: true,
      },
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

