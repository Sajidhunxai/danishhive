import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/contexts/ApiContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ChevronLeft,
  User,
  MapPin,
  CreditCard,
  Calendar,
  TrendingUp
} from "lucide-react";

interface FreelancerPayroll {
  user_id: string;
  full_name: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  registration_number: string | null;
  account_number: string | null;
  iban: string | null;
  bank_name: string | null;
  total_earnings: number;
  earnings_count: number;
  payment_method: string | null;
}

interface MonthlyEarning {
  month: string;
  year: number;
  total_amount: number;
  earnings_count: number;
  period_start: string;
  period_end: string;
}

interface FreelancerPayrollDetailProps {
  freelancer: FreelancerPayroll;
  onBack: () => void;
}

export const FreelancerPayrollDetail: React.FC<FreelancerPayrollDetailProps> = ({
  freelancer,
  onBack
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const api = useApi();
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyEarnings();
  }, [freelancer.user_id]);

  const fetchMonthlyEarnings = async () => {
    setLoading(true);
    try {
      // Get all earnings for this freelancer
      // Note: This assumes earnings API supports filtering by userId
      const allEarnings = await api.earnings.getMyEarnings();
      
      // Filter by freelancer and status
      const earnings = allEarnings.filter((earning: any) => 
        earning.userId === freelancer.user_id && 
        earning.status === 'paid'
      );

      // Group by payment period
      const monthlyMap = new Map<string, MonthlyEarning>();
      
      earnings.forEach((earning: any) => {
        const periodStart = new Date(earning.paymentPeriodStart || earning.createdAt);
        const periodKey = `${periodStart.getFullYear()}-${periodStart.getMonth()}`;
        const monthName = periodStart.toLocaleDateString('da-DK', { month: 'long' });
        
        if (monthlyMap.has(periodKey)) {
          const existing = monthlyMap.get(periodKey)!;
          existing.total_amount += Number(earning.amount);
          existing.earnings_count += 1;
        } else {
          monthlyMap.set(periodKey, {
            month: monthName,
            year: periodStart.getFullYear(),
            total_amount: Number(earning.amount),
            earnings_count: 1,
            period_start: earning.paymentPeriodStart || earning.createdAt,
            period_end: earning.paymentPeriodEnd || earning.createdAt
          });
        }
      });

      const monthlyArray = Array.from(monthlyMap.values())
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth();
        });

      setMonthlyEarnings(monthlyArray);

    } catch (error: any) {
      console.error('Error fetching monthly earnings:', error);
      toast({
        title: "Fejl",
        description: error.message || t('earnings.couldNotFetch'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount);
  };

  const getPaymentMethodText = (method: string | null) => {
    switch (method) {
      case 'danish_bank': return t('payment.danskBank');
      case 'iban': return 'IBAN';
      case 'paypal': return 'PayPal';
      default: return t('common.notSpecified') || 'Ikke angivet';
    }
  };

  const totalLifetimeEarnings = monthlyEarnings.reduce((sum, month) => sum + month.total_amount, 0);
  const totalLifetimeJobs = monthlyEarnings.reduce((sum, month) => sum + month.earnings_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('common.back')}
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {freelancer.full_name || 'Unavngivet Freelancer'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('earnings.detailedHistory')}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Freelancer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('contact.contactInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('contact.address')}</p>
                <p className="text-sm text-muted-foreground">
                  {[freelancer.address, freelancer.postal_code, freelancer.city]
                    .filter(Boolean).join(', ') || t('common.notSpecified')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('payment.paymentInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="space-y-2 flex-1">
                <div>
                  <p className="font-medium">{t('payment.paymentMethod')}</p>
                  <Badge variant="outline">
                    {getPaymentMethodText(freelancer.payment_method)}
                  </Badge>
                </div>
                
                {freelancer.payment_method === 'danish_bank' && (
                  <>
                    <div>
                      <p className="text-sm font-medium">{t('payment.registrationNumber')}</p>
                      <p className="text-sm text-muted-foreground">
                        {freelancer.registration_number || t('common.notSpecified')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('payment.accountNumber')}</p>
                      <p className="text-sm text-muted-foreground">
                        {freelancer.account_number || t('common.notSpecified')}
                      </p>
                    </div>
                  </>
                )}
                
                {freelancer.payment_method === 'iban' && (
                  <>
                    <div>
                      <p className="text-sm font-medium">IBAN</p>
                      <p className="text-sm text-muted-foreground">
                        {freelancer.iban || t('common.notSpecified')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('payment.bank')}</p>
                      <p className="text-sm text-muted-foreground">
                        {freelancer.bank_name || t('common.notSpecified')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifetime Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('earnings.totalEarnings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalLifetimeEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">Alle perioder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Antal Opgaver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLifetimeJobs}</div>
            <p className="text-xs text-muted-foreground">Gennemført total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Måneder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyEarnings.length}</div>
            <p className="text-xs text-muted-foreground">{t('earnings.withEarnings')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
{t('earnings.monthlyHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : monthlyEarnings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
{t('earnings.noHistoryFound')}
            </p>
          ) : (
            <div className="space-y-3">
              {monthlyEarnings.map((earning, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {earning.month} {earning.year}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {earning.earnings_count} opgave{earning.earnings_count !== 1 ? 'r' : ''} gennemført
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Periode: {new Date(earning.period_start).toLocaleDateString('da-DK')} - {new Date(earning.period_end).toLocaleDateString('da-DK')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(earning.total_amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};