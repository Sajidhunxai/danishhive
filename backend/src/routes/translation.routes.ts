import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import * as translationController from '../controllers/translation.controller';

const router = Router();

router.get('/', authenticate, requireAdmin, translationController.getTranslations);
router.get('/team-leaders', authenticate, requireAdmin, translationController.getTeamLeaders);
router.post('/assign/:translationId', authenticate, requireAdmin, translationController.assignTranslation);
router.post('/requests', authenticate, requireAdmin, translationController.createTranslationRequest);

export default router;

