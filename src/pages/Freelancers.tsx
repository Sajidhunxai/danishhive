import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApi } from "@/contexts/ApiContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface PublicFreelancer {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  location: string | null;
  hourlyRate: number | null;
  skills: string[];
  bio: string | null;
}

const Freelancers: React.FC = () => {
  const api = useApi();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [freelancers, setFreelancers] = useState<PublicFreelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        const response = await api.profiles.getAllFreelancers({ limit: 20 }).catch(() => []);
        const normalized = Array.isArray(response)
          ? response.map((freelancer: any) => normalizeFreelancer(freelancer))
          : [];
        setFreelancers(normalized);
      } catch (err) {
        console.error('Error fetching freelancers', err);
        setError(t('freelancers.loadError'));
        setFreelancers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, [api, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto p-6 space-y-10">
        <section className="text-center space-y-3">
          <h1 className="text-4xl font-bold">{t('freelancers.marketTitle')}</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t('freelancers.marketSubtitle')}
          </p>
        </section>

        {freelancers.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            {t('freelancers.noFreelancers')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {freelancers.map((freelancer) => (
              <Card key={freelancer.id} className="h-full flex flex-col">
                <CardHeader className="flex flex-col items-center text-center gap-3">
                  <Avatar className="h-20 w-20">
                    {freelancer.avatarUrl ? (
                      <AvatarImage src={freelancer.avatarUrl} alt={freelancer.fullName} />
                    ) : (
                      <AvatarFallback>
                        {freelancer.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{freelancer.fullName}</CardTitle>
                    {freelancer.location && (
                      <p className="text-sm text-muted-foreground">{freelancer.location}</p>
                    )}
                  </div>
                  {freelancer.hourlyRate && (
                    <Badge variant="secondary">
                      {freelancer.hourlyRate} {t('freelancers.hourlyRateLabel')}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-4 flex-1">
                  {freelancer.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{freelancer.bio}</p>
                  )}

                  {freelancer.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.slice(0, 8).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                    >
                      {t('freelancers.viewProfile')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

function normalizeFreelancer(data: any): PublicFreelancer {
  const skillsValue = data?.skills ?? data?.profile?.skills ?? null;
  let skills: string[] = [];

  if (Array.isArray(skillsValue)) {
    skills = skillsValue.map((skill) => String(skill));
  } else if (typeof skillsValue === 'string') {
    try {
      const parsed = JSON.parse(skillsValue);
      if (Array.isArray(parsed)) {
        skills = parsed.map((skill) => String(skill));
      }
    } catch {
      skills = skillsValue
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
    }
  }

  return {
    id: String(data?.userId ?? data?.id ?? ''),
    fullName: data?.fullName ?? data?.profile?.fullName ?? 'Freelancer',
    avatarUrl: data?.avatarUrl ?? data?.profile?.avatarUrl ?? null,
    location: data?.location ?? data?.profile?.location ?? null,
    hourlyRate: data?.hourlyRate ? Number(data.hourlyRate) : data?.profile?.hourlyRate ? Number(data.profile.hourlyRate) : null,
    skills,
    bio: data?.bio ?? data?.profile?.bio ?? null,
  };
}

export default Freelancers;
