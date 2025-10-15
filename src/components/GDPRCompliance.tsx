import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Download, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Cookie,
  Eye,
  Settings
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GDPRConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export const GDPRCompliance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consents, setConsents] = useState<GDPRConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Load saved consent preferences from localStorage
    const savedConsents = localStorage.getItem('gdpr-consents');
    if (savedConsents) {
      setConsents(JSON.parse(savedConsents));
    }
  }, []);

  const updateConsent = (type: keyof GDPRConsent, value: boolean) => {
    const newConsents = { ...consents, [type]: value };
    setConsents(newConsents);
    localStorage.setItem('gdpr-consents', JSON.stringify(newConsents));
    
    toast({
      title: "Samtykke opdateret",
      description: `${type === 'analytics' ? 'Analyse' : type === 'marketing' ? 'Marketing' : 'Præferencer'} cookies ${value ? 'aktiveret' : 'deaktiveret'}`,
    });
  };

  const exportUserData = async () => {
    if (!user) return;

    setExporting(true);
    try {
      // Use the secure export function
      const { data, error } = await supabase.functions.invoke('export-user-data');

      if (error) throw error;

      // Create downloadable JSON file from the response
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `danish-hive-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data eksporteret",
        description: "Dine data er downloadet som JSON fil",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Eksport fejlede",
        description: "Der opstod en fejl ved eksport af data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Konto slettet",
        description: "Din konto og alle tilknyttede data er permanent slettet",
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Sletning fejlede",
        description: error.message || "Der opstod en fejl ved sletning af kontoen",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* GDPR Rights Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dine GDPR Rettigheder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Ret til indsigt</p>
                <p className="text-sm text-muted-foreground">Se hvilke data vi har om dig</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Ret til dataportabilitet</p>
                <p className="text-sm text-muted-foreground">Download dine data</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Ret til sletning</p>
                <p className="text-sm text-muted-foreground">Slet din konto permanent</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Ret til berigtigelse</p>
                <p className="text-sm text-muted-foreground">Ret fejl i dine data</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Præferencer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Nødvendige cookies</p>
                <p className="text-sm text-muted-foreground">Påkrævet for grundlæggende funktionalitet</p>
              </div>
              <Badge variant="secondary">Påkrævet</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Analyse cookies</p>
                <p className="text-sm text-muted-foreground">Hjælper os forbedre tjenesten</p>
              </div>
              <Button
                variant={consents.analytics ? "default" : "outline"}
                size="sm"
                onClick={() => updateConsent('analytics', !consents.analytics)}
              >
                {consents.analytics ? 'Aktiveret' : 'Deaktiveret'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Marketing cookies</p>
                <p className="text-sm text-muted-foreground">Personaliserede annoncer og indhold</p>
              </div>
              <Button
                variant={consents.marketing ? "default" : "outline"}
                size="sm"
                onClick={() => updateConsent('marketing', !consents.marketing)}
              >
                {consents.marketing ? 'Aktiveret' : 'Deaktiveret'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Præference cookies</p>
                <p className="text-sm text-muted-foreground">Husker dine indstillinger</p>
              </div>
              <Button
                variant={consents.preferences ? "default" : "outline"}
                size="sm"
                onClick={() => updateConsent('preferences', !consents.preferences)}
              >
                {consents.preferences ? 'Aktiveret' : 'Deaktiveret'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Data */}
            <Button 
              onClick={exportUserData}
              disabled={exporting}
              className="flex items-center gap-2 h-auto p-4 justify-start"
              variant="outline"
            >
              <Download className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Eksporter Mine Data</p>
                <p className="text-sm text-muted-foreground">Download alle dine data som JSON</p>
              </div>
            </Button>

            {/* Delete Account */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2 h-auto p-4 justify-start"
                >
                  <Trash2 className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Slet Min Konto</p>
                    <p className="text-sm opacity-90">Permanent sletning af alle data</p>
                  </div>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Slet Konto Permanent
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>Denne handling kan ikke fortrydes.</strong>
                    <br /><br />
                    Følgende data vil blive slettet permanent:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Din profil og kontaktoplysninger</li>
                      <li>Alle beskeder og kommunikation</li>
                      <li>Jobansøgninger og kontrakter</li>
                      <li>Indtægtshistorik og betalingsdata</li>
                      <li>Uploadede filer og billeder</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuller</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Sletter...' : 'Slet Permanent'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Legal Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Juridiske Dokumenter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => window.open('/privacy-policy', '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Privatlivspolitik
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => window.open('/terms-of-service', '_blank')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Servicevilkår
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => window.open('/cookie-policy', '_blank')}
          >
            <Cookie className="h-4 w-4 mr-2" />
            Cookie Politik
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};