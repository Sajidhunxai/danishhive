import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/contexts/ApiContext';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

interface MitIDVerificationProps {
  userId: string;
  currentStatus: boolean;
  onStatusChange?: (verified: boolean) => void;
}

export const AdminMitIDVerification: React.FC<MitIDVerificationProps> = ({
  userId,
  currentStatus,
  onStatusChange
}) => {
  const [loading, setLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const { toast } = useToast();
  const api = useApi();

  const handleMitIDVerification = async (verified: boolean) => {
    setLoading(true);
    
    try {
      await api.admin.updateVerification(userId, 'mitid', verified);

      toast({
        title: 'MitID Verificering Opdateret',
        description: `Bruger er nu ${verified ? 'verificeret' : 'ikke verificeret'} via MitID`,
      });

      onStatusChange?.(verified);

    } catch (error: any) {
      console.error('MitID verification error:', error);
      toast({
        title: 'Fejl',
        description: error.message || 'Kunne ikke opdatere MitID verificering',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          MitID Verificering
        </CardTitle>
        <CardDescription>
          Manuel godkendelse af MitID verificering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Label>Nuværende status:</Label>
          {currentStatus ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Verificeret</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Ikke verificeret</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="verification-notes">Notater (valgfrit)</Label>
          <Textarea
            id="verification-notes"
            placeholder="Tilføj eventuelle notater om verificeringen..."
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleMitIDVerification(true)}
            disabled={loading || currentStatus}
            className="flex-1"
          >
            {loading ? 'Opdaterer...' : 'Godkend MitID'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleMitIDVerification(false)}
            disabled={loading || !currentStatus}
            className="flex-1"
          >
            {loading ? 'Opdaterer...' : 'Fjern Verificering'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
          <strong>Vigtigt:</strong> MitID verificering skal kun godkendes efter manuel kontrol af brugerens 
          identitetsdokumentation. Sørg for at følge GDPR-retningslinjer for behandling af persondata.
        </div>
      </CardContent>
    </Card>
  );
};