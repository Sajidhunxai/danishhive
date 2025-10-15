import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as forumController from '../controllers/forum.controller';

const router = Router();

// Categories
router.get('/categories', forumController.getCategories);

// Posts
router.get('/posts', forumController.getPosts);
router.post('/posts', authenticate, forumController.createPost);
router.get('/posts/:id', forumController.getPostById);
router.put('/posts/:id', authenticate, forumController.updatePost);
router.delete('/posts/:id', authenticate, forumController.deletePost);

// Replies
router.post('/replies', authenticate, forumController.createReply);
router.put('/replies/:id', authenticate, forumController.updateReply);
router.delete('/replies/:id', authenticate, forumController.deleteReply);

export default router;

