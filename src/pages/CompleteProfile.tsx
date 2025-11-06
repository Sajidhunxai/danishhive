import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { api } from "@/services/api";

import { BackButton } from "@/components/ui/back-button";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { PhoneVerification } from "@/components/PhoneVerification";
import { PaymentVerification } from "@/components/PaymentVerification";
import { PaymentCardInfo } from "@/components/PaymentCardInfo";
import { CVRLookup } from "@/components/CVRLookup";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";
import { User, Building, MapPin, CreditCard, Save, CheckCircle, Globe, LogOut, ArrowLeft } from "lucide-react";

interface ProfileData {
  full_name: string;
  company?: string;
  cvr_number?: string;
  has_cvr: boolean;
  country: string;
  country_code: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
  card_holder_name?: string;
}

const CompleteProfile = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submissions
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    company: "",
    cvr_number: "",
    has_cvr: false,
    country: "Danmark",
    country_code: "+45",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
    card_holder_name: ""
  });

  const computeStep1Valid = React.useCallback(() => {
    const required = [
      profileData.full_name.trim(),
      profileData.phone.trim(),
      profileData.address.trim(),
      profileData.city.trim(),
      profileData.postal_code.trim()
    ];
    if (userRole === 'client') {
      required.push(profileData.company?.trim() || "");
    }
    if (profileData.has_cvr) {
      required.push(profileData.cvr_number?.trim() || "");
      if (userRole === 'freelancer') {
        required.push(profileData.company?.trim() || "");
      }
    }
    const allFieldsFilled = required.every(field => field && field.length > 0);
    return allFieldsFilled && phoneVerified === true;
  }, [profileData, userRole, phoneVerified]);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;

    // If user is not logged in, redirect to auth
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Only allow clients and freelancers
    if (userRole && !['client', 'freelancer'].includes(userRole)) {
      navigate('/');
      return;
    }

    if (!userRole) return; // wait until role is known

    // Check if profile is already complete (run once)
    hasCheckedRef.current = true;
    checkProfileCompleteness();
  }, [user, userRole, navigate]);

  const checkProfileCompleteness = async () => {
    if (!user) return;

    try {
      const response: { profile?: {
        fullName?: string;
        address?: string;
        city?: string;
        postalCode?: string;
        paymentVerified?: boolean;
        role?: string;
        user?: { phoneNumber?: string; phoneVerified?: boolean };
      } } = await api.profiles.getMyProfile();
      const data = response.profile || (response as unknown as {
        fullName?: string;
        address?: string;
        city?: string;
        postalCode?: string;
        paymentVerified?: boolean;
        role?: string;
        user?: { phoneNumber?: string; phoneVerified?: boolean };
      });
      if (!data) return;

      // Check completeness based on role
      if ((data.role || userRole) === 'client') {
        // Client needs payment verification
        // For clients: require all fields including payment verification
        // For freelancers/admins: only require basic profile fields and phone verification
        const isProfileComplete = userRole === 'client' 
          ? (data.fullName && data.user?.phoneNumber && data.address && data.city && data.postalCode && data.paymentVerified && data.user?.phoneVerified)
          : (data.fullName && data.user?.phoneNumber && data.user?.phoneVerified);
        
        if (isProfileComplete) {
          navigate('/client');
        }
      } else if ((data.role || userRole) === 'freelancer') {
        // Freelancer: do not auto-redirect away from this page to avoid loops
        // Let the user complete missing fields here
        console.log('Freelancer profile incomplete - stay on Complete Profile');
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const updateProfileData = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep1 = () => {
    console.log('🔍 VALIDERING DEBUG:');
    console.log('UserRole:', userRole);
    console.log('Has CVR:', profileData.has_cvr);
    console.log('Phone verified:', phoneVerified);
    
    const required = [
      profileData.full_name.trim(),
      profileData.phone.trim(),
      profileData.address.trim(),
      profileData.city.trim(),
      profileData.postal_code.trim()
    ];
    
    console.log('Grundlæggende felter:', {
      full_name: profileData.full_name.trim(),
      phone: profileData.phone.trim(),
      address: profileData.address.trim(),
      city: profileData.city.trim(),
      postal_code: profileData.postal_code.trim()
    });
    
    // For clients, company name is always required
    if (userRole === 'client') {
      required.push(profileData.company?.trim() || "");
      console.log('Klient - firmanavn påkrævet:', profileData.company?.trim() || "");
    }
    
    // For both clients and freelancers: if has CVR, CVR number is required
    if (profileData.has_cvr) {
      required.push(profileData.cvr_number?.trim() || "");
      console.log('CVR nummer påkrævet:', profileData.cvr_number?.trim() || "");
      
      // If freelancer has CVR, company name is also required (for business name)
      if (userRole === 'freelancer') {
        required.push(profileData.company?.trim() || "");
        console.log('Freelancer med CVR - firmanavn påkrævet:', profileData.company?.trim() || "");
      }
    }
    
    const allFieldsFilled = required.every(field => field && field.length > 0);
    const phoneVerificationComplete = phoneVerified === true;
    
    console.log('Alle felter udfyldt:', allFieldsFilled);
    console.log('Telefon verificeret:', phoneVerificationComplete);
    console.log('Samlet validering:', allFieldsFilled && phoneVerificationComplete);
    console.log('Required fields:', required);
    
    return allFieldsFilled && phoneVerificationComplete;
  };

  const validateStep2 = () => {
    // Freelancers don't need payment verification
    if (userRole === 'freelancer') {
      return true;
    }
    
    // Clients need payment verification
    const cardValid = profileData.card_number?.trim() && 
                     profileData.card_expiry?.trim() && 
                     profileData.card_cvv?.trim() && 
                     profileData.card_holder_name?.trim();
    
    const paymentVerificationComplete = paymentVerified === true;
    
    return cardValid && paymentVerificationComplete;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      // Freelancers go directly to completion, clients need payment step
      if (userRole === 'freelancer') {
        handleComplete();
      } else {
        setCurrentStep(2);
      }
    }
  };

  const handleComplete = async () => {
    // Prevent double submissions
    if (isSubmitting || loading) {
      console.log('Profile submission already in progress, ignoring duplicate request');
      return;
    }

    // Double-check all validations before submission
    if (!user) {
      toast({
        title: t('completeProfile.error'),
        description: t('completeProfile.notLoggedIn'),
        variant: "destructive",
      });
      return;
    }

    // Check if freelancer is from Europe
    if (userRole === 'freelancer') {
      const europeanCountries = [
        'Danmark', 'Norge', 'Sverige', 'Finland', 'Tyskland', 'Frankrig', 
        'Storbritannien', 'Italien', 'Spanien', 'Holland', 'Belgien', 
        'Østrig', 'Schweiz', 'Polen', 'Tjekkiet', 'Portugal', 'Irland'
      ];
      
      if (!europeanCountries.includes(profileData.country)) {
        toast({
          title: t('completeProfile.europeanOnly'),
          description: t('completeProfile.europeanOnlyDesc'),
          variant: "destructive",
        });
        return;
      }
    }

    if (!validateStep1()) {
      toast({
        title: t('completeProfile.missingInfo1'),
        description: t('completeProfile.missingInfo1Desc'),
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }

    // Only validate step 2 for clients
    if (userRole === 'client' && !validateStep2()) {
      toast({
        title: t('completeProfile.missingInfo2'), 
        description: t('completeProfile.missingInfo2Desc'),
        variant: "destructive",
      });
      return;
    }

    // Additional security check - verify phone and payment verification states
    if (!phoneVerified) {
      toast({
        title: t('completeProfile.phoneNotVerified'),
        description: t('completeProfile.phoneNotVerifiedDesc'),
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }

    // Only require payment verification for clients
    if (userRole === 'client' && !paymentVerified) {
      toast({
        title: t('completeProfile.paymentNotVerified'),
        description: t('completeProfile.paymentNotVerifiedDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      // Validate all required fields are present and not empty
      if (!profileData.full_name || !profileData.phone || !profileData.address || 
          !profileData.city || !profileData.postal_code) {
        throw new Error(t('completeProfile.allFieldsRequired'));
      }

      // Prepare update data with strict validation
      const updateData: Record<string, unknown> = {
        fullName: profileData.full_name.trim(),
        companyName: (userRole === 'client' || (userRole === 'freelancer' && profileData.has_cvr)) ? (profileData.company?.trim() || null) : null,
        cvrNumber: profileData.has_cvr ? (profileData.cvr_number?.trim() || null) : null,
        location: profileData.country, // Store the selected country
        address: profileData.address.trim(),
        city: profileData.city.trim(),
        postalCode: profileData.postal_code.trim(),
        phoneNumber: `${profileData.country_code} ${profileData.phone.trim()}`,
        phoneVerified: phoneVerified,
        paymentVerified: userRole === 'client' ? paymentVerified : true, // Auto-verify payment for freelancers
      };

      // Call backend API to update profile
      console.log('Sending profile data to backend:', updateData);
      const result: unknown = await api.profiles.updateMyProfile(updateData);
      console.log('Backend response:', result);

      toast({
        title: t('completeProfile.profileCompleted'),
        description: t('completeProfile.profileCompletedDesc'),
      });

      // Redirect based on role
      if (userRole === 'client') {
        navigate('/client');
      } else {
        navigate('/');
      }
    } catch (error: unknown) {
      console.error('Error completing profile:', error);
      
      let errorMessage = "Kunne ikke gemme profil. Prøv igen.";
      
      // Handle API errors
      const err = error as { response?: { status?: number; data?: { error?: string; message?: string } }, message?: string };
      
      // Handle rate limit errors specifically
      if (err.response?.status === 429) {
        errorMessage = "For mange anmodninger. Vent venligst et øjeblik og prøv igen.";
        toast({
          title: "For mange anmodninger",
          description: errorMessage,
          variant: "destructive",
        });
        return; // Don't show the generic error toast
      }
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Check for specific error types
      if (errorMessage.includes("telefonnummer") || errorMessage.includes("phone")) {
        errorMessage = t('completeProfile.phoneAlreadyRegistered');
      }
      
      toast({
        title: t('completeProfile.completionError'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            {/* Top bar with back button, logo and logout */}
            <div className="flex justify-between items-center mb-4">
              {/* Back button */}
              <BackButton to="/" />

              {/* Logo */}
              
              {/* Language and logout */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <Select value={language} onValueChange={(value) => setLanguage(value as 'da' | 'en' | 'zh' | 'hi')}>
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="da">🇩🇰 DA</SelectItem>
                      <SelectItem value="en">🇬🇧 EN</SelectItem>
                      <SelectItem value="zh">🇨🇳 中文</SelectItem>
                      <SelectItem value="hi">🇮🇳 हिन्दी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.logout')}
                </Button>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <CardTitle className="text-2xl font-bold">
                {t('completeProfile.title').replace('{role}', userRole === 'client' ? t('completeProfile.client') : t('completeProfile.freelancer'))}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {t('completeProfile.welcome')}
              </p>
              {userRole === 'freelancer' && phoneVerified && (
                <Button onClick={() => navigate('/')}>{t('completeProfile.goToDashboard')}</Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Progress Indicator - Only show for clients */}
        {userRole === 'client' && (
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 1 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-sm font-medium">{t('section.contactInfo')}</span>
            </div>
            
            <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted-foreground'}`} />
            
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 2 ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">{t('section.paymentInfo')}</span>
            </div>
          </div>
        )}

        {/* Step 1: Contact Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('contact.information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="country">{t('completeProfile.land')} *</Label>
                  <Select value={profileData.country} onValueChange={(value) => updateProfileData('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg land" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Danmark">🇩🇰 Danmark</SelectItem>
                      <SelectItem value="Norge">🇳🇴 Norge</SelectItem>
                      <SelectItem value="Sverige">🇸🇪 Sverige</SelectItem>
                      <SelectItem value="Finland">🇫🇮 Finland</SelectItem>
                      <SelectItem value="Tyskland">🇩🇪 Tyskland</SelectItem>
                      <SelectItem value="Frankrig">🇫🇷 Frankrig</SelectItem>
                      <SelectItem value="Storbritannien">🇬🇧 Storbritannien</SelectItem>
                      <SelectItem value="Italien">🇮🇹 Italien</SelectItem>
                      <SelectItem value="Spanien">🇪🇸 Spanien</SelectItem>
                      <SelectItem value="Holland">🇳🇱 Holland</SelectItem>
                      <SelectItem value="Belgien">🇧🇪 Belgien</SelectItem>
                      <SelectItem value="Østrig">🇦🇹 Østrig</SelectItem>
                      <SelectItem value="Schweiz">🇨🇭 Schweiz</SelectItem>
                      <SelectItem value="Polen">🇵🇱 Polen</SelectItem>
                      <SelectItem value="Tjekkiet">🇨🇿 Tjekkiet</SelectItem>
                      <SelectItem value="Portugal">🇵🇹 Portugal</SelectItem>
                      <SelectItem value="Irland">🇮🇪 Irland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="full_name">{t('completeProfile.fullName')} *</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => updateProfileData('full_name', e.target.value)}
                    placeholder={t('completeProfile.fullNamePlaceholder')}
                  />
                </div>

                {(userRole === 'client' || userRole === 'freelancer') && (
                  <div className="md:col-span-2">
                    <CVRLookup
                      cvrNumber={profileData.cvr_number || ""}
                      companyName={profileData.company || ""}
                      hasCVR={profileData.has_cvr}
                      userRole={userRole}
                      onCVRChange={(cvr) => updateProfileData('cvr_number', cvr)}
                      onCompanyNameChange={(name) => updateProfileData('company', name)}
                      onHasCVRChange={(hasCVR) => setProfileData(prev => ({...prev, has_cvr: hasCVR}))}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <PhoneVerification
                    countryCode={profileData.country_code}
                    phoneNumber={profileData.phone}
                    onCountryCodeChange={(code) => updateProfileData('country_code', code)}
                    onPhoneNumberChange={(phone) => updateProfileData('phone', phone)}
                    onVerificationComplete={setPhoneVerified}
                  />
                </div>

                <div className="md:col-span-2">
                  <AddressAutocomplete
                    value={profileData.address}
                    onAddressSelect={(address) => {
                      updateProfileData('address', address.address);
                      updateProfileData('city', address.city);
                      updateProfileData('postal_code', address.postal_code);
                    }}
                    placeholder={t('address.search')}
                  />
                </div>

                {profileData.city && (
                  <div>
                    <Label>By</Label>
                    <Input value={profileData.city} readOnly className="bg-gray-50" />
                  </div>
                )}

                {profileData.postal_code && (
                  <div>
                    <Label>{t('contact.postcode')}</Label>
                    <Input value={profileData.postal_code} readOnly className="bg-gray-50" />
                  </div>
                )}

                <div className="md:col-span-2">
                  <ProfileImageUpload
                    onImageUploaded={(imageData) => {
                      console.log('Image uploaded:', imageData);
                    }}
                  />
                </div>
              </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleNext}
                    disabled={!computeStep1Valid()}
                  >
                    {userRole === 'freelancer' ? t('completeProfile.completeProfile') : t('completeProfile.next')}
                  </Button>
                </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payment Information - Only for clients */}
        {currentStep === 2 && userRole === 'client' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Betalings Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PaymentCardInfo
                cardNumber={profileData.card_number || ""}
                expiryDate={profileData.card_expiry || ""}
                cvv={profileData.card_cvv || ""}
                cardHolderName={profileData.card_holder_name || ""}
                onCardNumberChange={(value) => updateProfileData('card_number', value)}
                onExpiryDateChange={(value) => updateProfileData('card_expiry', value)}
                onCvvChange={(value) => updateProfileData('card_cvv', value)}
                onCardHolderNameChange={(value) => updateProfileData('card_holder_name', value)}
              />

              <PaymentVerification
                onVerificationComplete={setPaymentVerified}
                isRequired={true}
              />

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  {t('completeProfile.back')}
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={loading || isSubmitting || !validateStep2()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {(loading || isSubmitting) ? t('completeProfile.saving') : t('completeProfile.completeProfile')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompleteProfile;