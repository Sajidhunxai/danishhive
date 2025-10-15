import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BackButton } from "@/components/ui/back-button";
import { AdminPanel } from "@/components/AdminPanel";
import { AdminRevenueOverview } from "@/components/AdminRevenueOverview";
import { AdminImageApproval } from "@/components/AdminImageApproval";
import { AdminReportsManagement } from "@/components/AdminReportsManagement";
import AdminTranslationManager from "@/components/AdminTranslationManager";
import AdminUserAnalytics from "@/components/AdminUserAnalytics";
import { AdminManualVerification } from "@/components/AdminManualVerification";
import { AdminCouponManager } from "@/components/AdminCouponManager";
import { FreelancerPayrollTable } from "@/components/FreelancerPayrollTable";
import { MembershipPayments } from "@/components/MembershipPayments";
import { 
  Shield, 
  TrendingUp, 
  Image, 
  AlertTriangle, 
  Languages, 
  Users, 
  CreditCard,
  Ticket
} from "lucide-react";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h2 className="mb-4 text-4xl font-bold text-header-dark">
            Admin Dashboard
          </h2>
          <p className="text-xl text-muted-foreground mb-4">
            Administrer brugere, opgaver og systemindstillinger
          </p>
          <p className="text-lg text-muted-foreground">Logget ind som admin: {user.email}</p>
        </div>

        {/* Admin Functions Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Oversigt
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Omsætning
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Brugere
            </TabsTrigger>
            <TabsTrigger value="payroll" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Løn & Betaling
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Kuponer
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Billeder
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Rapporter
            </TabsTrigger>
            <TabsTrigger value="translations" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Oversættelser
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Omsætning & Økonomi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminRevenueOverview
                  onNavigateToFreelancers={() => setActiveTab("payroll")}
                  onNavigateToMemberships={() => setActiveTab("payroll")}
                  onNavigateToReports={() => setActiveTab("reports")}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* User Analytics */}
            <AdminUserAnalytics />
            
            {/* Manual Verification */}
            <AdminManualVerification />
            
            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Brugeradministration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Freelancer Lønadministration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FreelancerPayrollTable 
                    onBack={() => setActiveTab("overview")}
                    onViewDetails={() => {}}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Medlemskabsbetalinger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MembershipPayments onBack={() => setActiveTab("overview")} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coupons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Kuponkode Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminCouponManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Billedgodkendelse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminImageApproval />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Rapportadministration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminReportsManagement onBack={() => setActiveTab("overview")} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="translations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Oversættelsesadministration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminTranslationManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;