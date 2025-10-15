import { Router } from 'express';
import { authenticate, requireFreelancer } from '../middleware/auth.middleware';
import * as applicationController from '../controllers/application.controller';

const router = Router();

router.post('/', authenticate, requireFreelancer, applicationController.createApplication);
router.get('/my-applications', authenticate, requireFreelancer, applicationController.getMyApplications);
router.get('/job/:jobId', authenticate, applicationController.getJobApplications);
router.put('/:id', authenticate, applicationController.updateApplication);
router.delete('/:id', authenticate, applicationController.deleteApplication);

export default router;

