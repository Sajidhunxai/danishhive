import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-ESCROW-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received for escrow payment");

    // Get the payment data from Mollie webhook
    const paymentData = await req.json();
    const paymentId = paymentData.id;

    if (!paymentId) {
      throw new Error("Payment ID not found in webhook data");
    }

    const mollieApiKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieApiKey) {
      throw new Error("MOLLIE_API_KEY is not configured");
    }

    // Create Supabase client with service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch full payment details from Mollie
    logStep("Fetching payment details from Mollie", { paymentId });
    const paymentResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mollieApiKey}`,
      },
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      throw new Error(`Failed to fetch payment: ${error}`);
    }

    const payment = await paymentResponse.json();
    logStep("Payment details retrieved", { status: payment.status, metadata: payment.metadata });

    // Check if this is an escrow payment
    if (!payment.metadata?.escrow || payment.metadata?.purpose !== 'contract_escrow') {
      logStep("Not an escrow payment, ignoring webhook");
      return new Response(JSON.stringify({ message: "Not an escrow payment" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const contractId = payment.metadata.contract_id;
    if (!contractId) {
      throw new Error("Contract ID not found in payment metadata");
    }

    // Get the contract
    const { data: contract, error: contractError } = await supabaseService
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError) throw new Error(`Contract error: ${contractError.message}`);
    if (!contract) throw new Error("Contract not found");

    // Update contract metadata based on payment status
    let updatedMetadata = { ...contract.metadata };

    if (payment.status === "paid") {
      logStep("Payment successful, updating contract to active");
      updatedMetadata.escrow_status = 'paid';
      updatedMetadata.escrow_paid_at = new Date().toISOString();
      
      // Update contract status to active (this will be handled by the trigger)
      await supabaseService
        .from("contracts")
        .update({ metadata: updatedMetadata })
        .eq("id", contractId);

    } else if (payment.status === "failed" || payment.status === "canceled" || payment.status === "expired") {
      logStep("Payment failed/canceled/expired, updating metadata");
      updatedMetadata.escrow_status = 'failed';
      updatedMetadata.escrow_failed_at = new Date().toISOString();
      updatedMetadata.escrow_failure_reason = payment.status;

      await supabaseService
        .from("contracts")
        .update({ metadata: updatedMetadata })
        .eq("id", contractId);
    }

    logStep("Contract updated successfully");

    return new Response(JSON.stringify({
      success: true,
      message: `Escrow payment ${payment.status} processed for contract ${contractId}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook-escrow-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});