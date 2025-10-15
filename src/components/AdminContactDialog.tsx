import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { MessageCircle, Send } from 'lucide-react';

interface AdminContactDialogProps {
  trigger?: React.ReactNode;
}

export const AdminContactDialog: React.FC<AdminContactDialogProps> = ({ 
  trigger 
}) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');

  const texts = {
    da: {
      contactAdmin: 'Kontakt Admin',
      subject: 'Emne',
      category: 'Kategori',
      message: 'Besked',
      send: 'Send besked',
      sending: 'Sender...',
      selectCategory: 'Vælg kategori',
      categories: {
        general: 'Generel forespørgsel',
        technical: 'Teknisk problem',
        billing: 'Fakturering',
        account: 'Konto problem',
        report: 'Rapporter problem',
        other: 'Andet'
      },
      placeholders: {
        subject: 'Hvad handler din henvendelse om?',
        message: 'Beskriv dit problem eller din forespørgsel...'
      },
      success: 'Din besked er sendt til admin',
      error: 'Der opstod en fejl. Prøv igen.'
    },
    en: {
      contactAdmin: 'Contact Admin',
      subject: 'Subject',
      category: 'Category',
      message: 'Message',
      send: 'Send message',
      sending: 'Sending...',
      selectCategory: 'Select category',
      categories: {
        general: 'General inquiry',
        technical: 'Technical issue',
        billing: 'Billing',
        account: 'Account issue',
        report: 'Report problem',
        other: 'Other'
      },
      placeholders: {
        subject: 'What is your inquiry about?',
        message: 'Describe your problem or inquiry...'
      },
      success: 'Your message has been sent to admin',
      error: 'An error occurred. Please try again.'
    }
  };

  const t = texts[language as keyof typeof texts] || texts.da;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim() || !category) return;

    setIsLoading(true);

    try {
      // First, find an admin user
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_admin', true)
        .limit(1)
        .single();

      if (adminError || !adminProfile) {
        throw new Error('No admin found');
      }

      // Create or find conversation with admin
      let conversationId: string;
      
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${user.id},freelancer_id.eq.${adminProfile.user_id}),and(client_id.eq.${adminProfile.user_id},freelancer_id.eq.${user.id})`)
        .limit(1)
        .single();

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation with admin
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            client_id: user.id,
            freelancer_id: adminProfile.user_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (conversationError || !newConversation) {
          throw conversationError;
        }

        conversationId = newConversation.id;
      }

      // Send the message
      const messageContent = `[${t.categories[category as keyof typeof t.categories]}] ${subject}\n\n${message}`;
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: messageContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (messageError) {
        throw messageError;
      }

      // Send notification to admin
      try {
        await supabase.functions.invoke('send-message-notification', {
          body: {
            recipientId: adminProfile.user_id,
            senderName: user.user_metadata?.full_name || 'Unknown User',
            messageContent: messageContent
          }
        });
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
      }

      toast({
        title: t.success,
        description: t.success,
      });

      // Reset form and close
      setSubject('');
      setCategory('');
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending admin message:', error);
      toast({
        title: t.error,
        description: t.error,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <MessageCircle className="h-4 w-4" />
      {t.contactAdmin}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.contactAdmin}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t.category}</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder={t.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t.categories).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t.subject}</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.placeholders.subject}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t.message}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.placeholders.message}
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuller
            </Button>
            <Button type="submit" disabled={isLoading || !subject.trim() || !message.trim() || !category}>
              {isLoading ? (
                <>
                  <Send className="mr-2 h-4 w-4 animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t.send}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};