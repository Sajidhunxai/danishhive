import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AdminUserProfilePopup } from "@/components/AdminUserProfilePopup";
import { AdminRevenueOverview } from "@/components/AdminRevenueOverview";
import { FreelancerPayrollTable } from "@/components/FreelancerPayrollTable";
import { FreelancerPayrollDetail } from "@/components/FreelancerPayrollDetail";
import { MembershipPayments } from "@/components/MembershipPayments";
import { AdminImageApproval } from "./AdminImageApproval";
import { AdminReportsManagement } from "./AdminReportsManagement";
import AdminTranslationManager from "./AdminTranslationManager";
import { FreelancerProfilePopup } from "./FreelancerProfilePopup";
import { AdminPasswordEditDialog } from "./AdminPasswordEditDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Shield, 
  Users, 
  UserCheck, 
  UserX, 
  Settings,
  Plus,
  RotateCcw,
  Crown,
  Calendar,
  TrendingUp,
  ChevronLeft,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Languages,
  Key
} from "lucide-react";

interface User {
  user_id: string;
  email?: string;
  full_name: string | null;
  role: string | null;
  is_admin: boolean | null;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
}

interface RoleChangeRequest {
  id: string;
  user_id: string;
  current_user_role: string;
  requested_role: string;
  reason: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  user_profile?: {
    full_name: string;
    username: string | null;
    email?: string;
  };
}

interface FreelancerEarnings {
  user_id: string;
  full_name: string | null;
  total_earnings: number;
  earnings_count: number;
}

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

type AdminView = 'overview' | 'freelancers' | 'freelancer-detail' | 'memberships' | 'reports' | 'translations';

export const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleChangeRequest[]>([]);
  const [freelancerEarnings, setFreelancerEarnings] = useState<FreelancerEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentView, setCurrentView] = useState<AdminView>('overview');
  const [selectedFreelancer, setSelectedFreelancer] = useState<FreelancerPayroll | null>(null);
  
  // Create user form state
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    role: 'freelancer'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    userId: '',
    userName: '',
  });

  // Profile popup state
  const [profilePopup, setProfilePopup] = useState({
    isOpen: false,
    userId: null as string | null
  });

  // Password edit state
  const [passwordEdit, setPasswordEdit] = useState({
    isOpen: false,
    userId: '',
    userName: '',
    userRole: ''
  });

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchRoleRequests();
      fetchFreelancerEarnings();
    }
  }, [user, selectedMonth]);

  const fetchUsers = async () => {
    console.log('Fetching users as admin...');
    try {
      const { data, error } = await supabase.rpc('admin_get_users_with_email');
      console.log('Admin users result:', data, error);
      
      if (error) {
        console.error('RPC Error:', error);
        setUsers([]);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No users returned - user might not have admin rights');
        setUsers([]);
        return;
      }

      // Data now includes avatar_url directly from the function
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  // Function to make current user admin
  const makeCurrentUserAdmin = async () => {
    try {
      setActionLoading('make-admin');
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_admin: true, 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      
      toast({
        title: "Succes",
        description: "Du har nu admin rettigheder. Genindlæs siden.",
      });
      
      // Refresh data
      fetchUsers();
      fetchRoleRequests();
    } catch (error) {
      console.error('Error making user admin:', error);
      toast({
        title: "Fejl", 
        description: "Kunne ikke tildele admin rettigheder",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Function to handle delete confirmation dialog
  const openDeleteConfirmation = (userId: string, userName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      userId,
      userName,
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      userId: '',
      userName: '',
    });
  };

  // Function to delete user account
  const deleteUserAccount = async () => {
    try {
      setActionLoading(`delete_${deleteConfirmation.userId}`);
      
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { userId: deleteConfirmation.userId }
      });

      if (error) throw error;
      
      toast({
        title: "Succes",
        description: `Brugerkontoen for ${deleteConfirmation.userName} blev slettet.`,
      });
      
      // Refresh the users list
      await fetchUsers();
      
      // Close the confirmation dialog
      closeDeleteConfirmation();
    } catch (error) {
      console.error('Error deleting user account:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke slette brugerkontoen. Prøv igen.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const fetchRoleRequests = async () => {
    try {
      const { data: requests, error } = await supabase
        .from('role_change_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = (requests || []).map(r => r.user_id);

      // Batch fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, username')
        .in('user_id', userIds);
      const profilesMap = new Map((profilesData || []).map(p => [p.user_id, { full_name: p.full_name, username: p.username }]));

      // Fetch emails via admin RPC (SECURITY DEFINER)
      const { data: usersWithEmail } = await supabase.rpc('admin_get_users_with_email');
      const emailMap = new Map((usersWithEmail || []).map((u: any) => [u.user_id, u.email]));

      const enriched = (requests || []).map((req) => ({
        ...req,
        user_profile: {
          full_name: profilesMap.get(req.user_id)?.full_name || 'Ukendt bruger',
          username: profilesMap.get(req.user_id)?.username || null,
          email: emailMap.get(req.user_id) || null,
        }
      }));
      
      setRoleRequests(enriched);
    } catch (error) {
      console.error('Error fetching role requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreelancerEarnings = async () => {
    setEarningsLoading(true);
    try {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('earnings')
        .select(`
          user_id,
          amount
        `)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Get user profiles for freelancers
      const userIds = [...new Set(data?.map(earning => earning.user_id) || [])];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .in('user_id', userIds)
        .eq('role', 'freelancer');

      if (profilesError) throw profilesError;

      // Group earnings by user
      const earningsMap = new Map<string, { total: number; count: number; name: string }>();
      
      data?.forEach((earning: any) => {
        const userId = earning.user_id;
        const profile = profiles?.find(p => p.user_id === userId);
        
        // Only include freelancers
        if (profile && profile.role === 'freelancer') {
          const amount = Number(earning.amount) || 0;
          const name = profile.full_name || 'Unavngivet';
          
          if (earningsMap.has(userId)) {
            const existing = earningsMap.get(userId)!;
            existing.total += amount;
            existing.count += 1;
          } else {
            earningsMap.set(userId, { total: amount, count: 1, name });
          }
        }
      });

      const earningsArray: FreelancerEarnings[] = Array.from(earningsMap.entries()).map(([user_id, data]) => ({
        user_id,
        full_name: data.name,
        total_earnings: data.total,
        earnings_count: data.count
      }));

      setFreelancerEarnings(earningsArray);
    } catch (error) {
      console.error('Error fetching freelancer earnings:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente indtjening data",
        variant: "destructive",
      });
    } finally {
      setEarningsLoading(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    setActionLoading(`role_${targetUserId}`);
    try {
      const { data, error } = await supabase.rpc('admin_change_user_role', {
        target_user_id: targetUserId,
        new_role: newRole
      });

      if (error) throw error;

      toast({
        title: "Succes",
        description: `Brugerrolle ændret til ${newRole}`,
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke ændre brugerrolle",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleRequestAction = async (requestId: string, action: 'approved' | 'rejected', adminNotes?: string) => {
    setActionLoading(`request_${requestId}`);
    try {
      const { error } = await supabase
        .from('role_change_requests')
        .update({ 
          status: action,
          admin_notes: adminNotes,
          approved_by: user?.id
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: `Rolleanmodning ${action === 'approved' ? 'godkendt' : 'afvist'}`,
      });

      await fetchRoleRequests();
    } catch (error: any) {
      console.error('Error updating role request:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke opdatere rolleanmodning",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const createUser = async () => {
    if (!createUserForm.email || !createUserForm.password) {
      toast({
        title: "Fejl",
        description: "Udfyld alle felter",
        variant: "destructive",
      });
      return;
    }

    setActionLoading('create_user');
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: createUserForm.email,
          password: createUserForm.password,
          role: createUserForm.role
        }
      });

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Bruger oprettet succesfuldt",
      });

      setCreateUserForm({ email: '', password: '', role: 'freelancer' });
      setShowCreateForm(false);
      await fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke oprette bruger",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const createInitialAdmin = async () => {
    setActionLoading('create_admin');
    try {
      const { data, error } = await supabase.functions.invoke('create-initial-admin');

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Admin bruger oprettet: lkk@danishhive.com",
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Error creating initial admin:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke oprette admin bruger",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'client': return 'bg-blue-100 text-blue-800';
      case 'freelancer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'client': return 'Klient';
      case 'freelancer': return 'Freelancer';
      default: return 'Ukendt';
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

  // Navigation functions
  const handleNavigateToFreelancers = () => {
    setCurrentView('freelancers');
  };

  const handleNavigateToMemberships = () => {
    setCurrentView('memberships');
  };

  const handleNavigateToReports = () => {
    setCurrentView('reports');
  };

  const handleNavigateToTranslations = () => {
    setCurrentView('translations');
  };

  const handleViewFreelancerDetails = (freelancer: FreelancerPayroll) => {
    setSelectedFreelancer(freelancer);
    setCurrentView('freelancer-detail');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedFreelancer(null);
  };

  const handleBackToFreelancers = () => {
    setCurrentView('freelancers');
    setSelectedFreelancer(null);
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

  // If no users found, might be missing admin rights
  if (users.length === 0 && !loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center h-20">
              <Shield className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Ingen data tilgængelig</h3>
              <p className="text-sm text-muted-foreground">
                Du har muligvis ikke admin rettigheder. Klik nedenfor for at tildele admin rettigheder til din konto.
              </p>
            </div>
            <Button 
              onClick={makeCurrentUserAdmin}
              disabled={actionLoading === 'make-admin'}
              className="mt-4"
            >
              {actionLoading === 'make-admin' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Tildeler rettigheder...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Gør mig til admin
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render different views based on current state
  if (currentView === 'freelancers') {
    return (
      <FreelancerPayrollTable 
        onBack={handleBackToOverview}
        onViewDetails={handleViewFreelancerDetails}
      />
    );
  }

  if (currentView === 'freelancer-detail' && selectedFreelancer) {
    return (
      <FreelancerPayrollDetail
        freelancer={selectedFreelancer}
        onBack={handleBackToFreelancers}
      />
    );
  }

  if (currentView === 'memberships') {
    return (
      <MembershipPayments onBack={handleBackToOverview} />
    );
  }

  if (currentView === 'reports') {
    return (
      <AdminReportsManagement onBack={handleBackToOverview} />
    );
  }

  if (currentView === 'translations') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToOverview}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Tilbage til oversigt
          </Button>
          <h1 className="text-2xl font-bold">Oversættelsesadministration</h1>
        </div>
        <AdminTranslationManager />
      </div>
    );
  }

  // Default view - show revenue overview and admin management
  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <AdminRevenueOverview
        onNavigateToFreelancers={handleNavigateToFreelancers}
        onNavigateToMemberships={handleNavigateToMemberships}
        onNavigateToReports={handleNavigateToReports}
      />

      {/* Quick Access Cards */}  
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNavigateToFreelancers}>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-medium">Freelancer Løn</h3>
            <p className="text-sm text-muted-foreground">Administrer løn og indtjening</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNavigateToMemberships}>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-medium">Medlemskaber</h3>
            <p className="text-sm text-muted-foreground">Håndter betalinger</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNavigateToReports}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <h3 className="font-medium">Rapporter</h3>
            <p className="text-sm text-muted-foreground">Håndter brugerrapporter</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNavigateToTranslations}>
          <CardContent className="p-4 text-center">
            <Languages className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-medium">Oversættelser</h3>
            <p className="text-sm text-muted-foreground">Administrer filoverssettelser</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Traditional Admin Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Bruger Administration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Initial Admin Creation */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
            <div>
              <h4 className="font-medium text-yellow-800">Opret Initial Admin</h4>
              <p className="text-sm text-yellow-700">Opret admin bruger: lkk@danishhive.com</p>
            </div>
            <Button
              onClick={createInitialAdmin}
              disabled={actionLoading === 'create_admin'}
              variant="outline"
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            >
              <Crown className="h-4 w-4 mr-2" />
              {actionLoading === 'create_admin' ? 'Opretter...' : 'Opret Admin'}
            </Button>
          </div>

          {/* Create User Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Opret Ny Bruger
              </h3>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                variant="outline"
              >
                {showCreateForm ? 'Annuller' : 'Vis Formular'}
              </Button>
            </div>

            {showCreateForm && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="bruger@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Sikkert password"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Rolle</Label>
                  <Select 
                    value={createUserForm.role} 
                    onValueChange={(value) => setCreateUserForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                      <SelectItem value="client">Klient</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={createUser}
                    disabled={actionLoading === 'create_user'}
                    className="w-full"
                  >
                    {actionLoading === 'create_user' ? 'Opretter...' : 'Opret Bruger'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Role Change Requests */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Rolleanmodninger ({roleRequests.length})
            </h3>
            
            {roleRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Ingen ventende rolleanmodninger</p>
            ) : (
              <div className="space-y-3">
                 {roleRequests.map((request) => (
                   <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                     <div className="space-y-2">
                       {/* User Information */}
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-medium">Bruger:</span>
                         <button
                           onClick={() => {
                             setSelectedUserId(request.user_id);
                             setProfilePopupOpen(true);
                           }}
                           className="text-primary hover:underline text-sm font-medium"
                         >
                           {request.user_profile?.username || request.user_profile?.full_name || 'Ukendt bruger'}
                         </button>
                         {request.user_profile?.email && (
                           <span className="text-xs text-muted-foreground">
                             ({request.user_profile.email})
                           </span>
                         )}
                       </div>
                       
                       {/* Role Change Request */}
                       <p className="font-medium">
                         Ønsker at ændre fra {getRoleText(request.current_user_role)} til {getRoleText(request.requested_role)}
                       </p>
                       <p className="text-sm text-muted-foreground">
                         Begrundelse: {request.reason || 'Ingen begrundelse givet'}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         Anmodet: {new Date(request.created_at).toLocaleDateString('da-DK')}
                       </p>
                     </div>
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         onClick={() => handleRoleRequestAction(request.id, 'approved')}
                         disabled={actionLoading === `request_${request.id}`}
                       >
                         <UserCheck className="h-4 w-4 mr-1" />
                         Godkend
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleRoleRequestAction(request.id, 'rejected')}
                         disabled={actionLoading === `request_${request.id}`}
                       >
                         <UserX className="h-4 w-4 mr-1" />
                         Afvis
                       </Button>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Users Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Brugeradministration ({users.length})
            </h3>
            
            <div className="space-y-3">
               {users.map((userItem) => (
                <div key={userItem.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-4">
                     <Avatar className="h-10 w-10">
                       <AvatarImage src={userItem.avatar_url || undefined} />
                       <AvatarFallback>
                         {userItem.full_name 
                           ? userItem.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                           : 'U'
                         }
                       </AvatarFallback>
                     </Avatar>
                     <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <button 
                            className="font-medium text-left hover:text-primary hover:underline transition-colors"
                            onClick={() => setProfilePopup({ isOpen: true, userId: userItem.user_id })}
                          >
                            {userItem.full_name || 'Unavngivet bruger'}
                          </button>
                          <Badge className={getRoleBadgeColor(userItem.role)}>
                            {getRoleText(userItem.role)}
                          </Badge>
                          {userItem.is_admin && (
                            <Badge variant="destructive">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          {userItem.email && (
                            <p className="text-sm text-muted-foreground">
                              📧 {userItem.email}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Oprettet: {new Date(userItem.created_at).toLocaleDateString('da-DK')}
                          </p>
                        </div>
                     </div>
                   </div>
                  
                   <div className="flex items-center gap-2">
                     <Select 
                       value={userItem.role || 'freelancer'} 
                       onValueChange={(newRole) => handleRoleChange(userItem.user_id, newRole)}
                       disabled={actionLoading === `role_${userItem.user_id}` || actionLoading === `delete_${userItem.user_id}`}
                     >
                       <SelectTrigger className="w-32">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="freelancer">Freelancer</SelectItem>
                         <SelectItem value="client">Klient</SelectItem>
                         <SelectItem value="admin">Admin</SelectItem>
                       </SelectContent>
                     </Select>
                     
                     {/* Password Edit Button - Only for clients */}
                     {userItem.role === 'client' && (
                       <Button
                         onClick={() => setPasswordEdit({
                           isOpen: true,
                           userId: userItem.user_id,
                           userName: userItem.full_name || 'Unavngivet bruger',
                           userRole: userItem.role || 'client'
                         })}
                         disabled={actionLoading === `role_${userItem.user_id}` || actionLoading === `delete_${userItem.user_id}`}
                         variant="outline"
                         size="sm"
                         className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                         title="Opdater adgangskode"
                       >
                         <Key className="h-4 w-4" />
                       </Button>
                     )}
                     
                     <Button
                       onClick={() => openDeleteConfirmation(userItem.user_id, userItem.full_name || 'Unavngivet bruger')}
                       disabled={actionLoading === `role_${userItem.user_id}` || actionLoading === `delete_${userItem.user_id}`}
                       variant="outline"
                       size="sm"
                       className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                     
                     {(actionLoading === `role_${userItem.user_id}` || actionLoading === `delete_${userItem.user_id}`) && (
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                     )}
                   </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={closeDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Bekræft sletning af konto
            </AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette kontoen for{' '}
              <span className="font-semibold">{deleteConfirmation.userName}</span>?
              <br /><br />
              <span className="text-red-600 font-medium">
                Denne handling kan ikke fortrydes og vil:
              </span>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                <li>Slette alle brugerens data permanent</li>
                <li>Fjerne brugeren fra alle projekter og kontrakter</li>
                <li>Slette brugerens indtjening og historik</li>
                <li>Deaktivere brugerens login permanent</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteConfirmation}>
              Annuller
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUserAccount}
              disabled={actionLoading === `delete_${deleteConfirmation.userId}`}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading === `delete_${deleteConfirmation.userId}` ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sletter...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slet konto
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin User Profile Popup */}
      <AdminUserProfilePopup
        userId={selectedUserId}
        isOpen={profilePopupOpen}
        onClose={() => {
          setProfilePopupOpen(false);
          setSelectedUserId(null);
        }}
      />

      {/* Freelancer Profile Popup */}
      <FreelancerProfilePopup
        userId={profilePopup.userId}
        isOpen={profilePopup.isOpen}
        onClose={() => setProfilePopup({ isOpen: false, userId: null })}
      />

      {/* Password Edit Dialog */}
      <AdminPasswordEditDialog
        isOpen={passwordEdit.isOpen}
        onClose={() => setPasswordEdit({
          isOpen: false,
          userId: '',
          userName: '',
          userRole: ''
        })}
        userId={passwordEdit.userId}
        userName={passwordEdit.userName}
        userRole={passwordEdit.userRole}
      />
    </div>
  );
};