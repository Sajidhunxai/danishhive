import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Droplets, Star, Sparkles, Gift, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface HoneyPackage {
  drops: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

const HONEY_PACKAGES: HoneyPackage[] = [
  { drops: 10, price: 25, bonus: 0 }, // 2kr + 25% VAT = 2.50kr per drop
  { drops: 25, price: 62.50, bonus: 5, popular: true }, // with 5 bonus drops
  { drops: 50, price: 125, bonus: 15 }, // with 15 bonus drops  
  { drops: 100, price: 250, bonus: 40 } // with 40 bonus drops
];

interface HoneyDropsPurchaseProps {
  currentDrops: number;
  onPurchaseComplete: () => void;
}

export const HoneyDropsPurchase: React.FC<HoneyDropsPurchaseProps> = ({ 
  currentDrops, 
  onPurchaseComplete 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<HoneyPackage | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const applyCoupon = async () => {
    if (!user || !couponCode.trim()) return;

    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase.functions.invoke('apply-coupon', {
        body: {
          coupon_code: couponCode.trim().toUpperCase(),
          user_id: user.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAppliedCoupon(couponCode.trim());
        setCouponCode('');
        toast({
          title: "Kupon anvendt!",
          description: `Du har fået ${data.honey_drops} gratis honningdråber!`,
        });
        onPurchaseComplete(); // Refresh the drops count
      } else {
        toast({
          title: "Ugyldig kupon",
          description: data?.message || "Kuponen kunne ikke anvendes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke anvende kupon. Prøv igen senere.",
        variant: "destructive",
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePurchase = async (pkg: HoneyPackage) => {
    if (!user) {
      toast({
        title: "Log ind først",
        description: "Du skal være logget ind for at købe honningdråber",
        variant: "destructive",
      });
      return;
    }

    setSelectedPackage(pkg);
    setPurchasing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-honey-payment', {
        body: {
          package: {
            drops: pkg.drops,
            bonus: pkg.bonus,
            price: pkg.price
          }
        }
      });

      if (error) throw error;

      if (data?.checkout_url) {
        // Redirect to Mollie checkout
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Error creating honey payment:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke oprette betaling. Prøv igen senere.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-amber-500" />
          Køb Honningdråber
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-amber-500" />
            Køb Honningdråber
          </DialogTitle>
          <DialogDescription>
            Honningdråber bruges til at byde på opgaver. Pris: 2 kr + moms (2,50 kr) pr. dråbe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Coupon Code Section */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                Har du en kupokode?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="coupon">Kuponkode</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    placeholder="f.eks. DanishHive25"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
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
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
                  <Gift className="h-4 w-4" />
                  <span>Kupon "{appliedCoupon}" er anvendt!</span>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                💡 Tip: Første 150 freelancers kan få 120 gratis honningdråber!
              </p>
            </CardContent>
          </Card>

          <Separator />

          <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
              <Droplets className="h-5 w-5" />
              <span className="font-medium">Du har {currentDrops} honningdråber</span>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              3 dråber kræves for at byde på hver opgave
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HONEY_PACKAGES.map((pkg, index) => (
              <Card 
                key={index} 
                className={`relative cursor-pointer transition-all hover:shadow-md ${
                  pkg.popular ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handlePurchase(pkg)}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Populær
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-lg">
                    {pkg.drops} Dråber
                    {pkg.bonus > 0 && (
                      <span className="text-green-600 text-sm font-normal ml-2">
                        +{pkg.bonus} bonus
                      </span>
                    )}
                  </CardTitle>
                  <div className="text-2xl font-bold text-primary">
                    {pkg.price} kr
                  </div>
                  <div className="text-sm text-muted-foreground">
                    2,50 kr/dråbe (inkl. moms)
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-center text-amber-500 mb-3">
                    {Array.from({ length: Math.min(5, Math.ceil(pkg.drops / 10)) }).map((_, i) => (
                      <Droplets key={i} className="h-4 w-4 mx-0.5" />
                    ))}
                    {pkg.bonus > 0 && <Sparkles className="h-4 w-4 ml-1 text-green-500" />}
                  </div>
                  
                  <Button 
                    className="w-full" 
                    disabled={purchasing && selectedPackage === pkg}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    {purchasing && selectedPackage === pkg ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Køb Nu
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Sikker betaling med Mollie</p>
            <p>• Priser inkluderer 25% dansk moms</p>
            <p>• Honningdråber udløber aldrig</p>
            <p>• Få dine dråber tilbage hvis du ikke bliver valgt til en opgave</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};