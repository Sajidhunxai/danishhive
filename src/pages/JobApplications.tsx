import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/contexts/ApiContext";
import { useAuth } from "@/hooks/useAuth";
import { JobApplicationRefund } from "@/components/JobApplicationRefund";
import { useJobs } from "@/contexts/JobsContext";
import { ArrowLeft, MapPin, Clock, Mail, CheckCircle, XCircle } from "lucide-react";

const JobApplications = () => {
  const api = useApi();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getJobState, loadJob, loadJobApplications } = useJobs();

  const jobState = useMemo(() => (id ? getJobState(id) : undefined), [getJobState, id]);
  const job = jobState?.job ?? null;
  const applications = jobState?.applications ?? [];
  const jobLoading = jobState?.loading ?? false;
  const applicationsLoading = jobState?.applicationsLoading ?? false;
  const jobError = jobState?.error ?? null;

  const [ownershipChecked, setOwnershipChecked] = useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user || ownershipChecked) {
      return;
    }

    loadJob(id, { includeApplications: true })
      .then((detail) => {
        if (!detail) {
          toast({
            title: "Fejl",
            description: "Opgave ikke fundet.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        if (detail.clientId !== user.id) {
          toast({
            title: "Adgang nægtet",
            description: "Du har ikke adgang til at se ansøgninger for denne opgave.",
            variant: "destructive",
          });
          navigate(`/job/${id}`);
          return;
        }

        setOwnershipChecked(true);
      })
      .catch((error: any) => {
        console.error("Error loading job applications:", error);
        toast({
          title: "Fejl",
          description: error?.message || "Kunne ikke hente ansøgninger.",
          variant: "destructive",
        });
        navigate("/");
      });
  }, [id, user, ownershipChecked, loadJob, navigate, toast]);

  const updateApplicationStatus = async (applicationId: string, status: "accepted" | "rejected") => {
    try {
      await api.applications.updateApplication(applicationId, { status });

      if (status === "accepted" && job) {
        const acceptedApp = applications.find((app) => app.id === applicationId);
        if (acceptedApp) {
          setSelectedApplicantId(acceptedApp.applicantId);
        }
      }

      if (id) {
        await loadJobApplications(id, { force: true });
      }

      toast({
        title: "Succes",
        description: `Ansøgning ${status === "accepted" ? "godkendt" : "afvist"}!`,
      });
    } catch (error: any) {
      console.error("Error updating application status:", error);
      toast({
        title: "Fejl",
        description: error?.message || "Kunne ikke opdatere ansøgning status.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Godkendt</Badge>;
      case "rejected":
        return <Badge variant="destructive">Afvist</Badge>;
      default:
        return <Badge variant="outline">Afventer</Badge>;
    }
  };

  const formatRate = (rate: number | null) => {
    if (!rate) return "Ikke angivet";
    return `${rate.toLocaleString("da-DK")} kr./time`;
  };

  if (jobLoading || !ownershipChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job || jobError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Opgave ikke fundet</h2>
          <p className="text-muted-foreground">Vi kunne ikke finde opgaven eller du har ikke adgang.</p>
          <Button onClick={() => navigate("/")}>
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate(`/job/${id}`)} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tilbage til opgave
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold">Ansøgninger</h1>
            <p className="text-muted-foreground mt-2">
              For opgaven: <span className="font-medium">{job.title}</span>
            </p>
          </div>

          <Separator />

          {applicationsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">Ingen ansøgninger endnu.</div>
          ) : (
            <div className="space-y-6">
              {applications.map((application) => {
                const applicant = application.applicantProfile;
                return (
                  <Card key={application.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/40">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                            {applicant?.fullName?.charAt(0) || "A"}
                          </div>
                          <div>
                            <CardTitle className="text-xl">{applicant?.fullName || "Anonym ansøger"}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {applicant?.location || "Lokation ikke angivet"}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Ansøgt {new Date(application.appliedAt).toLocaleDateString("da-DK")}
                          </Badge>
                          <div>{getStatusBadge(application.status)}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Foreslået sats</p>
                          <p className="text-lg font-semibold">{formatRate(application.proposedRate)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Ansøger ID</p>
                          <p className="text-lg font-semibold">{application.applicantId}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>Ikke angivet</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ansøgning</p>
                        <p className="text-muted-foreground leading-relaxed mt-2">
                          {application.coverLetter || "Ingen besked fra ansøger."}
                        </p>
                      </div>

                      {applicant?.skills && applicant.skills.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Kompetencer</p>
                          <div className="flex flex-wrap gap-2">
                            {applicant.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row gap-3">
                        <Button className="flex-1" onClick={() => updateApplicationStatus(application.id, "accepted")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Godkend ansøgning
                        </Button>
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() => updateApplicationStatus(application.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Afvis ansøgning
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedApplicantId && job && (
            <JobApplicationRefund jobId={job.id} selectedApplicantId={selectedApplicantId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default JobApplications;

