import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Send } from 'lucide-react';

interface RoleChangeRequestProps {
  currentRole: string;
}

export const RoleChangeRequest = ({ currentRole }: RoleChangeRequestProps) => {
  const [requestedRole, setRequestedRole] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !requestedRole || !reason.trim()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('role_change_requests')
        .insert({
          user_id: user.id,
          requested_role: requestedRole,
          current_user_role: currentRole,
          reason: reason.trim(),
        });

      if (error) throw error;

      toast({
        title: 'Anmodning sendt',
        description: 'Din rolleændring er sendt til administratorer for godkendelse.',
      });

      setRequestedRole('');
      setReason('');
    } catch (error) {
      console.error('Error submitting role change request:', error);
      toast({
        title: 'Fejl',
        description: 'Der opstod en fejl ved indsendelse af anmodningen.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableRoles = currentRole === 'freelancer' ? ['client'] : ['freelancer'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="requested-role">Ønsket rolle</Label>
        <Select value={requestedRole} onValueChange={setRequestedRole}>
          <SelectTrigger>
            <SelectValue placeholder="Vælg ønsket rolle" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role === 'freelancer' ? 'Freelancer' : 'Klient'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Begrundelse</Label>
        <Textarea
          id="reason"
          placeholder="Beskriv hvorfor du ønsker at ændre din rolle..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
      </div>

      <Button 
        type="submit" 
        disabled={!requestedRole || !reason.trim() || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          'Sender...'
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send anmodning
          </>
        )}
      </Button>
    </form>
  );
};