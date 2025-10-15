import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/apply', authenticate, (req, res) => {
  res.json({ message: 'Apply coupon' });
});

router.post('/validate', authenticate, (req, res) => {
  res.json({ message: 'Validate coupon' });
});

export default router;

