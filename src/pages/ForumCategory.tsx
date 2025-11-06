import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Pin, Lock, MessageCircle, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useLanguage } from '@/contexts/LanguageContext';

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
  author?: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl?: string;
    };
  };
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  postCount: number;
}

const ForumCategory: React.FC = () => {
  const { categoryId } = useParams();
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAccess = userRole === 'freelancer' || userRole === 'admin';

  useEffect(() => {
    if (!hasAccess || !categoryId) return;
    fetchCategoryData();
  }, [categoryId, hasAccess]);

  const fetchCategoryData = async () => {
    try {
      // Fetch all categories to find the current one
      const categoriesData = await api.forum.getCategories();
      const currentCategory = categoriesData.find((c: ForumCategory) => c.id === categoryId);
      
      if (!currentCategory) {
        throw new Error('Category not found');
      }

      // Fetch posts in this category
      const postsData = await api.forum.getPosts({ categoryId });

      setCategory(currentCategory);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching category data:', error);
      toast.error('Fejl ved indlæsning af kategori data');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="animate-pulse">{t('loading.category')}</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Kategorien blev ikke fundet.
            </p>
          </CardContent>
        </Card>
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/forum">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbage til Forum
              </Button>
            </Link>
          </div>
          <Link to={`/forum/category/${categoryId}/new-post`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nyt Indlæg
            </Button>
          </Link>
        </div>

        {/* Category Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          <p className="text-muted-foreground mb-4">{category.description}</p>
          <Badge variant="secondary">{category.postCount} indlæg</Badge>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Ingen indlæg i denne kategori endnu.
                </p>
                <Link to={`/forum/category/${categoryId}/new-post`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Opret det første indlæg
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Link key={post.id} to={`/forum/post/${post.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.profile?.avatarUrl} />
                        <AvatarFallback>
                          {getInitials(post.author?.profile?.fullName || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {post.isPinned && (
                            <Pin className="h-4 w-4 text-primary" />
                          )}
                          {post.isLocked && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.content.substring(0, 200)}...
                        </p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span>{post.author?.profile?.fullName || 'Unknown'}</span>
                            <span>
                              {formatDistanceToNow(new Date(post.createdAt))} siden
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.replyCount} svar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumCategory;