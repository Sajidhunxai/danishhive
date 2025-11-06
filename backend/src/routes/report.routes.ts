import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import * as reportController from '../controllers/report.controller';

const router = Router();

router.post('/', authenticate, reportController.createReport);
router.get('/', authenticate, requireAdmin, reportController.getReports);
router.patch('/:reportId/status', authenticate, requireAdmin, reportController.updateReportStatus);

export default router;

