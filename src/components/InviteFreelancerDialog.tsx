import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Briefcase, Euro, MapPin } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  location: string | null;
  skills_required: string[] | null;
  status: string;
  is_remote: boolean | null;
  deadline: string | null;
}

interface InviteFreelancerDialogProps {
  freelancerId: string;
  freelancerName: string | null;
  children: React.ReactNode;
}

export const InviteFreelancerDialog: React.FC<InviteFreelancerDialogProps> = ({
  freelancerId,
  freelancerName,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchClientJobs = async () => {
    if (!user?.id) return;
    
    setFetchingJobs(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, description, budget_min, budget_max, location, skills_required, status, is_remote, deadline')
        .eq('client_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente dine opgaver",
        variant: "destructive",
      });
    } finally {
      setFetchingJobs(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchClientJobs();
    }
  }, [open, user?.id]);

  const handleJobToggle = (jobId: string) => {
    console.log('Toggling job:', jobId, 'Current selected:', selectedJobs);
    setSelectedJobs(prev => {
      const isSelected = prev.includes(jobId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId];
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  const handleSendInvitations = async () => {
    if (!user?.id || selectedJobs.length === 0) {
      toast({
        title: "Fejl",
        description: "Vælg mindst én opgave at invitere til",
        variant: "destructive",
      });
      return;
    }

    if (message.trim().length < 100 || message.trim().length > 300) {
      toast({
        title: "Fejl",
        description: "Beskeden skal være mellem 100 og 300 tegn",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create invitations for each selected job
      const invitations = selectedJobs.map(jobId => ({
        client_id: user.id,
        freelancer_id: freelancerId,
        job_id: jobId,
        message: message.trim(),
        status: 'pending'
      }));

      const { error } = await supabase
        .from('invitations')
        .insert(invitations);

      if (error) throw error;

      toast({
        title: "Invitationer sendt!",
        description: `${selectedJobs.length} invitation(er) er sendt til ${freelancerName || 'freelanceren'}`,
      });

      setOpen(false);
      setSelectedJobs([]);
      setMessage("");
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende invitationer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) {
      return `${min.toLocaleString('da-DK')} - ${max.toLocaleString('da-DK')} DKK`;
    } else if (min) {
      return `Fra ${min.toLocaleString('da-DK')} DKK`;
    } else if (max) {
      return `Op til ${max.toLocaleString('da-DK')} DKK`;
    }
    return "Budget ikke angivet";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Inviter {freelancerName || 'Freelancer'} til opgave
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {fetchingJobs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Henter dine opgaver...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen aktive opgaver</h3>
              <p className="text-muted-foreground">Du har ingen åbne opgaver at invitere til.</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-medium mb-4">Vælg opgaver at invitere til:</h3>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {jobs.map((job) => (
                    <Card key={job.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <Checkbox
                              id={`job-${job.id}`}
                              checked={selectedJobs.includes(job.id)}
                              onCheckedChange={() => handleJobToggle(job.id)}
                              className="h-5 w-5 border-2"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label 
                              htmlFor={`job-${job.id}`}
                              className="text-base font-medium cursor-pointer"
                              onClick={() => handleJobToggle(job.id)}
                            >
                              {job.title}
                            </Label>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {job.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Euro className="h-3 w-3" />
                                {formatBudget(job.budget_min, job.budget_max)}
                              </div>
                              
                              {job.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {job.location}
                                </div>
                              )}
                              
                              {job.is_remote && (
                                <Badge variant="secondary" className="text-xs">
                                  Remote
                                </Badge>
                              )}
                              
                              {job.deadline && (
                                <span>
                                  Deadline: {new Date(job.deadline).toLocaleDateString('da-DK')}
                                </span>
                              )}
                            </div>

                            {job.skills_required && job.skills_required.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {job.skills_required.slice(0, 5).map((skill) => (
                                  <Badge key={skill} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {job.skills_required.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{job.skills_required.length - 5} flere
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Besked til freelancer (påkrævet: 100-300 tegn)</Label>
                <Textarea
                  id="message"
                  placeholder="Skriv en personlig besked til freelanceren (minimum 100 tegn)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center text-sm">
                  <span className={`${
                    message.length < 100 ? 'text-red-500' : 
                    message.length > 300 ? 'text-red-500' : 
                    'text-green-600'
                  }`}>
                    {message.length < 100 ? `Mangler ${100 - message.length} tegn` :
                     message.length > 300 ? `${message.length - 300} tegn for mange` :
                     'Beskedlængde er korrekt'}
                  </span>
                  <span className={`${
                    message.length > 300 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {message.length}/300
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Annuller
                </Button>
                <Button 
                  onClick={handleSendInvitations}
                  disabled={loading || selectedJobs.length === 0 || message.trim().length < 100 || message.trim().length > 300}
                >
                  {loading ? "Sender..." : `Send ${selectedJobs.length} invitation(er)`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};