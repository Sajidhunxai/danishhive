import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
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

// Backend API response type (camelCase)
interface BackendProject {
  id: string;
  title: string;
  description: string | null;
  clientName: string | null;
  projectUrl: string | null;
  imageUrl: string | null;
  projectType: string;
  startDate: string | null;
  endDate: string | null;
  technologies: string | string[] | null;
  stillWorkingHere?: boolean;
}

// Job History interface
interface JobHistory {
  id: string;
  title: string;
  description: string;
  completed_at: string | null;
  final_amount: number | null;
  skills_required: string[] | null;
  location: string | null;
}

// Profile Update Data interface
interface ProfileUpdateData {
  fullName?: string;
  bio?: string;
  location?: string;
  hourlyRate?: number;
  skills?: string[];
  phoneNumber?: string;
  phoneVerified?: boolean;
  companyName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
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
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([]);
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
      console.log('Fetching profile for user:', user);
      const response = await api.profiles.getMyProfile();
      console.log('Profile API response:', response);
      
      // The API returns { profile: {...} }
      const profileData = response.profile;
      
      console.log('Profile data:', profileData);
      
      if (profileData) {
        // Parse skills from JSON string
        let skills = [];
        if (profileData.skills && typeof profileData.skills === 'string') {
          try {
            skills = JSON.parse(profileData.skills);
          } catch (e) {
            console.error('Error parsing skills:', e);
            skills = [];
          }
        } else if (Array.isArray(profileData.skills)) {
          skills = profileData.skills;
        }
        
        // Map backend profile data to frontend interface
        const completeProfile = {
          id: profileData.id,
          user_id: profileData.userId,
          full_name: profileData.fullName,
          bio: profileData.bio,
          avatar_url: profileData.avatarUrl,
          phone: null, // Phone data not in profile response
          company: profileData.companyName,
          phone_verified: false, // Phone verification not in profile response
          phone_verification_code: null, // Not included in API response
          location: profileData.location,
          hourly_rate: profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : null,
          skills: skills,
          software_skills: [], // Not in current API
          availability: null, // Not in current API
          active_status: true, // Default to active
          total_earnings: profileData.honeyDropsBalance || 0,
          rating: 0, // Not in current API
          rating_count: 0, // Not in current API
          address: profileData.address,
          city: profileData.city,
          postal_code: profileData.postalCode,
          role: 'freelancer', // Default role since not in profile response
          is_admin: false, // Default admin status since not in profile response
          created_at: profileData.createdAt,
          updated_at: profileData.updatedAt,
          birthday: profileData.birthday,
          iban: null, // Not in current API
          bank_name: null, // Not in current API
          account_holder_name: null, // Not in current API
          payment_method: null, // Not in current API
          mitid_verified: false, // Not in current API
          payment_verified: profileData.paymentVerified || false,
          platform_fee_rate: profileData.platformFeeRate || 0.15,
          reduced_fee_until: profileData.reducedFeeUntil
        };
        
        console.log('Mapped profile data:', completeProfile);
        setProfile(completeProfile);
      } else {
        console.log('No profile data found, creating empty profile');
        // Create a basic profile structure if no data is found
        const emptyProfile = {
          id: user?.id || '',
          user_id: user?.id || '',
          full_name: user?.email?.split('@')[0] || 'Unknown User',
          bio: '',
          avatar_url: null,
          phone: null,
          company: null,
          phone_verified: false,
          phone_verification_code: null,
          location: null,
          hourly_rate: null,
          skills: [],
          software_skills: [],
          availability: null,
          active_status: true,
          total_earnings: 0,
          rating: 0,
          rating_count: 0,
          address: null,
          city: null,
          postal_code: null,
          role: 'freelancer',
          is_admin: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          birthday: null,
          iban: null,
          bank_name: null,
          account_holder_name: null,
          payment_method: null,
          mitid_verified: false,
          payment_verified: false,
          platform_fee_rate: 0.15,
          reduced_fee_until: null
        };
        setProfile(emptyProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Create a fallback profile even if API fails
      const fallbackProfile = {
        id: user?.id || '',
        user_id: user?.id || '',
        full_name: user?.email?.split('@')[0] || 'Unknown User',
        bio: '',
        avatar_url: null,
        phone: null,
        company: null,
        phone_verified: false,
        phone_verification_code: null,
        location: null,
        hourly_rate: null,
        skills: [],
        software_skills: [],
        availability: null,
        active_status: true,
        total_earnings: 0,
        rating: 0,
        rating_count: 0,
        address: null,
        city: null,
        postal_code: null,
        role: 'freelancer',
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        birthday: null,
        iban: null,
        bank_name: null,
        account_holder_name: null,
        payment_method: null,
        mitid_verified: false,
        payment_verified: false,
        platform_fee_rate: 0.15,
        reduced_fee_until: null
      };
      setProfile(fallbackProfile);
      
      toast({
        title: t('profile.warning'),
        description: `${t('profile.could_not_fetch', { error: error.message || t('profile.unknown_error') })}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.profiles.getMyProfile();
      const backendProjects = response.profile?.projects || [];
      
      // Map backend camelCase fields to frontend snake_case Project interface
      const mappedProjects: Project[] = backendProjects.map((project: BackendProject) => {
        // Parse technologies if it's a JSON string
        let technologies = null;
        if (project.technologies) {
          if (typeof project.technologies === 'string') {
            try {
              technologies = JSON.parse(project.technologies);
            } catch (e) {
              console.error('Error parsing technologies:', e);
              technologies = [];
            }
          } else if (Array.isArray(project.technologies)) {
            technologies = project.technologies;
          }
        }
        
        return {
          id: project.id,
          title: project.title,
          description: project.description || null,
          client_name: project.clientName || null,
          project_url: project.projectUrl || null,
          image_url: project.imageUrl || null,
          project_type: project.projectType || 'portfolio',
          start_date: project.startDate || null,
          end_date: project.endDate || null,
          technologies: technologies,
          still_working_here: project.stillWorkingHere || (project.endDate === null && project.startDate !== null),
        };
      });
      
      setProjects(mappedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchJobHistory = async () => {
    try {
      // For now, set empty array since we don't have a backend API for job history yet
      // TODO: Implement backend API for job history
      setJobHistory([]);
    } catch (error) {
      console.error('Error fetching job history:', error);
    }
  };

  const handleImageUploaded = (imageData: { file_url: string; image_type: 'portrait' | 'logo' }) => {
      toast({
        title: t('profile.image_sent_approval'),
        description: t('profile.image_review_admin'),
      });
  };

  const handleProjectImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      // Convert file to base64 for backend upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          // Send to backend API for upload
          const token = localStorage.getItem('auth_token');
          const backendUrl = api.getBackendUrl();
          const response = await fetch(`${backendUrl}/profiles/upload-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              image: base64Data,
              imageType: 'project',
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
          }

          const data = await response.json();

      // Update either editing project or new project
      if (editingProject) {
            setEditingProject(prev => prev ? { ...prev, image_url: data.imageUrl } : null);
      } else {
            setNewProject(prev => ({ ...prev, image_url: data.imageUrl }));
      }
      
      toast({
        title: t('profile.success'),
        description: t('profile.project_image_uploaded'),
      });
    } catch (error) {
      console.error('Error uploading project image:', error);
      toast({
        title: t('profile.error'),
        description: t('profile.project_image_failed'),
        variant: "destructive",
      });
    } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading project image:', error);
      toast({
        title: t('profile.error'),
        description: t('profile.project_image_failed'),
        variant: "destructive",
      });
      setUploadingImage(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    setSaving(true);
    try {
      // Map frontend profile fields to backend API fields
      const updateData: ProfileUpdateData = {};
      
      if (updates.full_name !== undefined) updateData.fullName = updates.full_name;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.hourly_rate !== undefined) updateData.hourlyRate = updates.hourly_rate;
      if (updates.skills !== undefined) updateData.skills = updates.skills;
      if (updates.phone !== undefined) updateData.phoneNumber = updates.phone;
      if (updates.phone_verified !== undefined) updateData.phoneVerified = updates.phone_verified;
      if (updates.company !== undefined) updateData.companyName = updates.company;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.postal_code !== undefined) updateData.postalCode = updates.postal_code;

      await api.profiles.updateMyProfile(updateData);

      // Refresh the profile data after update
      await fetchProfile();
      
      toast({
        title: t('profile.success'),
        description: t('profile.profile_updated'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('profile.error'),
        description: t('profile.update_failed'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendPhoneVerification = async () => {
    if (!profile?.phone) {
      toast({
        title: t('profile.error'),
        description: t('profile.enter_phone_first'),
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
        title: t('profile.verification_sent'),
        description: t('profile.code_sent_to', { code, phone: profile.phone }),
      });
    } catch (error) {
      console.error('Error sending verification:', error);
      toast({
        title: t('profile.error'),
        description: t('profile.verification_failed'),
        variant: "destructive",
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const verifyPhone = async () => {
    if (!profile?.phone_verification_code || !verificationCode) {
      toast({
        title: t('profile.error'),
        description: t('profile.enter_verification_code'),
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
        title: t('profile.success'),
        description: t('profile.phone_verified'),
      });
    } else {
      toast({
        title: t('profile.error'),
        description: t('profile.wrong_code'),
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
        title: t('profile.max_skills_reached'),
        description: t('profile.max_skills_description'),
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
        title: t('profile.max_software_reached'),
        description: t('profile.max_software_description'),
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
      await api.profiles.createProject({
          title: newProject.title,
          description: newProject.description || null,
        clientName: newProject.client_name || null,
        projectUrl: newProject.project_url || null,
        imageUrl: newProject.image_url || null,
        projectType: newProject.project_type || "portfolio",
          technologies: newProject.technologies || null,
        startDate: newProject.start_date || null,
        endDate: newProject.still_working_here ? null : (newProject.end_date || null),
        stillWorkingHere: newProject.still_working_here || false,
      });

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
        title: t('profile.success'),
        description: t('profile.project_added'),
      });
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: t('profile.error'),
        description: t('profile.project_add_failed'),
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
      await api.profiles.updateProject(editingProject.id, {
          title: editingProject.title,
          description: editingProject.description || null,
        clientName: editingProject.client_name || null,
        projectUrl: editingProject.project_url || null,
        imageUrl: editingProject.image_url || null,
        projectType: editingProject.project_type || "portfolio",
          technologies: editingProject.technologies || null,
        startDate: editingProject.start_date || null,
        endDate: editingProject.still_working_here ? null : (editingProject.end_date || null),
        stillWorkingHere: editingProject.still_working_here || false,
      });

      await fetchProjects();
      setEditingProject(null);
      toast({
        title: t('profile.success'),
        description: t('profile.project_updated'),
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: t('profile.error'),
        description: t('profile.project_update_failed'),
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
      // For now, just show a message since we don't have a backend API for role change requests yet
      // TODO: Implement backend API for role change requests
      toast({
        title: t('profile.feature_development'),
        description: t('profile.role_change_unavailable'),
        variant: "destructive",
      });

      setShowRoleChangeDialog(false);
      setRequestedRole("");
    } catch (error) {
      console.error('Error requesting role change:', error);
      toast({
        title: t('profile.error'),
        description: t('profile.role_change_failed'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await api.profiles.deleteProject(projectId);

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast({
        title: t('profile.success'),
        description: t('profile.project_deleted'),
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: t('profile.error'),
        description: t('profile.project_delete_failed'),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">{t('common.loading')}</p>
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
              {t('profile.account_security')}
            </Button>
            <BackButton />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className={`grid w-full ${profile?.role === 'freelancer' ? 'grid-cols-3' : 'grid-cols-2'} mb-6`}>
              <TabsTrigger value="profile">{t('profile.my_profile')}</TabsTrigger>
              <TabsTrigger value="projects">{t('profile.projects')}</TabsTrigger>
              {profile?.role === 'freelancer' && (
                <TabsTrigger value="economy">{t('profile.my_economy')}</TabsTrigger>
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
                       <h2 className="text-xl font-bold">{profile?.full_name || t('profile.incomplete_profile')}</h2>
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
                              {t('profile.active')}
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-3 w-3 mr-1" />
                              {t('profile.inactive')}
                            </>
                          )}
                        </Badge>
                        {profile?.phone_verified && (
                          <Badge variant="outline" className="text-green-600">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            {t('profile.verified')}
                          </Badge>
                        )}
                        {profile?.total_earnings > 0 && (
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {profile.total_earnings.toLocaleString('da-DK')} {t('profile.earned')}
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
                            {t('profile.change_role')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPublicView(true)}
                          className="h-6 px-2 text-xs"
                        >
                          <User className="h-3 w-3 mr-1" />
                          {t('profile.view_as_others')}
                        </Button>
                      </div>
                       <p className="text-sm text-muted-foreground">
                         {t('profile.click_status')}
                       </p>
                     </div>
                   </div>
                   
                   <div className="mt-6">
                     <ProfileImageUpload 
                       onImageUploaded={handleImageUploaded}
                       currentImageUrl={profile?.avatar_url}
                     />
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">{t('profile.full_name')}</Label>
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
                            {sendingVerification ? t('profile.sending') : t('profile.verify')}
                          </Button>
                        )}
                      </div>
                      {profile?.phone_verified ? (
                        <p className="text-sm text-green-600 mt-1 flex items-center">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {t('profile.verified')}
                        </p>
                      ) : profile?.phone_verification_code && (
                        <div className="mt-2 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder={t('profile.enter_code')}
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              className="flex-1"
                            />
                            <Button onClick={verifyPhone} size="sm" className="h-9 px-4">
                              {t('profile.confirm')}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t('profile.enter_code_hint', { code: profile.phone_verification_code })}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="company">{t('profile.company_optional')}</Label>
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
                        placeholder={t('profile.search_address')}
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
                        placeholder={t('profile.hourly_rate_placeholder')}
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
                    placeholder={t('profile.bio_placeholder')}
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
                        {t('profile.platform_fees')}
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
                      <p>{t('profile.current_fee', { rate: ((profile?.platform_fee_rate || 0.15) * 100).toFixed(0) })}</p>
                      <p>{t('profile.fee_description')}</p>
                      {profile?.reduced_fee_until && new Date(profile.reduced_fee_until) > new Date() && (
                        <p className="text-green-600 font-medium mt-2">
                          {t('profile.special_discount', { date: new Date(profile.reduced_fee_until).toLocaleDateString('da-DK') })}
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
                        {t('profile.honey_drops')}
                      </CardTitle>
                      <HoneyDropsBalance 
                        drops={profile?.total_earnings || 0} 
                        onUpdate={fetchProfile} 
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>{t('profile.drops_description')}</p>
                      <p>{t('profile.drops_refund')}</p>
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
                      {t('profile.skills_count', { current: (profile?.skills || []).length })}
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
                          {skillSearch || t('profile.skills_placeholder')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder={t('profile.search_skills')} 
                            value={skillSearch}
                            onValueChange={setSkillSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">{t('profile.no_suggestions')}</p>
                                {skillSearch.trim() && (
                                   <Button 
                                     size="sm" 
                                     onClick={() => addSkill(skillSearch)}
                                     className="w-full h-8"
                                   >
                                    {t('profile.add_skill', { skill: skillSearch })}
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
                  <CardTitle>{t('profile.software_skills')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      {t('profile.software_count', { current: (profile?.software_skills || []).length })}
                      {(profile?.software_skills || []).length < 3 && (
                        <span className="text-destructive ml-2">
                          {t('profile.software_minimum')}
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
                          {softwareSearch || t('profile.add_software')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder={t('profile.search_software')} 
                            value={softwareSearch}
                            onValueChange={setSoftwareSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">{t('profile.no_suggestions')}</p>
                                {softwareSearch.trim() && (
                                   <Button 
                                     size="sm" 
                                     onClick={() => addSoftware(softwareSearch)}
                                     className="w-full h-8"
                                   >
                                    {t('profile.add_software_custom', { software: softwareSearch })}
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
                      {t('profile.add_project')}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(showAddProject || editingProject) && (
                    <Card className="p-4">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {editingProject ? t('profile.edit_project') : t('profile.add_new_project')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="project_title">{t('profile.project_title')}</Label>
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
                            <Label htmlFor="client_name">{t('profile.client_label')} {t('common.name')}</Label>
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
                          <Label htmlFor="project_description">{t('profile.description')}</Label>
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
                            <Label htmlFor="start_date">{t('profile.start_date')}</Label>
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
                            <Label htmlFor="end_date">{t('profile.end_date')}</Label>
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
                                {t('profile.still_working')}
                              </Label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="project_url">{t('profile.project_url')}</Label>
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
                          <Label htmlFor="project_image">{t('profile.project_image')}</Label>
                          <div className="space-y-2">
                            <Input
                              id="project_image"
                              type="file"
                              accept="image/*"
                              onChange={handleProjectImageUpload}
                              disabled={uploadingImage}
                            />
                            {uploadingImage && (
                              <p className="text-sm text-muted-foreground">{t('profile.uploading_image')}</p>
                            )}
                            {((editingProject && editingProject.image_url) || (!editingProject && newProject.image_url)) && (
                              <div className="relative">
                                <img 
                                  src={editingProject ? (editingProject.image_url || "") : (newProject.image_url || "")} 
                                  alt={t('profile.project_preview')} 
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
                            {editingProject ? t('profile.update_project') : t('profile.save_project')}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setShowAddProject(false);
                              setEditingProject(null);
                            }} 
                            className="h-9 px-4"
                          >
                            {t('profile.cancel')}
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
                              <span className="text-white text-sm font-medium">{t('profile.click_enlarge')}</span>
                            </div>
                          </div>
                        )}
                        {!project.image_url && (
                          <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                            <span className="text-muted-foreground">{t('profile.no_image')}</span>
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
                            <p className="text-sm text-muted-foreground">{t('profile.client_label', { name: project.client_name })}</p>
                          )}
                          {(project.start_date || project.end_date || project.still_working_here) && (
                            <p className="text-sm text-muted-foreground">
                              {project.start_date && new Date(project.start_date).toLocaleDateString('da-DK')}
                              {project.start_date && (project.end_date || project.still_working_here) && ' - '}
                              {project.still_working_here ? t('profile.current') : (project.end_date && new Date(project.end_date).toLocaleDateString('da-DK'))}
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
                              {t('profile.view_project')}
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {projects.length === 0 && !showAddProject && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>{t('profile.no_projects')}</p>
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
                    <CardTitle>{t('profile.my_economy')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentOverview />
                  </CardContent>
                </Card>

                {/* Completed Jobs */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('profile.completed_jobs')}</CardTitle>
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
                                {t('profile.view_all_jobs', { count: jobHistory.length })}
                              </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t('profile.no_completed_jobs')}</p>
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
            <h2 className="text-xl font-semibold">{t('profile.all_jobs')}</h2>
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
                        {t('profile.completed_at', { date: job.completed_at && new Date(job.completed_at).toLocaleDateString('da-DK') })}
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
                alt={t('profile.enlarged_project_image')}
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
              <h2 className="text-lg font-semibold">{t('profile.request_role_change')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('profile.current_role', { role: profile?.role || 'freelancer' })}
              </p>
            </div>
            
            <div>
              <Label htmlFor="requested_role">{t('profile.desired_role')}</Label>
              <Select value={requestedRole} onValueChange={setRequestedRole}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder={t('profile.select_role')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelancer">{t('profile.freelancer')}</SelectItem>
                  <SelectItem value="client">{t('profile.client')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('profile.role_request_note')}
            </p>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRoleChangeDialog(false);
                  setRequestedRole("");
                }}
              >
                {t('profile.cancel')}
              </Button>
              <Button 
                onClick={requestRoleChange}
                disabled={!requestedRole || saving}
              >
                {saving ? t('profile.sending') : t('profile.send_request')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Public Profile View Dialog */}
      <Dialog open={showPublicView} onOpenChange={setShowPublicView}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center pb-4 border-b">
            <h2 className="text-xl font-semibold">{t('profile.view_as_others_title')}</h2>
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