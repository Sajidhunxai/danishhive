import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Eye,
  MapPin,
  CreditCard,
  User
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

interface FreelancerPayrollTableProps {
  onBack: () => void;
  onViewDetails: (freelancer: FreelancerPayroll) => void;
}

export const FreelancerPayrollTable: React.FC<FreelancerPayrollTableProps> = ({
  onBack,
  onViewDetails
}) => {
  const { toast } = useToast();
  const [freelancers, setFreelancers] = useState<FreelancerPayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    fetchFreelancerPayroll();
  }, [selectedMonth]);

  const fetchFreelancerPayroll = async () => {
    setLoading(true);
    try {
      // Calculate period from 19th to 19th
      const periodStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 19);
      const periodEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 19);
      
      // Get earnings for the period
      const { data: earnings, error: earningsError } = await supabase
        .from('earnings')
        .select('user_id, amount')
        .eq('status', 'completed')
        .gte('payment_period_start', periodStart.toISOString().split('T')[0])
        .lt('payment_period_end', periodEnd.toISOString().split('T')[0]);

      if (earningsError) throw earningsError;

      // Get unique user IDs
      const userIds = [...new Set(earnings?.map(e => e.user_id) || [])];
      
      if (userIds.length === 0) {
        setFreelancers([]);
        return;
      }

      // Get freelancer profiles with all required data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          address,
          city,
          postal_code,
          registration_number,
          account_number,
          iban,
          bank_name,
          payment_method,
          role
        `)
        .in('user_id', userIds)
        .eq('role', 'freelancer');

      if (profilesError) throw profilesError;

      // Group earnings by user and combine with profile data
      const payrollData: FreelancerPayroll[] = profiles?.map(profile => {
        const userEarnings = earnings?.filter(e => e.user_id === profile.user_id) || [];
        const totalEarnings = userEarnings.reduce((sum, e) => sum + Number(e.amount), 0);
        
        return {
          user_id: profile.user_id,
          full_name: profile.full_name,
          address: profile.address,
          city: profile.city,
          postal_code: profile.postal_code,
          registration_number: profile.registration_number,
          account_number: profile.account_number,
          iban: profile.iban,
          bank_name: profile.bank_name,
          payment_method: profile.payment_method,
          total_earnings: totalEarnings,
          earnings_count: userEarnings.length
        };
      }).filter(f => f.total_earnings > 0) || [];

      setFreelancers(payrollData.sort((a, b) => b.total_earnings - a.total_earnings));

    } catch (error) {
      console.error('Error fetching freelancer payroll:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente løndata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedMonth(newDate);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('da-DK', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getPaymentMethodText = (method: string | null) => {
    switch (method) {
      case 'danish_bank': return 'Dansk Bank';
      case 'iban': return 'IBAN';
      case 'paypal': return 'PayPal';
      default: return 'Ikke angivet';
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Navn',
      'Adresse',
      'By',
      'Postnummer',
      'Registreringsnummer',
      'Kontonummer',
      'IBAN',
      'Bank',
      'Betalingsmetode',
      'Total Indtjening',
      'Antal Opgaver'
    ];

    const csvData = freelancers.map(f => [
      f.full_name || '',
      f.address || '',
      f.city || '',
      f.postal_code || '',
      f.registration_number || '',
      f.account_number || '',
      f.iban || '',
      f.bank_name || '',
      getPaymentMethodText(f.payment_method),
      f.total_earnings.toString(),
      f.earnings_count.toString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freelancer-payroll-${formatMonth(selectedMonth).replace(' ', '-')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Tilbage
              </Button>
              <CardTitle>
                Freelancer Lønninger - Periode 19. {formatMonth(selectedMonth)}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Eksporter CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {freelancers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ingen freelancer løn data for {formatMonth(selectedMonth)}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                {freelancers.length} freelancer{freelancers.length !== 1 ? 'e' : ''} har indtjening i denne periode
              </div>
              
              <div className="space-y-3">
                {freelancers.map((freelancer) => (
                  <Card key={freelancer.user_id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-lg">
                            {freelancer.full_name || 'Unavngivet'}
                          </span>
                          <Badge variant="outline">
                            {getPaymentMethodText(freelancer.payment_method)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {[freelancer.address, freelancer.postal_code, freelancer.city]
                                .filter(Boolean).join(', ') || 'Adresse ikke angivet'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3 w-3" />
                            <span>
                              {freelancer.payment_method === 'danish_bank' && freelancer.registration_number && freelancer.account_number
                                ? `${freelancer.registration_number}-${freelancer.account_number}`
                                : freelancer.payment_method === 'iban' && freelancer.iban
                                ? freelancer.iban
                                : 'Kontoinfo ikke angivet'
                              }
                            </span>
                          </div>
                          
                          <div>
                            <span>{freelancer.earnings_count} opgave{freelancer.earnings_count !== 1 ? 'r' : ''}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(freelancer.total_earnings)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total indtjening
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => onViewDetails(freelancer)}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detaljer
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Total udbetaling for {formatMonth(selectedMonth)}:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(freelancers.reduce((sum, f) => sum + f.total_earnings, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};