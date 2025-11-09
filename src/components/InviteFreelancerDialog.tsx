import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/contexts/ApiContext";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
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
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const api = useApi();

  const fetchClientJobs = async () => {
    if (!user?.id) return;
    setFetchingJobs(true);
    try {
      const jobsData = await api.jobs.getMyJobs();
      const openJobs = jobsData
        .filter((job: any) => job.status === "open")
        .map((job: any) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          budget_min: job.budget ? Number(job.budget) : null,
          budget_max: job.budget ? Number(job.budget) : null,
          location: job.location,
          skills_required: job.skills
            ? typeof job.skills === "string"
              ? JSON.parse(job.skills)
              : job.skills
            : null,
          status: job.status,
          is_remote: job.isRemote || null,
          deadline: job.deadline || null,
        }));
      setJobs(openJobs);
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast({
        title: t("inviteFreelancer.error"),
        description: t("inviteFreelancer.fetchError"),
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
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSendInvitations = async () => {
    if (!user?.id || selectedJobs.length === 0) {
      toast({
        title: t("inviteFreelancer.error"),
        description: t("inviteFreelancer.selectJobError"),
        variant: "destructive",
      });
      return;
    }

    if (message.trim().length < 100 || message.trim().length > 300) {
      toast({
        title: t("inviteFreelancer.error"),
        description: t("inviteFreelancer.messageLengthError"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      for (const jobId of selectedJobs) {
        await api.messages.sendMessage({
          receiverId: freelancerId,
          content: message.trim(),
          conversationId: `job-${jobId}`,
        });
      }

      toast({
        title: t("inviteFreelancer.sentTitle"),
        description: t("inviteFreelancer.sentDesc", {
          count: selectedJobs.length,
          name: freelancerName || t("inviteFreelancer.freelancer"),
        }),
      });

      setOpen(false);
      setSelectedJobs([]);
      setMessage("");
    } catch (error) {
      console.error("Error sending invitations:", error);
      toast({
        title: t("inviteFreelancer.error"),
        description: t("inviteFreelancer.sendError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) {
      return `${min.toLocaleString("da-DK")} - ${max.toLocaleString("da-DK")} DKK`;
    } else if (min) {
      return t("inviteFreelancer.budgetFrom", { amount: min });
    } else if (max) {
      return t("inviteFreelancer.budgetUpTo", { amount: max });
    }
    return t("inviteFreelancer.noBudget");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("inviteFreelancer.title", {
              name: freelancerName || t("inviteFreelancer.freelancer"),
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {fetchingJobs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                {t("inviteFreelancer.loadingJobs")}
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("inviteFreelancer.noJobs")}
              </h3>
              <p className="text-muted-foreground">
                {t("inviteFreelancer.noJobsDesc")}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-medium mb-4">
                  {t("inviteFreelancer.selectJobs")}
                </h3>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {jobs.map((job) => (
                    <Card key={job.id}>
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
                                  {t("inviteFreelancer.remote")}
                                </Badge>
                              )}

                              {job.deadline && (
                                <span>
                                  {t("inviteFreelancer.deadline")}:{" "}
                                  {new Date(job.deadline).toLocaleDateString("da-DK")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  {t("inviteFreelancer.messageLabel")}
                </Label>
                <Textarea
                  id="message"
                  placeholder={t("inviteFreelancer.messagePlaceholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
                <div className="flex justify-between items-center text-sm">
                  <span
                    className={`${
                      message.length < 100 || message.length > 300
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {message.length < 100
                      ? t("inviteFreelancer.missingChars", {
                          count: 100 - message.length,
                        })
                      : message.length > 300
                      ? t("inviteFreelancer.tooManyChars", {
                          count: message.length - 300,
                        })
                      : t("inviteFreelancer.correctLength")}
                  </span>
                  <span
                    className={`${
                      message.length > 300
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.length}/300
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("inviteFreelancer.cancel")}
                </Button>
                <Button
                  onClick={handleSendInvitations}
                  disabled={
                    loading ||
                    selectedJobs.length === 0 ||
                    message.trim().length < 100 ||
                    message.trim().length > 300
                  }
                >
                  {loading
                    ? t("inviteFreelancer.sending")
                    : t("inviteFreelancer.sendInvitations", {
                        count: selectedJobs.length,
                      })}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
