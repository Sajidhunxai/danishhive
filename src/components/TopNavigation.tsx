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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MessageCircle, User, Settings, LogOut, Home, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TopNavigation: React.FC = () => {
  const { user, userRole, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const texts = {
    da: {
      messages: 'Beskeder',
      profile: 'Profil',
      settings: 'Kontosikkerhed',
      logout: 'Log ud',
      home: 'Hjem',
      forum: 'Forum',
    },
    en: {
      messages: 'Messages',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
      home: 'Home',
      forum: 'Forum',
    }
  };

  const t = texts[language as keyof typeof texts] || texts.da;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const getHomeRoute = () => {
    // Always redirect to dashboard based on role
    if (userRole === 'admin') return '/admin';
    if (userRole === 'client') return '/client';
    return '/'; // Freelancers go to main page with jobs
  };

  // Show forum link for freelancers and admins
  const showForumLink = userRole === 'freelancer' || userRole === 'admin';

  if (!user) return null;

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(getHomeRoute())}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            <span className="font-medium">Hjem</span>
          </Button>

          {/* Right side menu */}
          <div className="flex items-center gap-2">
            {/* Forum - for freelancers and admins */}
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

            {/* Messages */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => handleNavigation('/messages')}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t.messages}</span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {getInitials(user?.user_metadata?.full_name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">
                    {user?.user_metadata?.full_name || 'User'}
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
          </div>
        </div>
      </div>
    </nav>
  );
};