import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as honeyController from '../controllers/honey.controller';

const router = Router();

router.get('/balance', authenticate, honeyController.getBalance);
router.get('/transactions', authenticate, honeyController.getTransactions);
router.post('/purchase', authenticate, honeyController.purchaseHoney);
router.post('/spend', authenticate, honeyController.spendHoney);
router.post('/refund', authenticate, honeyController.refundHoney);

export default router;

