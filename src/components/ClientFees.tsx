import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/contexts/ApiContext';
import { useAuth } from '@/hooks/useAuth';
import { Gift, Ticket, Percent, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ClientFeesProps {
  currentFeeRate: number;
  reducedFeeUntil?: string;
  onUpdate: () => void;
}

export const ClientFees: React.FC<ClientFeesProps> = ({ 
  currentFeeRate, 
  reducedFeeUntil,
  onUpdate 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = useApi();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const hasReducedFee = currentFeeRate < 0.15;
  const reducedFeeExpiry = reducedFeeUntil ? new Date(reducedFeeUntil) : null;
  const isExpired = reducedFeeExpiry ? reducedFeeExpiry < new Date() : false;

  const applyCoupon = async () => {
    if (!user || !couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const result = await api.payments.applyClientCoupon(couponCode.trim().toUpperCase());

      if (result.valid) {
        setAppliedCoupon(couponCode.trim().toUpperCase());
        setCouponCode('');
        toast({
          title: "Kupon anvendt!",
          description: `Du har fået ${result.discount}% rabat!`,
        });
        onUpdate(); // Refresh the fee info
      } else {
        toast({
          title: "Ugyldig kupon",
          description: result.error || "Kuponen kunne ikke anvendes",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke anvende kupon. Prøv igen senere.",
        variant: "destructive",
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const formatFeeRate = (rate: number) => {
    return `${(rate * 100).toFixed(0)}%`;
  };

  const calculateSavings = () => {
    if (!hasReducedFee) return 0;
    return Math.round(((0.15 - currentFeeRate) / 0.15) * 100);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Percent className="h-4 w-4" />
          Platform Gebyrer
          {hasReducedFee && !isExpired && (
            <Badge variant="secondary" className="ml-2">
              {formatFeeRate(currentFeeRate)}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Platform Gebyrer
          </DialogTitle>
          <DialogDescription>
            Administrer dine platformsgebyrer og anvend kuponer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Fee Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Nuværende Gebyr</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Platform gebyr:</span>
                <div className="flex items-center gap-2">
                  <Badge variant={hasReducedFee && !isExpired ? "default" : "secondary"}>
                    {formatFeeRate(currentFeeRate)}
                  </Badge>
                  {hasReducedFee && !isExpired && (
                    <Badge variant="outline" className="text-green-600">
                      -{calculateSavings()}% rabat!
                    </Badge>
                  )}
                </div>
              </div>

              {hasReducedFee && reducedFeeExpiry && (
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {isExpired 
                        ? `Udløbet ${reducedFeeExpiry.toLocaleDateString('da-DK')}`
                        : `Gyldig til ${reducedFeeExpiry.toLocaleDateString('da-DK')}`
                      }
                    </span>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Standard platform gebyr er 15%. Dette gebyr trækkes automatisk når du frigivr penge fra escrow.
              </div>
            </CardContent>
          </Card>

          {/* Coupon Section */}
          {(!hasReducedFee || isExpired) && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-blue-600" />
                  Har du en rabatkode?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="coupon">Kuponkode</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="f.eks. FreelanceHive26"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={validatingCoupon || !!appliedCoupon}
                    />
                    <Button 
                      onClick={applyCoupon}
                      disabled={!couponCode.trim() || validatingCoupon || !!appliedCoupon}
                      variant="outline"
                    >
                      {validatingCoupon ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      ) : (
                        <Ticket className="h-4 w-4 mr-2" />
                      )}
                      Anvend
                    </Button>
                  </div>
                </div>
                
                {appliedCoupon && (
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                    <Gift className="h-4 w-4" />
                    <span>Kupon "{appliedCoupon}" er anvendt!</span>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  💡 Spøg på support om aktuelle rabatkoder!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Fee Breakdown */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Eksempel:</strong></p>
            <p>• Projekt på 10.000 kr</p>
            <p>• Normalt gebyr (15%): 1.500 kr</p>
            {hasReducedFee && !isExpired && (
              <p className="text-green-600">• Dit gebyr ({formatFeeRate(currentFeeRate)}): {(10000 * currentFeeRate).toLocaleString('da-DK')} kr</p>
            )}
            <p>• Du sparer: {hasReducedFee && !isExpired ? (10000 * (0.15 - currentFeeRate)).toLocaleString('da-DK') : '0'} kr</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};