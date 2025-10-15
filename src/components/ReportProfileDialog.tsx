import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Flag } from "lucide-react";

interface ReportProfileDialogProps {
  reportedUserId: string;
  reportedUserName?: string;
  conversationData?: any;
  trigger?: React.ReactNode;
}

export const ReportProfileDialog: React.FC<ReportProfileDialogProps> = ({
  reportedUserId,
  reportedUserName,
  conversationData,
  trigger
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>("");
  const [reportReason, setReportReason] = useState("");
  const [description, setDescription] = useState("");

  const reportCategories = [
    { value: "inappropriate_behavior", label: "Upassende opførsel" },
    { value: "fake_profile", label: "Falsk profil" },
    { value: "scam_fraud", label: "Svindel/Bedrageri" },
    { value: "harassment", label: "Chikane" },
    { value: "spam", label: "Spam" },
    { value: "violence_threats", label: "Vold eller trusler" },
    { value: "inappropriate_content", label: "Upassende indhold" },
    { value: "other", label: "Andet" }
  ];

  const handleSubmitReport = async () => {
    if (!user) {
      toast({
        title: "Fejl",
        description: "Du skal være logget ind for at rapportere",
        variant: "destructive",
      });
      return;
    }

    if (!reportCategory || !reportReason.trim()) {
      toast({
        title: "Fejl",
        description: "Udfyld alle påkrævede felter",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profile_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          report_category: reportCategory,
          report_reason: reportReason,
          description: description || null,
          conversation_data: conversationData || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Rapport sendt",
        description: "Din rapport er blevet sendt til gennemgang",
      });

      // Reset form and close dialog
      setReportCategory("");
      setReportReason("");
      setDescription("");
      setOpen(false);

    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende rapport",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Rapporter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Rapporter Profil
          </DialogTitle>
          <DialogDescription>
            Rapporter {reportedUserName ? `"${reportedUserName}"` : "denne bruger"} for upassende adfærd eller regelovertrædelse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Rapport Kategori *</Label>
            <Select value={reportCategory} onValueChange={setReportCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg en kategori" />
              </SelectTrigger>
              <SelectContent>
                {reportCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Begrundelse *</Label>
            <Textarea
              id="reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Beskriv kort hvorfor du rapporterer denne profil..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Yderligere detaljer (valgfrit)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tilføj yderligere information eller kontekst..."
              rows={3}
            />
          </div>

          {conversationData && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">
                📋 Samtaledata vil blive inkluderet i rapporten
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuller
          </Button>
          <Button 
            onClick={handleSubmitReport}
            disabled={loading || !reportCategory || !reportReason.trim()}
          >
            {loading ? "Sender..." : "Send Rapport"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};