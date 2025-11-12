import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from "@/components/ui/back-button";
import { useFreelancerVerification } from '@/components/FreelancerVerificationGuard';
import { useLanguage } from "@/contexts/LanguageContext";
import { useJobs } from "@/contexts/JobsContext";
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

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const { requireVerification } = useFreelancerVerification();
  const [clientSpending, setClientSpending] = useState<number>(0);
  const [clientRating, setClientRating] = useState<number | null>(null);
  const { getJobState, loadJob } = useJobs();
  const { t } = useLanguage();
  const jobState = useMemo(() => (id ? getJobState(id) : undefined), [getJobState, id]);
  const job = jobState?.job;
  const applications = jobState?.applications ?? [];
  const applicationsLoading = jobState?.applicationsLoading ?? false;
  const jobLoading = jobState?.loading ?? false;
  const jobError = jobState?.error ?? null;
  const clientProfile = job?.clientProfile ?? null;

  useEffect(() => {
    if (!id) return;
    loadJob(id, { includeApplications: true }).catch(() => {
      // errors handled via context state
    });
  }, [id, loadJob]);

  useEffect(() => {
    if (job) {
      setClientSpending(0);
      setClientRating(4.5);
    }
  }, [job]);

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

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job || jobError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t("job.notFound.title")}</h2>
          <p className="text-muted-foreground mb-4">{jobError ?? t("job.notFound.desc")}</p>
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
                      {t('jobs.posted')} {new Date(job.createdAt).toLocaleDateString('da-DK')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.projectType === 'one-time' ? t('jobs.singleJob') : t('jobs.ongoingProject')}
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
                    <p className="font-medium">{t('common.budget')}</p>
                    <p className="text-sm text-muted-foreground">{formatBudget(job.budgetMin, job.budgetMax)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('jobs.location')}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.isRemote ? t('jobs.remoteWork') : job.location || t('common.notSpecified')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('jobs.deadline')}</p>
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
              {job.skillsRequired && job.skillsRequired.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">{t('jobs.requiredSkills')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skillsRequired.map((skill, index) => (
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
                  {clientProfile?.avatarUrl ? (
                    <img 
                      src={clientProfile.avatarUrl} 
                      alt="Klient avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">
                    {clientProfile?.fullName ? clientProfile.fullName.split(' ')[0] : 'Anonym klient'}
                  </h4>
                  
                  {clientRating && clientRating > 4.5 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-yellow-600 font-medium">Highly recommended</span>
                    </div>
                  )}
                  
                  <div className="space-y-1 mt-2">
                    {(clientProfile?.location || clientProfile?.companyName) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Bopæl: {clientProfile.location || clientProfile.companyName}
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
          {user && job?.clientId === user?.id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ansøgninger ({applications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : applications.length === 0 ? (
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
                                {application.applicantProfile?.avatarUrl ? (
                                  <img 
                                    src={application.applicantProfile.avatarUrl} 
                                    alt="Ansøger avatar" 
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {application.applicantProfile?.fullName || 'Anonym ansøger'}
                                </p>
                                {application.applicantProfile?.skills && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {application.applicantProfile.skills.slice(0, 2).map((skill, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {application.applicantProfile.skills.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{application.applicantProfile.skills.length - 2}
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
                                  {application.applicantProfile?.location || 'Ikke angivet'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {application.proposedRate ? (
                              <span className="font-medium">{application.proposedRate} kr./time</span>
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
                                {new Date(application.appliedAt).toLocaleDateString('da-DK')}
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
          {user && job?.clientId !== user?.id && (
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
