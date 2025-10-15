import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CreditCard, Shield, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentVerificationProps {
  onVerificationComplete?: (verified: boolean) => void;
  isRequired?: boolean;
}

export const PaymentVerification: React.FC<PaymentVerificationProps> = ({
  onVerificationComplete,
  isRequired = false
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check initial verification status
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('payment_verified, payment_method_verified')
          .eq('user_id', user.id)
          .single();

        if (profile?.payment_verified || profile?.payment_method_verified) {
          setIsVerified(true);
          onVerificationComplete?.(true);
        }
      } catch (error) {
        console.error('Error checking initial payment status:', error);
      }
    };

    checkInitialStatus();
  }, [onVerificationComplete]);

  // Check for payment verification from URL params (after redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentVerified = urlParams.get('payment_verified');
    const paymentIdParam = urlParams.get('payment_id');
    
    if (paymentVerified === 'success' && paymentIdParam) {
      setPaymentId(paymentIdParam);
      checkPaymentStatus(paymentIdParam);
    }
  }, []);

  const startPaymentVerification = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment-method');

      if (error) throw error;

      if (data.already_verified) {
        setIsVerified(true);
        onVerificationComplete?.(true);
        toast({
          title: "Already Verified",
          description: "Your payment method is already verified",
        });
        return;
      }

      if (data.checkout_url) {
        setPaymentId(data.payment_id);
        toast({
          title: "Redirecting to Payment",
          description: "You'll be charged €0.01 which will be refunded immediately",
        });
        
        // Open payment in new tab
        window.open(data.checkout_url, '_blank');
        
        // Start polling for payment status
        setTimeout(() => {
          if (data.payment_id) {
            pollPaymentStatus(data.payment_id);
          }
        }, 5000); // Wait 5 seconds before starting to poll
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Could not start payment verification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentIdToCheck: string) => {
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { payment_id: paymentIdToCheck }
      });

      if (error) throw error;

      if (data.verified) {
        setIsVerified(true);
        onVerificationComplete?.(true);
        toast({
          title: "Payment Verified!",
          description: data.message,
        });
        
        // Clean up URL params
        const url = new URL(window.location.href);
        url.searchParams.delete('payment_verified');
        url.searchParams.delete('payment_id');
        window.history.replaceState({}, document.title, url.toString());
      } else {
        toast({
          title: "Payment Pending",
          description: `Payment status: ${data.payment_status}`,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Payment status check error:', error);
      toast({
        title: "Status Check Failed",
        description: error.message || "Could not check payment status",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const pollPaymentStatus = (paymentIdToPoll: string) => {
    const maxAttempts = 12; // Poll for 2 minutes (12 * 10 seconds)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        toast({
          title: "Status Check Timeout",
          description: "Please refresh the page or check manually",
          variant: "destructive",
        });
        return;
      }

      attempts++;
      await checkPaymentStatus(paymentIdToPoll);
      
      if (!isVerified) {
        setTimeout(poll, 10000); // Poll every 10 seconds
      }
    };

    poll();
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        Payment Method Verification {isRequired && '*'}
      </Label>
      
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-2">
              Why verify your payment method?
            </h4>
            <ul className="text-sm text-blue-700 space-y-1 mb-4">
              <li>• Ensures you can pay freelancers for completed work</li>
              <li>• Required before creating contracts</li>
              <li>• Builds trust with freelancers</li>
              <li>• One-time verification (€0.01 charge, immediately refunded)</li>
            </ul>
            
            {!isVerified ? (
              <div className="space-y-3">
                <Button
                  onClick={startPaymentVerification}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Starting Verification..." : "Verify Payment Method"}
                </Button>
                
                {paymentId && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkPaymentStatus(paymentId)}
                      disabled={checkingStatus}
                    >
                      {checkingStatus ? "Checking..." : "Check Status"}
                    </Button>
                    <span className="text-xs text-gray-600">
                      Completed payment? Click to check status
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-4 w-4" />
                <span className="font-medium">Payment method verified!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isRequired && !isVerified && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Payment verification is required to create contracts</span>
        </div>
      )}
    </div>
  );
};