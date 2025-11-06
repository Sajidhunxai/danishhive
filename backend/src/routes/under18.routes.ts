import { Router } from 'express';
import cors from 'cors';
import * as under18Controller from '../controllers/under18.controller';

const router = Router();

// Allow CORS for under-18 applications (no auth required)
router.use(cors());
router.post('/applications', under18Controller.createUnder18Application);

export default router;

