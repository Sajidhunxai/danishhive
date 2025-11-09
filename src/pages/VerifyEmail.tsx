import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useApi } from "@/contexts/ApiContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const api = useApi();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Manglende verifikations token');
      setVerifying(false);
      return;
    }

    verifyEmailChange(token);
  }, [searchParams]);

  const verifyEmailChange = async (token: string) => {
    try {
      await api.verification.verifyEmailChange(token);

      setSuccess(true);
      toast({
        title: "Email opdateret!",
        description: "Din email adresse er blevet opdateret succesfuldt.",
      });
    } catch (error: any) {
      console.error('Error verifying email:', error);
      setError(error.message || 'Kunne ikke verificere email ændring');
      toast({
        title: "Verifikation fejlede",
        description: error.message || 'Kunne ikke verificere email ændring',
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Mail className="h-6 w-6" />
            Email Verifikation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {verifying ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="font-medium">Verificerer email ændring...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vent venligst mens vi bekræfter din nye email adresse.
                </p>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <h3 className="font-medium text-green-700 dark:text-green-400">
                  Email opdateret succesfuldt!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Din email adresse er blevet ændret. Du kan nu logge ind med din nye email.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/profile')}
                className="w-full"
              >
                Gå til profil
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <div>
                <h3 className="font-medium text-red-700 dark:text-red-400">
                  Verifikation fejlede
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {error || 'Kunne ikke verificere email ændring'}
                </p>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/profile')}
                  className="w-full"
                >
                  Tilbage til profil
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Prøv igen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;