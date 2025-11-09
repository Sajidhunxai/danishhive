import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/contexts/ApiContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useFreelancerVerification } from '@/components/FreelancerVerificationGuard';
  import { 
  FileText, 
  Send, 
  PenTool, 
  Download, 
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  CreditCard,
  Lock
} from "lucide-react";

interface Contract {
  id: string;
  job_id: string;
  client_id: string;
  freelancer_id: string | null;
  contract_number: string;
  title: string;
  content: string;
  terms: string | null;
  payment_terms: string | null;
  deadline: string | null;
  total_amount: number | null;
  status: string;
  client_signature_date: string | null;
  freelancer_signature_date: string | null;
  client_signature_data: string | null;
  freelancer_signature_data: string | null;
  metadata: any;
  created_at: string;
  jobs?: {
    title: string;
    description: string;
  };
}

interface ContractViewProps {
  contract: Contract;
  isOpen: boolean;
  onClose: () => void;
  onContractUpdated: () => void;
}

export const ContractView = ({ 
  contract, 
  isOpen, 
  onClose, 
  onContractUpdated 
}: ContractViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = useApi();
  const { requireVerification } = useFreelancerVerification();
  const [loading, setLoading] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [creatingEscrow, setCreatingEscrow] = useState(false);
  const [releasingEscrow, setReleasingEscrow] = useState(false);

  const isClient = user?.id === contract.client_id;
  const isFreelancer = user?.id === contract.freelancer_id;
  const canSign = (isClient && !contract.client_signature_date) || 
                  (isFreelancer && !contract.freelancer_signature_date);
  const canSendContract = isClient && contract.status === 'draft';
  
  // Contract is fully signed when both parties have signed
  const isFullySigned = contract.client_signature_date && contract.freelancer_signature_date;
  const hasEscrowPayment = contract.metadata?.escrow_payment_id;
  const escrowStatus = contract.metadata?.escrow_status;
  const canCreateEscrow = isClient && isFullySigned && !hasEscrowPayment && contract.total_amount;
  const canReleaseEscrow = isClient && hasEscrowPayment && escrowStatus === 'paid' && contract.status === 'active';
  const isContractCompleted = contract.status === 'completed';

  const handleSendContract = async () => {
    if (!canSendContract) return;

    setLoading(true);
    try {
      await api.contracts.updateContract(contract.id, { status: 'sent' });

      toast({
        title: "Succes",
        description: "Kontrakt sendt til freelancer",
      });

      onContractUpdated();
    } catch (error: any) {
      console.error('Error sending contract:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke sende kontrakt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    // Check freelancer verification first if freelancer is signing
    if (isFreelancer && !requireVerification("godkende kontrakter")) {
      return;
    }

    if (!canSign || !signatureData.trim()) {
      toast({
        title: "Fejl",
        description: "Skriv venligst dit navn for at underskrive",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updates: any = {};
      
      if (isClient) {
        updates.client_signature_date = new Date().toISOString();
        updates.client_signature_data = signatureData;
      } else if (isFreelancer) {
        updates.freelancer_signature_date = new Date().toISOString();
        updates.freelancer_signature_data = signatureData;
      }

      // Check if both parties have signed after this signature
      const bothSigned = (
        (contract.client_signature_date || isClient) && 
        (contract.freelancer_signature_date || isFreelancer)
      );

      if (bothSigned) {
        updates.status = 'signed';
      }

      await api.contracts.updateContract(contract.id, updates);

      toast({
        title: "Succes",
        description: bothSigned 
          ? "Kontrakt fuldt underskrevet af begge parter!" 
          : "Din underskrift er registreret",
      });

      setShowSignDialog(false);
      setSignatureData("");
      onContractUpdated();
    } catch (error) {
      console.error('Error signing contract:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke underskrive kontrakt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEscrow = async () => {
    if (!canCreateEscrow || !contract.total_amount) return;

    setCreatingEscrow(true);
    try {
      const result = await api.payments.createEscrowPayment(
        contract.id,
        Number(contract.total_amount),
        `Escrow payment for contract ${contract.contract_number}`
      );

      toast({
        title: "Succes",
        description: result.message || "Escrow betaling oprettet",
      });
      onContractUpdated();
    } catch (error: any) {
      console.error('Error creating escrow payment:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke oprette escrow betaling",
        variant: "destructive",
      });
    } finally {
      setCreatingEscrow(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!canReleaseEscrow || !contract.metadata?.escrow_payment_id) return;

    setReleasingEscrow(true);
    try {
      const paymentId = contract.metadata.escrow_payment_id;
      const result = await api.payments.releaseEscrowPayment(contract.id, paymentId);

      toast({
        title: "Succes",
        description: result.message || "Escrow betaling frigivet",
      });

      onContractUpdated();
    } catch (error: any) {
      console.error('Error releasing escrow payment:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke frigive escrow betaling",
        variant: "destructive",
      });
    } finally {
      setReleasingEscrow(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'escrow_pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'Udkast',
      'sent': 'Sendt til underskrift',
      'signed': 'Underskrevet',
      'active': 'Aktiv',
      'completed': 'Fuldført',
      'escrow_pending': 'Afventer escrow betaling'
    };
    return statusMap[status] || status;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Kontrakt Visning
              </DialogTitle>
              <Badge variant="secondary" className={getStatusColor(contract.status)}>
                {getStatusText(contract.status)}
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Contract Header */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{contract.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Kontrakt nr.: {contract.contract_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Opgave: {contract.jobs?.title}
                  </p>
                </div>
                <div className="space-y-2">
                  {contract.total_amount && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4" />
                      <span>Beløb: {contract.total_amount.toFixed(2)} DKK</span>
                    </div>
                  )}
                  {contract.deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Deadline: {new Date(contract.deadline).toLocaleDateString('da-DK')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Oprettet: {new Date(contract.created_at).toLocaleDateString('da-DK')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Klient Underskrift
                </h4>
                {contract.client_signature_date ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Underskrevet {new Date(contract.client_signature_date).toLocaleDateString('da-DK')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Afventer underskrift</span>
                  </div>
                )}
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Freelancer Underskrift
                </h4>
                {contract.freelancer_signature_date ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      Underskrevet {new Date(contract.freelancer_signature_date).toLocaleDateString('da-DK')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Afventer underskrift</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Content */}
            <div className="space-y-4">
              <h4 className="font-medium">Kontrakt Indhold</h4>
              <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {contract.content}
                </pre>
              </div>
            </div>

            {/* Terms */}
            {contract.terms && (
              <div className="space-y-4">
                <h4 className="font-medium">Vilkår og Betingelser</h4>
                <div className="bg-muted/30 border rounded-lg p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
                    {contract.terms}
                  </pre>
                </div>
              </div>
            )}

            {/* Payment Terms */}
            {contract.payment_terms && (
              <div className="space-y-4">
                <h4 className="font-medium">Betalingsbetingelser</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">{contract.payment_terms}</p>
                </div>
              </div>
            )}

            {/* Escrow Payment Status */}
            {(hasEscrowPayment || canCreateEscrow) && (
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Escrow Betaling
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {!hasEscrowPayment && canCreateEscrow && (
                    <div className="space-y-3">
                      <p className="text-sm text-blue-700">
                        💰 <strong>Kontrakten er underskrevet!</strong> Som klient skal du nu betale det aftalte beløb til escrow. 
                        Betalingen holdes sikkert, indtil arbejdet er fuldført.
                      </p>
                      <Button 
                        onClick={handleCreateEscrow} 
                        disabled={creatingEscrow}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {creatingEscrow ? "Opretter betaling..." : `Betal €${(contract.total_amount * 1.15)?.toFixed(2)} til Escrow`}
                      </Button>
                    </div>
                  )}
                  
                  {hasEscrowPayment && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Escrow Status:</span>
                        <Badge variant="secondary" className={
                          escrowStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          escrowStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          escrowStatus === 'released' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {escrowStatus === 'paid' ? 'Betalt' :
                           escrowStatus === 'pending' ? 'Afventer betaling' :
                           escrowStatus === 'released' ? 'Frigivet' : 
                           escrowStatus || 'Ukendt'}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-700">
                        Freelancer beløb: €{contract.total_amount?.toFixed(2)} <br/>
                        Platform gebyr (15%): €{(contract.total_amount * 0.15)?.toFixed(2)} <br/>
                        <strong>Total betaling: €{(contract.total_amount * 1.15)?.toFixed(2)}</strong>
                      </p>
                      
                      {canReleaseEscrow && (
                        <div className="space-y-2">
                          <p className="text-sm text-green-700">
                            ✅ <strong>Arbejdet er fuldført?</strong> Frigiv betalingen til freelanceren.
                          </p>
                          <Button 
                            onClick={handleReleaseEscrow} 
                            disabled={releasingEscrow}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {releasingEscrow ? "Frigiver betaling..." : "Frigiv Betaling til Freelancer"}
                          </Button>
                        </div>
                      )}
                      
                      {escrowStatus === 'released' && (
                        <p className="text-sm text-purple-700">
                          🎉 <strong>Betaling frigivet!</strong> Freelanceren har modtaget betalingen. Kontrakten er nu fuldført.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {canSendContract && (
                <Button onClick={handleSendContract} disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  Send til Underskrift
                </Button>
              )}
              
              {canSign && contract.status === 'sent' && (
                <Button onClick={() => setShowSignDialog(true)}>
                  <PenTool className="h-4 w-4 mr-2" />
                  Underskriv Kontrakt
                </Button>
              )}
              
              <Button variant="outline" onClick={onClose}>
                Luk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Contract Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Digital Underskrift
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Du er ved at underskrive kontrakten digitalt. Indtast dit fulde navn for at bekræfte din underskrift.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Dit fulde navn *
              </label>
              <Textarea
                value={signatureData}
                onChange={(e) => setSignatureData(e.target.value)}
                placeholder="Skriv dit fulde navn her..."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-700">
                ⚠️ <strong>Vigtigt:</strong> Ved at underskrive accepterer du alle vilkår i kontrakten. 
                Denne handling kan ikke fortrydes.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSignContract} 
                disabled={loading || !signatureData.trim()}
                className="flex-1"
              >
                {loading ? "Underskriver..." : "Bekræft Underskrift"}
              </Button>
              <Button variant="outline" onClick={() => setShowSignDialog(false)}>
                Annuller
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};