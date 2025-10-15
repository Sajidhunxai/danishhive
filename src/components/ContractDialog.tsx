import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FileText, Sparkles } from "lucide-react";

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  default_terms: string;
  category: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  is_permanent_consultant?: boolean;
}

interface Contract {
  id: string;
  job_id: string;
  title: string;
  content: string;
  terms: string;
  payment_terms: string;
  deadline: string;
  total_amount: number;
  template_id?: string;
}

interface ContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContractCreated: () => void;
  jobs: Job[];
  editContract?: Contract | null;
}

export const ContractDialog = ({ 
  isOpen, 
  onClose, 
  onContractCreated, 
  jobs, 
  editContract 
}: ContractDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [contractData, setContractData] = useState({
    title: "",
    content: "",
    terms: "",
    payment_terms: "",
    deadline: "",
    total_amount: "",
    asap: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (editContract) {
        // Populate form with existing contract data
        setSelectedJob(editContract.job_id);
        setContractData({
          title: editContract.title,
          content: editContract.content,
          terms: editContract.terms || "",
          payment_terms: editContract.payment_terms || "",
          deadline: editContract.deadline || "",
          total_amount: editContract.total_amount?.toString() || "",
          asap: false
        });
      } else {
        // Reset form for new contract
        setSelectedJob("");
        setSelectedTemplate("");
        setContractData({
          title: "",
          content: "",
          terms: "",
          payment_terms: "",
          deadline: "",
          total_amount: "",
          asap: false
        });
      }
    }
  }, [isOpen, editContract]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJob(jobId);
    const job = jobs.find(j => j.id === jobId);
    if (job && !editContract) {
      // Auto-fill some fields based on job
      setContractData(prev => ({
        ...prev,
        title: `Kontrakt - ${job.title}`,
        total_amount: job.budget_max?.toString() || job.budget_min?.toString() || ""
      }));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    const job = jobs.find(j => j.id === selectedJob);
    
    if (template && job) {
      // Replace placeholders in template
      let content = template.content;
      let terms = template.default_terms;
      
      // Replace placeholders
      content = content.replace('[Opgave Titel]', job.title);
      content = content.replace('[Detaljeret beskrivelse af opgaven]', job.description);
      content = content.replace('[Total Beløb]', contractData.total_amount || '0');
      
      setContractData(prev => ({
        ...prev,
        content,
        terms,
        payment_terms: "Betaling inden for 30 dage efter levering"
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedJob || !contractData.title || !contractData.content) {
      toast({
        title: "Fejl",
        description: "Udfyld venligst alle påkrævede felter",
        variant: "destructive",
      });
      return;
    }

    // Check if user profile is complete before allowing contract creation
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          full_name,
          phone,
          address,
          city,
          postal_code,
          phone_verified,
          payment_verified,
          role
        `)
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const isProfileComplete = profile &&
        profile.full_name && 
        profile.full_name.trim() !== '' &&
        profile.full_name !== 'Incomplete Profile' &&
        profile.phone && 
        profile.phone.trim() !== '' &&
        profile.address && 
        profile.address.trim() !== '' &&
        profile.city && 
        profile.city.trim() !== '' &&
        profile.postal_code && 
        profile.postal_code.trim() !== '' &&
        profile.phone_verified === true &&
        // Only require payment verification for clients, not freelancers
        profile.role === 'client' ? profile.payment_verified === true : true;

      if (!isProfileComplete) {
        toast({
          title: "Profil Ikke Fuldført",
          description: "Du skal fuldføre din profil og verificere telefon/betaling før du kan oprette kontrakter",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke verificere profil status. Prøv igen senere.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Generate contract number if creating new
      let contractNumber = "";
      if (!editContract) {
        const { data: numberData, error: numberError } = await supabase
          .rpc('generate_contract_number');
        if (numberError) throw numberError;
        contractNumber = numberData;
      }

      const contractPayload = {
        job_id: selectedJob,
        client_id: user.id,
        title: contractData.title,
        content: contractData.content,
        terms: contractData.terms || null,
        payment_terms: contractData.payment_terms || null,
        deadline: contractData.deadline || null,
        total_amount: contractData.total_amount ? parseFloat(contractData.total_amount) : null,
        template_id: selectedTemplate || null,
        contract_number: contractNumber,
        status: 'sent' // Always create contracts with 'sent' status
      };

      let error;
      if (editContract) {
        // Update existing contract (exclude contract_number)
        const { contract_number, ...updatePayload } = contractPayload;
        const { error: updateError } = await supabase
          .from('contracts')
          .update(updatePayload)
          .eq('id', editContract.id);
        error = updateError;
      } else {
        // Create new contract (include contract_number)
        const { error: insertError } = await supabase
          .from('contracts')
          .insert(contractPayload);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Succes",
        description: editContract ? "Kontrakt opdateret" : "Kontrakt oprettet",
      });

      onContractCreated();
    } catch (error) {
      console.error('Error saving contract:', error);
      toast({
        title: "Fejl",
        description: editContract ? "Kunne ikke opdatere kontrakt" : "Kunne ikke oprette kontrakt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {editContract ? "Rediger Kontrakt" : "Opret Ny Kontrakt"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Job Selection */}
          <div>
            <Label htmlFor="job">Vælg Opgave *</Label>
            <Select value={selectedJob} onValueChange={handleJobSelect} disabled={!!editContract}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg en opgave" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{job.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {job.budget_min && job.budget_max 
                          ? `${job.budget_min} - ${job.budget_max} DKK`
                          : job.budget_min 
                            ? `${job.budget_min} DKK`
                            : job.budget_max 
                              ? `${job.budget_max} DKK`
                              : "Ikke angivet"
                        }
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          {!editContract && (
            <div>
              <Label htmlFor="template">Brug Skabelon (valgfri)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg en skabelon" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-sm text-muted-foreground">{template.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Basic Contract Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Kontrakt Titel *</Label>
              <Input
                id="title"
                value={contractData.title}
                onChange={(e) => setContractData(prev => ({...prev, title: e.target.value}))}
                placeholder="f.eks. Kontrakt - Webside udvikling"
              />
            </div>
            <div>
              <Label htmlFor="total_amount">Samlet Beløb (DKK)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={contractData.total_amount}
                onChange={(e) => setContractData(prev => ({...prev, total_amount: e.target.value}))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {(() => {
                const selectedJobData = jobs.find(j => j.id === selectedJob);
                const isConsultant = selectedJobData?.is_permanent_consultant;
                return (
                  <div className="space-y-3">
                    <Label htmlFor="deadline">
                      {isConsultant ? "Forventet opstart" : "Deadline"}
                    </Label>
                    {isConsultant && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="asap"
                          checked={contractData.asap}
                          onCheckedChange={(checked) => setContractData(prev => ({...prev, asap: !!checked, deadline: checked ? "" : prev.deadline}))}
                        />
                        <Label htmlFor="asap" className="text-sm">
                          Snarest muligt
                        </Label>
                      </div>
                    )}
                    {!contractData.asap && (
                      <Input
                        id="deadline"
                        type="date"
                        value={contractData.deadline}
                        onChange={(e) => setContractData(prev => ({...prev, deadline: e.target.value}))}
                      />
                    )}
                  </div>
                );
              })()}
            </div>
            <div>
              <Label htmlFor="payment_terms">Betalingsbetingelser</Label>
              <Input
                id="payment_terms"
                value={contractData.payment_terms}
                onChange={(e) => setContractData(prev => ({...prev, payment_terms: e.target.value}))}
                placeholder="f.eks. 50% ved start, 50% ved levering"
              />
            </div>
          </div>

          {/* Contract Content */}
          <div>
            <Label htmlFor="content">Kontrakt Indhold *</Label>
            <Textarea
              id="content"
              value={contractData.content}
              onChange={(e) => setContractData(prev => ({...prev, content: e.target.value}))}
              placeholder="Skriv kontraktens hovedindhold..."
              className="min-h-[200px]"
            />
          </div>

          {/* Terms and Conditions */}
          <div>
            <Label htmlFor="terms">Vilkår og Betingelser</Label>
            <Textarea
              id="terms"
              value={contractData.terms}
              onChange={(e) => setContractData(prev => ({...prev, terms: e.target.value}))}
              placeholder="Generelle vilkår og betingelser..."
              className="min-h-[150px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Gemmer..." : editContract ? "Opdater Kontrakt" : "Opret Kontrakt"}
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