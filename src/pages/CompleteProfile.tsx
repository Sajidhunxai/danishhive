import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { BackButton } from "@/components/ui/back-button";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { PhoneVerification } from "@/components/PhoneVerification";
import { PaymentVerification } from "@/components/PaymentVerification";
import { PaymentCardInfo } from "@/components/PaymentCardInfo";
import { CVRLookup } from "@/components/CVRLookup";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";
import { User, MapPin, CreditCard, Save, CheckCircle } from "lucide-react";
import { CompleteProfileProvider, useCompleteProfile } from "@/contexts/CompleteProfileContext";

const CompleteProfileContent = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    user,
    userRole,
    profileData,
    updateProfileData,
    setProfileData,
    currentStep,
    setCurrentStep,
    phoneVerified,
    setPhoneVerified,
    paymentVerified,
    setPaymentVerified,
    loading,
    isSubmitting,
    computeStep1Valid,
    validateStep2,
    handleNext,
    handleComplete,
  } = useCompleteProfile();

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

const CompleteProfile = () => (
  <CompleteProfileProvider>
    <CompleteProfileContent />
  </CompleteProfileProvider>
);

export default CompleteProfile;