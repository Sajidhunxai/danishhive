import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Users, Briefcase, Lightbulb, HelpCircle, Plus, Pin, Lock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
  isActive: boolean;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  replyCount: number;
  lastReplyAt: string;
  lastReplyBy: string | null;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  authorId: string;
  categoryId: string;
  author?: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl?: string;
    };
  };
  category?: {
    id: string;
    name: string;
  };
  _count?: {
    replies: number;
  };
}

const iconMap: Record<string, React.ComponentType<any>> = {
  MessageCircle,
  Users,
  Briefcase,
  Lightbulb,
  HelpCircle,
};

const Forum: React.FC = () => {
  const { user, userRole } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [recentPosts, setRecentPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user has access (freelancer or admin)
  const hasAccess = userRole === 'freelancer' || userRole === 'admin';

  useEffect(() => {
    if (!hasAccess) return;
    
    fetchData();
  }, [user, hasAccess]);

  const fetchData = async () => {
    try {
      // Fetch categories
      const categoriesData = await api.forum.getCategories();

      // Fetch recent posts
      const postsData = await api.forum.getPosts();

      setCategories(categoriesData || []);
      setRecentPosts(postsData?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching forum data:', error);
      toast.error('Fejl ved indlæsning af forum data');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Du skal være logget ind for at se forummet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Dette forum er kun for freelancere og administratorer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Indlæser forum...</div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Danish Hive Forum</h1>
            <p className="text-muted-foreground">
              Vores community for freelancere at dele viden, stille spørgsmål og netværke
            </p>
          </div>
          <Link to="/forum/new-post">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nyt Indlæg
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Kategorier</h2>
            <div className="space-y-4">
              {categories.map((category) => {
                const IconComponent = iconMap[category.icon] || MessageCircle;
                return (
                  <Link key={category.id} to={`/forum/category/${category.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-primary/10 p-3 rounded-lg">
                              <IconComponent className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{category.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {category.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary">
                              {category.postCount} indlæg
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Seneste Aktivitet</h2>
            <Card>
              <CardContent className="p-0">
                {recentPosts.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Ingen indlæg endnu. Vær den første til at starte en diskussion!
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/forum/post/${post.id}`}
                        className="block p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.author?.profile?.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {getInitials(post.author?.profile?.fullName || 'Unknown')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {post.isPinned && (
                                <Pin className="h-3 w-3 text-primary" />
                              )}
                              {post.isLocked && (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <h4 className="font-medium text-sm line-clamp-2 mb-1">
                              {post.title}
                            </h4>
                            <div className="flex items-center text-xs text-muted-foreground space-x-2">
                              <span>{post.author?.profile?.fullName || 'Unknown'}</span>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(post.lastReplyAt || post.createdAt))} siden
                              </span>
                            </div>
                            <div className="flex items-center mt-2 text-xs text-muted-foreground">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              <span>{post.replyCount} svar</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Forum Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Forum Statistik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Kategorier:</span>
                    <span>{categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seneste indlæg:</span>
                    <span>{recentPosts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Din rolle:</span>
                    <Badge variant="outline">{userRole}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;