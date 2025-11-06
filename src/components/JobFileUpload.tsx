import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

interface JobFileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  uploadedFiles: UploadedFile[];
}

const JobFileUpload: React.FC<JobFileUploadProps> = ({ onFilesChange, uploadedFiles }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type (only PDF)
    if (file.type !== 'application/pdf') {
      toast({
        title: "Ugyldig filtype",
        description: "Kun PDF filer er tilladt for guidelines",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Fil for stor",
        description: "PDF filer må maksimalt være 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64File = reader.result as string;
          
          // Upload file using backend API
          const result = await api.upload.uploadJobAttachment(base64File, undefined, file.name);

          const newFile: UploadedFile = {
            id: result.fileId,
            name: file.name,
            size: file.size,
            url: result.fileUrl
          };

          const updatedFiles = [...uploadedFiles, newFile];
          onFilesChange(updatedFiles);

          toast({
            title: "Fil uploadet!",
            description: `${file.name} er uploadet succesfuldt`,
          });
        } catch (error: any) {
          console.error('Upload error:', error);
          toast({
            title: "Upload fejl",
            description: error.message || "Kunne ikke uploade filen. Prøv igen.",
            variant: "destructive",
          });
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload fejl",
          description: "Kunne ikke læse filen. Prøv igen.",
          variant: "destructive",
        });
        setUploading(false);
      };
      
      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fejl",
        description: error.message || "Kunne ikke uploade filen. Prøv igen.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const removeFile = async (fileToRemove: UploadedFile) => {
    try {
      // Remove from backend storage
      await api.upload.deleteJobAttachment(fileToRemove.id);

      // Update state
      const updatedFiles = uploadedFiles.filter(file => file.id !== fileToRemove.id);
      onFilesChange(updatedFiles);

      toast({
        title: "Fil fjernet",
        description: `${fileToRemove.name} er fjernet`,
      });
    } catch (error: any) {
      console.error('Remove error:', error);
      toast({
        title: "Fejl ved fjernelse",
        description: "Kunne ikke fjerne filen. Prøv igen.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Guidelines & Dokumenter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Anbefalet:</strong> Upload PDF guidelines for at hjælpe freelancere bedre at forstå opgaven. 
            Disse kan oversættes til freelancerens lokale sprog for bedre kommunikation.
          </AlertDescription>
        </Alert>

        <div>
          <Label>Upload PDF Guidelines (valgfri)</Label>
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploader..." : "Vælg PDF fil"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Maksimal filstørrelse: 10MB. Kun PDF filer accepteres.
          </p>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Uploadede filer:</h4>
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Når opgaven er oprettet, kan disse guidelines oversættes til forskellige sprog 
              for at hjælpe internationale freelancere.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default JobFileUpload;