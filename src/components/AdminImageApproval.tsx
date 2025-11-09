import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApi } from '@/contexts/ApiContext';
import { Image, Check, X, User, Building2 } from 'lucide-react';

interface ProfileImage {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  image_type: string;
  status: string;
  created_at: string;
  admin_notes?: string;
  profiles?: {
    full_name: string;
    company?: string;
  };
}

export const AdminImageApproval: React.FC = () => {
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const { t } = useLanguage();
  const api = useApi();

  const fetchPendingImages = async () => {
    try {
      const imagesData = await api.imageApproval.getPendingImages();

      // Map backend data to expected format
      const imagesWithProfiles = imagesData.map((image: any) => ({
        id: image.id,
        user_id: image.userId,
        file_name: image.fileName,
        file_url: image.fileUrl,
        image_type: image.imageType,
        status: image.status,
        created_at: image.createdAt,
        admin_notes: image.adminNotes,
        profiles: image.profile ? {
          full_name: image.profile.fullName,
          company: image.profile.companyName
        } : null
      }));

      setImages(imagesWithProfiles);
    } catch (error: any) {
      console.error('Error fetching images:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke hente billeder til godkendelse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingImages();
  }, []);

  const handleImageAction = async (imageId: string, action: 'approved' | 'rejected') => {
    setProcessingIds(prev => new Set(prev).add(imageId));
    
    try {
      const notes = adminNotes[imageId] || undefined;

      if (action === 'approved') {
        await api.imageApproval.approveImage(imageId, notes);
      } else {
        await api.imageApproval.rejectImage(imageId, notes);
      }

      toast({
        title: action === 'approved' ? "Billede godkendt!" : "Billede afvist!",
        description: `Billedet er blevet ${action === 'approved' ? 'godkendt' : 'afvist'}`,
      });

      // Remove from list
      setImages(prev => prev.filter(img => img.id !== imageId));
      
      // Clear notes
      setAdminNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[imageId];
        return newNotes;
      });

    } catch (error: any) {
      console.error('Error updating image status:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke opdatere billede status",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const updateAdminNotes = (imageId: string, notes: string) => {
    setAdminNotes(prev => ({
      ...prev,
      [imageId]: notes
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Billede Godkendelser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Billede Godkendelser
          {images.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {images.length} afventer
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Ingen billeder afventer godkendelse
          </p>
        ) : (
          <div className="space-y-6">
            {images.map((image) => (
              <div key={image.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={image.file_url}
                      alt="Pending approval"
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {image.image_type === 'portrait' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                          {image.profiles?.full_name || 'Ukendt bruger'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {image.image_type === 'portrait' ? 'Portræt' : 'Firma logo'}
                          {image.profiles?.company && ` • ${image.profiles.company}`}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(image.created_at).toLocaleDateString('da-DK')}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>Fil: {image.file_name}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`notes-${image.id}`}>Admin noter (valgfrit)</Label>
                      <Textarea
                        id={`notes-${image.id}`}
                        placeholder="Tilføj noter om godkendelse/afvisning..."
                        value={adminNotes[image.id] || ''}
                        onChange={(e) => updateAdminNotes(image.id, e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleImageAction(image.id, 'approved')}
                        disabled={processingIds.has(image.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Godkend
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleImageAction(image.id, 'rejected')}
                        disabled={processingIds.has(image.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Afvis
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};