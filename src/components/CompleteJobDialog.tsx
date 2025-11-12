import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import { useApi } from "@/contexts/ApiContext";
import { useLanguage } from "@/contexts/LanguageContext"; 
interface CompleteJobDialogProps {
  job: {
    id: string;
    title: string;
    budget_min: number | null;
    budget_max: number | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const CompleteJobDialog = ({ job, isOpen, onClose, onComplete }: CompleteJobDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = useApi();
  const [saving, setSaving] = useState(false);
  const [finalAmount, setFinalAmount] = useState(
    job.budget_max?.toString() || job.budget_min?.toString() || ""
  );
  const [completionNotes, setCompletionNotes] = useState("");
  const { t } = useLanguage(); 
  const handleComplete = async () => {
    if (!user || !finalAmount) {
      toast({
        title: "Fejl",
        description: "Udfyld venligst det endelige beløb",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await api.jobs.updateJob(job.id, {
        status: 'completed',
        freelancerId: user.id,
        finalAmount: parseFloat(finalAmount),
        completedAt: new Date().toISOString()
      });

      toast({
        title: "Succes",
        description: "Opgave markeret som fuldført. Indtægt vil blive tilføjet automatisk.",
      });

      onComplete();
      onClose();
    } catch (error: any) {
      console.error('Error completing job:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke markere opgave som fuldført",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {t("completeJob.title")} {/* "Mark as Completed" */}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="font-medium text-sm">{t("completeJob.task")}:</p> {/* "Job" */}
            <p className="text-sm text-muted-foreground">{job.title}</p>
            {(job.budget_min || job.budget_max) && (
              <p className="text-sm text-muted-foreground mt-1">
                {t("completeJob.budget")}:{" "}
                {job.budget_min && `${job.budget_min} DKK`}
                {job.budget_min && job.budget_max && " - "}
                {job.budget_max && `${job.budget_max} DKK`}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="final_amount">{t("completeJob.freelancerAmount")}</Label>
            <Input
              id="final_amount"
              type="number"
              step="0.01"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              <p>{t("completeJob.amountHint")}</p>
              {finalAmount && parseFloat(finalAmount) > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-2 rounded text-blue-700">
                  <p>
                    <strong>{t("completeJob.platformFee", { fee: (parseFloat(finalAmount) * 0.15).toFixed(2) })}</strong>
                  </p>
                  <p>
                    <strong>{t("completeJob.totalClient", { total: (parseFloat(finalAmount) * 1.15).toFixed(2) })}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{t("completeJob.notes")}</Label>
            <Textarea
              id="notes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder={t("completeJob.notesPlaceholder")}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              💰 <strong>{t("completeJob.paymentStructure")}</strong>
            </p>
            <ul className="text-sm text-green-700 mt-1 space-y-1 ml-4">
              <li>{t("completeJob.paymentList.freelancer")}</li>
              <li>{t("completeJob.paymentList.fee")}</li>
              <li>{t("completeJob.paymentList.record")}</li>
              <li>{t("completeJob.paymentList.payout")}</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleComplete}
              disabled={saving || !finalAmount}
              className="flex-1"
            >
              {saving ? t("completeJob.saving") : t("completeJob.save")}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t("completeJob.cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};