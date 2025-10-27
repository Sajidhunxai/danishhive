import React from 'react';
import { MessagingInbox } from '@/components/MessagingInbox';
import { useLanguage } from '@/contexts/LanguageContext';

const Messages: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('messages.title')}</h1>
      </div>
      <MessagingInbox />
    </div>
  );
};

export default Messages;