import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2 } from "lucide-react";

interface EmailChangeDialogProps {
  currentEmail: string;
}

const EmailChangeDialog: React.FC<EmailChangeDialogProps> = ({ currentEmail }) => {
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = async () => {
    if (!newEmail.trim() || newEmail === currentEmail) {
      toast({
        title: "Ugyldig email",
        description: "Indtast venligst en ny email adresse",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Ugyldig email",
        description: "Indtast venligst en gyldig email adresse",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-email-verification', {
        body: { newEmail }
      });

      if (error) throw error;

      toast({
        title: "Verifikations email sendt!",
        description: `Vi har sendt en verifikations email til ${newEmail}. Tjek din indbakke og klik på linket for at bekræfte ændringen.`,
      });

      setIsOpen(false);
      setNewEmail("");
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke sende verifikations email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-3">
          Skift email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Skift email adresse
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="current-email">Nuværende email</Label>
            <Input
              id="current-email"
              value={currentEmail}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div>
            <Label htmlFor="new-email">Ny email adresse</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="din.nye@email.dk"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleEmailChange()}
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Vi sender en verifikations email til din nye adresse. Du skal klikke på linket i emailen for at bekræfte ændringen.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleEmailChange} 
              disabled={loading || !newEmail.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sender...
                </>
              ) : (
                'Send verifikation'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Annuller
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailChangeDialog;