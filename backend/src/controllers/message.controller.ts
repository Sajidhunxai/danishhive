import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const getAllMessages = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user!.id },
          { receiverId: req.user!.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            userType: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            userType: true,
            email: true,
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
        createdAt: 'desc',
      },
    });
    
    res.json({ messages });
  } catch (error: unknown) {
    console.error('Get messages error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      message: errorMessage 
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content, conversationId } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver and content are required' });
    }
    
    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }
    
    // Generate conversation ID if not provided
    const convId = conversationId || `conv-${[req.user!.id, receiverId].sort().join('-')}`;
    
    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId,
        content,
        conversationId: convId,
      },
      include: {
        sender: {
          select: {
            id: true,
            userType: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            userType: true,
            email: true,
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
    
    res.status(201).json({ message });
  } catch (error: unknown) {
    console.error('Send message error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    res.status(500).json({ 
      error: 'Failed to send message',
      message: errorMessage 
    });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    // Get all messages for this user
    const allMessages = await prisma.message.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: req.user!.id },
              { receiverId: req.user!.id },
            ],
          },
          {
            conversationId: { not: null },
          },
        ],
      },
      select: {
        conversationId: true,
      },
    });
    
    // Get unique conversation IDs
    const uniqueConversationIds = [...new Set(
      allMessages
        .map(m => m.conversationId)
        .filter((id): id is string => id !== null)
    )];
    
    // Get last message and unread count for each conversation
    const conversations = await Promise.all(
      uniqueConversationIds.map(async (conversationId) => {
        const lastMessage = await prisma.message.findFirst({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                userType: true,
                email: true,
                profile: {
                  select: {
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            receiver: {
              select: {
                id: true,
                userType: true,
                email: true,
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
        
        if (!lastMessage) {
          return null;
        }
        
        const unreadCount = await prisma.message.count({
          where: {
            conversationId,
            receiverId: req.user!.id,
            isRead: false,
          },
        });
        
        return {
          conversationId,
          lastMessage,
          unreadCount,
        };
      })
    );
    
    // Filter out null conversations and sort by last message date
    const filteredConversations = conversations
      .filter((conv): conv is NonNullable<typeof conv> => conv !== null)
      .sort((a, b) => {
        const dateA = new Date(a.lastMessage.createdAt).getTime();
        const dateB = new Date(b.lastMessage.createdAt).getTime();
        return dateB - dateA;
      });
    
    res.json({ conversations: filteredConversations });
  } catch (error: unknown) {
    console.error('Get conversations error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    res.status(500).json({ 
      error: 'Failed to fetch conversations',
      message: errorMessage 
    });
  }
};

export const getConversationWithUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    const conversationId = `conv-${[req.user!.id, userId].sort().join('-')}`;
    
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            userType: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            userType: true,
            email: true,
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
    });
    
    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: req.user!.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    
    res.json({ messages });
  } catch (error: unknown) {
    console.error('Get conversation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    res.status(500).json({ 
      error: 'Failed to fetch conversation',
      message: errorMessage 
    });
  }
};

export const getMessagesByConversationId = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    // Verify user is part of this conversation
    const userMessages = await prisma.message.findFirst({
      where: {
        conversationId,
        OR: [
          { senderId: req.user!.id },
          { receiverId: req.user!.id },
        ],
      },
    });
    
    if (!userMessages) {
      return res.status(403).json({ error: 'Not authorized to access this conversation' });
    }
    
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            userType: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            userType: true,
            email: true,
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
    });
    
    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: req.user!.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    
    res.json({ messages });
  } catch (error: unknown) {
    console.error('Get messages by conversation ID error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      message: errorMessage 
    });
  }
};

export const markMessageAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const message = await prisma.message.findUnique({
      where: { id },
    });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.receiverId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    
    res.json({ message: updatedMessage });
  } catch (error: unknown) {
    console.error('Mark as read error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    res.status(500).json({ 
      error: 'Failed to mark message as read',
      message: errorMessage 
    });
  }
};

