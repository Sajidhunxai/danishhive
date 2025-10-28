import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cookie, Settings, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from "@/contexts/LanguageContext";
interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [consents, setConsents] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });
  const { t } = useLanguage();
  useEffect(() => {
    // Check if user has already made a choice
    const savedConsents = localStorage.getItem('gdpr-consents');
    const consentTimestamp = localStorage.getItem('gdpr-consent-timestamp');
    
    if (!savedConsents || !consentTimestamp) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    } else {
      // Check if consent is older than 13 months (GDPR requirement)
      const thirteenMonths = 13 * 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(consentTimestamp) > thirteenMonths) {
        setShowBanner(true);
      } else {
        setConsents(JSON.parse(savedConsents));
      }
    }
  }, []);

  const saveConsents = (newConsents: CookieConsent) => {
    localStorage.setItem('gdpr-consents', JSON.stringify(newConsents));
    localStorage.setItem('gdpr-consent-timestamp', Date.now().toString());
    setConsents(newConsents);
    setShowBanner(false);
    setShowPreferences(false);
    
    // Apply consent choices
    if (newConsents.analytics) {
      // Enable analytics tracking
      console.log('Analytics tracking enabled');
    }
    if (newConsents.marketing) {
      // Enable marketing tracking
      console.log('Marketing tracking enabled');
    }
  };

  const acceptAll = () => {
    saveConsents({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
  };

  const acceptNecessary = () => {
    saveConsents({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
  };

  const updateConsent = (type: keyof CookieConsent, value: boolean) => {
    const newConsents = { ...consents, [type]: value };
    setConsents(newConsents);
  };

  const savePreferences = () => {
    saveConsents(consents);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Consent Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{t("cookies.title")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                {t("cookies.description")}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={acceptAll} className="bg-primary text-primary-foreground">
                  {t("cookies.acceptAll")}
                  </Button>
                  <Button onClick={acceptNecessary} variant="outline">
                  {t("cookies.acceptNecessary")}
                  </Button>
                  <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {t("cookies.customize")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{t("cookies.preferencesTitle")}</DialogTitle>
                        <DialogDescription>
                          {t("cookies.preferencesDesc")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        {/* Necessary Cookies */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{t("cookies.necessaryTitle")}</h4>
                              <Badge variant="secondary">{t("gdpr.required")}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {t("cookies.necessaryDesc")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("cookies.necessaryIncludes")}
                            </p>
                          </div>
                          <div className="ml-4">
                            <Badge variant="default">{t("cookies.alwaysActive")}</Badge>
                          </div>
                        </div>

                        {/* Analytics Cookies */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">{t("cookies.analyticsTitle")}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t("cookies.analyticsDesc")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("cookies.analyticsIncludes")}
                            </p>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant={consents.analytics ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateConsent('analytics', !consents.analytics)}
                            >
                              {consents.analytics ? t("cookies.enabled") : t("cookies.disabled")}
                            </Button>
                          </div>
                        </div>

                        {/* Marketing Cookies */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">{t("gdpr.marketingCookies")}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t("cookies.marketingDesc")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("cookies.marketingIncludes")}
                            </p>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant={consents.marketing ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateConsent('marketing', !consents.marketing)}
                            >
                              {consents.marketing ? t("cookies.enabled") : t("cookies.disabled")}
                            </Button>
                          </div>
                        </div>

                        {/* Preference Cookies */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">{t("cookies.preferenceTitle")}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t("cookies.preferenceDesc")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("cookies.preferenceIncludes")}
                            </p>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant={consents.preferences ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateConsent('preferences', !consents.preferences)}
                            >
                              {consents.preferences ? t("cookies.enabled") : t("cookies.disabled")}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button onClick={savePreferences} className="flex-1">
                          {t("cookies.savePreferences")}
                        </Button>
                        <Button onClick={acceptAll} variant="outline" className="flex-1">
                          {t("cookies.acceptAll")}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};