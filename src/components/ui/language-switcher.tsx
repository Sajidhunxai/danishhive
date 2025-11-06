import React from 'react';
import { Button } from './button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './dropdown-menu';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'da', name: t('language.danish'), flag: '🇩🇰' },
    { code: 'en', name: t('language.english'), flag: '🇬🇧' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  ];

  const currentLang = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang?.flag} {currentLang?.name}</span>
          <span className="sm:hidden">{currentLang?.flag}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
        {languages.map((languageOption) => (
          <DropdownMenuItem
            key={languageOption.code}
            onClick={() => setLanguage(languageOption.code)}
            className={`cursor-pointer hover:bg-muted ${
              language === languageOption.code ? 'bg-muted' : ''
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{languageOption.flag}</span>
              <span>{languageOption.name}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};