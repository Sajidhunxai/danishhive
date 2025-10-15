import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as verificationController from '../controllers/verification.controller';

const router = Router();

// Phone verification
router.post('/phone/check-availability', authenticate, verificationController.checkPhoneAvailability);
router.post('/phone/send-sms', authenticate, verificationController.sendSMS);
router.post('/phone/verify-sms', authenticate, verificationController.verifySMS);

// Email verification
router.post('/email/send', authenticate, (req, res) => {
  res.json({ message: 'Send email verification' });
});

router.post('/email/verify', (req, res) => {
  res.json({ message: 'Verify email' });
});

router.post('/email/change', authenticate, (req, res) => {
  res.json({ message: 'Request email change' });
});

// CVR lookup
router.get('/cvr/:number', (req, res) => {
  res.json({ message: `CVR lookup for ${req.params.number}` });
});

export default router;

