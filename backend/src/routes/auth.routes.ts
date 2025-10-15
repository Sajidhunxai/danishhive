import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullName').notEmpty().trim(),
    body('userType').isIn(['FREELANCER', 'CLIENT']),
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

// Logout
router.post('/logout', authenticate, authController.logout);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Verify email
router.post('/verify-email', authController.verifyEmail);

// Request password reset
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  authController.resetPassword
);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

export default router;

