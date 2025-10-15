import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

// Categories
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.forumCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Posts
export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, search } = req.query;
    
    const where: any = {};
    
    if (categoryId) {
      where.categoryId = categoryId as string;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { content: { contains: search as string } },
      ];
    }
    
    const posts = await prisma.forumPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { lastReplyAt: 'desc' },
      ],
    });
    
    res.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const getPostById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                profile: {
                  select: {
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, title, content } = req.body;
    
    if (!categoryId || !title || !content) {
      return res.status(400).json({ error: 'Category, title, and content are required' });
    }
    
    // Check if category exists
    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId },
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const post = await prisma.forumPost.create({
      data: {
        categoryId,
        authorId: req.user!.id,
        title,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // Update category post count
    await prisma.forumCategory.update({
      where: { id: categoryId },
      data: {
        postCount: { increment: 1 },
      },
    });
    
    res.status(201).json({ post, message: 'Post created successfully' });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, isPinned, isLocked } = req.body;
    
    const existingPost = await prisma.forumPost.findUnique({
      where: { id },
    });
    
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Only author or admin can update
    if (existingPost.authorId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }
    
    const updateData: any = {};
    
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    
    // Only admin can pin or lock
    if (req.user!.isAdmin) {
      if (isPinned !== undefined) updateData.isPinned = isPinned;
      if (isLocked !== undefined) updateData.isLocked = isLocked;
    }
    
    const post = await prisma.forumPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    
    res.json({ post, message: 'Post updated successfully' });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingPost = await prisma.forumPost.findUnique({
      where: { id },
    });
    
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Only author or admin can delete
    if (existingPost.authorId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    await prisma.forumPost.delete({
      where: { id },
    });
    
    // Update category post count
    await prisma.forumCategory.update({
      where: { id: existingPost.categoryId },
      data: {
        postCount: { decrement: 1 },
      },
    });
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// Replies
export const createReply = async (req: AuthRequest, res: Response) => {
  try {
    const { postId, content, parentReplyId } = req.body;
    
    if (!postId || !content) {
      return res.status(400).json({ error: 'Post ID and content are required' });
    }
    
    // Check if post exists and is not locked
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.isLocked) {
      return res.status(400).json({ error: 'Post is locked' });
    }
    
    const reply = await prisma.forumReply.create({
      data: {
        postId,
        authorId: req.user!.id,
        content,
        parentReplyId: parentReplyId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    
    // Update post reply count and last reply info
    await prisma.forumPost.update({
      where: { id: postId },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
        lastReplyBy: req.user!.id,
      },
    });
    
    res.status(201).json({ reply, message: 'Reply created successfully' });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
};

export const updateReply = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const existingReply = await prisma.forumReply.findUnique({
      where: { id },
    });
    
    if (!existingReply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    // Only author or admin can update
    if (existingReply.authorId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this reply' });
    }
    
    const reply = await prisma.forumReply.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    
    res.json({ reply, message: 'Reply updated successfully' });
  } catch (error) {
    console.error('Update reply error:', error);
    res.status(500).json({ error: 'Failed to update reply' });
  }
};

export const deleteReply = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingReply = await prisma.forumReply.findUnique({
      where: { id },
    });
    
    if (!existingReply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    // Only author or admin can delete
    if (existingReply.authorId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this reply' });
    }
    
    await prisma.forumReply.delete({
      where: { id },
    });
    
    // Update post reply count
    await prisma.forumPost.update({
      where: { id: existingReply.postId },
      data: {
        replyCount: { decrement: 1 },
      },
    });
    
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
};

