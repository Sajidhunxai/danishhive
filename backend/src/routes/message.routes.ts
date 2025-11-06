import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as messageController from '../controllers/message.controller';

const router = Router();

router.get('/', authenticate, messageController.getAllMessages);
router.post('/', authenticate, messageController.sendMessage);
router.get('/conversations', authenticate, messageController.getConversations);
router.get('/conversation/:userId', authenticate, messageController.getConversationWithUser);
router.get('/conversation-id/:conversationId', authenticate, messageController.getMessagesByConversationId);
router.put('/:id/read', authenticate, messageController.markMessageAsRead);

export default router;

