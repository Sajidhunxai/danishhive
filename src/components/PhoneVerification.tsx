import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Shield, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/contexts/ApiContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface PhoneVerificationProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (phone: string) => void;
  onVerificationComplete?: (verified: boolean) => void;
}

const countryCodes = [
  { code: '+45', country: 'Danmark', flag: '🇩🇰' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+86', country: '中国', flag: '🇨🇳' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+49', country: 'Deutschland', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: '日本', flag: '🇯🇵' },
  { code: '+82', country: '한국', flag: '🇰🇷' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
];

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  onVerificationComplete
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();
  const { t } = useLanguage();
  const api = useApi();

  // Countdown timer for resend functionality
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const sendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: t('phone.invalidNumber'),
        description: t('phone.invalidNumberDesc'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if phone number is already registered
      const fullPhoneNumber = `${countryCode} ${phoneNumber.trim()}`;
      const phoneAvailable = await api.verification.checkPhoneAvailability(fullPhoneNumber);

      if (!phoneAvailable) {
        toast({
          title: t('completeProfile.phoneAlreadyRegistered'),
          description: t('completeProfile.phoneAlreadyRegistered'),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const data = await api.verification.sendSMS(phoneNumber, countryCode);

      if (data.success) {
        setIsCodeSent(true);
        setResendCooldown(60); // 60 second cooldown
        setVerificationCode(''); // Clear any existing code
        toast({
          title: t('phone.codeSent'),
          description: t('phone.codeSentDesc'),
        });
      } else {
        throw new Error(data.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('SMS send error:', error);
      let errorMessage = t('phone.verificationFailedDesc');
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message?.includes('phone_number')) {
        errorMessage = t('completeProfile.phoneAlreadyRegistered');
      }
      
      toast({
        title: t('phone.verificationFailed'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const data = await api.verification.sendSMS(phoneNumber, countryCode);

      if (data.success) {
        setResendCooldown(60); // 60 second cooldown
        setVerificationCode(''); // Clear any existing code
        toast({
          title: "Verificeringskode gensendt",
          description: "En ny 6-cifret kode er sendt til dit telefonnummer",
        });
      } else {
        throw new Error(data.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('SMS resend error:', error);
      toast({
        title: "Fejl ved SMS gensendelse",
        description: error.response?.data?.error || error.message || "Kunne ikke gensende verificeringskode",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Fejl",
        description: "Indtast en gyldig 6-cifret kode",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await api.verification.verifySMS(phoneNumber, countryCode, verificationCode);

      if (data.success) {
        setIsVerified(true);
        onVerificationComplete?.(true);
        toast({
          title: t('phone.verificationSuccess'),
          description: t('phone.verificationSuccessDesc'),
        });
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('SMS verification error:', error);
      toast({
        title: "Verificeringsfejl",
        description: error.response?.data?.error || error.message || "Ugyldig verificeringskode",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium flex items-center gap-2">
        <Phone className="h-4 w-4" />
        {t('phone.verification')} *
      </Label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="country-code">{t('phone.countryCode')}</Label>
          <Select value={countryCode} onValueChange={onCountryCodeChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('phone.countryCode')} />
            </SelectTrigger>
            <SelectContent>
              {countryCodes.map(({ code, country, flag }) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span>{flag}</span>
                    <span>{code}</span>
                    <span className="text-sm text-muted-foreground">{country}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="phone">{t('phone.number')}</Label>
          <div className="flex gap-2">
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              placeholder="12 34 56 78"
              disabled={isVerified}
              className={isVerified ? 'border-green-500 bg-green-50' : ''}
            />
            {!isVerified && (
              <Button
                type="button"
                onClick={sendVerificationCode}
                disabled={loading || isCodeSent}
                variant="outline"
              >
                {loading ? t('phone.uploading') : isCodeSent ? t('phone.codeSent') : t('phone.sendCode')}
              </Button>
            )}
            {isVerified && (
              <div className="flex items-center gap-1 text-green-600 px-3">
                <Check className="h-4 w-4" />
                <span className="text-sm">Verificeret</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCodeSent && !isVerified && (
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Label className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Verificeringskode
          </Label>
          <div className="flex gap-2">
            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Indtast 6-cifret kode"
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
            <Button
              type="button"
              onClick={verifyCode}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? "Verificerer..." : "Verificer"}
            </Button>
          </div>
          <p className="text-sm text-blue-600">
            En verificeringskode er sendt til {countryCode} {phoneNumber}
          </p>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resendVerificationCode}
              disabled={loading || resendCooldown > 0}
              className="text-blue-600 hover:text-blue-700"
            >
              {resendCooldown > 0 
                ? `Gensend om ${resendCooldown}s` 
                : loading 
                  ? "Gensender..." 
                  : "Gensend kode"
              }
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};