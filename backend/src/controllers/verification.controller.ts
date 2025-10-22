import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { sendVerificationCode } from '../services/sms.service';

// Generate a 6-digit verification code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if phone number is available
export const checkPhoneAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if phone number is already registered by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phoneNumber: phoneNumber,
        id: { not: req.user?.id }, // Exclude current user
      },
    });

    const available = !existingUser;
    res.json({ available });
  } catch (error) {
    console.error('Check phone availability error:', error);
    res.status(500).json({ error: 'Failed to check phone availability' });
  }
};

// Send SMS verification code
export const sendSMS = async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumber, countryCode } = req.body;

    if (!phoneNumber || !countryCode) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number and country code are required' 
      });
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if phone is already in use by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phoneNumber: fullPhoneNumber,
        id: { not: req.user!.id },
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Dette telefonnummer er allerede registreret',
      });
    }

    // Store verification code in database
    await prisma.phoneVerification.upsert({
      where: {
        phoneNumber: fullPhoneNumber,
      },
      update: {
        verificationCode: code,
        expiresAt,
      },
      create: {
        phoneNumber: fullPhoneNumber,
        verificationCode: code,
        expiresAt,
      },
    });

    // Send SMS via Twilio
    const sent = await sendVerificationCode(fullPhoneNumber, code);

    // In development mode, allow bypass if SMS fails (log code to console)
    if (!sent) {
      if (process.env.NODE_ENV === 'development') {
        console.log('─────────────────────────────────────────');
        console.log('📱 SMS Service Not Available (Development Mode)');
        console.log(`Phone: ${fullPhoneNumber}`);
        console.log(`Verification Code: ${code}`);
        console.log(`Expires: ${expiresAt.toLocaleString()}`);
        console.log('─────────────────────────────────────────');
        
        return res.json({
          success: true,
          message: 'Verification code sent successfully (dev mode)',
          devMode: true,
          code: code, // Only in development!
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send SMS. Please try again.',
      });
    }

    res.json({
      success: true,
      message: 'Verification code sent successfully',
    });
  } catch (error: any) {
    console.error('Send SMS error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send verification code',
    });
  }
};

// Verify SMS code
export const verifySMS = async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumber, countryCode, verificationCode } = req.body;

    if (!phoneNumber || !countryCode || !verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'Phone number, country code, and verification code are required',
      });
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;

    // Find verification record
    const verification = await prisma.phoneVerification.findUnique({
      where: { phoneNumber: fullPhoneNumber },
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'No verification request found',
      });
    }

    // Check if code matches
    if (verification.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
      });
    }

    // Check if code has expired
    if (new Date() > verification.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new one.',
      });
    }

    // Update user with verified phone
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        phoneNumber: fullPhoneNumber,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    });

    // Delete the verification record (it's been used)
    await prisma.phoneVerification.delete({
      where: { phoneNumber: fullPhoneNumber },
    });

    res.json({
      success: true,
      message: 'Phone number verified successfully',
    });
  } catch (error: any) {
    console.error('Verify SMS error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify code',
    });
  }
};

