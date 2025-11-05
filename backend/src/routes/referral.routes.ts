import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as referralController from '../controllers/referral.controller';

const router = Router();

router.get('/summary', authenticate, referralController.getReferralSummary);
router.get('/', authenticate, referralController.listReferrals);
router.get('/bonuses', authenticate, referralController.listReferralBonuses);
router.post('/', authenticate, referralController.createReferral);

export default router;


