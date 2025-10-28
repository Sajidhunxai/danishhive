import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Download, Droplets, Calendar, Receipt, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from "@/contexts/LanguageContext";
interface HoneyDropPurchase {
  id: string;
  created_at: string;
  amount: number;
  honey_drops: number;
  vat_amount: number;
  total_amount: number;
  payment_method?: string;
  mollie_payment_id?: string;
  status: string;
}

export const HoneyDropsPurchaseHistory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<HoneyDropPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<HoneyDropPurchase | null>(null);
  const { t } = useLanguage();
  useEffect(() => {
    if (user) {
      fetchPurchaseHistory();
    }
  }, [user]);

  const fetchPurchaseHistory = async () => {
    try {
      // For now, we'll fetch from a generic payments table or create mock data
      // Since honey_purchases table doesn't exist yet, we'll show placeholder
      const mockPurchases: HoneyDropPurchase[] = [
        // This will be replaced once the actual table is created
      ];
      
      setPurchases(mockPurchases);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente købshistorik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateVAT = (amount: number) => {
    // 25% VAT (moms) in Denmark
    return amount * 0.25;
  };

  const formatPrice = (amount: number) => {
    return amount.toFixed(2).replace('.', ',');
  };

  const generateReceipt = (purchase: HoneyDropPurchase) => {
    const pricePerDrop = 2.00; // 2kr per drop
    const subtotal = purchase.honey_drops * pricePerDrop;
    const vat = calculateVAT(subtotal);
    const total = subtotal + vat;

    const receiptContent = `
KVITTERING - HONNINGDRÅBER
================================

Dato: ${new Date(purchase.created_at).toLocaleDateString('da-DK')}
Ordre ID: ${purchase.id}
${purchase.mollie_payment_id ? `Betaling ID: ${purchase.mollie_payment_id}` : ''}

VARER:
${purchase.honey_drops} Honningdråber à 2,00 kr
Subtotal: ${formatPrice(subtotal)} kr

Moms (25%): ${formatPrice(vat)} kr
TOTAL: ${formatPrice(total)} kr

Betalingsmetode: ${purchase.payment_method || 'Kort'}
Status: Betalt

--------------------------------
FreelanceHive ApS
CVR: [CVR-nummer]
info@freelancehive.dk

Tak for dit køb!
    `.trim();

    return receiptContent;
  };

  const downloadReceipt = (purchase: HoneyDropPurchase) => {
    const receipt = generateReceipt(purchase);
    const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kvittering_honningdraber_${purchase.id.substring(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Kvittering downloaded",
      description: "Kvitteringen er downloadet til dine filer",
    });
  };

  const exportAllPurchases = () => {
    if (purchases.length === 0) return;

    let csvContent = 'Dato;Honningdråber;Subtotal (kr);Moms (kr);Total (kr);Ordre ID\n';
    
    purchases.forEach(purchase => {
      const pricePerDrop = 2.00;
      const subtotal = purchase.honey_drops * pricePerDrop;
      const vat = calculateVAT(subtotal);
      const total = subtotal + vat;
      
      csvContent += `${new Date(purchase.created_at).toLocaleDateString('da-DK')};${purchase.honey_drops};${formatPrice(subtotal)};${formatPrice(vat)};${formatPrice(total)};${purchase.id}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'honningdraber_kobshistorik.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Eksport fuldført",
      description: "Købshistorik er exporteret som CSV fil",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-amber-500" />
            {t("orders.purchaseHistoryHoneyDrops")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-amber-500" />
            {t("orders.purchaseHistoryHoneyDrops")}
          </CardTitle>
          {purchases.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportAllPurchases}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Eksporter alle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("honey.noPurchases")}</p>
            <p className="text-sm">{t("honey.noPurchasesDesc")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const pricePerDrop = 2.00;
              const subtotal = purchase.honey_drops * pricePerDrop;
              const vat = calculateVAT(subtotal);
              const total = subtotal + vat;

              return (
                <div key={purchase.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-lg">
                        <Droplets className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="font-medium">{purchase.honey_drops} {t("honey.honeyDrops")}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(purchase.created_at).toLocaleDateString('da-DK', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(total)} kr</div>
                      <div className="text-sm text-muted-foreground">
                        Inkl. {formatPrice(vat)} kr moms
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{t("honey.subtotal")}</span> {formatPrice(subtotal)} kr
                    </div>
                    <div>
                      <span className="font-medium">{t("honey.vat25")}</span> {formatPrice(vat)} kr
                    </div>
                    <div>
                      <span className="font-medium">{t("honey.pricePerDrop")}</span> {t("honey.pricePerDropWithVAT")}
                    </div>
                    <div>
                      <Badge variant="outline" className="w-fit">
                        {purchase.status === 'completed' ? t("honey.paid") : purchase.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedPurchase(purchase)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("honey.viewReceipt")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t("honey.receipt")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto whitespace-pre-wrap">
                            {selectedPurchase && generateReceipt(selectedPurchase)}
                          </pre>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReceipt(purchase)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t("honey.download")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};