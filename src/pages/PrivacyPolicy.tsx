import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Shield, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
const PrivacyPolicy = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            {t("privacy.title")}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("privacy.generalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none space-y-6">
            <div>
              <p><strong>{t("privacy.LastUpdated")}:</strong> {new Date().toLocaleDateString('da-DK')}</p>
              <p>
              {t("privacy.intro")}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("privacy.controller")}
              </h3>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>{t("privacy.company")}</strong></p>
                <p>CVR: [CVR-nummer]</p>
                <p>{t("address.label")}: [Adresse]</p>
                <p>{t("common.email")}: privacy@danishhive.dk</p>
                <p>{t("profile.phone")}: +45 XX XX XX XX</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">{t("privacy.collectTitle")}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{t("privacy.collect.account")}</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>{t("privacy.data.contact")}</li>
                    <li>{t("privacy.data.address")}</li>
                    <li>{t("privacy.data.profile")}</li>
                    <li>{t("privacy.data.skills")}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">{t("privacy.collect.payment")}</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>{t("privacy.data.bank")}</li>
                    <li>{t("privacy.data.mitid")}</li>
                    <li>{t("privacy.data.paymentHistory")}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">{t("privacy.collect.activity")}</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>{t("privacy.data.jobs")}</li>
                    <li>{t("privacy.data.messages")}</li>
                    <li>{t("privacy.data.contracts")}</li>
                    <li>{t("privacy.data.activity")}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">{t("privacy.usageTitle")}</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium">{t("privacy.usage.contract")}</h4>
                  <p className="text-muted-foreground">
                  {t("privacy.usage.contractDesc")}
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium">{t("privacy.usage.legitimate")}</h4>
                  <p className="text-muted-foreground">
                  {t("privacy.usage.legitimateDesc")}
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium">{t("privacy.usage.consent")}</h4>
                  <p className="text-muted-foreground">
                  {t("privacy.usage.consentDesc")}
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium">{t("privacy.usage.legal")}</h4>
                  <p className="text-muted-foreground">
                  {t("privacy.usage.legalDesc")}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">{t("privacy.shareTitle")}</h3>
              <p>{t("privacy.shareDesc")}</p>
              <ul className="list-disc list-inside space-y-2">
                <li>{t("privacy.share.point1")}</li>
                <li>{t("privacy.share.point2")}</li>
                <li>{t("privacy.share.point3")}</li>
                <li>{t("privacy.share.point4")}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">{t("privacy.rightsTitle")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">{t("privacy.right.access")}</h4>
                  <p className="text-sm text-muted-foreground">{t("privacy.right.accessDesc")}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">{t("privacy.right.rectify")}</h4>
                  <p className="text-sm text-muted-foreground">{t("privacy.right.rectifyDesc")}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">{t("privacy.right.delete")}</h4>
                  <p className="text-sm text-muted-foreground">{t("privacy.right.deleteDesc")}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">{t("privacy.right.portability")}</h4>
                  <p className="text-sm text-muted-foreground">{t("privacy.right.portabilityDesc")}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">{t("privacy.securityTitle")}</h3>
              <p>{t("privacy.securityDesc")}:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t("privacy.security.point1")}</li>
                <li>{t("privacy.security.point2")}</li>
                <li>{t("privacy.security.point3")}</li>
                <li>{t("privacy.security.point4")}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">{t("privacy.storageTitle")}</h3>
              <p>{t("privacy.storageDesc")}:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t("privacy.storage.point1")}</li>
                <li>{t("privacy.storage.point2")}</li>
                <li>{t("privacy.storage.point3")}</li>
                <li>{t("privacy.storage.point4")}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t("privacy.contactTitle")}
              </h3>
              <p>
              {t("privacy.contactDesc")}
              </p>
              <div className="bg-muted p-4 rounded-lg mt-3">
                <p><strong>{t("common.email")}:</strong> privacy@danishhive.dk</p>
                <p><strong>{t("profile.phone")}:</strong> +45 XX XX XX XX</p>
                <p><strong>{t("common.post")}:</strong> {t("privacy.company")}, [Adresse]</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
              {t("privacy.complaint")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;