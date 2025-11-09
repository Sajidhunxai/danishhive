import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApi } from '@/contexts/ApiContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages, Plus, Trash2, ChevronDown } from 'lucide-react';

interface LanguageSkill {
  id: string;
  languageCode: string;
  languageName: string;
  proficiencyLevel: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  // Legacy field names for compatibility
  language_code?: string;
  language_name?: string;
  proficiency_level?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

const AVAILABLE_LANGUAGES_CODES = [
  { code: 'da', flag: '🇩🇰' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'it', flag: '🇮🇹' },
  { code: 'nl', flag: '🇳🇱' },
  { code: 'sv', flag: '🇸🇪' },
  { code: 'no', flag: '🇳🇴' },
  { code: 'fi', flag: '🇫🇮' },
];

const getLanguageName = (code: string, t: (key: string) => string): string => {
  const languageMap: Record<string, string> = {
    'da': t('language.danish'),
    'en': t('language.english'),
    'de': t('language.german'),
    'fr': t('language.french'),
    'es': t('language.spanish'),
    'it': t('language.italian'),
    'nl': 'Nederlands',
    'sv': 'Svenska',
    'no': 'Norsk',
    'fi': 'Suomi',
  };
  return languageMap[code] || code;
};

export const LanguageSkills = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const api = useApi();
    
  const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLanguage, setShowAddLanguage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLanguageSkills();
    }
  }, [user]);

  const fetchLanguageSkills = async () => {
    console.log('LanguageSkills: Fetching language skills for user:', user?.id);
    try {
      const data = await api.languageSkills.getMyLanguageSkills();
      console.log('LanguageSkills: Fetched language skills:', data);
      setLanguageSkills(data || []);
    } catch (error) {
      console.error('Error fetching language skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLanguageSkill = async (languageCode: string, languageName: string) => {
    if (!user) {
      console.log('LanguageSkills: No user found');
      return;
    }

    console.log('LanguageSkills: Adding language skill', { languageCode, languageName, userId: user.id });

    try {
      await api.languageSkills.createLanguageSkill(languageCode, languageName, 'beginner');

      console.log('LanguageSkills: Successfully added language skill');
      await fetchLanguageSkills();
      setShowAddLanguage(false);
      
      toast({
        title: "Sprog tilføjet",
        description: `${languageName} blev tilføjet til dine sprogfærdigheder`,
      });
    } catch (error: any) {
      console.error('Error adding language skill:', error);
      toast({
        title: "Fejl",
        description: error?.response?.data?.error || "Kunne ikke tilføje sprog",
        variant: "destructive",
      });
    }
  };

  const updateProficiencyLevel = async (skillId: string, level: string) => {
    try {
      await api.languageSkills.updateLanguageSkill(skillId, level);

      setLanguageSkills(prev => 
        prev.map(skill => 
          skill.id === skillId 
            ? { ...skill, proficiencyLevel: level, proficiency_level: level }
            : skill
        )
      );

      toast({
        title: "Niveau opdateret",
        description: "Sprog niveau blev opdateret",
      });
    } catch (error) {
      console.error('Error updating proficiency level:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke opdatere niveau",
        variant: "destructive",
      });
    }
  };

  const removeLanguageSkill = async (skillId: string) => {
    try {
      await api.languageSkills.deleteLanguageSkill(skillId);

      setLanguageSkills(prev => prev.filter(skill => skill.id !== skillId));
      
      toast({
        title: "Sprog fjernet",
        description: "Sprog blev fjernet fra dine færdigheder",
      });
    } catch (error) {
      console.error('Error removing language skill:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke fjerne sprog",
        variant: "destructive",
      });
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-red-100 text-red-800 border-red-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'native': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const availableLanguages = AVAILABLE_LANGUAGES_CODES.map(lang => ({
    ...lang,
    name: getLanguageName(lang.code, t)
  })).filter(
    lang => !languageSkills.some(skill => (skill.languageCode || skill.language_code) === lang.code)
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('profile.language_skills')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">{t('loading.languages')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          {t('profile.language_skills')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Skills List */}
        <div className="space-y-3">
          {languageSkills.map((skill) => {
            const languageCode = skill.languageCode || skill.language_code;
            const proficiencyLevel = skill.proficiencyLevel || skill.proficiency_level;
            const languageInfo = AVAILABLE_LANGUAGES_CODES.find(lang => lang.code === languageCode);
            const languageName = languageInfo ? getLanguageName(languageCode, t) : (skill.languageName || skill.language_name || languageCode);
            return (
              <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{languageInfo?.flag}</span>
                  <span className="font-medium">{languageName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select 
                    value={proficiencyLevel} 
                    onValueChange={(value) => updateProficiencyLevel(skill.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="beginner">
                        <Badge className={getProficiencyColor('beginner')}>
                          {t('language.beginner')}
                        </Badge>
                      </SelectItem>
                      <SelectItem value="intermediate">
                        <Badge className={getProficiencyColor('intermediate')}>
                          {t('language.intermediate')}
                        </Badge>
                      </SelectItem>
                      <SelectItem value="advanced">
                        <Badge className={getProficiencyColor('advanced')}>
                          {t('language.advanced')}
                        </Badge>
                      </SelectItem>
                      <SelectItem value="native">
                        <Badge className={getProficiencyColor('native')}>
                          {t('language.native')}
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLanguageSkill(skill.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Language Button */}
        {availableLanguages.length > 0 && (
          <DropdownMenu open={showAddLanguage} onOpenChange={setShowAddLanguage}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Tilføj sprog
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border shadow-lg z-50" align="center">
              {availableLanguages.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => addLanguageSkill(language.code, language.name)}
                  className="cursor-pointer hover:bg-muted"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{language.flag}</span>
                    <span>{language.name}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
};