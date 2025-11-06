import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { api } from "@/services/api";
import { User, Mail, Phone, MapPin, Building, Calendar, Shield, CreditCard } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string | null;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  company: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone_verified: boolean;
  payment_verified: boolean;
  mitid_verified: boolean;
}

interface AdminUserProfilePopupProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUserProfilePopup: React.FC<AdminUserProfilePopupProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserProfile();
    }
  }, [userId, isOpen]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const usersData = await api.admin.getUsersWithEmail();
      const user = usersData.find((u: any) => u.id === userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Map backend data to expected format
      const mappedProfile: UserProfile = {
        id: user.profile?.id || '',
        user_id: user.id,
        full_name: user.profile?.fullName || user.fullName || '',
        username: user.profile?.username || null,
        role: user.userType?.toLowerCase() || '',
        bio: user.profile?.bio || null,
        avatar_url: user.profile?.avatarUrl || user.avatarUrl || null,
        location: user.profile?.location || null,
        phone: user.phoneNumber || null,
        created_at: user.createdAt,
        updated_at: user.updatedAt || user.createdAt,
        is_admin: user.isAdmin || false,
        company: user.profile?.companyName || null,
        address: user.profile?.address || null,
        city: user.profile?.city || null,
        postal_code: user.profile?.postalCode || null,
        phone_verified: user.phoneVerified || false,
        payment_verified: user.profile?.paymentVerified || false,
        mitid_verified: user.profile?.mitidVerified || false,
      };

      setProfile(mappedProfile);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'client': return 'Klient';
      case 'freelancer': return 'Freelancer';
      default: return role;
    }
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Brugerprofil
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(profile.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{profile.full_name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                        {getRoleText(profile.role)}
                      </Badge>
                      {profile.is_admin && (
                        <Badge variant="destructive">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.username && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Brugernavn: {profile.username}</span>
                  </div>
                )}
                
                {profile.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Beskrivelse:</p>
                    <p className="text-sm">{profile.bio}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Oprettet: {formatDate(profile.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Opdateret: {formatDate(profile.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kontaktoplysninger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.phone}</span>
                    </div>
                    <Badge variant={profile.phone_verified ? "default" : "secondary"}>
                      {profile.phone_verified ? "Verificeret" : "Ikke verificeret"}
                    </Badge>
                  </div>
                )}

                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}

                {(profile.address || profile.city || profile.postal_code) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {[profile.address, profile.postal_code, profile.city]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}

                {profile.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.company}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verificeringsstatus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Telefon</span>
                    <Badge variant={profile.phone_verified ? "default" : "secondary"}>
                      {profile.phone_verified ? "Verificeret" : "Ikke verificeret"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Betaling</span>
                    <Badge variant={profile.payment_verified ? "default" : "secondary"}>
                      {profile.payment_verified ? "Verificeret" : "Ikke verificeret"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">MitID</span>
                    <Badge variant={profile.mitid_verified ? "default" : "secondary"}>
                      {profile.mitid_verified ? "Verificeret" : "Ikke verificeret"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Kunne ikke indlæse brugerprofil</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};