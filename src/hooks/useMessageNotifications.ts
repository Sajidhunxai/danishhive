import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApi } from '@/contexts/ApiContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastAction } from '@/components/ui/toast';
import { playMessageSound } from '@/utils/sound';

interface LastMessage {
  conversationId: string;
  messageId: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  content: string;
}

export const useMessageNotifications = (enabled: boolean = true) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMessagesRef = useRef<Map<string, LastMessage>>(new Map());
  const isInitializedRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestInProgressRef = useRef(false);

  const checkForNewMessages = async () => {
    // Don't poll if already on messages page (ConversationsList handles it there)
    const isOnMessagesPage = location.pathname === '/messages';
    if (!user || !enabled || isOnMessagesPage) return;
    
    // Prevent concurrent requests
    if (isRequestInProgressRef.current) return;
    isRequestInProgressRef.current = true;

    try {
      const result = await api.messages.getConversations();
      const conversations = Array.isArray(result) ? result : (result?.conversations || []);

      let totalUnread = 0;
      const newMessages: LastMessage[] = [];

      for (const conv of conversations) {
          const convData = conv as {
          conversationId: string;
          lastMessage?: {
            id: string;
            content: string;
            createdAt: string;
            sender?: { id?: string; profile?: { fullName: string } };
          };
          unreadCount?: number;
        };

        if (convData.unreadCount) {
          totalUnread += convData.unreadCount;
        }

        if (convData.lastMessage) {
          const senderId = convData.lastMessage.sender?.id || '';
          const lastMsg = {
            conversationId: convData.conversationId,
            messageId: convData.lastMessage.id,
            createdAt: convData.lastMessage.createdAt,
            senderId,
            senderName: convData.lastMessage.sender?.profile?.fullName || 'Unknown',
            content: convData.lastMessage.content,
          };

          // Check if this is a new message
          const lastKnown = lastMessagesRef.current.get(convData.conversationId);
          if (
            isInitializedRef.current &&
            (!lastKnown || 
             lastKnown.messageId !== lastMsg.messageId ||
             new Date(lastMsg.createdAt) > new Date(lastKnown.createdAt))
          ) {
            // This is a new message - show notification
            if (lastMsg.senderId && lastMsg.senderId !== user.id) {
              newMessages.push(lastMsg);
            }
          }

          lastMessagesRef.current.set(convData.conversationId, lastMsg);
        }
      }

      setUnreadCount(totalUnread);

      // Show notifications for new messages
      if (isInitializedRef.current && newMessages.length > 0) {
        newMessages.forEach((msg) => {
          // Only show notification if not on messages page
          const isOnMessagesPage = window.location.pathname === '/messages';

          // Play sound notification
          playMessageSound();

          toast({
            title: t('messages.notification.newMessage') || 'New Message',
            description: `${msg.senderName}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`,
            duration: 5000,
          });
        });
      }

      isInitializedRef.current = true;
    } catch (error) {
      console.error('Error checking for new messages:', error);
    } finally {
      isRequestInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (!user || !enabled) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Initial check (only if not on messages page)
    const isOnMessagesPage = location.pathname === '/messages';
    if (!isOnMessagesPage) {
      checkForNewMessages();
    }

    // Poll every 30 seconds for new messages (reduced frequency)
    // Only poll when not on messages page
    pollingIntervalRef.current = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== '/messages') {
        checkForNewMessages();
      }
    }, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [user, enabled, location.pathname]);

  return { unreadCount };
};

