import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { useLanguage } from "@/contexts/LanguageContext";

interface Conversation {
  id: string;
  client_id: string;
  freelancer_id: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  client_profile?: {
    full_name: string;
    avatar_url?: string;
  };
  freelancer_profile?: {
    full_name: string;
    avatar_url?: string;
  };
  latest_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
}

interface ConversationsListProps {
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  onConversationSelect,
  selectedConversationId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const fetchConversations = async () => {
    if (!user) return;

    try {
      const result: { conversations?: unknown[] } = await api.messages.getConversations();
      // Backend shape: { conversations: [{ conversationId, lastMessage, unreadCount }] }
      const mapped: Conversation[] = (result?.conversations || []).map((c: unknown) => {
        const conv = c as {
          conversationId: string;
          lastMessage?: {
            id: string;
            content: string;
            createdAt: string;
            sender: { id: string; profile?: { fullName: string; avatarUrl?: string } };
            receiver: { id: string; profile?: { fullName: string; avatarUrl?: string } };
          };
          unreadCount?: number;
        };
        const last = conv.lastMessage;
        const senderId: string | undefined = last?.sender?.id;
        const receiverId = last?.receiver?.id;
        const clientId = senderId === user.id ? senderId : receiverId;
        const freelancerId = senderId === user.id ? receiverId : senderId;
        const clientProfile = last?.sender?.id === clientId ? last?.sender?.profile : last?.receiver?.profile;
        const freelancerProfile = last?.sender?.id === freelancerId ? last?.sender?.profile : last?.receiver?.profile;
        return {
          id: conv.conversationId,
          client_id: clientId,
          freelancer_id: freelancerId,
          last_message_at: last?.createdAt || null,
          created_at: last?.createdAt || new Date().toISOString(),
          updated_at: last?.createdAt || new Date().toISOString(),
          latest_message: last
            ? ({
                content: last.content as string,
                sender_id: last.sender.id as string,
                created_at: last.createdAt as string,
              } as Conversation['latest_message'])
            : undefined,
          client_profile: clientProfile
            ? { full_name: clientProfile.fullName, avatar_url: clientProfile.avatarUrl }
            : undefined,
          freelancer_profile: freelancerProfile
            ? { full_name: freelancerProfile.fullName, avatar_url: freelancerProfile.avatarUrl }
            : undefined,
        } as Conversation;
      });

      setConversations(mapped);
    } catch (error: unknown) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente beskeder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Real-time updates via polling (simple fallback)
  useEffect(() => {
    const id = setInterval(() => {
      if (user) fetchConversations();
    }, 10000);
    return () => clearInterval(id);
  }, [user]);

  const getOtherUser = (conversation: Conversation) => {
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t("messages.noMessagesTitle")}</h3>
          <p className="text-muted-foreground">
          {t("messages.noConversations")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherUser = getOtherUser(conversation);
        const isSelected = selectedConversationId === conversation.id;
        const isMyMessage = conversation.latest_message?.sender_id === user?.id;

        return (
          <Card
            key={conversation.id}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              isSelected ? 'ring-2 ring-primary bg-muted/30' : ''
            }`}
            onClick={() => onConversationSelect(conversation)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
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
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium truncate">
                      {otherUser.profile?.full_name || "Ukendt bruger"}
                    </h4>
                    {conversation.latest_message && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.latest_message.created_at), {
                          addSuffix: true,
                          locale: da
                        })}
                      </span>
                    )}
                  </div>
                  
                  {conversation.latest_message ? (
                    <div className="flex items-center space-x-2">
                      {isMyMessage && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          Du
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.latest_message.content}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("messages.noMessagesDesc")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};