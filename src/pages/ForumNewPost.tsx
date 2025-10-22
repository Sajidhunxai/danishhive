import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
}

const ForumNewPost: React.FC = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAccess = userRole === 'freelancer' || userRole === 'admin';

  useEffect(() => {
    if (!hasAccess) return;
    fetchCategories();
  }, [hasAccess]);

  const fetchCategories = async () => {
    try {
      const data = await api.forum.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Fejl ved indlæsning af kategorier');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedCategoryId || !title.trim() || !content.trim()) {
      toast.error('Udfyld venligst alle felter');
      return;
    }

    setIsSubmitting(true);

    try {
      const post = await api.forum.createPost({
        categoryId: selectedCategoryId,
        title: title.trim(),
        content: content.trim(),
      });

      toast.success('Indlæg oprettet!');
      navigate(`/forum/post/${post.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error 
        : 'Fejl ved oprettelse af indlæg';
      toast.error(errorMessage || 'Fejl ved oprettelse af indlæg');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link to={categoryId ? `/forum/category/${categoryId}` : '/forum'}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Opret Nyt Indlæg</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select 
                  value={selectedCategoryId} 
                  onValueChange={setSelectedCategoryId}
                  disabled={!!categoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg en kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Indtast en beskrivende titel..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Indhold</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Skriv dit indlæg her..."
                  rows={10}
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(categoryId ? `/forum/category/${categoryId}` : '/forum')}
                  disabled={isSubmitting}
                >
                  Annuller
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Opretter...' : 'Opret Indlæg'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForumNewPost;