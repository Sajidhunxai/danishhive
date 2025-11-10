import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApi } from '@/contexts/ApiContext';
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
  const api = useApi();
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
    },
    zh:{
      "contactAdmin": "联系管理员",
      "subject": "主题",
      "category": "类别",
      "message": "消息",
      "send": "发送消息",
      "sending": "正在发送...",
      "selectCategory": "选择类别",
      "categories": {
        "general": "一般咨询",
        "technical": "技术问题",
        "billing": "账单问题",
        "account": "账户问题",
        "report": "报告问题",
        "other": "其他"
      },
      "placeholders": {
        "subject": "您的咨询主题是什么？",
        "message": "请描述您的问题或咨询..."
      },
      "success": "您的消息已发送给管理员",
      "error": "发生错误，请重试。"
    },
    hi:{
      "contactAdmin": "प्रशासक से संपर्क करें",
      "subject": "विषय",
      "category": "श्रेणी",
      "message": "संदेश",
      "send": "संदेश भेजें",
      "sending": "भेजा जा रहा है...",
      "selectCategory": "श्रेणी चुनें",
      "categories": {
        "general": "सामान्य पूछताछ",
        "technical": "तकनीकी समस्या",
        "billing": "बिलिंग",
        "account": "खाता समस्या",
        "report": "समस्या की रिपोर्ट करें",
        "other": "अन्य"
      },
      "placeholders": {
        "subject": "आपकी पूछताछ किस बारे में है?",
        "message": "अपनी समस्या या पूछताछ का विवरण लिखें..."
      },
      "success": "आपका संदेश व्यवस्थापक को भेज दिया गया है",
      "error": "एक त्रुटि हुई। कृपया पुनः प्रयास करें।"
    }
  };

  const t = texts[language as keyof typeof texts] || texts.da;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim() || !category) return;

    setIsLoading(true);

    try {
      // First, find an admin user
      const adminData = await api.admin.getAdminUsers();
      const adminId = adminData.admin.id;

      if (!adminId) {
        throw new Error('No admin found');
      }

      // Send the message to admin
      const messageContent = `[${t.categories[category as keyof typeof t.categories]}] ${subject}\n\n${message}`;
      
      await api.messages.sendMessage({
        receiverId: adminId,
        content: messageContent,
        conversationId: `admin-contact-${user.id}`
      });

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