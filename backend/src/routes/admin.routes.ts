import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All routes require admin access
router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/with-email', adminController.getUsersWithEmail);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/change-role', adminController.changeUserRole);
router.post('/users/create-admin', adminController.createAdminUser);
router.post('/users/update-password', adminController.updateUserPassword);

// Coupon management
router.get('/coupons', adminController.getAllCoupons);
router.post('/coupons', adminController.createCoupon);
router.put('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);
router.get('/coupons/validate/:code', adminController.validateCoupon);
router.post('/coupons/use/:code', adminController.useCoupon);

// Verification management
router.post('/users/:userId/verification', adminController.updateVerification);

// Revenue overview
router.get('/revenue/overview', adminController.getRevenueOverview);

// Get admin users (for contact/admin messaging)
router.get('/users/admin', adminController.getAdminUsers);

export default router;

