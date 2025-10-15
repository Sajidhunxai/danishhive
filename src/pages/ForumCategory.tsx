import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Pin, Lock, MessageCircle, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  reply_count: number;
  last_reply_at: string;
  last_reply_by: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  author_id: string;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  post_count: number;
}

const ForumCategory: React.FC = () => {
  const { categoryId } = useParams();
  const { user, userRole } = useAuth();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, {full_name: string; avatar_url?: string}>>({});
  const [loading, setLoading] = useState(true);

  const hasAccess = userRole === 'freelancer' || userRole === 'admin';

  useEffect(() => {
    if (!hasAccess || !categoryId) return;
    fetchCategoryData();
  }, [categoryId, hasAccess]);

  const fetchCategoryData = async () => {
    try {
      // Fetch category details
      const { data: categoryData, error: categoryError } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (categoryError) throw categoryError;

      // Fetch posts in this category
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('category_id', categoryId)
        .order('is_pinned', { ascending: false })
        .order('last_reply_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles for all unique user IDs
      if (postsData?.length) {
        const userIds = Array.from(new Set([
          ...postsData.map(p => p.author_id),
          ...postsData.map(p => p.last_reply_by).filter(Boolean)
        ]));

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const profileMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, {full_name: string; avatar_url?: string}>);

        setProfiles(profileMap);
      }

      setCategory(categoryData);
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
        <div className="animate-pulse">Indlæser kategori...</div>
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
          <Badge variant="secondary">{category.post_count} indlæg</Badge>
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
                        <AvatarImage src={profiles[post.author_id]?.avatar_url} />
                        <AvatarFallback>
                          {getInitials(profiles[post.author_id]?.full_name || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {post.is_pinned && (
                            <Pin className="h-4 w-4 text-primary" />
                          )}
                          {post.is_locked && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <h3 className="font-semibold line-clamp-2">{post.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.content.substring(0, 200)}...
                        </p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span>{profiles[post.author_id]?.full_name || 'Unknown'}</span>
                            <span>
                              {formatDistanceToNow(new Date(post.created_at))} siden
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.reply_count} svar</span>
                            {post.last_reply_at && post.last_reply_by && (
                              <span>
                                • Seneste af {profiles[post.last_reply_by]?.full_name || 'Unknown'}
                              </span>
                            )}
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