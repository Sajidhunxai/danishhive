import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { api } from "@/services/api";
import FreelancerSearch from "@/components/FreelancerSearch";
import { BackButton } from "@/components/ui/back-button";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";
import { ContractSystem } from "@/components/ContractSystem";

import { 
  Plus, 
  Eye, 
  Calendar, 
  DollarSign, 
  FileText, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  UserPlus,
  TrendingUp,
  Send,
  Trash2
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  deadline: string | null;
}

type BackendJob = {
  id: string;
  title: string;
  description: string;
  status: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  createdAt: string;
  deadline?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  created_at?: string;
  freelancerId?: string | null;
  freelancer_id?: string | null;
  finalAmount?: number | null;
  final_amount?: number | null;
};

type BackendApplication = {
  id: string;
  status: string;
  appliedAt?: string;
  applied_at?: string;
  jobId?: string;
  job_id?: string;
  applicant?: { fullName?: string | null };
  applicant_full_name?: string | null;
};

interface JobApplication {
  id: string;
  status: string;
  applied_at: string;
  job_id: string;
  applicant: {
    full_name: string | null;
  };
}

const ClientDashboard = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    openJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalSpent: 0,
    totalPayments: 0
  });
  const [workedWithFreelancers, setWorkedWithFreelancers] = useState<Array<{ user_id: string; full_name?: string; hourly_rate?: number; skills?: string[] }>>([]);
  const [recentPayments, setRecentPayments] = useState<Array<{ id: string; description?: string; status?: string; created_at: string; amount: number; currency: string }>>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedJobForInvite, setSelectedJobForInvite] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    // Allow both clients and admin users to access this dashboard
  }, [user, loading, navigate]);
  const { t } = useLanguage();
  const fetchingDataRef = useRef(false);

  useEffect(() => {
    if (user && (userRole === 'client' || userRole === 'admin')) {
      fetchClientData();
    }
  }, [user, userRole]);

  const fetchClientData = async () => {
    // Prevent concurrent calls
    if (fetchingDataRef.current) {
      console.log('fetchClientData already in progress, skipping...');
      return;
    }
    
    fetchingDataRef.current = true;
    try {
      // Fetch user's jobs from backend
      const jobs: BackendJob[] = await api.jobs.getMyJobs();
      // Map backend camelCase to local snake_case used by UI
      const mappedJobs: Job[] = (jobs || []).map((j: BackendJob) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        status: j.status,
        budget_min: j.budgetMin ?? null,
        budget_max: j.budgetMax ?? null,
        created_at: j.createdAt,
        deadline: j.deadline ?? null,
        // preserve original fields if present
        ...(j.budget_min !== undefined && { budget_min: j.budget_min }),
        ...(j.budget_max !== undefined && { budget_max: j.budget_max }),
        ...(j.created_at !== undefined && { created_at: j.created_at }),
      }));
      setMyJobs(mappedJobs);

      // Fetch recent applications for user's jobs
      if (mappedJobs && mappedJobs.length > 0) {
        const jobIds = mappedJobs.map(job => job.id);
        // Fetch applications per job and aggregate (limit to first few to reduce calls)
        const firstFew = jobIds.slice(0, 5);
        const lists: BackendApplication[][] = await Promise.all(
          firstFew.map(async (jid) => {
            try {
              const apps: BackendApplication[] = await api.applications.getJobApplications(jid);
              return apps || [] as BackendApplication[];
            } catch {
              return [] as BackendApplication[];
            }
          })
        );
        const flattened = lists.flat().sort((a, b) => new Date(b.appliedAt || b.applied_at || '').getTime() - new Date(a.appliedAt || a.applied_at || '').getTime());
        const transformedApplications: JobApplication[] = flattened.slice(0, 5).map((app: BackendApplication) => ({
          id: app.id,
          status: app.status,
          applied_at: app.appliedAt || app.applied_at || new Date().toISOString(),
          job_id: app.jobId || app.job_id || '',
          applicant: {
            full_name: app.applicant?.fullName || app.applicant_full_name || null,
          },
        }));
        setRecentApplications(transformedApplications);

        // Calculate stats
        const totalJobs = mappedJobs.length;
        const openJobs = mappedJobs.filter(job => job.status === 'open').length;
        
        // Count total applications across all jobs
        // Backend doesn't provide a direct count endpoint; derive from aggregated lists
        const allLists: BackendApplication[][] = await Promise.all(
          jobIds.map(async (jid) => {
            try {
              const apps: BackendApplication[] = await api.applications.getJobApplications(jid);
              return apps || [] as BackendApplication[];
            } catch {
              return [] as BackendApplication[];
            }
          })
        );
        const allApps: BackendApplication[] = allLists.flat();
        const totalApplicationsCount = allApps.length;
        const pendingApplicationsCount = allApps.filter((a) => a.status === 'pending').length;

        // Calculate total spent (sum of final_amount from completed jobs)
        const completedJobs = (jobs || []).filter((job: BackendJob) => job.status === 'completed' && (job.finalAmount || job.final_amount));
        const totalSpent = completedJobs.reduce((sum: number, job: BackendJob) => sum + (job.finalAmount || job.final_amount || 0), 0);

        // Fetch earnings/payments data (not available on backend; set to empty for now)
        const earningsData: Array<{ id: string; description?: string; status?: string; created_at: string; amount: number; currency: string }> = [];
        const totalPayments = 0;

        // Get freelancers worked with (unique freelancers from completed jobs)
        const completedJobsWithFreelancers = (jobs || []).filter((job: BackendJob) => 
          job.status === 'completed' && (job.freelancerId || job.freelancer_id)
        );
        
        if (completedJobsWithFreelancers.length > 0) {
          const freelancerIds = [...new Set(completedJobsWithFreelancers.map((job: BackendJob) => job.freelancerId || job.freelancer_id))];
          // Backend doesn't provide batch profile fetch by userIds; skip for now
          setWorkedWithFreelancers([]);
        }

        // Get recent payments/earnings
        if (earningsData && earningsData.length > 0) {
          setRecentPayments(earningsData.slice(0, 5));
        }

        setStats({
          totalJobs,
          openJobs,
          totalApplications: totalApplicationsCount || 0,
          pendingApplications: pendingApplicationsCount || 0,
          totalSpent,
          totalPayments
        });
      }

    } catch (error: unknown) {
      console.error('Error fetching client data:', error);
      
      // Handle rate limit errors specifically
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 429) {
        toast({
          title: 'For mange anmodninger',
          description: 'Vent venligst et øjeblik og prøv igen.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Fejl',
          description: 'Kunne ikke hente data.',
          variant: 'destructive',
        });
      }
    } finally {
      fetchingDataRef.current = false;
    }
  };

  const deleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Er du sikker på at du vil slette opgaven "${jobTitle}"? Dette kan ikke fortrydes.`)) {
      return;
    }

    try {
      await api.jobs.deleteJob(jobId);

      toast({
        title: 'Opgave slettet',
        description: `Opgaven "${jobTitle}" er blevet slettet.`,
      });

      // Refresh data
      fetchClientData();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke slette opgaven. Prøv igen senere.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Åben</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">I gang</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Afsluttet</Badge>;
      case 'closed':
        return <Badge variant="destructive">Lukket</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Ikke angivet';
    if (min && max) return `${min.toLocaleString('da-DK')} - ${max.toLocaleString('da-DK')} kr.`;
    if (min) return `Fra ${min.toLocaleString('da-DK')} kr.`;
    if (max) return `Op til ${max.toLocaleString('da-DK')} kr.`;
    return 'Ikke angivet';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ProfileCompletionGuard>
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className="text-center py-8">
          <h2 className="mb-4 text-4xl font-bold text-header-dark">
            Klient Dashboard
          </h2>
          <p className="text-xl text-muted-foreground mb-4">
            Administrer dine opgaver, se ansøgninger og find freelancere
          </p>
          <p className="text-lg text-muted-foreground">Logget ind som: {user.email}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/create-job')}
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Opret ny opgave
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '#contracts'}
            className="flex items-center gap-2"
          >
            <FileText className="h-5 w-5" />
            Se kontrakter
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '#freelancer-search'}
            className="flex items-center gap-2"
          >
            <Users className="h-5 w-5" />
            Søg freelancere
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Samlede opgaver
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Åbne opgaver
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Samlede ansøgninger
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Afventer svar
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total brugt
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSpent.toLocaleString('da-DK')} kr</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Betalinger
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
            </CardContent>
          </Card>
        </div>

        {/* My Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mine opgaver
            </CardTitle>
            <CardDescription>
              Oversigt over dine oprettede opgaver
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myJobs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen opgaver endnu</h3>
                <p className="text-muted-foreground mb-4">
                  Opret din første opgave for at komme i gang
                </p>
                <Button onClick={() => navigate('/create-job')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Opret opgave
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{job.title}</h4>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(job.created_at).toLocaleDateString('da-DK')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatBudget(job.budget_min, job.budget_max)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedJobForInvite(job.id);
                          setShowInviteDialog(true);
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Inviter freelancer
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/job/${job.id}/applications`)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Se ansøgninger
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/job/${job.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Se detaljer
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteJob(job.id, job.title)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Slet
                      </Button>
                    </div>
                  </div>
                ))}
                
                {myJobs.length > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline">
                      Se alle opgaver ({myJobs.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        {recentApplications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Seneste ansøgninger
              </CardTitle>
              <CardDescription>
                De nyeste ansøgninger til dine opgaver
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentApplications.map((application) => {
                  const job = myJobs.find(j => j.id === application.job_id);
                  return (
                    <div key={application.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">
                          {application.applicant.full_name || 'Anonym ansøger'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ansøgte: {job?.title} - {new Date(application.applied_at).toLocaleDateString('da-DK')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {application.status === 'pending' && (
                          <Badge variant="outline">Afventer</Badge>
                        )}
                        {application.status === 'accepted' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">Godkendt</Badge>
                        )}
                        {application.status === 'rejected' && (
                          <Badge variant="destructive">Afvist</Badge>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/job/${application.job_id}/applications`)}
                        >
                          Se ansøgning
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Freelancers Worked With */}
        {workedWithFreelancers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Freelancere du har arbejdet med
              </CardTitle>
              <CardDescription>
                Oversigt over freelancere fra dine afsluttede opgaver
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workedWithFreelancers.map((freelancer) => (
                  <div key={freelancer.user_id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {freelancer.full_name?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <h4 className="font-medium">{freelancer.full_name || 'Anonym freelancer'}</h4>
                        {freelancer.hourly_rate && (
                          <p className="text-sm text-muted-foreground">
                            {freelancer.hourly_rate} kr/time
                          </p>
                        )}
                      </div>
                    </div>
                    {freelancer.skills && freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {freelancer.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {freelancer.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{freelancer.skills.length - 3} flere
                          </Badge>
                        )}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/freelancer/${freelancer.user_id}`)}
                    >
                      Se profil
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Payments */}
        {recentPayments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Seneste betalinger
              </CardTitle>
              <CardDescription>
                Oversigt over dine seneste betalinger til freelancere
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">
                        {payment.description || 'Betaling for opgave'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {payment.status === 'completed' ? 'Gennemført' : 'Pending'} • {new Date(payment.created_at).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {payment.amount.toLocaleString('da-DK')} {payment.currency}
                      </p>
                      {payment.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Betalt
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contracts Section */}
        <div id="contracts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mine kontrakter
              </CardTitle>
              <CardDescription>
                Administrer dine kontrakter og se status på igangværende og afsluttede aftaler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractSystem />
            </CardContent>
          </Card>
        </div>

        {/* Freelancer Search */}
        <div id="freelancer-search">
          <FreelancerSearch />
        </div>


        {/* Invite Freelancer Dialog */}
        {showInviteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Inviter freelancer til opgave</h3>
              <p className="text-muted-foreground mb-4">
                Denne funktion vil snart være tilgængelig. Du kan i stedet bruge "Søg freelancere" sektionen nedenfor.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Luk
                </Button>
                <Button onClick={() => {
                  setShowInviteDialog(false);
                  window.location.href = '#freelancer-search';
                }}>
                  Gå til freelancer søgning
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </ProfileCompletionGuard>
  );
};

export default ClientDashboard;