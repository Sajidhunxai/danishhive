import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from "@/components/ui/back-button";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import { useFreelancerVerification } from '@/components/FreelancerVerificationGuard';
import { HoneyDropsBalance } from '@/components/HoneyDropsBalance';

interface Job {
  id: string;
  title: string;
  description: string;
  client_id: string;
  payment_type: string;
  budget_min: number | null;
  budget_max: number | null;
  skills_required: string[] | null;
  project_type: string;
}

const JobApplication = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { requireVerification } = useFreelancerVerification();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [averagePrice, setAveragePrice] = useState<{ min: number; max: number; count: number } | null>(null);
  const [honeyDrops, setHoneyDrops] = useState<number>(0);

  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    proposedRate: '',
    expectedDelivery: '',
  });
  const [contactInfoWarning, setContactInfoWarning] = useState('');
  const [isValidatingContent, setIsValidatingContent] = useState(false);

  const getCharacterCount = (text: string) => {
    return text.trim().length;
  };

  const characterCount = getCharacterCount(applicationData.coverLetter);
  const isCharacterCountValid = characterCount >= 500 && characterCount <= 3000;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (id) {
      fetchJob();
      fetchHoneyDrops();
    }
  }, [id, user, navigate]);

  const fetchJob = async () => {
    if (!id) return;

    try {
      const { data: jobData, error } = await supabase
        .from('jobs')
        .select('id, title, description, client_id, payment_type, budget_min, budget_max, skills_required, project_type')
        .eq('id', id)
        .eq('status', 'open')
        .maybeSingle();

      if (error) throw error;
      
      if (jobData) {
        setJob(jobData);
        fetchAveragePrice(jobData);
      } else {
        toast({
          title: 'Fejl',
          description: 'Opgaven blev ikke fundet eller er ikke længere tilgængelig.',
          variant: 'destructive',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente opgave detaljer.',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchAveragePrice = async (currentJob: Job) => {
    try {
      // Build query for similar jobs based on skills or project type
      let query = supabase
        .from('jobs')
        .select('budget_min, budget_max')
        .eq('status', 'completed')
        .eq('project_type', currentJob.project_type)
        .neq('id', currentJob.id);

      // If we have skills, filter by similar skills
      if (currentJob.skills_required && currentJob.skills_required.length > 0) {
        query = query.overlaps('skills_required', currentJob.skills_required);
      }

      const { data: similarJobs, error } = await query.limit(20);

      if (error) throw error;

      if (similarJobs && similarJobs.length > 0) {
        const validJobs = similarJobs.filter(job => 
          job.budget_min !== null && job.budget_max !== null
        );

        if (validJobs.length > 0) {
          const avgMin = validJobs.reduce((sum, job) => sum + (job.budget_min || 0), 0) / validJobs.length;
          const avgMax = validJobs.reduce((sum, job) => sum + (job.budget_max || 0), 0) / validJobs.length;
          
          setAveragePrice({
            min: Math.round(avgMin),
            max: Math.round(avgMax),
            count: validJobs.length
          });
        }
      }
    } catch (error) {
      console.error('Error fetching average price:', error);
    }
  };

  const fetchHoneyDrops = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_earnings')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      // Using total_earnings temporarily to store honey drops until we add the proper column
      setHoneyDrops(data?.total_earnings || 0);
    } catch (error) {
      console.error('Error fetching honey drops:', error);
    }
  };

  const validateContactInfo = async (text: string) => {
    if (!text.trim() || text.length < 10) return;
    
    setIsValidatingContent(true);
    setContactInfoWarning('');
    
    try {
      const { data, error } = await supabase.functions.invoke('filter-contact-info', {
        body: { text }
      });

      if (error) {
        console.error('Error validating content:', error);
        return;
      }

      if (data?.hasContactInfo) {
        setContactInfoWarning('Din besked indeholder kontaktoplysninger, som ikke er tilladt. Brug kun Danish Hive til kommunikation.');
        // Update the cover letter with filtered text
        setApplicationData(prev => ({ 
          ...prev, 
          coverLetter: data.filteredText 
        }));
      }
    } catch (error) {
      console.error('Error validating contact info:', error);
    } finally {
      setIsValidatingContent(false);
    }
  };

  const handleCoverLetterChange = (value: string) => {
    setApplicationData(prev => ({ ...prev, coverLetter: value }));
    
    // Clear previous warning
    setContactInfoWarning('');
    
    // Debounce the validation
    const timeoutId = setTimeout(() => {
      validateContactInfo(value);
    }, 1000);

    // Cleanup function would be called if this component re-renders
    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check freelancer verification first
    if (!requireVerification("byde på opgaver")) {
      return;
    }

    if (!job || !user) return;

    // Final contact info validation
    if (contactInfoWarning) {
      toast({
        title: 'Kontaktoplysninger ikke tilladt',
        description: 'Fjern venligst alle kontaktoplysninger fra dit følgebrev',
        variant: 'destructive',
      });
      return;
    }

    // Check honey drops
    if (honeyDrops < 3) {
      toast({
        title: 'Ikke nok honningdråber',
        description: 'Du skal have mindst 3 honningdråber for at byde på denne opgave. Køb flere honningdråber.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Final validation of content before submission
      const { data: validationData } = await supabase.functions.invoke('filter-contact-info', {
        body: { text: applicationData.coverLetter }
      });

      if (validationData?.hasContactInfo) {
        toast({
          title: 'Kontaktoplysninger detekteret',
          description: 'Din ansøgning indeholder kontaktoplysninger. Ret venligst din besked.',
          variant: 'destructive',
        });
        setContactInfoWarning('Din besked indeholder kontaktoplysninger, som ikke er tilladt. Brug kun Danish Hive til kommunikation.');
        return;
      }

      // Submit the application
      const { data: newApplication, error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          applicant_id: user.id,
          cover_letter: applicationData.coverLetter,
          proposed_rate: applicationData.proposedRate ? parseFloat(applicationData.proposedRate) : null,
          availability: applicationData.expectedDelivery ? `${applicationData.expectedDelivery} dage` : null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct honey drops (simulate with direct update for now)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          total_earnings: honeyDrops - 3 // Using total_earnings temporarily to store honey drops
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error deducting honey drops:', updateError);
      } else {
        setHoneyDrops(prev => Math.max(0, prev - 3));
      }
      
      toast({
        title: 'Ansøgning sendt!',
        description: 'Din ansøgning er blevet sendt til klienten. Du vil høre fra dem snarest.',
      });

      navigate(`/job/${id}`);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved afsendelse af din ansøgning.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRateLabel = () => {
    if (!job) return 'Foreslået pris';
    return job.payment_type === 'hourly' ? 'Foreslået timepris (kr.)' : 'Foreslå en pris (kr.)';
  };

  const getRatePlaceholder = () => {
    if (!job) return '500';
    return job.payment_type === 'hourly' ? '500' : job.budget_min ? job.budget_min.toString() : '5000';
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
          <h2 className="text-2xl font-bold mb-2">Opgave ikke fundet</h2>
          <p className="text-muted-foreground mb-4">Den opgave du prøver at ansøge om eksisterer ikke.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbage til forsiden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <BackButton to={`/job/${id}`} />
            <ThemeToggle />
          </div>

          {/* Job Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ansøg om opgave</CardTitle>
              <p className="text-muted-foreground">{job.title}</p>
            </CardHeader>
          </Card>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Din ansøgning</CardTitle>
                <HoneyDropsBalance drops={honeyDrops} onUpdate={fetchHoneyDrops} />
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="coverLetter">Følgebrev *</Label>
                    <span className={`text-sm ${isCharacterCountValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                      {characterCount} tegn (500-3000 tegn påkrævet)
                    </span>
                  </div>
                  <Textarea
                    id="coverLetter"
                    placeholder="Beskriv hvorfor du er den rette til denne opgave..."
                    value={applicationData.coverLetter}
                    onChange={(e) => handleCoverLetterChange(e.target.value)}
                    className="min-h-32"
                    required
                  />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Fortæl klienten om din erfaring og hvordan du vil løse opgaven. Du kan bruge emojis og specialtegn.
                    </p>
                    {!isCharacterCountValid && applicationData.coverLetter.trim().length > 0 && (
                      <p className="text-sm text-destructive">
                        Følgebrevet skal indeholde mellem 500-3000 tegn
                      </p>
                    )}
                    {isValidatingContent && (
                      <p className="text-sm text-muted-foreground">
                        Kontrollerer indhold...
                      </p>
                    )}
                  </div>
                  {contactInfoWarning && (
                    <Alert className="border-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {contactInfoWarning}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proposedRate">{getRateLabel()}</Label>
                    <Input
                      id="proposedRate"
                      type="number"
                      placeholder={getRatePlaceholder()}
                      value={applicationData.proposedRate}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, proposedRate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedDelivery">Forventet leveringstid (dage)</Label>
                    <Input
                      id="expectedDelivery"
                      type="number"
                      placeholder="14"
                      value={applicationData.expectedDelivery}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/job/${id}`)}
                    className="flex-1"
                  >
                    Annuller
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={
                      submitting || 
                      !applicationData.coverLetter.trim() || 
                      !isCharacterCountValid || 
                      !!contactInfoWarning ||
                      isValidatingContent ||
                      honeyDrops < 3
                    }
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {honeyDrops < 3 ? 'Ikke nok honningdråber (3 kræves)' : 'Send ansøgning (3 dråber)'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Average Price Info */}
          {averagePrice && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                💡 Gennemsnitspris for lignende opgaver: {averagePrice.min.toLocaleString('da-DK')} - {averagePrice.max.toLocaleString('da-DK')} kr. 
                (baseret på {averagePrice.count} gennemførte opgaver)
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Ved at sende din ansøgning accepterer du vores vilkår og betingelser
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplication;