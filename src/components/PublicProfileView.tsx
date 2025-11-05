import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Calendar, ExternalLink, X } from "lucide-react";
import { api } from "@/services/api";
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

interface PublicProfileViewProps {
  userId: string;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({ userId }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicProfile();
  }, [userId]);

  const fetchPublicProfile = async () => {
    try {
      // Use secure function to get public profile with access logging
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_public_profile_by_id', { _user_id: userId });

      // Convert array result to single profile object
      const profile = profileData && profileData.length > 0 ? profileData[0] : null;

      if (profileError) throw profileError;
      
      // Extend profile with missing properties for type compatibility
      const extendedProfile = profile ? {
        ...profile,
        software_skills: profile.skills || [],  // Map skills to software_skills if needed
        rating: 0, // Default rating since secure function doesn't return this
        rating_count: 0 // Default rating count since secure function doesn't return this
      } : null;
      
      setProfile(extendedProfile);

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

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
    } catch (error) {
      console.error('Error fetching public profile:', error);
    } finally {
      setLoading(false);
    }
  };

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
                    .map(n => n[0])
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
                    <div className="font-medium">
                      {profile.hourly_rate} DKK/time
                    </div>
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
                  <span>Medlem siden {new Date(profile.created_at).toLocaleDateString('da-DK', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}</span>
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
            <CardTitle>Software</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.software_skills.map((software) => (
                <Badge key={software} variant="secondary">
                  {software}
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
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => setSelectedImage(project.image_url)}
                    >
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
                      <p className="text-sm text-muted-foreground mb-2">
                        Klient: {project.client_name}
                      </p>
                    )}
                    
                    {(project.start_date || project.end_date || project.still_working_here) && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {project.start_date && new Date(project.start_date).toLocaleDateString('da-DK')}
                        {project.start_date && (project.end_date || project.still_working_here) && ' - '}
                        {project.still_working_here ? 'Nuværende' : (project.end_date && new Date(project.end_date).toLocaleDateString('da-DK'))}
                      </p>
                    )}
                    
                    {project.description && (
                      <p className="text-sm mb-3">{project.description}</p>
                    )}
                    
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