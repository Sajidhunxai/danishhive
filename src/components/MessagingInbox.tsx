import React, { useState } from 'react';
import { ConversationsList } from './ConversationsList';
import { MessageThread } from './MessageThread';
import { AdminContactDialog } from './AdminContactDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

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

export const MessagingInbox: React.FC = () => {
  const { userRole } = useAuth();
  const { language } = useLanguage();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const texts = {
    da: {
      messages: 'Beskeder',
      selectConversation: 'Vælg en samtale',
      selectConversationDesc: 'Vælg en samtale fra listen for at se beskeder',
      contactAdmin: 'Kontakt Admin'
    },
    en: {
      messages: 'Messages',
      selectConversation: 'Select a conversation',
      selectConversationDesc: 'Select a conversation from the list to view messages',
      contactAdmin: 'Contact Admin'
    }
  };

  const t = texts[language as keyof typeof texts] || texts.da;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations list */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t.messages}
              </div>
              {userRole !== 'admin' && (
                <AdminContactDialog />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto">
            <ConversationsList
              onConversationSelect={setSelectedConversation}
              selectedConversationId={selectedConversation?.id}
            />
          </CardContent>
        </Card>
      </div>

      {/* Message thread */}
      <div className="lg:col-span-2">
        {selectedConversation ? (
          <MessageThread conversation={selectedConversation} />
        ) : (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t.selectConversation}</h3>
                <p className="text-muted-foreground">
                  {t.selectConversationDesc}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};