import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import FreelancerSearch from "@/components/FreelancerSearch";
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
import { ClientDashboardProvider, useClientDashboard } from "@/contexts/ClientDashboardContext";

const getStatusBadge = (status: string, translate: (key: string) => string) => {
  const labels: Record<string, string> = {
    open: translate("jobs.status.open"),
    in_progress: translate("jobs.status.in_progress"),
    completed: translate("jobs.status.completed"),
    closed: translate("jobs.status.closed"),
  };

  const label = labels[status] ?? status;

  switch (status) {
    case "open":
      return <Badge className="bg-green-100 text-green-800 border-green-200">{label}</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{label}</Badge>;
    case "completed":
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{label}</Badge>;
    case "closed":
      return <Badge variant="destructive">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
};

const ClientDashboardContent = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    myJobs,
    recentApplications,
    stats,
    workedWithFreelancers,
    recentPayments,
    showInviteDialog,
    openInviteDialog,
    closeInviteDialog,
    deleteJob,
    formatBudget,
  } = useClientDashboard();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
            {t('index.client_dashboard')}
          </h2>
          <p className="text-xl text-muted-foreground mb-4">
            {t('index.client_dashboard_description')}
          </p>
          <p className="text-lg text-muted-foreground">{t('admin.logged_in_as')} {user.email}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/create-job')}
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {t('jobs.createNewJob')}
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '#contracts'}
            className="flex items-center gap-2"
          >
            <FileText className="h-5 w-5" />
            {t('index.view_contracts')}
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '#freelancer-search'}
            className="flex items-center gap-2"
          >
            <Users className="h-5 w-5" />
                {t('index.search_freelancers')}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                        {t('jobs.totalJobs')}
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
                {t('jobs.openJobs')}
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
                {t('jobs.totalApplications')}
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
                {t('jobs.pendingApplications')}
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
                {t('index.total_spent')}
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
                {t('index.total_payments')}
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
                                      {t('index.my_jobs')}
            </CardTitle>
            <CardDescription>
              {t('index.overview_of_your_created_jobs')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myJobs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('index.no_jobs_yet')}</h3>
                <p className="text-muted-foreground mb-4">
                            {t('index.create_your_first_job_to_get_started')}
                </p>
                <Button onClick={() => navigate('/create-job')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('index.create_job')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{job.title}</h4>
                        {getStatusBadge(job.status, t)}
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
                          openInviteDialog(job.id);
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                            {t('jobs.inviteFreelancer')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/job/${job.id}/applications`)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {t('index.view_applications')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/job/${job.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                              {t('jobs.viewDetails')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteJob(job.id, job.title)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                            {t('index.delete')}
                      </Button>
                    </div>
                  </div>
                ))}
                
                {myJobs.length > 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline">
                      {t('profile.view_all_jobs')} ({myJobs.length})

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
                {t('jobs.latestApplications')}
              </CardTitle>
              <CardDescription>
                {t('index.newest_applications_to_your_jobs')}
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
                                                                    {application.applicant.full_name || t('jobs.anonymousApplicant')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('jobs.applied')}: {job?.title} - {new Date(application.applied_at).toLocaleDateString('da-DK')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {application.status === 'pending' && (
                          <Badge variant="outline">{t('jobs.pendingResponse')}</Badge>
                        )}
                        {application.status === 'accepted' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">{t('jobs.accepted')}</Badge>
                        )}
                        {application.status === 'rejected' && (
                          <Badge variant="destructive">{t('jobs.rejected')}</Badge>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/job/${application.job_id}/applications`)}
                        >
                                    {t('jobs.viewApplication')}
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
                {t('jobs.overviewFreelancers')}
              </CardTitle>
              <CardDescription>
                {t('jobs.overviewFreelancers')}
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
                                  <h4 className="font-medium">{freelancer.full_name || t('jobs.anonymousFreelancer')}</h4>
                        {freelancer.hourly_rate && (
                          <p className="text-sm text-muted-foreground">
                            {freelancer.hourly_rate} {t('jobs.hourlyRate')}
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
                            +{freelancer.skills.length - 3} {t('jobs.moreSkills')}
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
                                            {t('jobs.viewFreelancerProfile')}
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
                {t('jobs.latestPayments')}
              </CardTitle>
              <CardDescription>
                {t('jobs.overviewLatestPayments')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">
                        {payment.description || t('jobs.paymentForJob')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('jobs.status')}: {payment.status === 'completed' ? t('jobs.completed') : t('jobs.pending')} • {new Date(payment.created_at).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {payment.amount.toLocaleString('da-DK')} {payment.currency}
                      </p>
                      {payment.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {t('jobs.paid')}
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
                {t('index.my_contracts')}
              </CardTitle>
              <CardDescription>
                {t('index.manage_your_contracts')}
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
                      <h3 className="text-lg font-semibold mb-4">{t('index.invite_freelancer')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('index.invite_freelancer_description')}
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={closeInviteDialog}>
                  {t('index.close')}
                </Button>
                <Button onClick={() => {
                  closeInviteDialog();
                  window.location.href = '#freelancer-search';
                }}>
                    {t('index.go_to_freelancer_search')}
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

const ClientDashboard = () => (
  <ClientDashboardProvider>
    <ClientDashboardContent />
  </ClientDashboardProvider>
);

export default ClientDashboard;