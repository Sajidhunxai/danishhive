import React, { useState, useEffect, useRef } from 'react';
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
  const isFetchingRef = useRef(false);
  
  const fetchConversations = async () => {
    if (!user) return;
    
    // Prevent concurrent requests
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      console.log('Fetching conversations for user:', user.id);
      const result: { conversations?: unknown[] } | unknown[] = await api.messages.getConversations();
      console.log('Conversations API response:', result);
      console.log('Result type:', Array.isArray(result) ? 'array' : 'object');
      
      // Handle both array and object responses
      let conversationsArray: unknown[] = [];
      if (Array.isArray(result)) {
        conversationsArray = result;
      } else if (result && typeof result === 'object' && 'conversations' in result) {
        conversationsArray = (result as { conversations?: unknown[] }).conversations || [];
      }
      
      console.log('Conversations array to map:', conversationsArray);
      
      // Backend shape: { conversations: [{ conversationId, lastMessage, unreadCount }] }
      const mapped: Conversation[] = conversationsArray.map((c: unknown) => {
        const conv = c as {
          conversationId: string;
          lastMessage?: {
            id: string;
            content: string;
            createdAt: string;
            sender: { 
              id: string; 
              userType?: string;
              email?: string;
              profile?: { fullName: string; avatarUrl?: string } 
            };
            receiver: { 
              id: string; 
              userType?: string;
              email?: string;
              profile?: { fullName: string; avatarUrl?: string } 
            };
          };
          unreadCount?: number;
        };
        const last = conv.lastMessage;
        if (!last) {
          // If no last message, return minimal conversation data
          return {
            id: conv.conversationId,
            client_id: '',
            freelancer_id: '',
            last_message_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            latest_message: undefined,
            client_profile: undefined,
            freelancer_profile: undefined,
          } as Conversation;
        }

        // Determine client and freelancer based on userType
        const sender = last.sender;
        const receiver = last.receiver;
        
        // Determine which is client and which is freelancer based on userType
        let clientId: string;
        let freelancerId: string;
        let clientProfile: { fullName: string; avatarUrl?: string } | undefined;
        let freelancerProfile: { fullName: string; avatarUrl?: string } | undefined;
        
        if (sender.userType === 'CLIENT') {
          clientId = sender.id;
          freelancerId = receiver.id;
          clientProfile = sender.profile;
          freelancerProfile = receiver.profile;
        } else if (receiver.userType === 'CLIENT') {
          clientId = receiver.id;
          freelancerId = sender.id;
          clientProfile = receiver.profile;
          freelancerProfile = sender.profile;
        } else {
          // Fallback: if userType is not set, use current user's role
          if (user?.userType === 'CLIENT') {
            clientId = user.id;
            freelancerId = sender.id === user.id ? receiver.id : sender.id;
            clientProfile = sender.id === user.id ? sender.profile : (receiver.id === user.id ? receiver.profile : undefined);
            freelancerProfile = sender.id === user.id ? receiver.profile : sender.profile;
          } else {
            freelancerId = user?.id || sender.id;
            clientId = sender.id === user?.id ? receiver.id : sender.id;
            freelancerProfile = sender.id === user?.id ? sender.profile : (receiver.id === user?.id ? receiver.profile : undefined);
            clientProfile = sender.id === user?.id ? receiver.profile : sender.profile;
          }
        }
        
        return {
          id: conv.conversationId,
          client_id: clientId || '',
          freelancer_id: freelancerId || '',
          last_message_at: last.createdAt || null,
          created_at: last.createdAt || new Date().toISOString(),
          updated_at: last.createdAt || new Date().toISOString(),
          latest_message: {
            content: last.content,
            sender_id: sender.id,
            created_at: last.createdAt,
          } as Conversation['latest_message'],
          client_profile: clientProfile
            ? { full_name: clientProfile.fullName, avatar_url: clientProfile.avatarUrl }
            : undefined,
          freelancer_profile: freelancerProfile
            ? { full_name: freelancerProfile.fullName, avatar_url: freelancerProfile.avatarUrl }
            : undefined,
        } as Conversation;
      });

      console.log('Mapped conversations:', mapped);
      console.log('Number of conversations:', mapped.length);
      setConversations(mapped);
      console.log('Conversations state set, length:', mapped.length);
    } catch (error: unknown) {
      console.error('Error fetching conversations:', error);
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

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Real-time updates via polling (simple fallback)
  // Only poll when on messages page
  useEffect(() => {
    const isOnMessagesPage = window.location.pathname === '/messages';
    if (!isOnMessagesPage) return;
    
    const id = setInterval(() => {
      if (user) fetchConversations();
    }, 20000); // Increased to 20 seconds
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

  console.log('Render - loading:', loading, 'conversations.length:', conversations.length);

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

  console.log('Before empty check - conversations:', conversations);
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