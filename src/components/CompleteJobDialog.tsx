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
            Markér som Fuldført
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="font-medium text-sm">Opgave:</p>
            <p className="text-sm text-muted-foreground">{job.title}</p>
            {(job.budget_min || job.budget_max) && (
              <p className="text-sm text-muted-foreground mt-1">
                Budget: {job.budget_min && `${job.budget_min} DKK`}
                {job.budget_min && job.budget_max && " - "}
                {job.budget_max && `${job.budget_max} DKK`}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="final_amount">Freelancer beløb (EUR) *</Label>
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
              <p>Dette beløb går til freelanceren</p>
              {finalAmount && parseFloat(finalAmount) > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-2 rounded text-blue-700">
                  <p><strong>Platform gebyr (15%):</strong> €{(parseFloat(finalAmount) * 0.15).toFixed(2)}</p>
                  <p><strong>Total klient betaling:</strong> €{(parseFloat(finalAmount) * 1.15).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Noter (valgfri)</Label>
            <Textarea
              id="notes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Eventuelle noter om opgavens fuldførelse..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm text-green-700">
              💰 <strong>Betalingsstruktur:</strong> 
            </p>
            <ul className="text-sm text-green-700 mt-1 space-y-1 ml-4">
              <li>• Freelancer modtager det angivne beløb</li>
              <li>• Platform gebyr (15%) tilføjes automatisk til klientens regning</li>
              <li>• Indtægter registreres i betalingsperioden (19. til 19.)</li>
              <li>• Udbetales som løn den 1. i næste måned</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleComplete} 
              disabled={saving || !finalAmount}
              className="flex-1"
            >
              {saving ? "Gemmer..." : "Markér som Fuldført"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Annuller
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};