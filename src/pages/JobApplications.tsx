import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { JobApplicationRefund } from '@/components/JobApplicationRefund';
import { 
  ArrowLeft, 
  MapPin,
  DollarSign, 
  Clock, 
  Users,
  Star,
  Mail,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';

interface JobApplication {
  id: string;
  cover_letter: string | null;
  proposed_rate: number | null;
  availability: string | null;
  status: string;
  applied_at: string;
  applicant: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
    bio: string | null;
    skills: string[] | null;
    hourly_rate: number | null;
  };
}

interface Job {
  id: string;
  title: string;
  description: string;
  client_id: string;
}

const JobApplications = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);

  useEffect(() => {
    if (id && user) {
      fetchJobAndApplications();
    }
  }, [id, user]);

  const fetchJobAndApplications = async () => {
    if (!id || !user) return;

    try {
      // First fetch the job to verify ownership
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, description, client_id')
        .eq('id', id)
        .maybeSingle();

      if (jobError) throw jobError;

      if (!jobData) {
        toast({
          title: 'Fejl',
          description: 'Opgave ikke fundet.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Check if user is the job owner
      if (jobData.client_id !== user.id) {
        toast({
          title: 'Adgang nægtet',
          description: 'Du har ikke adgang til at se ansøgninger for denne opgave.',
          variant: 'destructive',
        });
        navigate(`/job/${id}`);
        return;
      }

      setJob(jobData);

      // Fetch applications with applicant profiles
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', id)
        .order('applied_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      // Fetch profiles for each applicant
      const applicantIds = applicationsData.map(app => app.applicant_id);
      
      if (applicantIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, location, bio, skills, hourly_rate')
          .in('user_id', applicantIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Transform the data
        const transformedApplications = applicationsData.map(app => {
          const applicantProfile = profilesData?.find(profile => profile.user_id === app.applicant_id);
          return {
            id: app.id,
            cover_letter: app.cover_letter,
            proposed_rate: app.proposed_rate,
            availability: app.availability,
            status: app.status,
            applied_at: app.applied_at,
            applicant: applicantProfile || {
              user_id: app.applicant_id,
              full_name: null,
              avatar_url: null,
              location: null,
              bio: null,
              skills: null,
              hourly_rate: null
            }
          };
        });

        setApplications(transformedApplications);
      } else {
        setApplications([]);
      }

    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente ansøgninger.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      // If accepting an application, trigger refunds for others
      if (status === 'accepted' && job) {
        const acceptedApp = applications.find(app => app.id === applicationId);
        if (acceptedApp) {
          // Trigger refund component
          setSelectedApplicantId(acceptedApp.applicant.user_id);
        }
      }

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status } 
            : app
        )
      );

      toast({
        title: 'Succes',
        description: `Ansøgning ${status === 'accepted' ? 'godkendt' : 'afvist'}!`,
      });

    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke opdatere ansøgning status.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Godkendt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Afvist</Badge>;
      default:
        return <Badge variant="outline">Afventer</Badge>;
    }
  };

  const formatRate = (rate: number | null) => {
    if (!rate) return 'Ikke angivet';
    return `${rate.toLocaleString('da-DK')} kr./time`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/job/${id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Tilbage til opgave
            </Button>
            <ThemeToggle />
          </div>

          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold">Ansøgninger</h1>
            {job && (
              <p className="text-muted-foreground mt-2">
                For opgaven: <span className="font-medium">{job.title}</span>
              </p>
            )}
          </div>

          {/* Applications */}
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen ansøgninger endnu</h3>
                <p className="text-muted-foreground">
                  Der er ikke kommet ansøgninger til denne opgave endnu.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          {application.applicant?.avatar_url ? (
                            <img 
                              src={application.applicant.avatar_url} 
                              alt="Ansøger avatar" 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl">
                            {application.applicant?.full_name || 'Anonym ansøger'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Ansøgt {new Date(application.applied_at).toLocaleDateString('da-DK')}
                            </span>
                            {application.applicant?.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {application.applicant.location}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(application.status)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Applicant Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Foreslået timepris</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatRate(application.proposed_rate)}
                        </p>
                      </div>
                      
                      {application.availability && (
                        <div>
                          <h4 className="font-medium mb-2">Tilgængelighed</h4>
                          <p className="text-sm text-muted-foreground">
                            {application.availability}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {application.applicant?.skills && application.applicant.skills.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Kompetencer</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.applicant.skills.map((skill, index) => (
                            <Badge key={index} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cover Letter */}
                    {application.cover_letter && (
                      <div>
                        <h4 className="font-medium mb-2">Følgebrev</h4>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">
                            {application.cover_letter}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {application.applicant?.bio && (
                      <div>
                        <h4 className="font-medium mb-2">Om ansøgeren</h4>
                        <p className="text-sm text-muted-foreground">
                          {application.applicant.bio}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {application.status === 'pending' && (
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={() => updateApplicationStatus(application.id, 'accepted')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Godkend ansøgning
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Afvis ansøgning
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Refund component for honey drops */}
      {selectedApplicantId && job && (
        <JobApplicationRefund 
          jobId={job.id} 
          selectedApplicantId={selectedApplicantId} 
        />
      )}
    </div>
  );
};

export default JobApplications;