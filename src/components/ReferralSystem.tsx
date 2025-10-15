import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Gift, Share2, Mail, Copy, CheckCircle, Clock, Euro } from "lucide-react";

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  bonus_paid: boolean;
  referred_earnings: number;
  created_at: string;
  bonus_paid_at: string | null;
}

interface ReferralBonus {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

const ReferralSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [bonuses, setBonuses] = useState<ReferralBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [referring, setReferring] = useState(false);
  const [referralEmail, setReferralEmail] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchReferrals();
      fetchBonuses();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_limit, referrals_used')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBonuses = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_bonuses')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBonuses(data || []);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
    }
  };

  const sendReferral = async () => {
    if (!referralEmail.trim() || !user) return;

    // Check referral limit
    const currentReferrals = referrals.length;
    const referralLimit = userProfile?.referral_limit || 20;
    
    if (currentReferrals >= referralLimit) {
      toast({
        title: "Henvisningsgrænse nået",
        description: `Du har nået din grænse på ${referralLimit} henvisninger. Inviter flere venner for at øge din grænse!`,
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referralEmail)) {
      toast({
        title: "Ugyldig email",
        description: "Indtast venligst en gyldig email adresse",
        variant: "destructive",
      });
      return;
    }

    setReferring(true);
    try {
      const { error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: user.id,
          referred_email: referralEmail.trim().toLowerCase(),
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Email allerede henvist",
            description: "Du har allerede henvist denne email adresse",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      await fetchReferrals();
      await fetchUserProfile();
      setReferralEmail("");
      
      toast({
        title: "Henvisning sendt!",
        description: "Din ven kan nu tilmelde sig Danish Hive. Du får 500kr når de tjener deres første 2000kr!",
      });
    } catch (error) {
      console.error('Error sending referral:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende henvisning",
        variant: "destructive",
      });
    } finally {
      setReferring(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?referrer=${user?.id}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link kopieret!",
      description: "Henvisningslinket er kopieret til din udklipsholder",
    });
  };

  const getStatusBadge = (status: string, bonusPaid: boolean) => {
    if (bonusPaid) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Bonus udbetalt</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Afventer tilmelding</Badge>;
      case 'registered':
        return <Badge variant="outline"><UserPlus className="h-3 w-3 mr-1" />Tilmeldt</Badge>;
      case 'completed':
        return <Badge variant="default"><Gift className="h-3 w-3 mr-1" />Kvalificeret</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalBonusEarnings = bonuses
    .filter(bonus => bonus.status === 'pending' || bonus.status === 'completed')
    .reduce((sum, bonus) => sum + bonus.amount, 0);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Indlæser henvisninger...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Henvis en ven til Danish Hive
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tjen 500kr for hver ven du henviser, når de tjener deres første 2000kr på Danish Hive!
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">{referrals.length}</div>
            <div className="text-sm text-muted-foreground">Samlede henviser</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {(userProfile?.referral_limit || 20) - referrals.length}
            </div>
            <div className="text-sm text-muted-foreground">Tilbage</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">{referrals.filter(r => r.bonus_paid).length}</div>
            <div className="text-sm text-muted-foreground">Bonus udbetalt</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {totalBonusEarnings}
            </div>
            <div className="text-sm text-muted-foreground">Total bonus indtjening</div>
          </div>
        </div>

        {/* Send Referral */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="referral-email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Henvis via email
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="referral-email"
                type="email"
                placeholder="din.vens@email.dk"
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendReferral()}
              />
              <Button 
                onClick={sendReferral} 
                disabled={referring || !referralEmail.trim() || referrals.length >= (userProfile?.referral_limit || 20)}
                className="shrink-0"
              >
                {referring ? "Sender..." : "Send henvisning"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground">ELLER</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Del henvisningslink
            </Label>
            <Button 
              variant="outline" 
              onClick={copyReferralLink}
              className="w-full mt-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Kopier henvisningslink
            </Button>
          </div>
        </div>

        {/* Referrals List */}
        {referrals.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Dine henviser</h4>
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{referral.referred_email}</div>
                    <div className="text-sm text-muted-foreground">
                      Henvist {new Date(referral.created_at).toLocaleDateString('da-DK')}
                      {referral.referred_earnings > 0 && (
                        <span className="ml-2">• Tjent: {referral.referred_earnings.toLocaleString('da-DK')} DKK</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(referral.status, referral.bonus_paid)}
                    {referral.bonus_paid && (
                      <Badge variant="default" className="bg-green-500">
                        <Euro className="h-3 w-3 mr-1" />
                        500kr
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Sådan fungerer det:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Send en henvisning til din vens email eller del dit henvisningslink</li>
            <li>• Din ven tilmelder sig Danish Hive og begynder at arbejde</li>
            <li>• Når din ven har tjent deres første 2000kr, får du automatisk 500kr i bonus</li>
            <li>• Du får 5 ekstra henvisninger hver gang en ven kvalificerer sig!</li>
            <li>• Start med 20 henvisninger - få flere ved at hjælpe venner med at blive succesfulde</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralSystem;