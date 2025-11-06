import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ChevronLeft,
  ChevronRight,
  Users,
  CreditCard,
  Calendar,
  Download
} from "lucide-react";

interface MembershipPayment {
  id: string;
  user_id: string;
  full_name: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_date: string;
  membership_type: string;
  subscription_period: string;
}

interface MembershipPaymentsProps {
  onBack: () => void;
}

export const MembershipPayments: React.FC<MembershipPaymentsProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [payments, setPayments] = useState<MembershipPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);

  useEffect(() => {
    fetchMembershipPayments();
  }, [selectedMonth]);

  const fetchMembershipPayments = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      // TODO: Replace with actual membership payments table when available
      // For now, create mock data to demonstrate the interface
      const mockPayments: MembershipPayment[] = [
        {
          id: '1',
          user_id: 'user1',
          full_name: 'John Doe',
          amount: 299,
          currency: 'DKK',
          status: 'paid',
          payment_date: selectedMonth.toISOString(),
          membership_type: 'Pro',
          subscription_period: 'monthly'
        },
        {
          id: '2',
          user_id: 'user2',
          full_name: 'Jane Smith',
          amount: 199,
          currency: 'DKK',
          status: 'paid',
          payment_date: selectedMonth.toISOString(),
          membership_type: 'Basic',
          subscription_period: 'monthly'
        }
      ];

      // Filter by selected month (when real data is available)
      const filteredPayments = mockPayments.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
      });

      setPayments(filteredPayments);
      setTotalRevenue(filteredPayments.reduce((sum, p) => sum + p.amount, 0));
      setActiveMembers(filteredPayments.length);

      // TODO: When real membership table exists, use this query:
      /*
      const { data: membershipPayments, error } = await supabase
        .from('membership_payments')
        .select(`
          id,
          user_id,
          amount,
          currency,
          status,
          payment_date,
          membership_type,
          subscription_period,
          profiles!inner(full_name)
        `)
        .gte('payment_date', startOfMonth.toISOString())
        .lte('payment_date', endOfMonth.toISOString())
        .eq('status', 'paid')
        .order('payment_date', { ascending: false });

      if (error) throw error;

      const formattedPayments = membershipPayments?.map(p => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.profiles.full_name,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        payment_date: p.payment_date,
        membership_type: p.membership_type,
        subscription_period: p.subscription_period
      })) || [];

      setPayments(formattedPayments);
      setTotalRevenue(formattedPayments.reduce((sum, p) => sum + p.amount, 0));
      setActiveMembers(formattedPayments.length);
      */

    } catch (error) {
      console.error('Error fetching membership payments:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente membership betalinger",
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

  const getMembershipTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pro': return 'bg-purple-100 text-purple-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Navn',
      'Membership Type',
      'Beløb',
      'Valuta',
      'Status',
      'Betalingsdato',
      'Periode'
    ];

    const csvData = payments.map(p => [
      p.full_name || '',
      p.membership_type,
      p.amount.toString(),
      p.currency,
      p.status,
      new Date(p.payment_date).toLocaleDateString('da-DK'),
      p.subscription_period
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `membership-payments-${formatMonth(selectedMonth).replace(' ', '-')}.csv`;
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('common.back')}
              </Button>
              <CardTitle>
                Membership Betalinger - {formatMonth(selectedMonth)}
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
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Membership Indtægt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">{formatMonth(selectedMonth)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktive Medlemmer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">Betalende medlemmer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gennemsnitsbetaling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeMembers > 0 ? formatCurrency(totalRevenue / activeMembers) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per medlem</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Betalingshistorik
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {payments.length === 0 && "Ingen betalinger fundet for denne måned (Membership system ikke implementeret endnu)"}
          </p>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Ingen membership betalinger for {formatMonth(selectedMonth)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Membership system skal implementeres for at vise rigtige data
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {payment.full_name || 'Unavngivet medlem'}
                        </span>
                        <Badge className={getMembershipTypeColor(payment.membership_type)}>
                          {payment.membership_type}
                        </Badge>
                        <Badge variant="outline">
                          {payment.subscription_period}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(payment.payment_date).toLocaleDateString('da-DK')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3" />
                          <span>Status: {payment.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.currency}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};