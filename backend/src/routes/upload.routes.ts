import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload job attachment
router.post('/job-attachment', uploadController.uploadJobAttachment);

// Delete job attachment
router.delete('/job-attachment', uploadController.deleteJobAttachment);

// Move temp files to job folder
router.post('/move-temp-files', uploadController.moveTempFilesToJob);

export default router;


