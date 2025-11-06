import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from "@/components/ui/back-button";
import { useFreelancerVerification } from '@/components/FreelancerVerificationGuard';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { getJobById, getJobApplications } from '@/api/jobs';
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  Users, 
  Briefcase,
  Star,
  MessageSquare
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  skills_required: string[];
  budget_min: number | null;
  budget_max: number | null;
  location: string | null;
  is_remote: boolean;
  deadline: string | null;
  status: string;
  project_type: string;
  created_at: string;
  client_id: string;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  city: string | null;
}

interface JobApplication {
  id: string;
  applicant_id: string;
  cover_letter: string | null;
  proposed_rate: number | null;
  availability: string | null;
  status: string;
  applied_at: string;
  applicant_profile: {
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
    skills: string[] | null;
  } | null;
}

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const { requireVerification } = useFreelancerVerification();
  const [job, setJob] = useState<Job | null>(null);
  const [clientProfile, setClientProfile] = useState<Profile | null>(null);
  const [clientSpending, setClientSpending] = useState<number>(0);
  const [clientRating, setClientRating] = useState<number | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const fetchApplications = useCallback(async (jobId: string) => {
    try {
      const apps = await getJobApplications(jobId);
      
      // Map backend data to frontend format
      const mappedApplications: JobApplication[] = (apps || []).map((app: any) => ({
        id: app.id,
        applicant_id: app.freelancerId,
        cover_letter: app.coverLetter,
        proposed_rate: app.proposedRate ? parseFloat(app.proposedRate.toString()) : null,
        availability: app.availability || null,
        status: app.status,
        applied_at: app.submittedAt,
        applicant_profile: {
          full_name: app.freelancer?.profile?.fullName || null,
          avatar_url: app.freelancer?.profile?.avatarUrl || null,
          location: app.freelancer?.profile?.location || null,
          skills: Array.isArray(app.freelancer?.profile?.skills) ? app.freelancer.profile.skills : 
                  (typeof app.freelancer?.profile?.skills === 'string' ? JSON.parse(app.freelancer.profile.skills) : []),
        },
      }));
      
      setApplications(mappedApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente ansøgninger.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchJob = useCallback(async () => {
    if (!id) return;
  
    try {
      const jobData = await getJobById(id);
      
      // Map backend data to frontend format
      const mappedJob: Job = {
        id: jobData.id,
        title: jobData.title,
        description: jobData.description,
        skills_required: Array.isArray(jobData.skills) ? jobData.skills : 
                         (typeof jobData.skills === 'string' ? JSON.parse(jobData.skills) : []),
        budget_min: jobData.budget ? parseFloat(jobData.budget.toString()) : null,
        budget_max: jobData.budget ? parseFloat(jobData.budget.toString()) : null,
        location: jobData.location,
        is_remote: !jobData.location || jobData.location.toLowerCase().includes('remote'),
        deadline: jobData.deadline,
        status: jobData.status,
        project_type: 'one-time', // Default value
        created_at: jobData.createdAt,
        client_id: jobData.clientId,
      };
      
      setJob(mappedJob);
  
      // Extract client info
      const client = jobData.client?.profile;
      setClientProfile({
        full_name: client?.fullName || null,
        avatar_url: client?.avatarUrl || null,
        location: client?.location || null,
        city: client?.companyName || null,
      });
  
      // Example derived data - TODO: Calculate from actual data
      setClientSpending(0);
      setClientRating(4.5);
  
      // Only fetch applications if user is the client
      if (user && jobData.client?.id === user.id) {
        await fetchApplications(jobData.id);
      }
  
    } catch (error) {
      console.error("Error fetching job:", error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente opgave detaljer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, user, toast, fetchApplications]);

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id, fetchJob]);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return t('common.notSpecified');
    if (min && max) return `${min.toLocaleString('da-DK')} - ${max.toLocaleString('da-DK')} kr.`;
    if (min) return `${t('jobs.from')} ${min.toLocaleString('da-DK')} kr.`;
    if (max) return `${t('jobs.upTo')} ${max.toLocaleString('da-DK')} kr.`;
    return t('common.notSpecified');
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return t('common.notSpecified');
    return new Date(deadline).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">{t('jobs.status.accepted')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{t('jobs.status.rejected')}</Badge>;
      default:
        return <Badge variant="outline">{t('jobs.status.pending')}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t("job.notFound.title")}</h2>
          <p className="text-muted-foreground mb-4">{t("job.notFound.desc")}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('job.notFound.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton to="/" />
            <ThemeToggle />
          </div>

          {/* Job Header Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t('jobs.posted')} {new Date(job.created_at).toLocaleDateString('da-DK')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.project_type === 'one-time' ? t('jobs.singleJob') : t('jobs.ongoingProject')}
                    </div>
                  </div>
                </div>
                <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                  {job.status === 'open' ? t('jobs.status.open') : t('jobs.status.closed')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Budget</p>
                    <p className="text-sm text-muted-foreground">{formatBudget(job.budget_min, job.budget_max)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('jobs.location')}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.is_remote ? t('jobs.remoteWork') : job.location || t('common.notSpecified')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Deadline</p>
                    <p className="text-sm text-muted-foreground">{formatDeadline(job.deadline)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('jobs.description')}</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>

              {/* Skills Required */}
              {job.skills_required && job.skills_required.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('jobs.requiredSkills')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-black dark:text-white">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('jobs.aboutClient')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  {clientProfile?.avatar_url ? (
                    <img 
                      src={clientProfile.avatar_url} 
                      alt="Klient avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">
                    {clientProfile?.full_name ? clientProfile.full_name.split(' ')[0] : 'Anonym klient'}
                  </h4>
                  
                  {clientRating && clientRating > 4.5 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-yellow-600 font-medium">Highly recommended</span>
                    </div>
                  )}
                  
                  <div className="space-y-1 mt-2">
                    {clientProfile?.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Bopæl: {clientProfile.city}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      Brugt på Danish Hive: {clientSpending.toLocaleString('da-DK')} kr.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications Table for Client */}
          {user && job?.client_id === user?.id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ansøgninger ({applications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen ansøgninger endnu
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ansøger</TableHead>
                        <TableHead>Lokation</TableHead>
                        <TableHead>Foreslået sats</TableHead>
                        <TableHead>Tilgængelighed</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ansøgt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                {application.applicant_profile?.avatar_url ? (
                                  <img 
                                    src={application.applicant_profile.avatar_url} 
                                    alt="Ansøger avatar" 
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {application.applicant_profile?.full_name || 'Anonym ansøger'}
                                </p>
                                {application.applicant_profile?.skills && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {application.applicant_profile.skills.slice(0, 2).map((skill, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {application.applicant_profile.skills.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{application.applicant_profile.skills.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {application.applicant_profile?.location || 'Ikke angivet'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {application.proposed_rate ? (
                              <span className="font-medium">{application.proposed_rate} kr./time</span>
                            ) : (
                              <span className="text-muted-foreground">Ikke angivet</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {application.availability || 'Ikke angivet'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(application.status)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {new Date(application.applied_at).toLocaleDateString('da-DK')}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons for Freelancers */}
          {user && job?.client_id !== user?.id && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Button 
                      className="flex-1 max-w-md" 
                      size="lg"
                      onClick={() => {
                        // Check freelancer verification before allowing application
                        if (userRole === 'freelancer' && !requireVerification("ansøge på opgaver")) {
                          return;
                        }
                        navigate(`/job/${id}/apply`);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {t('jobs.applyForJob')}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    {t('jobs.byApplyingAccept')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!user && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  {t('jobs.loginToApply')}
                </p>
                <Button onClick={() => navigate('/auth')}>
                  {t('jobs.loginSignup')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
