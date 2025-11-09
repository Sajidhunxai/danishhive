import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/contexts/ApiContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Gift, Share2, Mail, Copy, CheckCircle, Clock, Euro } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

interface UserProfile {
  referral_limit: number;
  referrals_used: number;
}

const ReferralSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = useApi();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [bonuses, setBonuses] = useState<ReferralBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [referring, setReferring] = useState(false);
  const [referralEmail, setReferralEmail] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { t } = useLanguage();
  useEffect(() => {
    if (user) {
      fetchReferrals();
      fetchBonuses();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const summary = await api.referrals.getSummary();
      setUserProfile({ referral_limit: summary.referralLimit, referrals_used: summary.referralsUsed });
    } catch (error) {
      console.error('Error fetching referral summary:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const data = await api.referrals.getMyReferrals();
      const normalized = data.map(r => ({
        id: r.id,
        referred_email: r.referredEmail,
        status: r.status,
        bonus_paid: r.bonusPaid || false,
        referred_earnings: r.referredEarnings || 0,
        created_at: r.createdAt,
        bonus_paid_at: r.bonusPaidAt || null,
      }));
      setReferrals(normalized);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBonuses = async () => {
    try {
      const data = await api.referrals.getMyBonuses();
      const normalized = data.map(b => ({
        id: b.id,
        amount: b.amount,
        status: b.status,
        created_at: b.createdAt,
      }));
      setBonuses(normalized);
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
      await api.referrals.createReferral(referralEmail);

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
        <p className="mt-2 text-sm text-muted-foreground">{t('loading.referrals')}</p>
      </div>
    );
  }

  return (
    <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Share2 className="h-5 w-5" />
        {t("referral.title")}
      </CardTitle>
      <p className="text-sm text-muted-foreground">
        {t("referral.description")}
      </p>
    </CardHeader>
    <CardContent className="space-y-6">
  
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-green-600">{referrals.length}</div>
          <div className="text-sm text-muted-foreground">{t("referral.totalReferrals")}</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {(userProfile?.referral_limit || 20) - referrals.length}
          </div>
          <div className="text-sm text-muted-foreground">{t("referral.remaining")}</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-green-600">{referrals.filter(r => r.bonus_paid).length}</div>
          <div className="text-sm text-muted-foreground">{t("referral.bonusPaid")}</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {totalBonusEarnings}
          </div>
          <div className="text-sm text-muted-foreground">{t("referral.totalEarnings")}</div>
        </div>
      </div>
  
      {/* Email Referral */}
      <div>
        <Label htmlFor="referral-email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {t("referral.referByEmail")}
        </Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="referral-email"
            type="email"
            placeholder={t("referral.emailPlaceholder")}
            value={referralEmail}
            onChange={(e) => setReferralEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendReferral()}
          />
          <Button 
            onClick={sendReferral}
            disabled={referring || !referralEmail.trim()}
          >
            {referring ? t("referral.sending") : t("referral.sendReferral")}
          </Button>
        </div>
      </div>
  
      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-xs text-muted-foreground">{t("referral.or")}</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>
  
      {/* Link Referral */}
      <div>
        <Label className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          {t("referral.shareLink")}
        </Label>
        <Button variant="outline" onClick={copyReferralLink} className="w-full mt-1">
          <Copy className="h-4 w-4 mr-2" />
          {t("referral.copyLink")}
        </Button>
      </div>
  
      {/* How it Works */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          {t("referral.howItWorks")}
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• {t("referral.step1")}</li>
          <li>• {t("referral.step2")}</li>
          <li>• {t("referral.step3")}</li>
          <li>• {t("referral.step4")}</li>
          <li>• {t("referral.step5")}</li>
        </ul>
      </div>
    </CardContent>
  </Card>
  
  );
};

export default ReferralSystem;