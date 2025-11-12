import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/contexts/ApiContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from "@/contexts/LanguageContext";
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
  const api = useApi();
  const [consents, setConsents] = useState<GDPRConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { t } = useLanguage();
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
      title: t("gdpr.toastUpdated"),
      description: `${t(
        type === 'analytics'
          ? 'gdpr.analytics'
          : type === 'marketing'
          ? 'gdpr.marketing'
          : 'gdpr.preferences'
      )} ${value ? t('gdpr.enabled') : t('gdpr.disabled')}`,
    });
    
  };

  const exportUserData = async () => {
    if (!user) return;

    setExporting(true);
    try {
      // Use backend API to export user data
      const result = await api.gdpr.exportData();

      // Create downloadable JSON file from the response
      const dataStr = JSON.stringify(result.data, null, 2);
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
        title: t("gdpr.exportSuccess"),
        description: t("gdpr.exportDescription"),
      });
      
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: t("gdpr.exportError"),
        description: error.message || t("gdpr.exportErrorDesc"),
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
      await api.gdpr.deleteAccount('DELETE');

      toast({
        title: t("gdpr.deleteSuccess"),
        description: t("gdpr.deleteDesc"),
      });
      
      
      // Redirect to auth page after deletion
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
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
            {t("gdpr.rightsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{t("gdpr.accessRight")}</p>
                <p className="text-sm text-muted-foreground">{t("gdpr.accessDesc")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{t("gdpr.portabilityRight")}</p>
                <p className="text-sm text-muted-foreground">{t("gdpr.portabilityDesc")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{t("gdpr.deletionRight")}</p>
                <p className="text-sm text-muted-foreground">{t("gdpr.deletionDesc")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">{t("gdpr.rectificationRight")}</p>
                <p className="text-sm text-muted-foreground">{t("gdpr.rectificationDesc")}</p>
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
            {t("gdpr.cookiePreferences")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{t("gdpr.necessaryCookies")}</p>
                <p className="text-sm text-muted-foreground">{t("gdpr.necessaryCookiesDesc")}</p>
              </div>
              <Badge variant="secondary">{t("gdpr.required")}</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{t("gdpr.analyticsCookies")}</p>
                <p className="text-sm text-muted-foreground">{t("gdpr.analyticsCookiesDesc")}</p>
              </div>
              <Button
                variant={consents.analytics ? "default" : "outline"}
                size="sm"
                onClick={() => updateConsent('analytics', !consents.analytics)}
              >
                {consents.analytics ? t("gdpr.enabled") : t("gdpr.disabled")}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{t("gdpr.marketingCookies")}</p>
                <p className="text-sm text-muted-foreground">{t("gdpr.marketingCookiesDesc")}</p>
              </div>
              <Button
                variant={consents.marketing ? "default" : "outline"}
                size="sm"
                onClick={() => updateConsent('marketing', !consents.marketing)}
              >
                {consents.marketing ? t("gdpr.enabled") : t("gdpr.disabled")}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{t("gdpr.preferenceCookies")}</p>
                <p className="text-sm text-muted-foreground">{t("gdpr.preferenceCookiesDesc")}</p>
              </div>
              <Button
                variant={consents.preferences ? "default" : "outline"}
                size="sm"
                onClick={() => updateConsent('preferences', !consents.preferences)}
              >
                {consents.preferences ? t("gdpr.enabled") : t("gdpr.disabled")}
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
            {t("gdpr.dataManagement")}
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
                <p className="font-medium">{t("gdpr.exportData")}</p>
                <p className="text-sm text-muted-foreground">{t("gdpr.exportDataDesc")}</p>
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
                    <p className="font-medium">{t("gdpr.deleteAccount")}</p>
                    <p className="text-sm opacity-90">{t("gdpr.deleteAccountDesc")}</p>
                  </div>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {t("gdpr.confirmDeleteAccount")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{t("gdpr.irreversibleAction")}</strong>
                    <br /><br />
                    {t("gdpr.deleteWillRemove")}
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{t("gdpr.deleteProfile")}</li>
                      <li>{t("gdpr.deleteMessages")}</li>
                      <li>{t("gdpr.deleteJobs")}</li>
                      <li>{t("gdpr.deleteEarnings")}</li>
                      <li>{t("gdpr.deleteFiles")}</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("gdpr.cancel")}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? t("gdpr.deleting") : t("gdpr.deletePermanent")}
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
            {t("gdpr.legalDocuments")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => window.open('/privacy-policy', '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t("gdpr.privacyPolicy")}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => window.open('/terms-of-service', '_blank')}
          >
            <FileText className="h-4 w-4 mr-2" />
            {t("gdpr.termsOfService")}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => window.open('/cookie-policy', '_blank')}
          >
            <Cookie className="h-4 w-4 mr-2" />
            {t("gdpr.cookiePolicy")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};