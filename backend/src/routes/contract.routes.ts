import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as contractController from '../controllers/contract.controller';

const router = Router();

router.get('/', authenticate, contractController.getAllContracts);
router.get('/my-contracts', authenticate, contractController.getAllContracts); // Alias for user's contracts
router.post('/', authenticate, contractController.createContract);
router.get('/:id', authenticate, contractController.getContractById);
router.put('/:id', authenticate, contractController.updateContract);
router.post('/:id/sign', authenticate, contractController.signContract);

export default router;

