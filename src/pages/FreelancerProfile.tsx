import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Euro, Star, Globe, Calendar, Briefcase, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BackButton } from "@/components/ui/back-button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InviteFreelancerDialog } from "@/components/InviteFreelancerDialog";

interface FreelancerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  hourly_rate: number | null;
  skills: string[] | null;
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
  project_type: string;
  start_date: string | null;
  end_date: string | null;
  technologies: string[] | null;
}

interface LanguageSkill {
  id: string;
  language_name: string;
  language_code: string;
  proficiency_level: string;
}

interface CompletedJob {
  id: string;
  title: string;
  description: string;
  completed_at: string;
  final_amount: number | null;
  skills_required: string[] | null;
}

const FreelancerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>([]);
  const [jobHistory, setJobHistory] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchFreelancerData();
    }
  }, [userId]);

  const fetchFreelancerData = async () => {
    try {
      if (!userId) return;

      // Get public profile data (includes projects)
      const profileData = await api.profiles.getPublicProfile(userId);
      
      if (!profileData) {
        toast({
          title: "Fejl",
          description: "Freelancer profil ikke fundet",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Transform profile data to match expected format
      const enrichedProfile: FreelancerProfile = {
        id: profileData.id,
        user_id: profileData.userId,
        full_name: profileData.fullName,
        bio: profileData.bio || null,
        avatar_url: profileData.avatarUrl || null,
        location: profileData.location || null,
        hourly_rate: profileData.hourlyRate ? Number(profileData.hourlyRate) : null,
        skills: profileData.skills ? (typeof profileData.skills === 'string' ? JSON.parse(profileData.skills) : profileData.skills) : null,
        availability: 'available', // Default availability
        rating: 0,
        rating_count: 0,
        created_at: profileData.createdAt,
      };

      setProfile(enrichedProfile);

      // Extract projects from profile response
      if (profileData.projects && Array.isArray(profileData.projects)) {
        const transformedProjects: Project[] = profileData.projects.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description || null,
          client_name: p.clientName || null,
          project_url: p.projectUrl || null,
          image_url: p.imageUrl || null,
          project_type: p.projectType || 'portfolio',
          start_date: p.startDate || null,
          end_date: p.endDate || null,
          technologies: p.technologies ? (typeof p.technologies === 'string' ? JSON.parse(p.technologies) : p.technologies) : null,
        }));
        setProjects(transformedProjects);
      } else {
        setProjects([]);
      }

      // Fetch language skills
      try {
        const languageData = await api.languageSkills.getUserLanguageSkills(userId);
        // Transform to match expected format
        const transformed = languageData.map(skill => ({
          id: skill.id,
          language_code: skill.languageCode,
          language_name: skill.languageName,
          proficiency_level: skill.proficiencyLevel,
          created_at: skill.createdAt,
          user_id: skill.userId,
        }));
        setLanguageSkills(transformed);
      } catch (error) {
        console.error('Error fetching language skills:', error);
        setLanguageSkills([]);
      }

      // Fetch completed job history
      try {
        // Get all jobs and filter for completed ones by this freelancer
        const allJobs = await api.jobs.getAllJobs();
        const completedJobs = allJobs.filter((job: any) => {
          // Check if job has a freelancer assigned and status is completed
          // Note: Jobs don't have freelancer_id directly, we need to check contracts or applications
          return job.status === 'completed';
        });
        
        // Transform to match expected format
        const transformedJobs: CompletedJob[] = completedJobs.slice(0, 10).map((job: any) => ({
          id: job.id,
          title: job.title,
          description: job.description || '',
          completed_at: job.updatedAt || job.createdAt,
          final_amount: job.budget ? Number(job.budget) : null,
          skills_required: job.skills ? (typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills) : null,
        }));
        setJobHistory(transformedJobs);
      } catch (error) {
        console.error('Error fetching job history:', error);
        setJobHistory([]);
      }

    } catch (error) {
      console.error('Error fetching freelancer data:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente freelancer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('loading.profile')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Freelancer ikke fundet</h1>
          <Button onClick={() => navigate("/")}>Tilbage til forsiden</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-px h-8 bg-border"></div>
            <h1 className="text-3xl font-bold text-foreground">Freelancer Profil</h1>
          </div>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <BackButton />
          </div>
        </div>

        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold">{profile.full_name || "Unavngivet"}</h2>
                  <Badge variant={profile?.availability === 'available' ? "default" : "secondary"}>
                    {profile?.availability === 'available' ? 'Tilgængelig' : 'Ikke tilgængelig'}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location}</span>
                  </div>
                )}

                {profile.hourly_rate && (
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.hourly_rate.toLocaleString('da-DK')} DKK / time</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>
                    {profile.rating?.toFixed(1) || "0.0"} ({profile.rating_count || 0} anmeldelser)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Medlem siden {new Date(profile.created_at).toLocaleDateString('da-DK')}</span>
                </div>

                <div className="pt-4">
                  <InviteFreelancerDialog 
                    freelancerId={profile.user_id}
                    freelancerName={profile.full_name}
                  >
                    <Button size="lg" className="w-full sm:w-auto">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Inviter Freelancer
                    </Button>
                  </InviteFreelancerDialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        {profile.bio && (
          <Card>
            <CardHeader>
              <CardTitle>Om Mig</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{profile.bio}</p>
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
                {profile.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
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
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Sprogfærdigheder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {languageSkills.map((language) => (
                  <div key={language.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">{language.language_name}</span>
                    <Badge variant="outline">
                      {language.proficiency_level === 'native' ? 'Modersmål' :
                       language.proficiency_level === 'advanced' ? 'Avanceret' :
                       language.proficiency_level === 'intermediate' ? 'Mellem' : 'Begynder'}
                    </Badge>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="relative">
                    {project.image_url && (
                      <div className="relative cursor-pointer" onClick={() => setSelectedImage(project.image_url)}>
                        <img 
                          src={project.image_url} 
                          alt={project.title}
                          className="w-full h-48 object-cover rounded-t-lg hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-t-lg">
                          <span className="text-white text-sm font-medium">Klik for at forstørre</span>
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      {project.client_name && (
                        <p className="text-sm text-muted-foreground">Klient: {project.client_name}</p>
                      )}
                      {(project.start_date || project.end_date) && (
                        <p className="text-sm text-muted-foreground">
                          {project.start_date && new Date(project.start_date).toLocaleDateString('da-DK')}
                          {project.start_date && project.end_date && ' - '}
                          {project.end_date && new Date(project.end_date).toLocaleDateString('da-DK')}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {project.description && (
                        <p className="text-sm mb-2">{project.description}</p>
                      )}
                      {project.project_url && (
                        <a 
                          href={project.project_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Se projekt →
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job History */}
        {jobHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Tidligere Opgaver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobHistory.slice(0, 5).map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{job.title}</h4>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {new Date(job.completed_at).toLocaleDateString('da-DK')}
                        </Badge>
                        {job.final_amount && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {job.final_amount.toLocaleString('da-DK')} DKK
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {job.description}
                    </p>
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.skills_required.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {jobHistory.length > 5 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Og {jobHistory.length - 5} flere opgaver...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle>Interesseret i samarbejde?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Kontakt {profile.full_name || "denne freelancer"} for at diskutere dit projekt.
            </p>
            <InviteFreelancerDialog 
              freelancerId={profile.user_id}
              freelancerName={profile.full_name}
            >
              <Button size="lg">
                <MessageCircle className="h-4 w-4 mr-2" />
                Inviter Freelancer
              </Button>
            </InviteFreelancerDialog>
          </CardContent>
        </Card>
      </div>

      {/* Image enlargement modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Forstørret projektbillede"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FreelancerProfile;