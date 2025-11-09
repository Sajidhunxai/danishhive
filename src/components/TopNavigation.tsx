import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageCircle, User, Settings, LogOut, Home, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/contexts/ApiContext';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export const TopNavigation: React.FC = () => {
  const { user, userRole, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { unreadCount } = useMessageNotifications(true);
  const api = useApi();

  const texts = {
    da: {
      messages: 'Beskeder',
      profile: 'Profil',
      settings: 'Kontosikkerhed',
      logout: 'Log ud',
      home: 'Hjem',
      forum: 'Forum',
      login: 'Log ind',
      signup: 'Opret konto',
    },
    en: {
      messages: 'Messages',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      home: 'Home',
      forum: 'Forum',
      login: 'Login',
      signup: 'Sign Up',
    },
  };

  const t = texts[language as keyof typeof texts] || texts.da;
  const isAuthenticated = Boolean(user);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const getHomeRoute = () => {
    if (!isAuthenticated) return '/';
    if (userRole === 'admin') return '/admin';
    if (userRole === 'client') return '/client';
    return '/';
  };

  const showForumLink = isAuthenticated && (userRole === 'freelancer' || userRole === 'admin');

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(getHomeRoute())}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            <span className="font-medium">{t.home}</span>
          </Button>

          <div className="flex items-center gap-2">
            {showForumLink && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleNavigation('/forum')}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t.forum}</span>
              </Button>
            )}

            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 relative"
                onClick={() => handleNavigation('/messages')}
              >
                <div className="relative">
                  <MessageCircle className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
              </Button>
            )}

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {(() => {
                        const raw = user?.profile?.avatarUrl;
                        const src = raw ? (raw.startsWith('http') ? raw : `${api.getBackendUrl()}${raw}`) : undefined;
                        return <AvatarImage src={src} />;
                      })()}
                      <AvatarFallback className="text-xs">
                        {getInitials((user?.profile?.fullName || user?.email || 'User').trim())}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">
                      {user?.profile?.fullName || user?.email || 'User'}
                    </span>
                    {userRole === 'admin' && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    {t.profile}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t.settings}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  {t.login}
                </Button>
                <Button size="sm" onClick={() => navigate('/auth')}> {/* Tabs handle sign up selection */}
                  {t.signup}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};