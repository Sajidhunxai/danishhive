import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  MapPin,
  Euro,
  Star,
  Globe,
  Calendar,
  Briefcase,
  MessageCircle
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InviteFreelancerDialog } from "@/components/InviteFreelancerDialog";

const FreelancerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [languageSkills, setLanguageSkills] = useState<any[]>([]);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (userId) fetchFreelancerData();
  }, [userId]);

  const fetchFreelancerData = async () => {
    try {
      if (!userId) return;
      const profileData = await api.profiles.getPublicProfile(userId);
      if (!profileData) {
        toast({
          title: t("freelancerProfile.error"),
          description: t("freelancerProfile.notFoundDesc"),
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const enrichedProfile = {
        id: profileData.id,
        user_id: profileData.userId,
        full_name: profileData.fullName,
        bio: profileData.bio || null,
        avatar_url: profileData.avatarUrl || null,
        location: profileData.location || null,
        hourly_rate: profileData.hourlyRate ? Number(profileData.hourlyRate) : null,
        skills: profileData.skills
          ? typeof profileData.skills === "string"
            ? JSON.parse(profileData.skills)
            : profileData.skills
          : null,
        availability: "available",
        rating: 0,
        rating_count: 0,
        created_at: profileData.createdAt,
      };

      setProfile(enrichedProfile);
      setProjects(profileData.projects || []);
      setLanguageSkills([]);
      setJobHistory([]);
    } catch (error) {
      console.error("Error fetching freelancer data:", error);
      toast({
        title: t("common.error"),
        description: t("freelancerProfile.fetchError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("loading.profile")}</p>
        </div>
      </div>
    );

  if (!profile)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("freelancerProfile.notFound")}</h1>
          <Button onClick={() => navigate("/")}>{t("freelancerProfile.backHome")}</Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-px h-8 bg-border"></div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("freelancerProfile.title")}
            </h1>
          </div>
          <BackButton />
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("freelancerProfile.profileInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold">
                    {profile.full_name || t("freelancerProfile.unnamed")}
                  </h2>
                  <Badge
                    variant={
                      profile.availability === "available" ? "default" : "secondary"
                    }
                  >
                    {profile.availability === "available"
                      ? t("freelancerProfile.available")
                      : t("freelancerProfile.unavailable")}
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
                    <span>
                      {profile.hourly_rate.toLocaleString("da-DK")} DKK /{" "}
                      {t("freelancerProfile.hour")}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>
                    {profile.rating.toFixed(1)} ({profile.rating_count}{" "}
                    {t("freelancerProfile.reviews")})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {t("freelancerProfile.memberSince")}{" "}
                    {new Date(profile.created_at).toLocaleDateString("da-DK")}
                  </span>
                </div>

                <div className="pt-4">
                  <InviteFreelancerDialog
                    freelancerId={profile.user_id}
                    freelancerName={profile.full_name}
                  >
                    <Button size="lg" className="w-full sm:w-auto">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {t("freelancerProfile.invite")}
                    </Button>
                  </InviteFreelancerDialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        {profile.bio && (
          <Card>
            <CardHeader>
              <CardTitle>{t("freelancerProfile.about")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("freelancerProfile.skills")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("freelancerProfile.portfolio")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project: any) => (
                  <Card key={project.id} className="relative">
                    {project.image_url && (
                      <div
                        className="relative cursor-pointer"
                        onClick={() => setSelectedImage(project.image_url)}
                      >
                        <img
                          src={project.image_url}
                          alt={project.title}
                          className="w-full h-48 object-cover rounded-t-lg hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-t-lg">
                          <span className="text-white text-sm font-medium">
                            {t("freelancerProfile.clickToEnlarge")}
                          </span>
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>{t("freelancerProfile.interested")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {t("freelancerProfile.contactDesc", {
                name: profile.full_name || t("freelancerProfile.thisFreelancer"),
              })}
            </p>
            <InviteFreelancerDialog
              freelancerId={profile.user_id}
              freelancerName={profile.full_name}
            >
              <Button size="lg">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t("freelancerProfile.invite")}
              </Button>
            </InviteFreelancerDialog>
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
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
                alt={t("freelancerProfile.enlargedImage")}
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
