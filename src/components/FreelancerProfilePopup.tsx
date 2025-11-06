import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Shield, 
  CheckCircle, 
  XCircle,
  Calendar,
  DollarSign,
  Briefcase,
  Star
} from "lucide-react";

interface FreelancerProfile {
  user_id: string;
  full_name: string;
  username: string | null;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  skills: string[] | null;
  hourly_rate: number | null;
  availability: string;
  phone: string | null;
  phone_verified: boolean;
  mitid_verified: boolean;
  is_admin: boolean;
  rating: number;
  rating_count: number;
  total_earnings: number;
  active_status: boolean;
  created_at: string;
  updated_at: string;
}

interface FreelancerProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export function FreelancerProfilePopup({ isOpen, onClose, userId }: FreelancerProfilePopupProps) {
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Get public profile using backend API
      const profileData = await api.profiles.getPublicProfile(userId);
      
      // Convert backend data to FreelancerProfile format
      const freelancerProfile: FreelancerProfile = {
        user_id: profileData.userId || userId,
        full_name: profileData.fullName || '',
        username: profileData.username || null,
        role: profileData.role || 'freelancer',
        bio: profileData.bio || null,
        avatar_url: profileData.avatarUrl || null,
        location: profileData.location || null,
        skills: profileData.skills ? (typeof profileData.skills === 'string' ? JSON.parse(profileData.skills) : profileData.skills) : null,
        hourly_rate: profileData.hourlyRate ? Number(profileData.hourlyRate) : null,
        availability: 'available',
        phone: null, // Not exposed in public profile
        phone_verified: false,
        mitid_verified: false,
        is_admin: false,
        rating: 0,
        rating_count: 0,
        total_earnings: 0,
        active_status: true,
        created_at: profileData.createdAt || new Date().toISOString(),
        updated_at: profileData.updatedAt || profileData.createdAt || new Date().toISOString()
      };
      
      setProfile(freelancerProfile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke hente profil data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return <Badge variant="default" className="bg-green-500">Tilgængelig</Badge>;
      case 'busy':
        return <Badge variant="secondary">Optaget</Badge>;
      case 'unavailable':
        return <Badge variant="destructive">Ikke tilgængelig</Badge>;
      default:
        return <Badge variant="outline">Ukendt</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Freelancer Profil
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                  {profile.is_admin && (
                    <Badge variant="destructive">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                
                {profile.username && (
                  <p className="text-muted-foreground">@{profile.username}</p>
                )}
                
                <div className="flex items-center gap-4">
                  {getAvailabilityBadge(profile.availability)}
                  <Badge variant={profile.active_status ? "default" : "secondary"}>
                    {profile.active_status ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right space-y-1">
                {profile.rating_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{profile.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({profile.rating_count})</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Medlem siden {new Date(profile.created_at).toLocaleDateString('da-DK')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kontakt Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Kontakt Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone || "Ikke angivet"}</span>
                    {profile.phone_verified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location || "Ikke angivet"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>MitID Verificeret</span>
                    {profile.mitid_verified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Professionelle Oplysninger */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Professionelle Oplysninger
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Timeløn: {profile.hourly_rate ? formatCurrency(profile.hourly_rate) : "Ikke angivet"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Total indtjening: {formatCurrency(profile.total_earnings)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Rolle: {profile.role}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bio */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Om mig</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Færdigheder */}
            {profile.skills && profile.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Færdigheder</CardTitle>
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

            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                Luk
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Ingen profil data fundet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}