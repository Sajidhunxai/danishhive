import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Pin, Lock, Trash2, Edit, Send, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useApi } from '@/contexts/ApiContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ForumReply {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  postId: string;
  parentReplyId: string | null;
  author?: {
    id: string;
    profile: {
      fullName: string;
      avatarUrl?: string;
    };
  };
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
  updatedAt: string;
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
  replies?: ForumReply[];
}

const ForumPostDetail: React.FC = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const api = useApi();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'post' | 'reply'>('reply');

  const hasAccess = userRole === 'freelancer' || userRole === 'admin';

  useEffect(() => {
    if (!hasAccess || !postId) return;
    fetchPostData();
  }, [postId, hasAccess]);

  const fetchPostData = async () => {
    try {
      const postData = await api.forum.getPostById(postId!);
      setPost(postData);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Fejl ved indlæsning af indlæg');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !replyContent.trim() || !postId) {
      toast.error('Udfyld venligst dit svar');
      return;
    }

    if (post?.isLocked && userRole !== 'admin') {
      toast.error('Dette indlæg er låst');
      return;
    }

    setIsSubmittingReply(true);

    try {
      await api.forum.createReply({
        postId,
        content: replyContent.trim(),
      });

      toast.success('Svar oprettet!');
      setReplyContent('');
      await fetchPostData();
    } catch (error) {
      console.error('Error creating reply:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error 
        : 'Fejl ved oprettelse af svar';
      toast.error(errorMessage || 'Fejl ved oprettelse af svar');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleEditReply = async (replyId: string) => {
    if (!editingContent.trim()) {
      toast.error('Indholdet kan ikke være tomt');
      return;
    }

    try {
      await api.forum.updateReply(replyId, editingContent.trim());
      toast.success('Svar opdateret!');
      setEditingReplyId(null);
      setEditingContent('');
      await fetchPostData();
    } catch (error) {
      console.error('Error updating reply:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error 
        : 'Fejl ved opdatering af svar';
      toast.error(errorMessage || 'Fejl ved opdatering af svar');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === 'post' && deleteTargetId) {
        await api.forum.deletePost(deleteTargetId);
        toast.success('Indlæg slettet!');
        navigate(`/forum/category/${post?.categoryId}`);
      } else if (deleteType === 'reply' && deleteTargetId) {
        await api.forum.deleteReply(deleteTargetId);
        toast.success('Svar slettet!');
        await fetchPostData();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error 
        : 'Fejl ved sletning';
      toast.error(errorMessage || 'Fejl ved sletning');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  const openDeleteDialog = (id: string, type: 'post' | 'reply') => {
    setDeleteTargetId(id);
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const canEditOrDelete = (authorId: string) => {
    return user?.id === authorId || userRole === 'admin';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
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
        <div className="animate-pulse">{t('loading.post')}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Indlægget blev ikke fundet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to={`/forum/category/${post.categoryId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage til {post.category?.name}
            </Button>
          </Link>
        </div>

        {/* Post */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {post.isPinned && <Pin className="h-4 w-4 text-primary" />}
                  {post.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                  <Badge variant="outline">{post.category?.name}</Badge>
                </div>
                <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              </div>
              {canEditOrDelete(post.authorId) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openDeleteDialog(post.id, 'post')}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Slet indlæg
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author?.profile?.avatarUrl} />
                <AvatarFallback>
                  {getInitials(post.author?.profile?.fullName || 'Unknown')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold">{post.author?.profile?.fullName || 'Unknown'}</span>
                  <span className="text-sm text-muted-foreground">
                    • {formatDistanceToNow(new Date(post.createdAt))} siden
                  </span>
                </div>
              </div>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Svar ({post.replies?.length || 0})
          </h2>
          <div className="space-y-4">
            {post.replies && post.replies.length > 0 ? (
              post.replies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.author?.profile?.avatarUrl} />
                        <AvatarFallback className="text-xs">
                          {getInitials(reply.author?.profile?.fullName || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm">
                              {reply.author?.profile?.fullName || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {formatDistanceToNow(new Date(reply.createdAt))} siden
                            </span>
                            {reply.updatedAt !== reply.createdAt && (
                              <span className="text-xs text-muted-foreground italic">
                                (redigeret)
                              </span>
                            )}
                          </div>
                          {canEditOrDelete(reply.authorId) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingReplyId(reply.id);
                                    setEditingContent(reply.content);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rediger
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(reply.id, 'reply')}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Slet
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {editingReplyId === reply.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={4}
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => handleEditReply(reply.id)}>
                                Gem
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingReplyId(null);
                                  setEditingContent('');
                                }}
                              >
                                Annuller
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Ingen svar endnu. Vær den første til at svare!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {!post.isLocked || userRole === 'admin' ? (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Skriv et svar</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Skriv dit svar her..."
                  rows={6}
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmittingReply}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmittingReply ? 'Sender...' : 'Send Svar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                Dette indlæg er låst. Der kan ikke oprettes flere svar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
            <AlertDialogDescription>
              Denne handling kan ikke fortrydes. Dette vil permanent slette{' '}
              {deleteType === 'post' ? 'indlægget og alle tilhørende svar' : 'svaret'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Slet</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ForumPostDetail;

