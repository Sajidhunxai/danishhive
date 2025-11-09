import React, { useState, useEffect } from "react";
import { useApi } from "@/contexts/ApiContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Languages, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Upload
} from "lucide-react";

interface AttachmentTranslation {
  id: string;
  attachment_id: string;
  target_language: string;
  translated_file_path: string | null;
  status: string;
  assigned_to: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  job_attachments: {
    id: string;
    file_name: string;
    file_path: string;
    jobs: {
      id: string;
      title: string;
      client_id: string;
    };
  };
  assigned_user?: {
    full_name: string;
    email: string;
  };
}

interface TeamLeader {
  user_id: string;
  full_name: string;
}

const AdminTranslationManager = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const api = useApi();
  const [translations, setTranslations] = useState<AttachmentTranslation[]>([]);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranslation, setSelectedTranslation] = useState<AttachmentTranslation | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [newRequestDialogOpen, setNewRequestDialogOpen] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    job_id: "",
    attachment_id: "",
    target_language: "",
    notes: ""
  });

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    assigned: "bg-blue-100 text-blue-800", 
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  const statusIcons = {
    pending: Clock,
    assigned: User,
    in_progress: Languages,
    completed: CheckCircle,
    rejected: XCircle
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "de", name: "Tysk" },
    { code: "fr", name: "Fransk" },
    { code: "es", name: "Spansk" },
    { code: "it", name: "Italiensk" },
    { code: "pl", name: "Polsk" },
    { code: "ro", name: "Rumænsk" },
    { code: "zh", name: "Kinesisk" },
    { code: "ar", name: "Arabisk" }
  ];

  useEffect(() => {
    fetchTranslations();
    fetchTeamLeaders();
  }, []);

  const fetchTranslations = async () => {
    try {
      const translationsData = await api.translations.getTranslations();
      
      // Map backend data to expected format
      const translationsWithUsers = translationsData.map((translation: any) => ({
        ...translation,
        assigned_user: translation.assignedUser ? {
          full_name: translation.assignedUser.fullName || translation.assignedUser.full_name,
          email: '' // We don't expose email for privacy
        } : null
      }));

      setTranslations(translationsWithUsers);
    } catch (error: any) {
      console.error('Error fetching translations:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke hente oversættelser",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeaders = async () => {
    try {
      const teamLeadersData = await api.translations.getTeamLeaders();
      
      // Map backend data to expected format
      const mappedLeaders = teamLeadersData.map((leader: any) => ({
        user_id: leader.user_id || leader.userId,
        full_name: leader.full_name || leader.fullName
      }));

      setTeamLeaders(mappedLeaders);
    } catch (error: any) {
      console.error('Error fetching team leaders:', error);
    }
  };

  const assignTranslation = async (translationId: string, assignedTo: string) => {
    try {
      await api.translations.assignTranslation(translationId, assignedTo);

      toast({
        title: "Tildelt!",
        description: "Oversættelsen er tildelt til teamlederen",
      });

      fetchTranslations();
      setAssignDialogOpen(false);
      setSelectedTranslation(null);
    } catch (error: any) {
      console.error('Error assigning translation:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke tildele oversættelsen",
        variant: "destructive",
      });
    }
  };

  const createTranslationRequest = async (jobId: string, attachmentId: string, targetLanguage: string, notes?: string) => {
    try {
      await api.translations.createTranslationRequest({
        jobId,
        attachmentId,
        targetLanguage,
        notes: notes || undefined
      });

      toast({
        title: "Anmodning oprettet!",
        description: "Oversættelsesanmodningen er oprettet",
      });

      fetchTranslations();
      setNewRequestDialogOpen(false);
      setNewRequestData({ job_id: "", attachment_id: "", target_language: "", notes: "" });
    } catch (error: any) {
      console.error('Error creating translation request:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke oprette oversættelsesanmodning",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Oversættelseshåndtering</h2>
        <Dialog open={newRequestDialogOpen} onOpenChange={setNewRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Languages className="h-4 w-4 mr-2" />
              Ny oversættelsesanmodning
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opret ny oversättelsesanmodning</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Job ID</Label>
                <Input
                  value={newRequestData.job_id}
                  onChange={(e) => setNewRequestData(prev => ({ ...prev, job_id: e.target.value }))}
                  placeholder="UUID af job"
                />
              </div>
              <div>
                <Label>Vedhæftet fil ID</Label>
                <Input
                  value={newRequestData.attachment_id}
                  onChange={(e) => setNewRequestData(prev => ({ ...prev, attachment_id: e.target.value }))}
                  placeholder="UUID af vedhæftet fil"
                />
              </div>
              <div>
                <Label>Målsprog</Label>
                <Select
                  value={newRequestData.target_language}
                  onValueChange={(value) => setNewRequestData(prev => ({ ...prev, target_language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg målsprog" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Noter (valgfri)</Label>
                <Textarea
                  value={newRequestData.notes}
                  onChange={(e) => setNewRequestData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Specielle instruktioner eller noter"
                />
              </div>
              <Button 
                onClick={() => createTranslationRequest(
                  newRequestData.job_id,
                  newRequestData.attachment_id,
                  newRequestData.target_language,
                  newRequestData.notes
                )}
                disabled={!newRequestData.job_id || !newRequestData.attachment_id || !newRequestData.target_language}
              >
                Opret anmodning
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="pending">Afventende</TabsTrigger>
          <TabsTrigger value="assigned">Tildelt</TabsTrigger>
          <TabsTrigger value="in_progress">Igangværende</TabsTrigger>
          <TabsTrigger value="completed">Fuldført</TabsTrigger>
        </TabsList>

        {["all", "pending", "assigned", "in_progress", "completed"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            <div className="grid gap-4">
              {translations
                .filter(t => tabValue === "all" || t.status === tabValue)
                .map((translation) => (
                <Card key={translation.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {translation.job_attachments.file_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Fra opgave: {translation.job_attachments.jobs.title}
                        </p>
                      </div>
                      <Badge className={statusColors[translation.status as keyof typeof statusColors]}>
                        {getStatusIcon(translation.status)}
                        <span className="ml-1 capitalize">{translation.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Målsprog:</span>
                        <p className="text-muted-foreground">
                          {languages.find(l => l.code === translation.target_language)?.name || translation.target_language}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Oprettet:</span>
                        <p className="text-muted-foreground">
                          {formatDate(translation.created_at)}
                        </p>
                      </div>
                      {translation.assigned_user && (
                        <div>
                          <span className="font-medium">Tildelt til:</span>
                          <p className="text-muted-foreground">
                            {translation.assigned_user.full_name}
                          </p>
                        </div>
                      )}
                      {translation.completed_at && (
                        <div>
                          <span className="font-medium">Fuldført:</span>
                          <p className="text-muted-foreground">
                            {formatDate(translation.completed_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {translation.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <span className="font-medium">Noter:</span>
                        <p className="text-muted-foreground mt-1">{translation.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      {translation.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTranslation(translation);
                            setAssignDialogOpen(true);
                          }}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Tildel
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download original
                      </Button>
                      
                      {translation.status === 'completed' && translation.translated_file_path && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download oversættelse
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {translations.filter(t => tabValue === "all" || t.status === tabValue).length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Languages className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ingen oversættelser</h3>
                    <p className="text-muted-foreground">
                      {tabValue === "all" 
                        ? "Der er ingen oversættelsesanmodninger endnu"
                        : `Ingen oversættelser med status "${tabValue}"`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tildel oversættelse</DialogTitle>
          </DialogHeader>
          {selectedTranslation && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">Fil: {selectedTranslation.job_attachments.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  Målsprog: {languages.find(l => l.code === selectedTranslation.target_language)?.name}
                </p>
              </div>
              
              <div>
                <Label>Vælg teamleder</Label>
                <Select onValueChange={(value) => assignTranslation(selectedTranslation.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg teamleder" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamLeaders.map((leader) => (
                      <SelectItem key={leader.user_id} value={leader.user_id}>
                        {leader.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTranslationManager;