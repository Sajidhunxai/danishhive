import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image, Building2, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProfileImageUploadProps {
  onImageUploaded?: (imageData: { file_url: string; image_type: 'portrait' | 'logo' }) => void;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ onImageUploaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<'portrait' | 'logo'>('portrait');
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ugyldig filtype",
          description: "Vælg venligst en billedfil (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fil for stor",
          description: "Billedet må maksimalt være 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Bruger ikke logget ind');

      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${imageType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create signed URL for private bucket access
      const { data: signed, error: signedError } = await supabase.storage
        .from('profile-images')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      if (signedError) throw signedError;
      const publicUrl = signed?.signedUrl;

      // Save to database for admin approval
      const { error: dbError } = await supabase
        .from('profile_images')
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_url: publicUrl,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          image_type: imageType,
          status: 'pending'
        });

      if (dbError) throw dbError;

      toast({
        title: "Billede uploadet!",
        description: "Dit billede er sendt til godkendelse af admin",
      });

      onImageUploaded?.({ file_url: publicUrl, image_type: imageType });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fejlede",
        description: error.message || "Kunne ikke uploade billede",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setUploadedImage(null);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium flex items-center gap-2">
        <Image className="h-4 w-4" />
        Profilbillede (valgfrit)
      </Label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="image-type">Bildetype</Label>
          <Select value={imageType} onValueChange={(value: 'portrait' | 'logo') => setImageType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">
                <span className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Portræt
                </span>
              </SelectItem>
              <SelectItem value="logo">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Firma logo
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="image-upload">Vælg billede</Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
        </div>
      </div>

      {uploadedImage && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <img
                src={uploadedImage}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border"
              />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">
                  {imageType === 'portrait' ? 'Portræt' : 'Firma logo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedFile?.name} ({(((selectedFile?.size ?? 0) / 1024) / 1024).toFixed(2)} MB)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={uploadImage}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploading ? "Uploader..." : "Upload til godkendelse"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={removeImage}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded border-l-4 border-amber-400">
        ⚠️ Alle billeder skal godkendes af en administrator før de bliver synlige på din profil.
        <br />
        💡 Understøttede formater: JPG, PNG, GIF. Maksimal størrelse: 5MB.
      </div>
    </div>
  );
};