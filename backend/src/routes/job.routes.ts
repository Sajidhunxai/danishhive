import { Router } from 'express';
import { authenticate, requireClient } from '../middleware/auth.middleware';
import * as jobController from '../controllers/job.controller';

const router = Router();

// Public routes
router.get('/', jobController.getAllJobs);

// Protected routes - must come before /:id to avoid route conflicts
router.get('/my/jobs', authenticate, requireClient, jobController.getMyJobs);
router.post('/', authenticate, requireClient, jobController.createJob);

// ID-based routes - must come last
router.get('/:id', jobController.getJobById);
router.put('/:id', authenticate, requireClient, jobController.updateJob);
router.delete('/:id', authenticate, requireClient, jobController.deleteJob);

export default router;

