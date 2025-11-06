import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import * as imageApprovalController from '../controllers/imageApproval.controller';

const router = Router();

router.get('/pending', authenticate, requireAdmin, imageApprovalController.getPendingImages);
router.post('/:imageId/approve', authenticate, requireAdmin, imageApprovalController.approveImage);
router.post('/:imageId/reject', authenticate, requireAdmin, imageApprovalController.rejectImage);

export default router;

