import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/contexts/ApiContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from "@/contexts/LanguageContext";

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
  requireComplete?: boolean;
  redirectTo?: string;
}

export const ProfileCompletionGuard: React.FC<ProfileCompletionGuardProps> = ({
  children,
  requireComplete = true,
  redirectTo = '/complete-profile'
}) => {
  const { user, userRole, loading: authLoading } = useAuth();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const api = useApi();
  const { t } = useLanguage();

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user || authLoading) return;

      // Only check for clients if completion is required
      if (requireComplete && userRole === 'client') {
        try {
          const response: { profile?: {
            fullName?: string;
            address?: string;
            city?: string;
            postalCode?: string;
            role?: string;
            user?: { phoneNumber?: string; phoneVerified?: boolean };
          } } = await api.profiles.getMyProfile();
          const data = response.profile || (response as unknown as any);

          // Check if phone number exists (it might be in user object or could be empty string)
          const hasPhoneNumber = data.user?.phoneNumber && 
                                 data.user.phoneNumber.trim() !== '' &&
                                 data.user.phoneNumber !== null;
          
          const isComplete = !!(data &&
            data.fullName && 
            data.fullName.trim() !== '' &&
            data.fullName !== 'Incomplete Profile' &&
            hasPhoneNumber &&
            data.address && 
            data.address.trim() !== '' &&
            data.city && 
            data.city.trim() !== '' &&
            data.postalCode && 
            data.postalCode.trim() !== '' &&
            data.user?.phoneVerified === true);
          
          console.log('Profile completion check:', {
            fullName: data.fullName,
            phoneNumber: data.user?.phoneNumber,
            phoneVerified: data.user?.phoneVerified,
            address: data.address,
            city: data.city,
            postalCode: data.postalCode,
            isComplete,
          });

          setProfileComplete(isComplete);

          if (!isComplete && requireComplete) {
            toast({
              title: t("profileIncomplete.title"),
              description: t("profileIncomplete.description"),
              variant: "destructive",
            });
            
            navigate(redirectTo);
          }
        } catch (error) {
          console.error('Error checking profile completion:', error);
          setProfileComplete(false);
          if (requireComplete) {
            navigate(redirectTo);
          }
        }
      } else {
        // For non-clients or when completion isn't required
        setProfileComplete(true);
      }
      
      setLoading(false);
    };

    checkProfileCompletion();
  }, [user, userRole, authLoading, requireComplete, redirectTo, navigate, toast]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Kontrollerer profil...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-muted-foreground">Du skal være logget ind</p>
            <Button onClick={() => navigate('/auth')}>
              Log Ind
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireComplete && userRole === 'client' && profileComplete === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <h3 className="text-lg font-semibold">Profil Ikke Fuldført</h3>
            <p className="text-muted-foreground text-center">
              Du skal fuldføre din profil for at få adgang til denne funktion.
            </p>
            <Button onClick={() => navigate(redirectTo)}>
              Fuldfør Profil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};