import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/back-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowLeft, Send, AlertTriangle } from "lucide-react";
import { useFreelancerVerification } from "@/components/FreelancerVerificationGuard";
import { HoneyDropsBalance } from "@/components/HoneyDropsBalance";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/services/api";
import { getJobById } from "@/api/jobs";
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
  const [averagePrice, setAveragePrice] = useState<{
    min: number;
    max: number;
    count: number;
  } | null>(null);
  const [honeyDrops, setHoneyDrops] = useState<number>(0);
  const { t } = useLanguage();
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    proposedRate: "",
    expectedDelivery: "",
  });
  const [contactInfoWarning, setContactInfoWarning] = useState("");
  const [isValidatingContent, setIsValidatingContent] = useState(false);

  const getCharacterCount = (text: string) => {
    return text.trim().length;
  };

  const characterCount = getCharacterCount(applicationData.coverLetter);
  const isCharacterCountValid = characterCount >= 500 && characterCount <= 3000;

  useEffect(() => {
    if (!user) {
      navigate("/auth");
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
      const jobData = await getJobById(id);

      if (jobData) {
        // Map backend data to frontend format
        const mappedJob: Job = {
          id: jobData.id,
          title: jobData.title,
          description: jobData.description,
          client_id: jobData.clientId,
          payment_type: jobData.paymentType || 'fixed',
          budget_min: jobData.budget ? parseFloat(jobData.budget.toString()) : null,
          budget_max: jobData.budget ? parseFloat(jobData.budget.toString()) : null,
          skills_required: Array.isArray(jobData.skills) ? jobData.skills : 
                          (typeof jobData.skills === 'string' ? JSON.parse(jobData.skills) : []),
          project_type: jobData.projectType || 'one-time',
        };

        // Only set job if status is open
        if (jobData.status === 'open') {
          setJob(mappedJob);
          // fetchAveragePrice(mappedJob); // TODO: Implement average price calculation via backend
        } else {
          toast({
            title: "Fejl",
            description:
              "Opgaven blev ikke fundet eller er ikke længere tilgængelig.",
            variant: "destructive",
          });
          navigate("/");
        }
      } else {
        toast({
          title: "Fejl",
          description:
            "Opgaven blev ikke fundet eller er ikke længere tilgængelig.",
          variant: "destructive",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("Error fetching job:", error);
      toast({
        title: "Fejl",
        description: error.response?.data?.error || "Kunne ikke hente opgave detaljer.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchAveragePrice = async (currentJob: Job) => {
    try {
      // TODO: Implement average price calculation via backend API
      // For now, we'll skip this feature as it requires backend support
      // The backend would need an endpoint like GET /jobs/average-price?projectType=...&skills=...
      console.log("Average price calculation not yet implemented via backend");
    } catch (error) {
      console.error("Error fetching average price:", error);
    }
  };

  const fetchHoneyDrops = async () => {
    if (!user) return;

    try {
      const balance = await api.honey.getBalance();
      setHoneyDrops(balance || 0);
    } catch (error) {
      console.error("Error fetching honey drops:", error);
      setHoneyDrops(0);
    }
  };

  const validateContactInfo = async (text: string) => {
    if (!text.trim() || text.length < 10) return;

    setIsValidatingContent(true);
    setContactInfoWarning("");

    try {
      // TODO: Implement contact info validation via backend API
      // For now, we'll do basic client-side validation
      const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/g;
      const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
      const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
      
      const hasEmail = emailPattern.test(text);
      const hasPhone = phonePattern.test(text);
      const hasUrl = urlPattern.test(text);

      if (hasEmail || hasPhone || hasUrl) {
        setContactInfoWarning(
          "Din besked indeholder kontaktoplysninger, som ikke er tilladt. Brug kun Danish Hive til kommunikation."
        );
      }
    } catch (error) {
      console.error("Error validating contact info:", error);
    } finally {
      setIsValidatingContent(false);
    }
  };

  const handleCoverLetterChange = (value: string) => {
    setApplicationData((prev) => ({ ...prev, coverLetter: value }));

    // Clear previous warning
    setContactInfoWarning("");

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
        title: "Kontaktoplysninger ikke tilladt",
        description: "Fjern venligst alle kontaktoplysninger fra dit følgebrev",
        variant: "destructive",
      });
      return;
    }

    // Check honey drops
    if (honeyDrops < 3) {
      toast({
        title: "Ikke nok honningdråber",
        description:
          "Du skal have mindst 3 honningdråber for at byde på denne opgave. Køb flere honningdråber.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Final validation of content before submission (client-side check)
      const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/g;
      const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
      const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
      
      const hasEmail = emailPattern.test(applicationData.coverLetter);
      const hasPhone = phonePattern.test(applicationData.coverLetter);
      const hasUrl = urlPattern.test(applicationData.coverLetter);

      if (hasEmail || hasPhone || hasUrl) {
        toast({
          title: "Kontaktoplysninger detekteret",
          description:
            "Din ansøgning indeholder kontaktoplysninger. Ret venligst din besked.",
          variant: "destructive",
        });
        setContactInfoWarning(
          "Din besked indeholder kontaktoplysninger, som ikke er tilladt. Brug kun Danish Hive til kommunikation."
        );
        setSubmitting(false);
        return;
      }

      // Submit the application via backend API
      await api.applications.createApplication({
        jobId: job.id,
        coverLetter: applicationData.coverLetter,
        proposedRate: applicationData.proposedRate
          ? parseFloat(applicationData.proposedRate)
          : undefined,
      });

      // Deduct honey drops via backend API
      try {
        await api.honey.spend(3, `Application fee for job: ${job.title}`);
        setHoneyDrops((prev) => Math.max(0, prev - 3));
      } catch (honeyError) {
        console.error("Error deducting honey drops:", honeyError);
        // Application was created, but honey drop deduction failed
        // This should be handled by the backend, but we log it here
      }

      toast({
        title: "Ansøgning sendt!",
        description:
          "Din ansøgning er blevet sendt til klienten. Du vil høre fra dem snarest.",
      });

      navigate(`/job/${id}`);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Fejl",
        description: error.response?.data?.error || "Der opstod en fejl ved afsendelse af din ansøgning.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRateLabel = () => {
    if (!job) return t("jobs.suggestedPrice");
    return job.payment_type === "hourly"
      ? t("jobs.suggestHourlyRate")
      : t("jobs.suggestPrice");
  };

  const getRatePlaceholder = () => {
    if (!job) return "500";
    return job.payment_type === "hourly"
      ? "500"
      : job.budget_min
      ? job.budget_min.toString()
      : "5000";
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
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("job.notFound.back")}
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
              <CardTitle className="text-xl">{t("job.apply.title")}</CardTitle>
              <p className="text-muted-foreground">{job.title}</p>
            </CardHeader>
          </Card>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("job.apply.subtitle")}</CardTitle>
                <HoneyDropsBalance
                  drops={honeyDrops}
                  onUpdate={fetchHoneyDrops}
                />
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="coverLetter">
                      {t("job.apply.coverLetter")}
                    </Label>
                    <span
                      className={`text-sm ${
                        isCharacterCountValid
                          ? "text-muted-foreground"
                          : "text-destructive"
                      }`}
                    >
                      {characterCount} {t("job.apply.charCount")}
                    </span>
                  </div>
                  <Textarea
                    id="coverLetter"
                    placeholder={t("job.apply.coverLetter.placeholder")}
                    value={applicationData.coverLetter}
                    onChange={(e) => handleCoverLetterChange(e.target.value)}
                    className="min-h-32"
                    required
                  />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {t("job.apply.coverLetter.help")}
                    </p>
                    {!isCharacterCountValid &&
                      applicationData.coverLetter.trim().length > 0 && (
                        <p className="text-sm text-destructive">
                          {t("job.apply.coverLetter.invalid")}
                        </p>
                      )}
                    {isValidatingContent && (
                      <p className="text-sm text-muted-foreground">
                        {t("job.apply.validating")}
                      </p>
                    )}
                  </div>
                  {contactInfoWarning && (
                    <Alert className="border-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{contactInfoWarning}</AlertDescription>
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
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          proposedRate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedDelivery">
                      {t("job.apply.delivery")}
                    </Label>
                    <Input
                      id="expectedDelivery"
                      type="number"
                      placeholder="14"
                      value={applicationData.expectedDelivery}
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          expectedDelivery: e.target.value,
                        }))
                      }
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
                    {t("job.apply.cancel")}
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
                    {honeyDrops < 3
                      ? t("job.apply.insufficientDrops")
                      : t("common.submitApplication")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Average Price Info */}
          {averagePrice && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
              {t("job.apply.averagePrice")}
                {averagePrice.min.toLocaleString("da-DK")} -{" "}
                {averagePrice.max.toLocaleString("da-DK")} kr. (baseret på{" "}
                {averagePrice.count} gennemførte opgaver)
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Ved at sende din ansøgning accepterer du vores vilkår og
              betingelser
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplication;
