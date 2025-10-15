import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, Trash2, Save, User, MapPin, Phone, Building2, Shield, ShieldCheck, Star, ToggleLeft, ToggleRight, X, Check, ChevronsUpDown, Settings, Mail, Droplets, DollarSign } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSkills } from "@/components/LanguageSkills";
import { BackButton } from "@/components/ui/back-button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import ReferralSystem from "@/components/ReferralSystem";
import EmailChangeDialog from "@/components/EmailChangeDialog";
import { PaymentOverview } from "@/components/PaymentOverview";
import { PublicProfileView } from "@/components/PublicProfileView";
import { HoneyDropsPurchase } from "@/components/HoneyDropsPurchase";
import { HoneyDropsBalance } from "@/components/HoneyDropsBalance";
import { HoneyDropsPurchaseHistory } from "@/components/HoneyDropsPurchaseHistory";
import { ClientFees } from "@/components/ClientFees";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  phone_verified: boolean;
  phone_verification_code: string | null;
  location: string | null;
  hourly_rate: number | null;
  skills: string[] | null;
  software_skills: string[] | null;
  availability: string | null;
  active_status: boolean;
  total_earnings: number;
  rating: number;
  rating_count: number;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  role: string | null;
  is_admin?: boolean | null;
  created_at?: string;
  updated_at?: string;
  birthday?: string | null;
  iban?: string | null;
  bank_name?: string | null;
  account_holder_name?: string | null;
  payment_method?: string | null;
  mitid_verified?: boolean;
  payment_verified?: boolean;
  platform_fee_rate?: number;
  reduced_fee_until?: string;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  project_url: string | null;
  image_url: string | null;
  project_type: string;
  start_date: string | null;
  end_date: string | null;
  technologies: string[] | null;
  still_working_here: boolean;
}

// Common skills for autocomplete
const COMMON_SKILLS = [
  "React", "JavaScript", "TypeScript", "Node.js", "Python", "Java", "C#", "PHP", "HTML", "CSS",
  "Angular", "Vue.js", "Next.js", "Express.js", "Django", "Flask", "Spring", "ASP.NET",
  "MySQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure",
  "Google Cloud", "Git", "Jenkins", "Figma", "Adobe Photoshop", "Adobe Illustrator",
  "UI/UX Design", "Graphic Design", "Content Writing", "SEO", "Digital Marketing",
  "Project Management", "Scrum", "Agile", "WordPress", "Shopify", "E-commerce",
  "Data Analysis", "Machine Learning", "API Development", "Mobile Development",
  "Flutter", "React Native", "iOS Development", "Android Development"
];

// Common software for autocomplete
const COMMON_SOFTWARE = [
  "Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Adobe After Effects", "Adobe Premiere Pro",
  "Figma", "Sketch", "InVision", "Canva", "Blender", "AutoCAD", "SolidWorks", "Maya",
  "Microsoft Office", "Microsoft Excel", "Microsoft Word", "Microsoft PowerPoint",
  "Google Workspace", "Slack", "Trello", "Asana", "Jira", "Confluence", "Notion",
  "Visual Studio Code", "IntelliJ IDEA", "Eclipse", "Xcode", "Android Studio",
  "Git", "GitHub", "GitLab", "Bitbucket", "Docker", "Kubernetes",
  "Unity", "Unreal Engine", "FL Studio", "Pro Tools", "Logic Pro", "Ableton Live",
  "Final Cut Pro", "DaVinci Resolve", "Cinema 4D", "3ds Max", "Rhino", "SketchUp"
];

const Profile = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: "",
    description: "",
    client_name: "",
    project_url: "",
    project_type: "portfolio",
    technologies: [],
    start_date: "",
    end_date: "",
    still_working_here: false
  });
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [jobHistory, setJobHistory] = useState<any[]>([]);
  const [showJobHistoryModal, setShowJobHistoryModal] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [softwareOpen, setSoftwareOpen] = useState(false);
  const [softwareSearch, setSoftwareSearch] = useState("");
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [requestedRole, setRequestedRole] = useState<string>("");
  const [showPublicView, setShowPublicView] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchProjects();
      fetchJobHistory();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Use secure function to get own complete profile (excluding sensitive data)
      const { data, error } = await supabase
        .rpc('get_own_profile_complete', { _user_id: user?.id });

      if (error) throw error;
      
      // Convert array result to single profile object
      const profileData = data && data.length > 0 ? data[0] : null;
      
      if (profileData) {
        // Extend profile data to match interface with safe defaults for missing fields
        const completeProfile = {
          ...profileData,
          phone: null, // Sensitive data - not included in secure function
          company: null, // Add company field with null default
          phone_verification_code: null, // Sensitive data - not included
          address: null, // Sensitive data - not included
          city: null, // Sensitive data - not included
          postal_code: null // Sensitive data - not included
        };
        
        setProfile(completeProfile);
        
        // Calculate and update total earnings
        const { data: totalEarnings } = await supabase
          .rpc('calculate_user_total_earnings', { 
            user_id_param: user?.id 
          });
          
        if (totalEarnings !== null && profileData.total_earnings !== totalEarnings) {
          setProfile(prev => prev ? { ...prev, total_earnings: totalEarnings } : null);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchJobHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('freelancer_id', user?.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setJobHistory(data || []);
    } catch (error) {
      console.error('Error fetching job history:', error);
    }
  };

  const handleImageUploaded = (imageData: { file_url: string; image_type: 'portrait' | 'logo' }) => {
    toast({
      title: "Billede sendt til godkendelse",
      description: "Dit profilbillede bliver gennemgået af en administrator",
    });
  };

  const handleProjectImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      // Update either editing project or new project
      if (editingProject) {
        setEditingProject(prev => prev ? { ...prev, image_url: data.publicUrl } : null);
      } else {
        setNewProject(prev => ({ ...prev, image_url: data.publicUrl }));
      }
      
      toast({
        title: "Succes",
        description: "Projekt billede uploadet",
      });
    } catch (error) {
      console.error('Error uploading project image:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke uploade projekt billede",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    setSaving(true);
    try {
      // Use secure update function that only allows safe fields
      const { error } = await supabase
        .rpc('update_own_profile_safe', { _updates: updates });

      if (error) throw error;

      // Refresh the profile data after update
      await fetchProfile();
      
      toast({
        title: "Succes",
        description: "Profil opdateret",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke opdatere profil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendPhoneVerification = async () => {
    if (!profile?.phone) {
      toast({
        title: "Fejl",
        description: "Indtast venligst et telefonnummer først",
        variant: "destructive",
      });
      return;
    }

    setSendingVerification(true);
    try {
      // Generate a simple 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      await updateProfile({ phone_verification_code: code });
      
      toast({
        title: "Verifikationskode sendt",
        description: `Koden ${code} er sendt til ${profile.phone}`,
      });
    } catch (error) {
      console.error('Error sending verification:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende verifikationskode",
        variant: "destructive",
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const verifyPhone = async () => {
    if (!profile?.phone_verification_code || !verificationCode) {
      toast({
        title: "Fejl",
        description: "Indtast venligst verifikationskoden",
        variant: "destructive",
      });
      return;
    }

    if (profile.phone_verification_code === verificationCode) {
      await updateProfile({ 
        phone_verified: true, 
        phone_verification_code: null 
      });
      setVerificationCode("");
      toast({
        title: "Succes",
        description: "Telefonnummer verificeret",
      });
    } else {
      toast({
        title: "Fejl",
        description: "Forkert verifikationskode",
        variant: "destructive",
      });
    }
  };

  const toggleActiveStatus = async () => {
    if (!profile) return;
    await updateProfile({ active_status: !profile.active_status });
  };

  const removeSkill = (skillToRemove: string) => {
    if (!profile) return;
    const updatedSkills = (profile.skills || []).filter(skill => skill !== skillToRemove);
    updateProfile({ skills: updatedSkills });
  };

  const addSkill = (skill: string) => {
    if (!profile || !skill.trim()) return;
    
    const currentSkills = profile?.skills || [];
    
    // Check if skill already exists
    if (currentSkills.includes(skill.trim())) return;
    
    // Check max limit
    if (currentSkills.length >= 25) {
      toast({
        title: "Maks antal kompetencer nået",
        description: "Du kan højst have 25 kompetencer",
        variant: "destructive",
      });
      return;
    }
    
    const updatedSkills = [...currentSkills, skill.trim()];
    updateProfile({ skills: updatedSkills });
    setSkillSearch("");
    setSkillsOpen(false);
  };

  const addSoftware = (software: string) => {
    if (!profile || !software.trim()) return;
    
    const currentSoftware = profile?.software_skills || [];
    
    // Check if software already exists
    if (currentSoftware.includes(software.trim())) return;
    
    // Check max limit
    if (currentSoftware.length >= 30) {
      toast({
        title: "Maks antal softwareprogrammer nået",
        description: "Du kan højst have 30 softwareprogrammer",
        variant: "destructive",
      });
      return;
    }
    
    const updatedSoftware = [...currentSoftware, software.trim()];
    updateProfile({ software_skills: updatedSoftware });
    setSoftwareSearch("");
    setSoftwareOpen(false);
  };

  const removeSoftware = (softwareToRemove: string) => {
    if (!profile) return;
    const updatedSoftware = (profile.software_skills || []).filter(software => software !== softwareToRemove);
    updateProfile({ software_skills: updatedSoftware });
  };

  const addProject = async () => {
    if (!user || !newProject.title) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: newProject.title,
          description: newProject.description || null,
          client_name: newProject.client_name || null,
          project_url: newProject.project_url || null,
          image_url: newProject.image_url || null,
          project_type: newProject.project_type || "portfolio",
          technologies: newProject.technologies || null,
          start_date: newProject.start_date || null,
          end_date: newProject.still_working_here ? null : (newProject.end_date || null),
          still_working_here: newProject.still_working_here || false,
        });

      if (error) throw error;

      await fetchProjects();
      setNewProject({
        title: "",
        description: "",
        client_name: "",
        project_url: "",
        image_url: "",
        project_type: "portfolio",
        technologies: [],
        start_date: "",
        end_date: "",
        still_working_here: false
      });
      setShowAddProject(false);
      toast({
        title: "Succes",
        description: "Projekt tilføjet",
      });
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke tilføje projekt",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const editProject = async () => {
    if (!user || !editingProject?.title) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editingProject.title,
          description: editingProject.description || null,
          client_name: editingProject.client_name || null,
          project_url: editingProject.project_url || null,
          image_url: editingProject.image_url || null,
          project_type: editingProject.project_type || "portfolio",
          technologies: editingProject.technologies || null,
          start_date: editingProject.start_date || null,
          end_date: editingProject.still_working_here ? null : (editingProject.end_date || null),
          still_working_here: editingProject.still_working_here || false,
        })
        .eq('id', editingProject.id);

      if (error) throw error;

      await fetchProjects();
      setEditingProject(null);
      toast({
        title: "Succes",
        description: "Projekt opdateret",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke opdatere projekt",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const startEditingProject = (project: Project) => {
    setEditingProject(project);
    setShowAddProject(false);
  };

  const requestRoleChange = async () => {
    if (!user || !requestedRole) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('role_change_requests')
        .insert({
          user_id: user.id,
          current_user_role: profile?.role || 'freelancer',
          requested_role: requestedRole,
          reason: `Bruger anmoder om rolleændring til ${requestedRole}`,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Anmodning sendt",
        description: "Din anmodning om rolleændring er sendt til administratorerne",
      });

      setShowRoleChangeDialog(false);
      setRequestedRole("");
    } catch (error) {
      console.error('Error requesting role change:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende anmodning om rolleændring",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast({
        title: "Succes",
        description: "Projekt slettet",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke slette projekt",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Indlæser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-px h-8 bg-border"></div>
            <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
          </div>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button onClick={() => navigate("/settings")} variant="outline" size="sm" className="w-32">
              Kontosikkerhed
            </Button>
            <BackButton />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className={`grid w-full ${profile?.role === 'freelancer' ? 'grid-cols-3' : 'grid-cols-2'} mb-6`}>
              <TabsTrigger value="profile">Min Profil</TabsTrigger>
              <TabsTrigger value="projects">Projekter</TabsTrigger>
              {profile?.role === 'freelancer' && (
                <TabsTrigger value="economy">Min Økonomi</TabsTrigger>
              )}
            </TabsList>


            <TabsContent value="profile" className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.basic_info')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                     <div className="flex-1 space-y-2">
                       <h2 className="text-xl font-bold">{profile?.full_name || 'Ufuldendt Profil'}</h2>
                       <p className="text-muted-foreground flex items-center gap-1">
                         <Mail className="h-3 w-3" />
                         {user?.email}
                       </p>
                       <div className="flex items-center gap-2">
                        <Badge 
                          variant={profile?.active_status ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={toggleActiveStatus}
                        >
                          {profile?.active_status ? (
                            <>
                              <ToggleRight className="h-3 w-3 mr-1" />
                              Aktiv
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-3 w-3 mr-1" />
                              Inaktiv
                            </>
                          )}
                        </Badge>
                        {profile?.phone_verified && (
                          <Badge variant="outline" className="text-green-600">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verificeret
                          </Badge>
                        )}
                        {profile?.total_earnings > 0 && (
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {profile.total_earnings.toLocaleString('da-DK')} kr optjent
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {profile?.role || 'freelancer'}
                        </Badge>
                        {/* Only show role change for non-admin users */}
                        {userRole !== 'admin' && !profile?.is_admin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRoleChangeDialog(true)}
                            className="h-6 px-2 text-xs"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Ændre rolle
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPublicView(true)}
                          className="h-6 px-2 text-xs"
                        >
                          <User className="h-3 w-3 mr-1" />
                          Se som andre
                        </Button>
                      </div>
                       <p className="text-sm text-muted-foreground">
                         Klik på din status for at ændre tilgængelighed
                       </p>
                     </div>
                   </div>
                   
                   <div className="mt-6">
                     <ProfileImageUpload onImageUploaded={handleImageUploaded} />
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">{t('profile.name')}</Label>
                      <Input
                        id="full_name"
                        value={profile?.full_name || ""}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                        onBlur={() => profile && updateProfile({ full_name: profile.full_name })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="flex gap-2">
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="flex-1"
                        />
                        <EmailChangeDialog currentEmail={user?.email || ""} />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">{t('profile.phone')}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="phone"
                          type="tel"
                          value={profile?.phone || ""}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                          onBlur={() => profile && updateProfile({ phone: profile.phone })}
                          disabled={profile?.phone_verified}
                          className="flex-1"
                        />
                        {!profile?.phone_verified && (
                          <Button
                            onClick={sendPhoneVerification}
                            disabled={sendingVerification || !profile?.phone}
                            size="sm"
                            className="h-9 px-4"
                          >
                            {sendingVerification ? "Sender..." : "Verificer"}
                          </Button>
                        )}
                      </div>
                      {profile?.phone_verified ? (
                        <p className="text-sm text-green-600 mt-1 flex items-center">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Verificeret
                        </p>
                      ) : profile?.phone_verification_code && (
                        <div className="mt-2 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Indtast 6-cifret kode"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              className="flex-1"
                            />
                            <Button onClick={verifyPhone} size="sm" className="h-9 px-4">
                              Bekræft
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Indtast koden: {profile.phone_verification_code}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="company">Virksomhed (valgfrit)</Label>
                      <Input
                        id="company"
                        value={profile?.company || ""}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, company: e.target.value } : null)}
                        onBlur={() => profile && updateProfile({ company: profile.company })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">{t('profile.location')}</Label>
                      <AddressAutocomplete
                        value={profile?.location || ""}
                        onAddressSelect={(addressData) => {
                          setProfile(prev => prev ? { ...prev, location: addressData.location } : null);
                          if (profile) updateProfile({ location: addressData.location });
                        }}
                        placeholder="Søg efter adresse..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="hourly_rate">{t('profile.hourly_rate')}</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        value={profile?.hourly_rate || ""}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, hourly_rate: parseFloat(e.target.value) || 0 } : null)}
                        onBlur={() => profile && updateProfile({ hourly_rate: profile.hourly_rate })}
                        placeholder="kr/time"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Bio */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.about')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Skriv lidt om dig selv, din erfaring og hvad du tilbyder..."
                    value={profile?.bio || ""}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    onBlur={() => profile && updateProfile({ bio: profile.bio })}
                    className="min-h-[120px]"
                  />
                </CardContent>
              </Card>

              {/* Client Fees Section */}
              {profile?.role === 'client' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Platform Gebyrer
                      </CardTitle>
                      <ClientFees 
                        currentFeeRate={profile?.platform_fee_rate || 0.15}
                        reducedFeeUntil={profile?.reduced_fee_until}
                        onUpdate={fetchProfile}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>Dit nuværende platform gebyr er {((profile?.platform_fee_rate || 0.15) * 100).toFixed(0)}%.</p>
                      <p>Dette gebyr trækkes automatisk når du frigiver penge fra escrow til freelancers.</p>
                      {profile?.reduced_fee_until && new Date(profile.reduced_fee_until) > new Date() && (
                        <p className="text-green-600 font-medium mt-2">
                          🎉 Du har særlig rabat til {new Date(profile.reduced_fee_until).toLocaleDateString('da-DK')}!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Honey Drops Section for Freelancers */}
              {profile?.role === 'freelancer' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-amber-500" />
                        Honningdråber
                      </CardTitle>
                      <HoneyDropsBalance 
                        drops={profile?.total_earnings || 0} 
                        onUpdate={fetchProfile} 
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>Honningdråber bruges til at byde på opgaver. Du skal bruge 3 dråber for hvert bud.</p>
                      <p>Får du ikke opgaven, får du automatisk dine dråber tilbage.</p>
                    </div>
                    <HoneyDropsPurchase 
                      currentDrops={profile?.total_earnings || 0}
                      onPurchaseComplete={fetchProfile}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.skills')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      {(profile?.skills || []).length}/25 kompetencer
                    </div>
                    
                    <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={skillsOpen}
                          className="w-full justify-between"
                          disabled={(profile?.skills || []).length >= 25}
                        >
                          {skillSearch || "her kan du indtaste dine skills"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Søg efter kompetencer..." 
                            value={skillSearch}
                            onValueChange={setSkillSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">Ingen forslag fundet.</p>
                                {skillSearch.trim() && (
                                   <Button 
                                     size="sm" 
                                     onClick={() => addSkill(skillSearch)}
                                     className="w-full h-8"
                                   >
                                    Tilføj "{skillSearch}"
                                  </Button>
                                )}
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {COMMON_SKILLS
                                .filter(skill => 
                                  skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
                                  !(profile?.skills || []).includes(skill)
                                )
                                .map((skill) => (
                                  <CommandItem
                                    key={skill}
                                    value={skill}
                                    onSelect={() => addSkill(skill)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        (profile?.skills || []).includes(skill) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {skill}
                                  </CommandItem>
                                ))}
                              {skillSearch.trim() && 
                               !COMMON_SKILLS.some(skill => 
                                 skill.toLowerCase() === skillSearch.toLowerCase()
                               ) && 
                               !(profile?.skills || []).includes(skillSearch.trim()) && (
                                <CommandItem
                                  value={skillSearch}
                                  onSelect={() => addSkill(skillSearch)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Tilføj "{skillSearch}"
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(profile?.skills || []).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeSkill(skill)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Software Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Software Kompetencer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      {(profile?.software_skills || []).length}/30 softwareprogrammer
                      {(profile?.software_skills || []).length < 3 && (
                        <span className="text-destructive ml-2">
                          (Minimum 3 påkrævet)
                        </span>
                      )}
                    </div>
                    
                    <Popover open={softwareOpen} onOpenChange={setSoftwareOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={softwareOpen}
                          className="w-full justify-between"
                          disabled={(profile?.software_skills || []).length >= 30}
                        >
                          {softwareSearch || "Tilføj software kompetencer"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Søg efter software..." 
                            value={softwareSearch}
                            onValueChange={setSoftwareSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">Ingen forslag fundet.</p>
                                {softwareSearch.trim() && (
                                   <Button 
                                     size="sm" 
                                     onClick={() => addSoftware(softwareSearch)}
                                     className="w-full h-8"
                                   >
                                    Tilføj "{softwareSearch}"
                                  </Button>
                                )}
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {COMMON_SOFTWARE
                                .filter(software => 
                                  software.toLowerCase().includes(softwareSearch.toLowerCase()) &&
                                  !(profile?.software_skills || []).includes(software)
                                )
                                .map((software) => (
                                  <CommandItem
                                    key={software}
                                    value={software}
                                    onSelect={() => addSoftware(software)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        (profile?.software_skills || []).includes(software) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {software}
                                  </CommandItem>
                                ))}
                              {softwareSearch.trim() && 
                               !COMMON_SOFTWARE.some(software => 
                                 software.toLowerCase() === softwareSearch.toLowerCase()
                               ) && 
                               !(profile?.software_skills || []).includes(softwareSearch.trim()) && (
                                <CommandItem
                                  value={softwareSearch}
                                  onSelect={() => addSoftware(softwareSearch)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Tilføj "{softwareSearch}"
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(profile?.software_skills || []).map((software, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {software}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeSoftware(software)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Language Skills */}
              <LanguageSkills />

              {/* Referral System */}
              <ReferralSystem />
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              {/* Projects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t('profile.projects')}
                    <Button onClick={() => setShowAddProject(true)} size="sm" className="h-9 px-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Tilføj Projekt
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(showAddProject || editingProject) && (
                    <Card className="p-4">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {editingProject ? 'Rediger projekt' : 'Tilføj nyt projekt'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="project_title">Projekt Titel</Label>
                            <Input
                              id="project_title"
                              value={editingProject ? editingProject.title : (newProject.title || "")}
                              onChange={(e) => {
                                if (editingProject) {
                                  setEditingProject(prev => prev ? { ...prev, title: e.target.value } : null);
                                } else {
                                  setNewProject(prev => ({ ...prev, title: e.target.value }));
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor="client_name">Klient</Label>
                            <Input
                              id="client_name"
                              value={editingProject ? (editingProject.client_name || "") : (newProject.client_name || "")}
                              onChange={(e) => {
                                if (editingProject) {
                                  setEditingProject(prev => prev ? { ...prev, client_name: e.target.value } : null);
                                } else {
                                  setNewProject(prev => ({ ...prev, client_name: e.target.value }));
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="project_description">Beskrivelse</Label>
                          <Textarea
                            id="project_description"
                            value={editingProject ? (editingProject.description || "") : (newProject.description || "")}
                            onChange={(e) => {
                              if (editingProject) {
                                setEditingProject(prev => prev ? { ...prev, description: e.target.value } : null);
                              } else {
                                setNewProject(prev => ({ ...prev, description: e.target.value }));
                              }
                            }}
                          />
                        </div>
                         
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="start_date">Start Dato</Label>
                            <Input
                              id="start_date"
                              type="date"
                              value={editingProject ? (editingProject.start_date || "") : (newProject.start_date || "")}
                              onChange={(e) => {
                                if (editingProject) {
                                  setEditingProject(prev => prev ? { ...prev, start_date: e.target.value } : null);
                                } else {
                                  setNewProject(prev => ({ ...prev, start_date: e.target.value }));
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor="end_date">Slut Dato</Label>
                            <Input
                              id="end_date"
                              type="date"
                              value={editingProject ? 
                                (editingProject.still_working_here ? "" : (editingProject.end_date || "")) : 
                                (newProject.still_working_here ? "" : (newProject.end_date || ""))
                              }
                              onChange={(e) => {
                                if (editingProject) {
                                  setEditingProject(prev => prev ? { ...prev, end_date: e.target.value } : null);
                                } else {
                                  setNewProject(prev => ({ ...prev, end_date: e.target.value }));
                                }
                              }}
                              disabled={editingProject ? editingProject.still_working_here : newProject.still_working_here}
                            />
                            <div className="flex items-center space-x-2 mt-2">
                              <Checkbox
                                id="still_working_here"
                                checked={editingProject ? (editingProject.still_working_here || false) : (newProject.still_working_here || false)}
                                onCheckedChange={(checked) => {
                                  if (editingProject) {
                                    setEditingProject(prev => prev ? { 
                                      ...prev, 
                                      still_working_here: checked === true,
                                      end_date: checked === true ? "" : prev.end_date
                                    } : null);
                                  } else {
                                    setNewProject(prev => ({ 
                                      ...prev, 
                                      still_working_here: checked === true,
                                      end_date: checked === true ? "" : prev.end_date
                                    }));
                                  }
                                }}
                              />
                              <Label htmlFor="still_working_here" className="text-sm">
                                Arbejder her stadig
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="project_url">Projekt URL</Label>
                          <Input
                            id="project_url"
                            type="url"
                            value={editingProject ? (editingProject.project_url || "") : (newProject.project_url || "")}
                            onChange={(e) => {
                              if (editingProject) {
                                setEditingProject(prev => prev ? { ...prev, project_url: e.target.value } : null);
                              } else {
                                setNewProject(prev => ({ ...prev, project_url: e.target.value }));
                              }
                            }}
                          />
                        </div>

                        <div>
                          <Label htmlFor="project_image">Projekt Billede</Label>
                          <div className="space-y-2">
                            <Input
                              id="project_image"
                              type="file"
                              accept="image/*"
                              onChange={handleProjectImageUpload}
                              disabled={uploadingImage}
                            />
                            {uploadingImage && (
                              <p className="text-sm text-muted-foreground">Uploader billede...</p>
                            )}
                            {((editingProject && editingProject.image_url) || (!editingProject && newProject.image_url)) && (
                              <div className="relative">
                                <img 
                                  src={editingProject ? (editingProject.image_url || "") : (newProject.image_url || "")} 
                                  alt="Projekt preview" 
                                  className="w-full h-32 object-cover rounded-md border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => {
                                    if (editingProject) {
                                      setEditingProject(prev => prev ? { ...prev, image_url: "" } : null);
                                    } else {
                                      setNewProject(prev => ({ ...prev, image_url: "" }));
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={editingProject ? editProject : addProject} 
                            disabled={saving} 
                            className="h-9 px-4"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {editingProject ? 'Opdater Projekt' : 'Gem Projekt'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setShowAddProject(false);
                              setEditingProject(null);
                            }} 
                            className="h-9 px-4"
                          >
                            Annuller
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <Card key={project.id} className="relative">
                        {project.image_url && (
                          <div className="relative cursor-pointer" onClick={() => setSelectedImage(project.image_url)}>
                            <img 
                              src={project.image_url} 
                              alt={project.title}
                              className="w-full h-48 object-cover rounded-t-lg hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 rounded-t-lg">
                              <span className="text-white text-sm font-medium">Klik for at forstørre</span>
                            </div>
                          </div>
                        )}
                        {!project.image_url && (
                          <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                            <span className="text-muted-foreground">Ingen billede</span>
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {project.title}
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditingProject(project)}
                                className="text-primary hover:text-primary"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteProject(project.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardTitle>
                          {project.client_name && (
                            <p className="text-sm text-muted-foreground">Klient: {project.client_name}</p>
                          )}
                          {(project.start_date || project.end_date || project.still_working_here) && (
                            <p className="text-sm text-muted-foreground">
                              {project.start_date && new Date(project.start_date).toLocaleDateString('da-DK')}
                              {project.start_date && (project.end_date || project.still_working_here) && ' - '}
                              {project.still_working_here ? 'Nuværende' : (project.end_date && new Date(project.end_date).toLocaleDateString('da-DK'))}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          {project.description && (
                            <p className="text-sm mb-2">{project.description}</p>
                          )}
                          {project.project_url && (
                            <a 
                              href={project.project_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Se projekt →
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {projects.length === 0 && !showAddProject && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Ingen projekter endnu. Tilføj dit første projekt!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {profile?.role === 'freelancer' && (
              <TabsContent value="economy" className="space-y-6">
                {/* Payment Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Min Økonomi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentOverview />
                  </CardContent>
                </Card>

                {/* Completed Jobs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Færdige Opgaver</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {jobHistory.length > 0 ? (
                      <>
                        <div className="space-y-4">
                          {jobHistory.slice(0, 10).map((job) => (
                            <div key={job.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium">{job.title}</h4>
                                <Badge variant="secondary">
                                  {job.completed_at && new Date(job.completed_at).toLocaleDateString('da-DK')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {job.description}
                              </p>
                              {job.final_amount && (
                                <p className="text-sm font-medium text-green-600">
                                  {job.final_amount.toLocaleString('da-DK')} DKK
                                </p>
                              )}
                              {job.skills_required && job.skills_required.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {job.skills_required.map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {jobHistory.length > 10 && (
                          <div className="mt-4 text-center">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowJobHistoryModal(true)}
                              className="h-9 px-4"
                            >
                              Se alle opgaver ({jobHistory.length})
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Ingen færdige opgaver endnu.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Honey Drops Purchase History */}
                <HoneyDropsPurchaseHistory />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Job History Modal */}
      <Dialog open={showJobHistoryModal} onOpenChange={setShowJobHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 pb-4">
            <h2 className="text-xl font-semibold">Alle opgaver</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowJobHistoryModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">
              {jobHistory.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Færdiggjort: {job.completed_at && new Date(job.completed_at).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                    {job.final_amount && (
                      <Badge variant="secondary" className="text-green-600">
                        {job.final_amount.toLocaleString('da-DK')} DKK
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">{job.description}</p>
                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.skills_required.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {job.location && (
                    <p className="text-xs text-muted-foreground">📍 {job.location}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image enlargement modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Forstørret projektbillede"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Anmod om rolleændring</h2>
              <p className="text-sm text-muted-foreground">
                Din nuværende rolle: <strong>{profile?.role || 'freelancer'}</strong>
              </p>
            </div>
            
            <div>
              <Label htmlFor="requested_role">Ønsket rolle</Label>
              <Select value={requestedRole} onValueChange={setRequestedRole}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Vælg rolle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="client">Klient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              Din anmodning vil blive sendt til administratorerne til godkendelse.
            </p>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRoleChangeDialog(false);
                  setRequestedRole("");
                }}
              >
                Annuller
              </Button>
              <Button 
                onClick={requestRoleChange}
                disabled={!requestedRole || saving}
              >
                {saving ? "Sender..." : "Send anmodning"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Public Profile View Dialog */}
      <Dialog open={showPublicView} onOpenChange={setShowPublicView}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b">
            <h2 className="text-xl font-semibold">Sådan ser andre din profil</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPublicView(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto flex-1">
            {user && <PublicProfileView userId={user.id} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;