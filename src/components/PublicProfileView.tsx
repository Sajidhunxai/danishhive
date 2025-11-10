import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Calendar, ExternalLink, X } from "lucide-react";
import { useApi } from "@/contexts/ApiContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  hourly_rate: number | null;
  skills: string[] | null;
  software_skills: string[] | null;
  availability: string | null;
  rating: number;
  rating_count: number;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  project_url: string | null;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  technologies: string[] | null;
  still_working_here: boolean;
}

interface LanguageSkill {
  id: string;
  language_name: string;
  language_code: string;
  proficiency_level: string;
}

type BackendProfile = {
  id: string;
  userId: string;
  fullName?: string | null;
  full_name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  hourlyRate?: number | string | null;
  hourly_rate?: number | string | null;
  skills?: string[] | string | null;
  softwareSkills?: string[] | null;
  availability?: string | null;
  rating?: number | string | null;
  ratingCount?: number | string | null;
  rating_count?: number | string | null;
  createdAt?: string | null;
  projects?: BackendProject[] | null;
};

type BackendProject = {
  id: string;
  title?: string | null;
  description?: string | null;
  clientName?: string | null;
  client_name?: string | null;
  projectUrl?: string | null;
  project_url?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  startDate?: string | null;
  start_date?: string | null;
  endDate?: string | null;
  end_date?: string | null;
  technologies?: string[] | string | null;
  stillWorkingHere?: boolean | null;
  still_working_here?: boolean | null;
};

type BackendLanguageSkill = {
  id: string;
  languageCode?: string | null;
  language_code?: string | null;
  languageName?: string | null;
  language_name?: string | null;
  proficiencyLevel?: string | null;
  proficiency_level?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  userId?: string | null;
  user_id?: string | null;
};

interface OpenProject {
  id: string;
  title: string;
  summary: string | null;
  budget: string | null;
  location: string | null;
  projectType: string | null;
}

interface PublicProfileViewProps {
  userId: string;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({ userId }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>([]);
  const [otherFreelancers, setOtherFreelancers] = useState<Profile[]>([]);
  const [openProjects, setOpenProjects] = useState<OpenProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const api = useApi();
  const navigate = useNavigate();

  const fetchRecommendations = useCallback(
    async (currentFreelancerId: string) => {
      try {
        const [freelancersResponse, jobsResponse] = await Promise.all([
          api.profiles.getAllFreelancers({ limit: 6 }).catch((error: unknown) => {
            console.warn('Unable to load related freelancers', error);
            return [];
          }),
          api.jobs.getAllJobs({ limit: 6, status: 'open' }).catch((error: unknown) => {
            console.warn('Unable to load open projects', error);
            return [];
          }),
        ]);

        const freelancers = (freelancersResponse || [])
          .filter((item: any) => item?.id && item.id !== currentFreelancerId)
          .map((item: any) => buildProfileFromBackend(item as BackendProfile));

        const projects = normalizeOpenProjects(jobsResponse || []);

        setOtherFreelancers(freelancers.slice(0, 4));
        setOpenProjects(projects.slice(0, 4));
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setOtherFreelancers([]);
        setOpenProjects([]);
      }
    },
    [api]
  );

  const fetchPublicProfile = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.profiles.getPublicProfile(userId);
      const profileData = (response?.profile || response) as BackendProfile | null | undefined;

      if (!profileData) {
        setProfile(null);
        setProjects([]);
        setLanguageSkills([]);
        setOtherFreelancers([]);
        setOpenProjects([]);
        return;
      }

      const freelancerProfile = buildProfileFromBackend(profileData);
      setProfile(freelancerProfile);
      setProjects(normalizePortfolioProjects(profileData.projects));

      try {
        const languageData = await api.languageSkills.getUserLanguageSkills(userId);
        setLanguageSkills(normalizeLanguageSkills(languageData));
      } catch (error) {
        console.error('Error fetching language skills:', error);
        setLanguageSkills([]);
      }

      fetchRecommendations(profileData.id);
    } catch (error) {
      console.error('Error fetching public profile:', error);
      setProfile(null);
      setProjects([]);
      setLanguageSkills([]);
      setOtherFreelancers([]);
      setOpenProjects([]);
    } finally {
      setLoading(false);
    }
  }, [api, fetchRecommendations, userId]);

  useEffect(() => {
    fetchPublicProfile();
  }, [fetchPublicProfile]);

  const getAvailabilityColor = (availability: string | null) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityText = (availability: string | null) => {
    switch (availability) {
      case 'available':
        return 'Ledig';
      case 'busy':
        return 'Optaget';
      case 'unavailable':
        return 'Ikke tilgængelig';
      default:
        return 'Ukendt';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Profil ikke fundet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>
                  {profile.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'FL'}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name || 'Freelancer'}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <Badge variant="secondary" className={getAvailabilityColor(profile.availability)}>
                    {getAvailabilityText(profile.availability)}
                  </Badge>
                  {profile.location && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.hourly_rate && (
                    <div className="font-medium">{profile.hourly_rate} DKK/time</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {profile.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{profile.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({profile.rating_count} bedømmelser)</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Medlem siden {new Date(profile.created_at).toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      {profile.bio && (
        <Card>
          <CardHeader>
            <CardTitle>Om mig</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills Section */}
      {profile.skills && profile.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kompetencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Software Skills */}
      {profile.software_skills && profile.software_skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Software og værktøjer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.software_skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language Skills */}
      {languageSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sprog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {languageSkills.map((skill) => (
                <div key={skill.id} className="flex justify-between items-center p-3 border rounded">
                  <span className="font-medium">{skill.language_name}</span>
                  <Badge variant="outline">{skill.proficiency_level}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Portfolio */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg overflow-hidden">
                  {project.image_url && (
                    <div className="relative cursor-pointer group" onClick={() => setSelectedImage(project.image_url)}>
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-48 object-cover group-hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <span className="text-white text-sm font-medium">Klik for at forstørre</span>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-lg">{project.title}</h4>
                      {project.project_url && (
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    {project.client_name && (
                      <p className="text-sm text-muted-foreground mb-2">Klient: {project.client_name}</p>
                    )}

                    {(project.start_date || project.end_date || project.still_working_here) && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {project.start_date && new Date(project.start_date).toLocaleDateString('da-DK')}
                        {project.start_date && (project.end_date || project.still_working_here) && ' - '}
                        {project.still_working_here
                          ? 'Nuværende'
                          : project.end_date && new Date(project.end_date).toLocaleDateString('da-DK')}
                      </p>
                    )}

                    {project.description && <p className="text-sm mb-3">{project.description}</p>}

                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Freelancers */}
      {otherFreelancers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Se også disse freelancere</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {otherFreelancers.map((freelancer) => (
                <div key={freelancer.id} className="flex flex-col items-center text-center gap-3 p-4 border rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={freelancer.avatar_url || undefined} />
                    <AvatarFallback>
                      {freelancer.full_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'FL'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{freelancer.full_name || 'Freelancer'}</h4>
                    {freelancer.location && (
                      <p className="text-sm text-muted-foreground">{freelancer.location}</p>
                    )}
                  </div>
                  {freelancer.hourly_rate && (
                    <Badge variant="secondary">{freelancer.hourly_rate} DKK/time</Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={() => navigate(`/freelancer/${freelancer.id}`)}>
                    Vis profil
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Projects */}
      {openProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle projekter fra virksomheder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {openProjects.map((project) => (
                <div key={project.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{project.title}</h4>
                    {project.projectType && <Badge variant="outline">{project.projectType}</Badge>}
                  </div>
                  {project.summary && <p className="text-sm text-muted-foreground line-clamp-3">{project.summary}</p>}
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {project.location && <span>📍 {project.location}</span>}
                    {project.budget && <span>💰 {project.budget}</span>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                    Ansøg / log ind
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedImage && (
              <img src={selectedImage} alt="Forstørret projektbillede" className="w-full h-auto max-h-[80vh] object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function buildProfileFromBackend(profileData: BackendProfile): Profile {
  return {
    id: profileData.id,
    user_id: profileData.userId,
    full_name: profileData.fullName ?? profileData.full_name ?? null,
    bio: profileData.bio ?? null,
    avatar_url: profileData.avatarUrl ?? profileData.avatar_url ?? null,
    location: profileData.location ?? null,
    skills: normalizeSkills(profileData.skills),
    software_skills: normalizeSoftwareSkills(profileData),
    hourly_rate: normalizeNumericField(profileData.hourlyRate ?? profileData.hourly_rate),
    availability: profileData.availability ?? null,
    rating: Number(profileData.rating ?? 0),
    rating_count: Number(profileData.ratingCount ?? profileData.rating_count ?? 0),
    created_at: profileData.createdAt ?? new Date().toISOString(),
  };
}

function normalizeNumericField(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numericValue) ? Number(numericValue) : null;
}

function normalizeSkills(value: string[] | string | null | undefined): string[] | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((skill) => String(skill)).filter((skill) => skill.trim().length > 0);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((skill) => String(skill)).filter((skill) => skill.trim().length > 0);
      }
    } catch {
      // ignored – fall back to comma separation
    }

    return value
      .split(',')
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);
  }

  return null;
}

function normalizeSoftwareSkills(profile: BackendProfile): string[] | null {
  const raw =
    (profile as Record<string, unknown>).softwareSkills ??
    (profile as Record<string, unknown>).software_skills ??
    null;

  if (!raw) {
    return null;
  }

  if (Array.isArray(raw)) {
    return raw.map((skill) => String(skill)).filter((skill) => skill.trim().length > 0);
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((skill) => String(skill)).filter((skill) => skill.trim().length > 0);
      }
    } catch {
      // swallow parse error
    }

    return raw
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);
  }

  return null;
}

function normalizePortfolioProjects(projects: BackendProject[] | null | undefined): Project[] {
  if (!projects) {
    return [];
  }

  return projects.map((project) => ({
    id: String(project.id),
    title: project.title ?? project.clientName ?? 'Projekt',
    description: project.description ?? null,
    client_name: project.clientName ?? project.client_name ?? null,
    project_url: project.projectUrl ?? project.project_url ?? null,
    image_url: project.imageUrl ?? project.image_url ?? null,
    start_date: project.startDate ?? project.start_date ?? null,
    end_date: project.endDate ?? project.end_date ?? null,
    technologies: normalizeSkills(project.technologies) ?? null,
    still_working_here: Boolean(project.stillWorkingHere ?? project.still_working_here ?? false),
  }));
}

function normalizeLanguageSkills(skills: unknown): LanguageSkill[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  return (skills as BackendLanguageSkill[]).map((skill) => ({
    id: String(skill.id),
    language_code: (skill.languageCode ?? skill.language_code ?? 'unknown').toString(),
    language_name: (skill.languageName ?? skill.language_name ?? 'Ukendt').toString(),
    proficiency_level: (skill.proficiencyLevel ?? skill.proficiency_level ?? 'unknown').toString(),
  }));
}

function normalizeOpenProjects(jobs: unknown): OpenProject[] {
  if (!Array.isArray(jobs)) {
    return [];
  }

  return (jobs as any[]).map((job, index) => {
    const min = job?.budgetMin ?? job?.budget_min;
    const max = job?.budgetMax ?? job?.budget_max;
    let budgetLabel: string | null = null;

    if (min && max) {
      budgetLabel = `${Number(min).toLocaleString('da-DK')} - ${Number(max).toLocaleString('da-DK')} DKK`;
    } else if (min) {
      budgetLabel = `${Number(min).toLocaleString('da-DK')} DKK`;
    } else if (max) {
      budgetLabel = `${Number(max).toLocaleString('da-DK')} DKK`;
    }

    return {
      id: job?.id ? String(job.id) : `job-${index}`,
      title: job?.title || 'Projekt',
      summary: job?.description || null,
      budget: budgetLabel,
      location: job?.location || job?.city || null,
      projectType: job?.projectType || job?.project_type || null,
    } as OpenProject;
  });
}