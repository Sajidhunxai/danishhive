import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as earningController from '../controllers/earning.controller';

const router = Router();

router.get('/me', authenticate, earningController.getMyEarnings);

export default router;

