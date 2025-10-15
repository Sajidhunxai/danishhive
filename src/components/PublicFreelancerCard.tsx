import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReportProfileDialog } from "@/components/ReportProfileDialog";
import { InviteFreelancerDialog } from "@/components/InviteFreelancerDialog";
import { 
  MapPin, 
  Star, 
  Clock, 
  User,
  MessageSquare
} from "lucide-react";

interface PublicFreelancerCardProps {
  freelancer: {
    user_id: string;
    full_name: string | null;
    bio: string | null;
    location: string | null;
    skills: string[] | null;
    hourly_rate: number | null;
    rating: number | null;
    rating_count: number | null;
    avatar_url: string | null;
    availability: string | null;
  };
  conversationData?: any;
}

export const PublicFreelancerCard: React.FC<PublicFreelancerCardProps> = ({
  freelancer,
  conversationData
}) => {
  const getAvailabilityColor = (availability: string | null) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityText = (availability: string | null) => {
    switch (availability) {
      case 'available': return 'Tilgængelig';
      case 'busy': return 'Optaget';
      case 'unavailable': return 'Ikke tilgængelig';
      default: return 'Ukendt';
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={freelancer.avatar_url || undefined} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <div>
                <h3 className="text-xl font-semibold">
                  {freelancer.full_name || 'Unavngivet freelancer'}
                </h3>
                {freelancer.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{freelancer.location}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={getAvailabilityColor(freelancer.availability)}>
                  <Clock className="h-3 w-3 mr-1" />
                  {getAvailabilityText(freelancer.availability)}
                </Badge>
                
                {freelancer.rating && freelancer.rating_count && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{freelancer.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({freelancer.rating_count})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <InviteFreelancerDialog 
              freelancerId={freelancer.user_id}
              freelancerName={freelancer.full_name}
            >
              <Button size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Inviter Freelancer
              </Button>
            </InviteFreelancerDialog>
            <ReportProfileDialog
              reportedUserId={freelancer.user_id}
              reportedUserName={freelancer.full_name || undefined}
              conversationData={conversationData}
            />
          </div>
        </div>

        {/* Bio */}
        {freelancer.bio && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {freelancer.bio}
            </p>
          </div>
        )}

        {/* Skills */}
        {freelancer.skills && freelancer.skills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Færdigheder</h4>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills.slice(0, 6).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {freelancer.skills.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{freelancer.skills.length - 6} mere
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Rate */}
        {freelancer.hourly_rate && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Timepris</span>
              <span className="text-lg font-semibold">
                {freelancer.hourly_rate} DKK/time
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};