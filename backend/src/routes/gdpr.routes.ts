import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as gdprController from '../controllers/gdpr.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Export user data
router.get('/export-data', gdprController.exportUserData);

// Delete user account
router.post('/delete-account', gdprController.deleteUserAccount);

export default router;


