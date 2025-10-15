import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as profileController from '../controllers/profile.controller';

const router = Router();

router.get('/me', authenticate, profileController.getMyProfile);
router.put('/me', authenticate, profileController.updateMyProfile);
router.get('/freelancers', profileController.getAllFreelancers);
router.get('/:id', profileController.getProfileById);

// Projects
router.post('/projects', authenticate, profileController.createProject);
router.put('/projects/:id', authenticate, profileController.updateProject);
router.delete('/projects/:id', authenticate, profileController.deleteProject);

export default router;

