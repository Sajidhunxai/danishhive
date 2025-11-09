import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApi } from "@/contexts/ApiContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

interface PublicJob {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  projectType: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  status: string | null;
  deadline: string | null;
  createdAt: string | null;
}

const Jobs: React.FC = () => {
  const api = useApi();
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const jobsResponse = await api.jobs.getAllJobs({ status: 'open' }).catch(() => []);
        const normalized = Array.isArray(jobsResponse)
          ? jobsResponse.map((job: any) => normalizeJob(job))
          : [];
        const openJobs = normalized.filter(
          (job) => !job.status || job.status.toLowerCase() === 'open'
        );
        setJobs(openJobs);
      } catch (err) {
        console.error('Error loading jobs', err);
        setError(t('jobs.loadError'));
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [api, t]);

  const hasJobs = useMemo(() => jobs.length > 0, [jobs]);

  const renderBudget = (job: PublicJob) => {
    if (job.budgetMin && job.budgetMax) {
      return `${job.budgetMin.toLocaleString('da-DK')} - ${job.budgetMax.toLocaleString('da-DK')} DKK`;
    }
    if (job.budgetMin) {
      return `${job.budgetMin.toLocaleString('da-DK')} DKK`;
    }
    if (job.budgetMax) {
      return `${job.budgetMax.toLocaleString('da-DK')} DKK`;
    }
    return null;
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto p-6 space-y-10">
        <section className="text-center space-y-3">
          <h1 className="text-4xl font-bold">{t('jobs.marketTitle')}</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t('jobs.marketSubtitle')}
          </p>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : hasJobs ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const budgetLabel = renderBudget(job);
              const createdAt = formatDate(job.createdAt);
              const deadline = formatDate(job.deadline);

              return (
                <Card key={job.id} className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between text-lg">
                      <span>{job.title}</span>
                      {job.projectType && (
                        <Badge variant="outline">{job.projectType}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 flex-1">
                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {job.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {job.location && <span>📍 {job.location}</span>}
                      {budgetLabel && <span>💰 {budgetLabel}</span>}
                      {createdAt && (
                        <span>
                          📅 {t('jobs.posted')}: {createdAt}
                        </span>
                      )}
                      {deadline && (
                        <span>
                          ⏰ {t('jobs.deadlineLabel')}: {deadline}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-auto">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/job/${job.id}`)}
                      >
                        {t('index.view_details')}
                      </Button>
                      {user ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/job/${job.id}/apply`)}
                        >
                          {t('jobs.applyNow')}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/auth')}
                        >
                          {t('jobs.loginToApply')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-20">
            {t('jobs.noOpenJobs')}
          </div>
        )}
      </main>
    </div>
  );
};

function normalizeJob(job: any): PublicJob {
  const budgetMin = job?.budgetMin ?? job?.budget_min ?? null;
  const budgetMax = job?.budgetMax ?? job?.budget_max ?? null;
  const description = job?.description ?? job?.summary ?? null;

  return {
    id: String(job?.id ?? ''),
    title: job?.title || 'Projekt',
    description,
    location: job?.location ?? job?.city ?? null,
    projectType: job?.projectType ?? job?.project_type ?? null,
    budgetMin: typeof budgetMin === 'number' ? budgetMin : budgetMin ? Number(budgetMin) : null,
    budgetMax: typeof budgetMax === 'number' ? budgetMax : budgetMax ? Number(budgetMax) : null,
    status: job?.status ?? null,
    deadline: job?.deadline ?? job?.closingDate ?? job?.closing_date ?? null,
    createdAt: job?.createdAt ?? job?.created_at ?? job?.postedAt ?? job?.posted_at ?? null,
  };
}

export default Jobs;
