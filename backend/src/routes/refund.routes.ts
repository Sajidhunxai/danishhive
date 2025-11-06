import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as refundController from '../controllers/refund.controller';

const router = Router();

router.post('/application-honey-drops', authenticate, refundController.refundApplicationHoneyDrops);

export default router;

