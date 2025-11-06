import React, { useEffect } from 'react';
import { api } from '@/services/api';
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
        await api.refunds.refundApplicationHoneyDrops(jobId, selectedApplicantId);

        toast({
          title: "Honningdråber refunderet",
          description: "Ikke-valgte ansøgere har fået deres honningdråber tilbage",
        });
      } catch (error: any) {
        console.error('Error handling refunds:', error);
        toast({
          title: "Fejl",
          description: error.message || "Kunne ikke refundere honningdråber",
          variant: "destructive",
        });
      }
    };

    handleRefunds();
  }, [jobId, selectedApplicantId, toast]);

  return null; // This component doesn't render anything
};