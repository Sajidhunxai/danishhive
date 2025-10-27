import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Shield, User, CreditCard, MapPin, Mail, Lock, CheckCircle, AlertCircle, Save } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ContractSystem } from "@/components/ContractSystem";
import { BackButton } from "@/components/ui/back-button";
import BankAutocomplete from "@/components/BankAutocomplete";
import { GDPRCompliance } from "@/components/GDPRCompliance";
import { useLanguage } from "@/contexts/LanguageContext";
interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  iban: string | null;
  bank_name: string | null;
  account_holder_name: string | null;
  registration_number?: string | null;
  account_number?: string | null;
  payment_method?: string | null;
  paypal_email?: string | null;
  mitid_verified: boolean | null;
  mitid_verification_date: string | null;
  role: string | null;
  is_admin: boolean | null;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<Profile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"danish_bank" | "iban" | "paypal">("danish_bank");
  const [paypalEmail, setPaypalEmail] = useState("");
  const { t } = useLanguage();
  useEffect(() => {
    if (user) {
      fetchProfile();
      setNewEmail(user.email || "");
    }
  }, [user]);

  // Initialize registration and account numbers when profile changes
  useEffect(() => {
    if (profile) {
      if ((profile as any).registration_number) {
        setRegistrationNumber((profile as any).registration_number);
      }
      if ((profile as any).account_number) {
        setAccountNumber((profile as any).account_number);
      }
      if ((profile as any).payment_method) {
        setPaymentMethod((profile as any).payment_method);
      }
      if ((profile as any).paypal_email) {
        setPaypalEmail((profile as any).paypal_email);
      }
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
      setOriginalProfile(data);
      setHasChanges(false);
      
      // Initialize registration and account numbers from existing data
      if ((data as any)?.registration_number) {
        setRegistrationNumber((data as any).registration_number);
      }
      if ((data as any)?.account_number) {
        setAccountNumber((data as any).account_number);
      }
      if ((data as any)?.payment_method) {
        setPaymentMethod((data as any).payment_method);
      }
      if ((data as any)?.paypal_email) {
        setPaypalEmail((data as any).paypal_email);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          ...updates,
        });

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setOriginalProfile(prev => prev ? { ...prev, ...updates } : null);
      setHasChanges(false);
      toast({
        title: "Succes",
        description: "Profil opdateret",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke opdatere profil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAllChanges = async () => {
    if (!user || !profile || !hasChanges) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profile,
        });

      if (error) throw error;

      setOriginalProfile(profile);
      setHasChanges(false);
      toast({
        title: "Succes",
        description: "Alle ændringer er gemt",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke gemme ændringerne",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Check for changes when profile updates
  React.useEffect(() => {
    if (profile && originalProfile) {
      const hasProfileChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);
      setHasChanges(hasProfileChanges);
    }
  }, [profile, originalProfile]);

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Fejl",
        description: "Adgangskoder matcher ikke",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Fejl",
        description: "Adgangskode skal være mindst 6 tegn",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Succes",
        description: "Adgangskode opdateret",
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke opdatere adgangskode",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast({
        title: "Fejl",
        description: "Indtast en ny email adresse",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Bekræftelses email sendt til den nye adresse",
      });
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke opdatere email",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const simulateMitIdVerification = async () => {
    // Dette er en simulation - i virkeligheden ville du integrere med MitID API
    setSaving(true);
    try {
      await updateProfile({
        mitid_verified: true,
        mitid_verification_date: new Date().toISOString(),
      });

      toast({
        title: "Succes",
        description: "MitID verificering gennemført",
      });
    } catch (error) {
      console.error('Error with MitID verification:', error);
      toast({
        title: "Fejl",
        description: "MitID verificering fejlede",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("settings.loadingSettings")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-px h-8 bg-border"></div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              {t("nav.settings")}
            </h1>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button 
                onClick={saveAllChanges} 
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                {saving ? t("completeProfile.saving") : "Gem Ændringer"}
              </Button>
            )}
            <ThemeToggle />
            <BackButton />
            <Button onClick={signOut} variant="destructive" size="sm">
            {t("nav.logout")}
            </Button>
          </div>
        </div>

        {/* Contract System - Kun til klienter */}
        {profile?.role === 'client' && <ContractSystem />}

        {/* GDPR Compliance Section */}
        <GDPRCompliance />

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t("profile.account_security")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Update */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t("settings.emailAddress")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2">
                  <Label htmlFor="new_email">{t("settings.newEmail")}</Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={user?.email || ""}
                  />
                </div>
                <Button onClick={updateEmail} disabled={saving}>
                {t("settings.updateEmail")}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
              {t("settings.emailConfirmNotice")}
              </p>
            </div>

            <Separator />

            {/* Password Update */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("settings.changePassword")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new_password">{t("settings.newPassword")}</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm_password">{t("settings.confirmPassword")}</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={updatePassword} 
                disabled={saving || !newPassword || !confirmPassword}
              >
                {t("settings.updatePassword")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Address Information - Kun for ikke-admin brugere */}
        {!profile?.is_admin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("settings.addressInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">{t("address.label")}</Label>
              <Input
                id="address"
                value={profile?.address || ""}
                 onChange={(e) => setProfile(prev => prev ? { ...prev, address: e.target.value } : null)}
                 placeholder="Vejnavn og husnummer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">{t("contact.postcode")}</Label>
                <Input
                  id="postal_code"
                  value={profile?.postal_code || ""}
                   onChange={(e) => setProfile(prev => prev ? { ...prev, postal_code: e.target.value } : null)}
                   placeholder="0000"
                />
              </div>
              <div>
                <Label htmlFor="city">By</Label>
                <Input
                  id="city"
                  value={profile?.city || ""}
                   onChange={(e) => setProfile(prev => prev ? { ...prev, city: e.target.value } : null)}
                   placeholder="Bynavn"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Bank Information - Kun for ikke-admin brugere */}
        {!profile?.is_admin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("settings.bankInfo")}
              </CardTitle>
            </CardHeader>
          <CardContent>
            <BankAutocomplete
              registrationNumber={registrationNumber}
              accountNumber={accountNumber}
              bankName={profile?.bank_name || ""}
              accountHolderName={profile?.account_holder_name || ""}
              iban={profile?.iban || ""}
              paypalEmail={paypalEmail}
              paymentMethod={paymentMethod}
              onRegistrationNumberChange={(value) => {
                setRegistrationNumber(value);
                setProfile(prev => prev ? { ...prev, registration_number: value } : null);
              }}
              onAccountNumberChange={(value) => {
                setAccountNumber(value);
                setProfile(prev => prev ? { ...prev, account_number: value } : null);
              }}
              onBankNameChange={(value) => {
                setProfile(prev => prev ? { ...prev, bank_name: value } : null);
              }}
              onAccountHolderNameChange={(value) => {
                setProfile(prev => prev ? { ...prev, account_holder_name: value } : null);
              }}
              onIbanChange={(value) => {
                setProfile(prev => prev ? { ...prev, iban: value } : null);
              }}
              onPaypalEmailChange={(value) => {
                setPaypalEmail(value);
                setProfile(prev => prev ? { ...prev, paypal_email: value } : null);
              }}
              onPaymentMethodChange={(value) => {
                setPaymentMethod(value);
                setProfile(prev => prev ? { ...prev, payment_method: value } : null);
              }}
            />
          </CardContent>
        </Card>
        )}

        {/* MitID Verification - Kun for ikke-admin brugere */}
        {!profile?.is_admin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("settings.mitidVerification")}
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{t("settings.verificationStatus")}</p>
                <div className="flex items-center gap-2">
                  {profile?.mitid_verified ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="default" className="bg-green-100 text-green-800">
                      {t("profile.verified")}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {t("settings.notVerified")}
                      </Badge>
                    </>
                  )}
                </div>
                {profile?.mitid_verified && profile?.mitid_verification_date && (
                  <p className="text-sm text-muted-foreground">
                    {t("settings.verifiedOn")} {new Date(profile.mitid_verification_date).toLocaleDateString('da-DK')}
                  </p>
                )}
              </div>

              {!profile?.mitid_verified && (
                <Button 
                  onClick={simulateMitIdVerification} 
                  disabled={saving}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t("settings.startMitidVerification")}
                </Button>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{t("settings.note")}:</strong> {t("settings.demoImplementation")}
                <a 
                  href="https://www.mitid.dk/da/udvikler/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-1"
                >
                  {t("settings.mitidDeveloperAPI")}
                </a> 
                {" "}{t("settings.forRealVerification")}
              </p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;