import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image, Building2, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBackendAuth } from '@/hooks/useBackendAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';

interface ProfileImageUploadProps {
  onImageUploaded?: (imageData: { file_url: string; image_type: 'portrait' | 'logo' }) => void;
  currentImageUrl?: string | null;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ onImageUploaded, currentImageUrl }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<'portrait' | 'logo'>('portrait');
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useBackendAuth();
  const { t } = useLanguage();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('image.invalidFileType'),
          description: t('image.invalidFileTypeDesc'),
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('image.fileTooLarge'),
          description: t('image.fileTooLargeDesc'),
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
      if (!user) throw new Error('User not logged in');

      // Convert image to base64 for backend upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;

          // Send to backend API for upload and approval
          const token = localStorage.getItem('auth_token');
          const backendUrl = api.getBackendUrl();
          const response = await fetch(`${backendUrl}/profiles/upload-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              image: base64Data,
              imageType: imageType,
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              fileType: selectedFile.type,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || t('image.uploadFailed'));
          }

          const data = await response.json();
          console.log('Image upload response:', data);

          toast({
            title: t('image.uploadSuccess'),
            description: t('image.uploadSuccessDesc'),
          });

          // Update the preview with the uploaded image URL
          setUploadedImage(data.imageUrl);
          console.log('Updated uploadedImage to:', data.imageUrl);
          
          onImageUploaded?.({ file_url: data.imageUrl, image_type: imageType });

        } catch (error: any) {
          console.error('Upload error:', error);
          toast({
            title: t('image.uploadFailed'),
            description: error.message || t('image.uploadFailedDesc'),
            variant: "destructive",
          });
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(selectedFile);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: t('image.uploadFailed'),
        description: error.message || t('image.uploadFailedDesc'),
        variant: "destructive",
      });
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
        {t('image.profileImage')}
      </Label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="image-type">{t('image.imageType')}</Label>
          <Select value={imageType} onValueChange={(value: 'portrait' | 'logo') => setImageType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">
                <span className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  {t('image.portrait')}
                </span>
              </SelectItem>
              <SelectItem value="logo">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t('image.logo')}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="image-upload">{t('image.selectImage')}</Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
        </div>
      </div>

      {(uploadedImage || currentImageUrl) && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <CardContent className="p-0">
            <div className="flex items-center gap-4">
              <img
                src={uploadedImage || currentImageUrl || ""}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border"
              />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">
                  {imageType === 'portrait' ? t('image.portrait') : t('image.logo')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploadedImage ? 
                    `${selectedFile?.name} (${(((selectedFile?.size ?? 0) / 1024) / 1024).toFixed(2)} MB)` :
                    t('image.currentImage')
                  }
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={uploadImage}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploading ? t('image.uploading') : t('image.uploadForApproval')}
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
        ⚠️ {t('image.approvalNotice')}
        <br />
        💡 {t('image.supportedFormats')}
      </div>
    </div>
  );
};