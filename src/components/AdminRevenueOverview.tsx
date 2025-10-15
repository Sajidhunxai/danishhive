import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminReportsManagement } from "@/components/AdminReportsManagement";
import { AdminImageApproval } from "@/components/AdminImageApproval";
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Percent,
  Clock,
  Calendar,
  ArrowRight,
  DollarSign
} from "lucide-react";

interface RevenueData {
  membershipRevenue: number;
  freelanceRevenue: number;
  platformCommission: number;
  pendingPayments: number;
  nextPayoutDate: string;
  totalTransactions: number;
}

interface AdminRevenueOverviewProps {
  onNavigateToFreelancers: () => void;
  onNavigateToMemberships: () => void;
  onNavigateToReports: () => void;
}

export const AdminRevenueOverview: React.FC<AdminRevenueOverviewProps> = ({
  onNavigateToFreelancers,
  onNavigateToMemberships,
  onNavigateToReports
}) => {
  const { toast } = useToast();
  const [revenueData, setRevenueData] = useState<RevenueData>({
    membershipRevenue: 0,
    freelanceRevenue: 0,
    platformCommission: 0,
    pendingPayments: 0,
    nextPayoutDate: '',
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    fetchRevenueData();
  }, [selectedMonth]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 19);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 19);
      
      // Fetch freelance earnings (completed)
      const { data: freelanceEarnings, error: freelanceError } = await supabase
        .from('earnings')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString())
        .lt('created_at', endOfMonth.toISOString());

      if (freelanceError) throw freelanceError;

      // Fetch pending payments
      const { data: pendingEarnings, error: pendingError } = await supabase
        .from('earnings')
        .select('amount')
        .eq('status', 'pending')
        .gte('created_at', startOfMonth.toISOString())
        .lt('created_at', endOfMonth.toISOString());

      if (pendingError) throw pendingError;

      // Calculate revenue data
      const freelanceTotal = freelanceEarnings?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      const pendingTotal = pendingEarnings?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      const commission = freelanceTotal * 0.15; // 15% commission

      // Mock membership data (replace with actual membership table when available)
      const membershipRevenue = 0; // TODO: Implement membership revenue calculation

      // Calculate next payout date (1st of next month)
      const nextPayout = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);

      setRevenueData({
        membershipRevenue,
        freelanceRevenue: freelanceTotal,
        platformCommission: commission,
        pendingPayments: pendingTotal,
        nextPayoutDate: nextPayout.toLocaleDateString('da-DK'),
        totalTransactions: (freelanceEarnings?.length || 0) + (pendingEarnings?.length || 0)
      });

    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente indtægtsdata",
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

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('da-DK', { 
      year: 'numeric', 
      month: 'long' 
    });
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
      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membership Indtægt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueData.membershipRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatMonth(selectedMonth)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freelance Arbejde</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueData.freelanceRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total udbetalt til freelancere
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Provision (15%)</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(revenueData.platformCommission)}</div>
            <p className="text-xs text-muted-foreground">
              Vores indtægt fra freelance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afventende Betalinger</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(revenueData.pendingPayments)}</div>
            <p className="text-xs text-muted-foreground">
              Næste udbetaling: {revenueData.nextPayoutDate}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Samlet Indtægtsoversigt - {formatMonth(selectedMonth)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Platform Indtægt:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(revenueData.membershipRevenue + revenueData.platformCommission)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Transaktioner:</span>
                <span className="text-lg font-semibold">{revenueData.totalTransactions}</span>
              </div>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={onNavigateToFreelancers}
                className="w-full justify-between"
                variant="outline"
              >
                <span>Freelancer Lønninger</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                onClick={onNavigateToMemberships}
                className="w-full justify-between"
                variant="outline"
              >
                <span>Membership Indbetalinger</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button 
                onClick={onNavigateToReports}
                className="w-full justify-between"
                variant="outline"
              >
                <span>Profil Rapporter</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminReportsManagement onBack={() => {}} />
      <AdminImageApproval />
    </div>
  );
};