import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Placeholder - will be implemented
router.get('/', authenticate, (req, res) => {
  res.json({ message: 'Get all users' });
});

router.get('/:id', authenticate, (req, res) => {
  res.json({ message: `Get user ${req.params.id}` });
});

router.put('/:id', authenticate, (req, res) => {
  res.json({ message: `Update user ${req.params.id}` });
});

router.delete('/:id', authenticate, (req, res) => {
  res.json({ message: `Delete user ${req.params.id}` });
});

export default router;

