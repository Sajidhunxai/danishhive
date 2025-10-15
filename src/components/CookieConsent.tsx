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
                <h3 className="font-semibold text-lg mb-2">Vi bruger cookies</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Vi bruger cookies til at forbedre din oplevelse på Danish Hive. Nogle cookies er nødvendige for 
                  at platformen fungerer, mens andre hjælper os med at forstå, hvordan du bruger vores tjeneste.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={acceptAll} className="bg-primary text-primary-foreground">
                    Accepter alle
                  </Button>
                  <Button onClick={acceptNecessary} variant="outline">
                    Kun nødvendige
                  </Button>
                  <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Tilpas præferencer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Cookie Præferencer</DialogTitle>
                        <DialogDescription>
                          Vælg hvilke typer cookies du tillader. Du kan altid ændre dine præferencer senere.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        {/* Necessary Cookies */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">Nødvendige cookies</h4>
                              <Badge variant="secondary">Påkrævet</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Disse cookies er nødvendige for at Danish Hive kan fungere korrekt. 
                              De kan ikke deaktiveres.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Inkluderer: Session cookies, sikkerhed, formdata
                            </p>
                          </div>
                          <div className="ml-4">
                            <Badge variant="default">Altid aktiv</Badge>
                          </div>
                        </div>

                        {/* Analytics Cookies */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">Analyse cookies</h4>
                            <p className="text-sm text-muted-foreground">
                              Hjælper os med at forstå, hvordan besøgende interagerer med hjemmesiden 
                              ved at indsamle og rapportere information anonymt.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Inkluderer: Google Analytics, brugsstatistikker
                            </p>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant={consents.analytics ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateConsent('analytics', !consents.analytics)}
                            >
                              {consents.analytics ? 'Aktiveret' : 'Deaktiveret'}
                            </Button>
                          </div>
                        </div>

                        {/* Marketing Cookies */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">Marketing cookies</h4>
                            <p className="text-sm text-muted-foreground">
                              Bruges til at vise relevante annoncer og spore effektiviteten af 
                              vores marketingkampagner.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Inkluderer: Facebook Pixel, Google Ads, retargeting
                            </p>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant={consents.marketing ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateConsent('marketing', !consents.marketing)}
                            >
                              {consents.marketing ? 'Aktiveret' : 'Deaktiveret'}
                            </Button>
                          </div>
                        </div>

                        {/* Preference Cookies */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">Præference cookies</h4>
                            <p className="text-sm text-muted-foreground">
                              Gør det muligt for hjemmesiden at huske oplysninger, der ændrer 
                              måden, siden fungerer eller ser ud på.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Inkluderer: Sprogindstillinger, tema, layout præferencer
                            </p>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant={consents.preferences ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateConsent('preferences', !consents.preferences)}
                            >
                              {consents.preferences ? 'Aktiveret' : 'Deaktiveret'}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button onClick={savePreferences} className="flex-1">
                          Gem præferencer
                        </Button>
                        <Button onClick={acceptAll} variant="outline" className="flex-1">
                          Accepter alle
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