import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JobApplicationRefundProps {
  jobId: string;
  selectedApplicantId: string;
}

export const JobApplicationRefund: React.FC<JobApplicationRefundProps> = ({ 
  jobId, 
  selectedApplicantId 
}) => {
  const { toast } = useToast();

  useEffect(() => {
    const handleRefunds = async () => {
      try {
        // Get all applications for this job
        const { data: applications, error: appsError } = await supabase
          .from('job_applications')
          .select('id, applicant_id')
          .eq('job_id', jobId)
          .neq('applicant_id', selectedApplicantId); // Exclude the selected applicant

        if (appsError) throw appsError;

        // Refund honey drops to rejected applicants
        for (const app of applications || []) {
          // Get current honey drops (using total_earnings temporarily)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('total_earnings')
            .eq('user_id', app.applicant_id)
            .single();

          if (profileError) continue;

          // Add 3 honey drops back
          const newTotal = (profile?.total_earnings || 0) + 3;

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ total_earnings: newTotal })
            .eq('user_id', app.applicant_id);

          if (updateError) {
            console.error('Error refunding honey drops:', updateError);
          }
        }

        toast({
          title: "Honningdråber refunderet",
          description: "Ikke-valgte ansøgere har fået deres honningdråber tilbage",
        });

      } catch (error) {
        console.error('Error handling refunds:', error);
      }
    };

    handleRefunds();
  }, [jobId, selectedApplicantId, toast]);

  return null; // This component doesn't render anything
};