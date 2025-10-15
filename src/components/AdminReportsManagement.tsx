import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  User,
  MessageSquare,
  ChevronLeft
} from "lucide-react";

interface ProfileReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  report_reason: string;
  report_category: string;
  description: string | null;
  conversation_data: any;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  reporter_profile?: {
    full_name: string | null;
  } | null;
  reported_profile?: {
    full_name: string | null;
  } | null;
}

interface AdminReportsManagementProps {
  onBack: () => void;
}

export const AdminReportsManagement: React.FC<AdminReportsManagementProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<ProfileReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ProfileReport | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // First get the reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('profile_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Then get profile information for each user
      const reports = reportsData || [];
      const allUserIds = [...new Set([
        ...reports.map(r => r.reporter_id),
        ...reports.map(r => r.reported_user_id)
      ])];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', allUserIds);

      if (profilesError) throw profilesError;

      // Map profiles to reports
      const reportsWithProfiles = reports.map(report => ({
        ...report,
        reporter_profile: profilesData?.find(p => p.user_id === report.reporter_id) || null,
        reported_profile: profilesData?.find(p => p.user_id === report.reported_user_id) || null
      }));
      
      setReports(reportsWithProfiles);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente rapporter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = (report: ProfileReport, action: 'approved' | 'rejected') => {
    setSelectedReport(report);
    setAdminNotes("");
    setReviewDialog(true);
  };

  const submitReview = async (action: 'approved' | 'rejected') => {
    if (!selectedReport || !user) return;

    setActionLoading(`review_${selectedReport.id}`);
    try {
      const { error } = await supabase
        .from('profile_reports')
        .update({
          status: action,
          admin_notes: adminNotes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      toast({
        title: "Succes",
        description: `Rapport ${action === 'approved' ? 'godkendt' : 'afvist'}`,
      });

      setReviewDialog(false);
      setSelectedReport(null);
      await fetchReports();
    } catch (error: any) {
      console.error('Error reviewing report:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke gennemgå rapport",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getCategoryText = (category: string) => {
    const categories: Record<string, string> = {
      inappropriate_behavior: "Upassende opførsel",
      fake_profile: "Falsk profil",
      scam_fraud: "Svindel/Bedrageri",
      harassment: "Chikane",
      spam: "Spam",
      violence_threats: "Vold eller trusler",
      inappropriate_content: "Upassende indhold",
      other: "Andet"
    };
    return categories[category] || category;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const totalReports = reports.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Tilbage
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Rapport Administration
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {totalReports} rapporter total • {pendingReports} afventer behandling
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Rapporter</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ingen rapporter fundet
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="space-y-4">
                    {/* Report Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(report.status)}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1 capitalize">{report.status}</span>
                          </Badge>
                          <Badge variant="outline">
                            {getCategoryText(report.report_category)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Rapporteret bruger:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span>{report.reported_profile?.full_name || 'Unavngivet'}</span>
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Rapporteret af:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span>{report.reporter_profile?.full_name || 'Unavngivet'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="font-medium text-sm">Begrundelse:</span>
                          <p className="text-sm text-muted-foreground mt-1">{report.report_reason}</p>
                        </div>

                        {report.description && (
                          <div>
                            <span className="font-medium text-sm">Yderligere detaljer:</span>
                            <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                          </div>
                        )}

                        {report.conversation_data && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>Samtaledata tilgængelig</span>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Rapporteret: {new Date(report.created_at).toLocaleString('da-DK')}
                        </div>

                        {report.admin_notes && (
                          <div className="p-3 bg-muted rounded-lg">
                            <span className="font-medium text-sm">Admin noter:</span>
                            <p className="text-sm mt-1">{report.admin_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {report.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleReviewReport(report, 'approved')}
                            disabled={actionLoading === `review_${report.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Godkend
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewReport(report, 'rejected')}
                            disabled={actionLoading === `review_${report.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Afvis
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gennemgå Rapport</DialogTitle>
            <DialogDescription>
              Tilføj eventuelle noter til din beslutning om denne rapport.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Noter (valgfrit)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tilføj noter om din beslutning..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReviewDialog(false)}
              disabled={actionLoading !== null}
            >
              Annuller
            </Button>
            <Button 
              variant="destructive"
              onClick={() => submitReview('rejected')}
              disabled={actionLoading !== null}
            >
              Afvis Rapport
            </Button>
            <Button 
              onClick={() => submitReview('approved')}
              disabled={actionLoading !== null}
            >
              {actionLoading ? "Behandler..." : "Godkend Rapport"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};