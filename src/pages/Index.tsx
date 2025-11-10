import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import JobsSection from "@/components/JobsSection";
import { useApi } from "@/contexts/ApiContext";

interface FeaturedFreelancer {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  location: string | null;
  hourlyRate: number | null;
}

interface FeaturedProject {
  id: string;
  title: string;
  description: string | null;
  budget: string | null;
  location: string | null;
  projectType: string | null;
}

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const hasCheckedRef = useRef(false);
  const fetchedPublicRef = useRef(false);
  const api = useApi();

  const [featuredFreelancers, setFeaturedFreelancers] = useState<FeaturedFreelancer[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);

  const checkProfileCompletion = useCallback(async () => {
    if (!user) return;

    try {
      const profile = await api.profiles.getMyProfile();
      if (!profile) {
        navigate("/complete-profile");
        return;
      }

      if (profile.user?.isAdmin === true) {
        return;
      }

      const hasBasicProfile =
        profile.fullName && profile.fullName.trim() !== "" && profile.fullName !== "Incomplete Profile";

      if (profile.user?.userType === "CLIENT" && !profile.user?.isAdmin) {
        const isClientProfileComplete =
          hasBasicProfile &&
          profile.phoneNumber && 
          profile.phoneNumber.trim() !== "" &&
          profile.address && 
          profile.address.trim() !== "" &&
          profile.city && 
          profile.city.trim() !== "" &&
          profile.postalCode && 
          profile.postalCode.trim() !== "" &&
          profile.user?.phoneVerified === true;

        if (!isClientProfileComplete) {
          navigate("/complete-profile");
        }
      } else if (profile.user?.userType === "FREELANCER") {
        if (!hasBasicProfile) {
          return;
        }
        
        const isFreelancerProfileComplete =
          hasBasicProfile &&
          profile.phoneNumber && 
          profile.phoneNumber.trim() !== "" &&
          profile.address && 
          profile.address.trim() !== "" &&
          profile.city && 
          profile.city.trim() !== "" &&
          profile.postalCode && 
          profile.postalCode.trim() !== "" &&
          profile.user?.phoneVerified === true;

        if (!isFreelancerProfileComplete) {
          return;
        }
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      navigate("/complete-profile");
    }
  }, [api, navigate, user]);

  const fetchPublicShowcase = useCallback(async () => {
    if (fetchedPublicRef.current) return;
    fetchedPublicRef.current = true;

    setPublicLoading(true);
    try {
      const [freelancersResponse, jobsResponse] = await Promise.all([
        api.profiles.getAllFreelancers({ limit: 6 }).catch((error: unknown) => {
          console.warn("Unable to fetch freelancers for public landing", error);
          return [];
        }),
        api.jobs.getAllJobs({ limit: 6, status: "open" }).catch((error: unknown) => {
          console.warn("Unable to fetch jobs for public landing", error);
          return [];
        }),
      ]);

      const freelancers = (freelancersResponse || [])
        .filter((profile: any) => profile?.id)
        .map((profile: any) => ({
          id: profile.id,
          fullName: profile.fullName || profile.profile?.fullName || "Ukendt freelancer",
          avatarUrl: profile.avatarUrl || profile.profile?.avatarUrl || null,
          location: profile.location || profile.profile?.location || null,
          hourlyRate: profile.hourlyRate ? Number(profile.hourlyRate) : null,
        }));

      const projects = (jobsResponse || []).map((job: any) => {
        const min = job.budgetMin ?? job.budget_min;
        const max = job.budgetMax ?? job.budget_max;
        let budgetLabel: string | null = null;
        if (min && max) {
          budgetLabel = `${Number(min).toLocaleString('da-DK')} - ${Number(max).toLocaleString('da-DK')} DKK`;
        } else if (min) {
          budgetLabel = `${Number(min).toLocaleString('da-DK')} DKK`; 
        } else if (max) {
          budgetLabel = `${Number(max).toLocaleString('da-DK')} DKK`;
        }

        return {
          id: job.id,
          title: job.title || "Projekt",
          description: job.description || null,
          budget: budgetLabel,
          location: job.location || job.city || null,
          projectType: job.projectType || job.project_type || null,
        } as FeaturedProject;
      });

      setFeaturedFreelancers(freelancers.slice(0, 4));
      setFeaturedProjects(projects.slice(0, 4));
    } catch (error) {
      console.error("Error fetching public showcase:", error);
      setFeaturedFreelancers([]);
      setFeaturedProjects([]);
    } finally {
      setPublicLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      fetchPublicShowcase();
      return;
    }

    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    checkProfileCompletion();
  }, [loading, user, checkProfileCompletion, fetchPublicShowcase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto p-6">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground animate-pulse">{t('index.loading')}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto p-6 space-y-12">
          <section className="text-center space-y-4 py-12">
            <h1 className="text-4xl font-bold">{t('index.welcome')}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('index.welcomeDesc')}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button size="lg" onClick={() => navigate('/auth')}>
                {t('landing.loginOrSignup')}
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}>
                {t('landing.exploreFreelancers')}
              </Button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{t('landing.featuredFreelancers')}</h2>
              <Button variant="link" onClick={() => navigate('/freelancers')} className="px-0">
                {t('common.viewAll')}
              </Button>
            </div>

            {publicLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredFreelancers.map((freelancer) => (
                  <Card key={freelancer.id} className="h-full">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
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
                        <div>
                          <h3 className="font-semibold text-base">{freelancer.fullName}</h3>
                          {freelancer.location && (
                            <p className="text-sm text-muted-foreground">{freelancer.location}</p>
                          )}
                        </div>
                      </div>
                      {freelancer.hourlyRate && (
                        <Badge variant="secondary">{freelancer.hourlyRate} {t('common.ratePerHour')}</Badge>
                      )}
                      <Button variant="outline" size="sm" onClick={() => navigate(`/freelancer/${freelancer.id}`)}>
                        {t('landing.viewProfile')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {featuredFreelancers.length === 0 && !publicLoading && (
                  <div className="col-span-full text-center text-muted-foreground py-6">
                    {t('landing.noPublicFreelancers')}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{t('landing.currentProjects')}</h2>
              <Button variant="link" onClick={() => navigate('/jobs')} className="px-0">
                {t('profile.view_all_jobs', { count: featuredProjects.length })}

              </Button>
            </div>

            {publicLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {featuredProjects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>{project.title}</span>
                        {project.projectType && (
                          <Badge variant="outline">{project.projectType}</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {project.location && <span>📍 {project.location}</span>}
                        {project.budget && <span>💰 {project.budget}</span>}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/job/${project.id}`)}>
                        {t('jobs.viewDetails')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {featuredProjects.length === 0 && !publicLoading && (
                  <div className="col-span-full text-center text-muted-foreground py-6">
                    {t('landing.noPublicProjects')}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="text-center py-12">
          <h2 className="mb-4 text-4xl font-bold text-header-dark">{t('index.welcome')}</h2>
          <p className="text-xl text-muted-foreground mb-4">{t('index.subtitle')}</p>
          <p className="text-lg text-muted-foreground">
            {t('index.logged_in_as')}: {user.email}
          </p>
        </div>

        {userRole === 'admin' && (
          <div className="flex justify-center gap-4 py-6">
            <Button onClick={() => navigate('/client')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
              🏢 {t('index.go_to_client')}
            </Button>
            <Button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3">
              💼 {t('index.go_to_freelancer')}
            </Button>
            <Button onClick={() => navigate('/admin')} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3">
              ⚙️ {t('index.go_to_admin')}
            </Button>
          </div>
        )}

        <JobsSection />
      </main>
    </div>
  );
};

export default Index;
