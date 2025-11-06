import { Router } from 'express';
import * as universityController from '../controllers/university.controller';

const router = Router();

// Universities endpoint doesn't require authentication (public data)
router.get('/', universityController.getUniversities);

export default router;

