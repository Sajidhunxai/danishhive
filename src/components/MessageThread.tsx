import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { playMessageSound } from '@/utils/sound';
import { useLanguage } from "@/contexts/LanguageContext";
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: string;
  client_id: string;
  freelancer_id: string;
  client_profile?: {
    full_name: string;
    avatar_url?: string;
  };
  freelancer_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface MessageThreadProps {
  conversation: Conversation;
}

export const MessageThread: React.FC<MessageThreadProps> = ({ conversation }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const { t } = useLanguage();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    // Prevent concurrent requests
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      // Use conversation ID directly instead of generating a new one
      console.log('Fetching messages for conversation:', conversation.id);
      const result = await api.messages.getMessagesByConversationId(conversation.id);
      console.log('Messages API response:', result);
      const msgs = (result?.messages || []).map((m: any) => ({
        id: m.id,
        conversation_id: conversation.id,
        sender_id: m.sender.id,
        content: m.content,
        created_at: m.createdAt,
        updated_at: m.createdAt,
        sender_profile: m.sender?.profile
          ? { full_name: m.sender.profile.fullName, avatar_url: m.sender.profile.avatarUrl }
          : undefined,
      })) as Message[];
      
      // Check if there are new messages from other users
      if (messages.length > 0 && user) {
        const previousMessageIds = new Set(messages.map(m => m.id));
        const newMessages = msgs.filter(m => !previousMessageIds.has(m.id));
        const hasNewMessagesFromOthers = newMessages.some(m => m.sender_id !== user.id);
        
        if (hasNewMessagesFromOthers) {
          // Play sound when a new message is received from another user
          playMessageSound();
        }
      }
      
      setMessages(msgs);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente beskeder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const recipientId = conversation.client_id === user.id 
        ? conversation.freelancer_id 
        : conversation.client_id;

      const sent = await api.messages.sendMessage({
        receiverId: recipientId,
        content: newMessage.trim(),
        conversationId: conversation.id,
      });

      const m = (sent?.message || sent) as any;
      const appended: Message = {
        id: m.id,
        conversation_id: conversation.id,
        sender_id: user.id,
        content: m.content,
        created_at: m.createdAt,
        updated_at: m.createdAt,
        sender_profile: m.sender?.profile
          ? { full_name: m.sender.profile.fullName, avatar_url: m.sender.profile.avatarUrl }
          : undefined,
      };

      setMessages(prev => [...prev, appended]);
      setNewMessage('');
      scrollToBottom();
      
      // Note: Sound notification only plays for received messages, not sent messages
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende besked",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simple polling for updates (only when conversation is selected)
  useEffect(() => {
    if (!conversation.id) return;
    
    const id = setInterval(() => {
      fetchMessages();
    }, 15000); // Increased to 15 seconds
    return () => clearInterval(id);
  }, [conversation.id]);

  const getOtherUser = () => {
    if (conversation.client_id === user?.id) {
      return {
        id: conversation.freelancer_id,
        profile: conversation.freelancer_profile
      };
    } else {
      return {
        id: conversation.client_id,
        profile: conversation.client_profile
      };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const otherUser = getOtherUser();

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="animate-pulse flex items-center space-x-3">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="h-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage 
              src={otherUser.profile?.avatar_url} 
              alt={otherUser.profile?.full_name || "Bruger"}
            />
            <AvatarFallback>
              {otherUser.profile?.full_name ? (
                getInitials(otherUser.profile.full_name)
              ) : (
                <User className="h-5 w-5" />
              )}
            </AvatarFallback>
          </Avatar>
          <span>{otherUser.profile?.full_name || "Ukendt bruger"}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[400px]">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Ingen beskeder endnu. Start samtalen!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMyMessage = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMyMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: da
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="flex-shrink-0 space-y-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv din besked..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
            {t("chat.sendHint")}
            </p>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              {sending ? (
                "Sender..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};