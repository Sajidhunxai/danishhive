import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, User, Star, MessageCircle, Eye } from "lucide-react";

interface FreelancerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  skills: string[] | null;
  hourly_rate: number | null;
  availability: string | null;
  created_at: string;
}

const FreelancerSearch = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    fetchFreelancers();
  }, []);

  useEffect(() => {
    filterFreelancers();
  }, [freelancers, searchQuery, skillFilter, locationFilter]);

  const fetchFreelancers = async () => {
    try {
      const profilesData = await api.profiles.getAllFreelancers();

      const sortedProfiles = profilesData
        ? profilesData
            .map((profile: any) => ({
              id: profile.userId || profile.id,
              user_id: profile.userId || profile.id,
              full_name: profile.fullName,
              username: profile.username || null,
              role: profile.user?.userType || null,
              bio: profile.bio,
              avatar_url: profile.avatarUrl,
              location: profile.location,
              skills: profile.skills
                ? typeof profile.skills === "string"
                  ? JSON.parse(profile.skills)
                  : profile.skills
                : null,
              hourly_rate: profile.hourlyRate ? Number(profile.hourlyRate) : null,
              availability: "available",
              created_at: profile.createdAt || new Date().toISOString(),
            }))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [];

      setFreelancers(sortedProfiles);
      setFilteredFreelancers(sortedProfiles);
    } catch (error) {
      console.error("Error fetching freelancers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterFreelancers = () => {
    let filtered = freelancers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.full_name?.toLowerCase().includes(query) ||
          f.username?.toLowerCase().includes(query) ||
          f.bio?.toLowerCase().includes(query) ||
          f.skills?.some((skill) => skill.toLowerCase().includes(query))
      );
    }

    if (skillFilter.trim()) {
      const skill = skillFilter.toLowerCase();
      filtered = filtered.filter((f) =>
        f.skills?.some((s) => s.toLowerCase().includes(skill))
      );
    }

    if (locationFilter.trim()) {
      const location = locationFilter.toLowerCase();
      filtered = filtered.filter((f) => f.location?.toLowerCase().includes(location));
    }

    setFilteredFreelancers(filtered);
  };

  const getInitials = (name: string | null, username: string | null) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    if (username) return username.slice(0, 2).toUpperCase();
    return "FL";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t("loading.freelancers")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6" />
        <h2 className="text-2xl font-bold text-foreground">{t("freelancerSearch.title")}</h2>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("freelancerSearch.searchFilter")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("freelancerSearch.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="text"
              placeholder={t("freelancerSearch.filterSkill")}
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            />
            <Input
              type="text"
              placeholder={t("freelancerSearch.filterLocation")}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Freelancers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFreelancers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            {searchQuery || skillFilter || locationFilter ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t("freelancerSearch.noResults")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("freelancerSearch.adjustCriteria")}
                </p>
              </>
            ) : (
              <>
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("freelancerSearch.noFreelancersYet")}</p>
              </>
            )}
          </div>
        ) : (
          filteredFreelancers.map((freelancer) => (
            <Card key={freelancer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={freelancer.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(freelancer.full_name, freelancer.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {freelancer.full_name || freelancer.username || t("freelancerSearch.unnamed")}
                    </CardTitle>
                    {freelancer.username && freelancer.full_name && (
                      <p className="text-sm text-muted-foreground">@{freelancer.username}</p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {freelancer.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{freelancer.bio}</p>
                )}

                {freelancer.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{freelancer.location}</span>
                  </div>
                )}

                {freelancer.hourly_rate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4" />
                    <span>
                      {freelancer.hourly_rate} {t("freelancerSearch.hourlyRate")}
                    </span>
                  </div>
                )}

                {freelancer.availability && (
                  <div className="text-sm">
                    <Badge
                      variant={
                        freelancer.availability === "available" ? "default" : "secondary"
                      }
                    >
                      {freelancer.availability === "available"
                        ? t("freelancerSearch.available")
                        : freelancer.availability === "busy"
                        ? t("freelancerSearch.busy")
                        : t("freelancerSearch.unavailable")}
                    </Badge>
                  </div>
                )}

                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t("freelancerSearch.skills")}:</p>
                    <div className="flex flex-wrap gap-1">
                      {freelancer.skills.slice(0, 4).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {freelancer.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{freelancer.skills.length - 4} {t("freelancerSearch.more")}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => navigate(`/freelancer/${freelancer.user_id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t("freelancerSearch.viewProfile")}
                  </Button>
                  <Button
                    className="w-full"
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/freelancer/${freelancer.user_id}`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("freelancerSearch.contactFreelancer")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FreelancerSearch;
