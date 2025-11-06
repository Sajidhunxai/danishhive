import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ContractDialog } from "@/components/ContractDialog";
import { ContractView } from "@/components/ContractView";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Users,
  Clock,
  CheckCircle,
  Send
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
  status: string;
  total_amount: number | null;
  deadline: string | null;
  client_signature_date: string | null;
  freelancer_signature_date: string | null;
  client_signature_data: string | null;
  freelancer_signature_data: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  jobs?: {
    title: string;
    description: string;
  };
}

interface Job {
  id: string;
  title: string;
  description: string;
  client_id: string;
  budget_min: number | null;
  budget_max: number | null;
}

export const ContractSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractView, setShowContractView] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchContracts();
      fetchJobs();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const profile = await api.profiles.getMyProfile();
      setUserRole(profile.userType?.toLowerCase() || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const contractsData = await api.contracts.getMyContracts();
      
      // Map backend data to expected format
      const mappedContracts = contractsData.map((contract: any) => ({
        id: contract.id,
        job_id: contract.jobId,
        client_id: contract.clientId,
        freelancer_id: contract.freelancerId,
        contract_number: contract.contractNumber,
        title: contract.title,
        content: contract.content,
        terms: contract.terms,
        payment_terms: contract.paymentTerms,
        status: contract.status,
        total_amount: contract.totalAmount ? Number(contract.totalAmount) : null,
        deadline: contract.deadline,
        client_signature_date: contract.clientSignatureDate,
        freelancer_signature_date: contract.freelancerSignatureDate,
        client_signature_data: contract.clientSignatureData,
        freelancer_signature_data: contract.freelancerSignatureData,
        metadata: contract.metadata,
        created_at: contract.createdAt,
        updated_at: contract.updatedAt,
        jobs: contract.job ? {
          title: contract.job.title,
          description: contract.job.description
        } : undefined
      }));
      
      setContracts(mappedContracts);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke hente kontrakter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const jobsData = await api.jobs.getMyJobs();
      
      // Filter open jobs and map to expected format
      const openJobs = jobsData
        .filter((job: any) => job.status === 'open')
        .map((job: any) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          client_id: job.clientId,
          budget_min: job.budget ? Number(job.budget) : null,
          budget_max: job.budget ? Number(job.budget) : null
        }));
      
      setJobs(openJobs);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'signed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Sendt';
      case 'signed': return 'Signeret';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4" />;
      case 'signed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.jobs?.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {userRole === 'client' ? 'Kontraktsystem' : 'Mine Kontrakter'}
              </CardTitle>
              {userRole === 'client' && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  disabled={jobs.length === 0}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Opret Kontrakt
                </Button>
              )}
            </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Søg i kontrakter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">Alle status</option>
              <option value="sent">Sendt</option>
              <option value="signed">Signeret</option>
            </select>
          </div>

          {/* Contract Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-600">Sendte Kontrakter</div>
              <div className="text-2xl font-bold text-blue-700">
                {contracts.filter(c => c.status === 'sent').length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-600">Signerede Kontrakter</div>
              <div className="text-2xl font-bold text-green-700">
                {contracts.filter(c => c.status === 'signed').length}
              </div>
            </div>
          </div>

          {/* Contracts List */}
          <div className="space-y-4">
            <h4 className="font-medium">Kontrakter ({filteredContracts.length})</h4>
            {filteredContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {contracts.length === 0 ? (
                  <>
                    <p>Ingen kontrakter oprettet endnu</p>
                    <p className="text-sm">Opret din første kontrakt for en opgave</p>
                  </>
                ) : (
                  <>
                    <p>Ingen kontrakter matcher søgekriterierne</p>
                    <p className="text-sm">Prøv at justere søgning eller filter</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h5 className="font-medium">{contract.title}</h5>
                        <Badge variant="secondary" className={getStatusColor(contract.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(contract.status)}
                            {getStatusText(contract.status)}
                          </div>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Kontrakt nr.: {contract.contract_number}</p>
                        <p>Opgave: {contract.jobs?.title}</p>
                        {contract.total_amount && (
                          <p>Beløb: {contract.total_amount.toFixed(2)} DKK</p>
                        )}
                        {contract.deadline && (
                          <p>Deadline: {new Date(contract.deadline).toLocaleDateString('da-DK')}</p>
                        )}
                        <p>Oprettet: {new Date(contract.created_at).toLocaleDateString('da-DK')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowContractView(true);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Vis
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          {userRole === 'client' && jobs.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> Du skal først have oprettet opgaver for at kunne oprette kontrakter. 
                Gå til forsiden og opret en opgave først.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Contract Dialog - Only for clients */}
      {userRole === 'client' && (
        <ContractDialog
          isOpen={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedContract(null);
          }}
          onContractCreated={() => {
            fetchContracts();
            setShowCreateDialog(false);
            setSelectedContract(null);
          }}
          jobs={jobs}
          editContract={selectedContract}
        />
      )}

      {/* Contract View Dialog */}
      {selectedContract && (
        <ContractView
          contract={selectedContract}
          isOpen={showContractView}
          onClose={() => {
            setShowContractView(false);
            setSelectedContract(null);
          }}
          onContractUpdated={fetchContracts}
        />
      )}
    </>
  );
};