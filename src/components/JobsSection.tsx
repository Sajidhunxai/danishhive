import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Clock, Building, Users, Search, CheckCircle, User } from "lucide-react";
import { CompleteJobDialog } from "@/components/CompleteJobDialog";
import { useLanguage } from "@/contexts/LanguageContext";
interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  skills_required: string[] | null;
  project_type: string;
  location: string | null;
  is_remote: boolean;
  deadline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  client_profile?: {
    full_name: string | null;
    avatar_url: string | null;
    company: string | null;
  }[];
}

const JobsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddJob, setShowAddJob] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [completeJobDialog, setCompleteJobDialog] = useState<{ isOpen: boolean; job: Job | null }>({
    isOpen: false,
    job: null
  });
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    budget_min: "",
    budget_max: "",
    skills_required: [] as string[],
    project_type: "one-time",
    location: "",
    is_remote: true,
    deadline: ""
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (userRole) {
      fetchJobs();
    } else if (!user) {
      setLoading(false);
    }
  }, [userRole, user]);

  const fetchUserRole = async () => {
    try {
      const profile = await api.profiles.getMyProfile();
      setUserRole(profile.user?.userType || 'freelancer');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('freelancer'); // Default to freelancer
    }
  };

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery]);

  useEffect(() => {
    // Set a maximum loading time of 5 seconds to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('JobsSection loading timeout - forcing completion');
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  const filterJobs = () => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = jobs.filter(job => {
      const matchesTitle = job.title.toLowerCase().includes(query);
      const matchesDescription = job.description.toLowerCase().includes(query);
      const matchesLocation = job.location?.toLowerCase().includes(query) || false;
      const matchesSkills = job.skills_required?.some(skill => 
        skill.toLowerCase().includes(query)
      ) || false;
      
      return matchesTitle || matchesDescription || matchesLocation || matchesSkills;
    });
    
    setFilteredJobs(filtered);
  };

  const fetchJobs = async () => {
    if (!userRole || !user) {
      setLoading(false);
      return;
    }

    try {
      const jobs = await api.jobs.getAllJobs();
      setJobs(jobs || []);
      setFilteredJobs(jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const addJob = async () => {
    if (!user || !newJob.title || !newJob.description) {
      toast({
        title: "Fejl",
        description: "Udfyld titel og beskrivelse",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await api.jobs.createJob({
        title: newJob.title,
        description: newJob.description,
        budgetMin: newJob.budget_min ? parseFloat(newJob.budget_min) : null,
        budgetMax: newJob.budget_max ? parseFloat(newJob.budget_max) : null,
        skillsRequired: newJob.skills_required.length > 0 ? newJob.skills_required : null,
        projectType: newJob.project_type,
        location: newJob.location || null,
        isRemote: newJob.is_remote,
        deadline: newJob.deadline || null,
      });

      await fetchJobs();
      setNewJob({
        title: "",
        description: "",
        budget_min: "",
        budget_max: "",
        skills_required: [],
        project_type: "one-time",
        location: "",
        is_remote: true,
        deadline: ""
      });
      setShowAddJob(false);
      toast({
        title: "Succes",
        description: "Opgave oprettet",
      });
    } catch (error) {
      console.error('Error adding job:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke oprette opgave",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim() || newJob.skills_required.includes(newSkill.trim())) return;
    setNewJob(prev => ({ ...prev, skills_required: [...prev.skills_required, newSkill.trim()] }));
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setNewJob(prev => ({ ...prev, skills_required: prev.skills_required.filter(s => s !== skill) }));
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "Budget ikke angivet";
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} DKK`;
    if (min) return `Fra ${min.toLocaleString()} DKK`;
    if (max) return `Op til ${max.toLocaleString()} DKK`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Indlæser opgaver...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6" />
          <h2 className="text-2xl font-bold text-foreground">
          {userRole === 'client' ? t("jobs.myTasks") : t("jobs.availableTasks")}
          </h2>
        </div>
        {userRole === 'client' && (
          <Button onClick={() => setShowAddJob(true)} className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            {t("jobs.createTask")}
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("jobs.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {showAddJob && userRole === 'client' && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>{t("jobs.newTask")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title">{t("jobs.title")}</Label>
                <Input
                  id="job_title"
                  value={newJob.title}
                  onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t("jobs.titlePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="project_type">{t("jobs.type")}</Label>
                <select
                  id="project_type"
                  value={newJob.project_type}
                  onChange={(e) => setNewJob(prev => ({ ...prev, project_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="one-time">{t("jobs.type.oneTime")}</option>
                  <option value="ongoing">{t("jobs.type.ongoing")}</option>
                  <option value="hourly">{t("jobs.type.hourly")}</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="job_description">{t("jobs.description")}</Label>
              <Textarea
                id="job_description"
                value={newJob.description}
                onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t("jobs.descriptionPlaceholder")}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                    <Label htmlFor="budget_min">{t("jobs.minBudget")}</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={newJob.budget_min}
                  onChange={(e) => setNewJob(prev => ({ ...prev, budget_min: e.target.value }))}
                  placeholder={t("jobs.minBudgetPlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="budget_max">{t("jobs.maxBudget")}</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={newJob.budget_max}
                  onChange={(e) => setNewJob(prev => ({ ...prev, budget_max: e.target.value }))}
                  placeholder={t("jobs.maxBudgetPlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="deadline">{t("jobs.deadline")}</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newJob.deadline}
                  onChange={(e) => setNewJob(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">{t("jobs.location")}</Label>
                <Input
                  id="location"
                  value={newJob.location}
                  onChange={(e) => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={t("jobs.locationPlaceholder")}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="is_remote"
                  checked={newJob.is_remote}
                  onChange={(e) => setNewJob(prev => ({ ...prev, is_remote: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_remote">{t("jobs.remoteOption")}</Label>
              </div>
            </div>

            <div>
              <Label>{t("jobs.skillsRequired")}</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder={t("jobs.addSkillPlaceholder")}
                  />
                  <Button onClick={addSkill} type="button" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newJob.skills_required.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="ml-1">×</button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addJob} disabled={saving}>
                {saving ? t("jobs.creating") : t("jobs.createTask")}
              </Button>
              <Button onClick={() => setShowAddJob(false)} variant="outline">
                {t("jobs.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">{t("jobs.noJobsFound", { query: searchQuery })}</p>
                <p className="text-sm text-muted-foreground">{t("jobs.tryAnother")}</p>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("jobs.noJobsAvailable")}</p>
                <p className="text-sm text-muted-foreground">{t("jobs.firstToCreate")}</p>
              </>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{job.project_type}</Badge>
                    {job.is_remote && <Badge variant="secondary">{t("jobs.remote")}</Badge>}
                  </div>
                  
                  {/* Client Info */}
                  {job.client_profile && job.client_profile[0] && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                        {job.client_profile[0].avatar_url ? (
                          <img 
                            src={job.client_profile[0].avatar_url} 
                            alt={t("jobs.clientLogo")} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </div>
                      <span className="font-medium">
                        {job.client_profile[0].company || job.client_profile[0].full_name || t("jobs.anonymousClient")}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm line-clamp-3">{job.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span>{formatBudget(job.budget_min, job.budget_max)}</span>
                  </div>
                  
                  {job.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  
                  {job.deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{t("jobs.deadlineLabel", { date: formatDate(job.deadline) })}</span>
                    </div>
                  )}
                </div>

                {job.skills_required && job.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.skills_required.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills_required.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.skills_required.length - 3} {t("jobs.moreSkills")}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      size="sm"
                      onClick={() => navigate(`/job/${job.id}`)}
                    >
                      {t("jobs.viewDetails")}
                    </Button>
                    {job.status === 'open' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setCompleteJobDialog({ isOpen: true, job })}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                          {t("jobs.completed")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Complete Job Dialog */}
      {completeJobDialog.job && (
        <CompleteJobDialog
          job={completeJobDialog.job}
          isOpen={completeJobDialog.isOpen}
          onClose={() => setCompleteJobDialog({ isOpen: false, job: null })}
          onComplete={() => {
            fetchJobs(); // Refresh jobs list
            setCompleteJobDialog({ isOpen: false, job: null });
          }}
        />
      )}
    </div>
  );
};

export default JobsSection;