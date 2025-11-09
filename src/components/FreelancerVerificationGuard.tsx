import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/contexts/ApiContext';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FreelancerVerificationGuardProps {
  onVerificationCheck?: (isVerified: boolean) => void;
  showInlineAlert?: boolean;
}

export const FreelancerVerificationGuard: React.FC<FreelancerVerificationGuardProps> = ({
  onVerificationCheck,
  showInlineAlert = false
}) => {
  const { user, userRole } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const api = useApi();

  useEffect(() => {
    const checkVerification = async () => {
      if (!user || userRole !== 'freelancer') {
        setIsVerified(true); // Non-freelancers don't need verification
        setLoading(false);
        onVerificationCheck?.(true);
        return;
      }

      try {
        const isComplete = await api.profiles.isMyProfileComplete();
        setIsVerified(isComplete);
        onVerificationCheck?.(isComplete);
      } catch (error) {
        console.error('Error checking freelancer verification:', error);
        setIsVerified(false);
        onVerificationCheck?.(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [user, userRole, onVerificationCheck, api]);

  const handleRedirectToProfile = () => {
    navigate('/complete-profile');
  };

  const showVerificationError = () => {
    toast({
      title: "Profil ikke verificeret",
      description: "Du skal udfylde og verificere din profil før du kan bruge denne funktion",
      variant: "destructive",
    });
  };

  // For inline alerts
  if (showInlineAlert && !loading && isVerified === false) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Du skal udfylde og verificere din profil før du kan bruge denne funktion.
          <Button 
            variant="link" 
            className="p-0 h-auto ml-2 text-destructive"
            onClick={handleRedirectToProfile}
          >
            Gå til profil →
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

// Hook for easy verification checking
export const useFreelancerVerification = () => {
  const { user, userRole } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const api = useApi();

  useEffect(() => {
    const checkVerification = async () => {
      if (!user || userRole !== 'freelancer') {
        setIsVerified(true);
        setLoading(false);
        return;
      }

      try {
        const isComplete = await api.profiles.isMyProfileComplete();
        setIsVerified(isComplete);
      } catch (error) {
        console.error('Error checking freelancer verification:', error);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [user, userRole, api]);

  const requireVerification = (action: string = "denne funktion") => {
    if (loading) return false;
    
    if (!isVerified) {
      toast({
        title: "Profil ikke verificeret",
        description: `Du skal udfylde og verificere din profil før du kan ${action}`,
        variant: "destructive",
      });
      navigate('/complete-profile');
      return false;
    }
    return true;
  };

  return {
    isVerified,
    loading,
    requireVerification
  };
};