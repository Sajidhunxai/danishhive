import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

// Apply coupon (public for clients)
router.post('/coupon/apply', authenticate, paymentController.applyCoupon);

// Apply client coupon (for job applications)
router.post('/coupon/apply-client', authenticate, paymentController.applyClientCoupon);

// Payment verification
router.post('/verify-method', authenticate, paymentController.verifyPaymentMethod);

router.post('/check-status', authenticate, paymentController.checkPaymentStatus);

// Escrow payments
router.post('/escrow/create', authenticate, paymentController.createEscrowPayment);

router.post('/escrow/release', authenticate, paymentController.releaseEscrowPayment);

// Honey purchase
router.post('/honey/purchase', authenticate, paymentController.createHoneyPayment);

// Webhooks
router.post('/webhook/escrow', (req, res) => {
  res.json({ message: 'Escrow payment webhook' });
});

router.post('/webhook/honey', (req, res) => {
  res.json({ message: 'Honey payment webhook' });
});

export default router;

