import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Get latest message and profiles for each conversation
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conversation) => {
          // Get latest message
          const { data: messageData } = await supabase
            .from('messages')
            .select('content, sender_id, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get client profile
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', conversation.client_id)
            .single();

          // Get freelancer profile
          const { data: freelancerProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', conversation.freelancer_id)
            .single();

          return {
            ...conversation,
            latest_message: messageData,
            client_profile: clientProfile,
            freelancer_profile: freelancerProfile
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error: any) {
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

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `or(client_id.eq.${user.id},freelancer_id.eq.${user.id})`
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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