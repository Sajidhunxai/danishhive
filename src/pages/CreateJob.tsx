import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X, MapPin, Calendar, FileText, Shield } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import JobFileUpload from "@/components/JobFileUpload";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";

const CreateJob = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    budget_min: "",
    budget_max: "",
    deadline: "",
    location: "",
    is_remote: true,
    project_type: "one-time",
    skills_required: [] as string[],
    software_required: [] as string[],
    positions_available: 1,
    requires_approval: true,
    payment_type: "fixed_price", // fixed_price or hourly_rate
    currency: "EUR",
    is_permanent_consultant: false,
    hours_per_week: "",
    contract_duration_weeks: "",
    company_address: "",
    location_type: "remote", // "remote", "fixed", or "hybrid"
    use_company_address: true,
    remote_restriction_type: "none", // "none", "continent", "country"
    allowed_continents: [] as string[],
    allowed_countries: [] as string[]
  });
  
  const [newSkill, setNewSkill] = useState("");
  const [newSoftware, setNewSoftware] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    name: string;
    size: number;
    url: string;
  }>>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile for company address
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('address, city, postal_code, company')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
          // Auto-populate company address if available
          if (profile.address && profile.city && profile.postal_code) {
            const fullAddress = `${profile.address}, ${profile.postal_code} ${profile.city}`;
            setJobData(prev => ({ 
              ...prev, 
              company_address: fullAddress,
              location: profile.city || prev.location
            }));
          }
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const addSkill = () => {
    if (jobData.skills_required.length >= 25) {
      toast({
        title: "Maksimum antal færdigheder nået",
        description: "Du kan højst tilføje 25 færdigheder til en opgave",
        variant: "destructive",
      });
      return;
    }
    
    if (newSkill.trim() && !jobData.skills_required.includes(newSkill.trim())) {
      setJobData(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setJobData(prev => ({
      ...prev,
      skills_required: prev.skills_required.filter(skill => skill !== skillToRemove)
    }));
  };

  const addSoftware = () => {
    if (jobData.software_required.length >= 30) {
      toast({
        title: "Maksimum antal software nået",
        description: "Du kan højst tilføje 30 softwareprogrammer til en opgave",
        variant: "destructive",
      });
      return;
    }
    
    if (newSoftware.trim() && !jobData.software_required.includes(newSoftware.trim())) {
      setJobData(prev => ({
        ...prev,
        software_required: [...prev.software_required, newSoftware.trim()]
      }));
      setNewSoftware("");
    }
  };

  const removeSoftware = (softwareToRemove: string) => {
    setJobData(prev => ({
      ...prev,
      software_required: prev.software_required.filter(software => software !== softwareToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Fejl",
        description: "Du skal være logget ind for at oprette en opgave",
        variant: "destructive",
      });
      return;
    }

    // Validate minimum requirements
    if (jobData.skills_required.length < 3) {
      toast({
        title: "For få færdigheder",
        description: "Du skal angive mindst 3 påkrævede færdigheder",
        variant: "destructive",
      });
      return;
    }

    if (jobData.software_required.length < 3) {
      toast({
        title: "For få softwareprogrammer", 
        description: "Du skal angive mindst 3 påkrævede softwareprogrammer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: createdJob, error } = await supabase.from('jobs').insert([
        {
          title: jobData.title,
          description: jobData.description,
          budget_min: jobData.budget_min ? parseFloat(jobData.budget_min) : null,
          budget_max: jobData.budget_max ? parseFloat(jobData.budget_max) : null,
          deadline: jobData.deadline || null,
          location: jobData.use_company_address && userProfile ? 
            `${userProfile.city || ''}` : 
            (jobData.company_address || jobData.location || null),
          is_remote: jobData.is_remote,
          project_type: jobData.project_type,
          skills_required: jobData.skills_required,
          software_required: jobData.software_required,
          positions_available: jobData.positions_available,
          requires_approval: jobData.requires_approval,
          client_id: user.id,
          status: 'open',
          // New fields
          payment_type: jobData.payment_type,
          currency: jobData.currency,
          is_permanent_consultant: jobData.is_permanent_consultant,
          hours_per_week: jobData.hours_per_week ? parseInt(jobData.hours_per_week) : null,
          contract_duration_weeks: jobData.contract_duration_weeks ? parseInt(jobData.contract_duration_weeks) : null,
          // Remote restriction fields
          remote_restriction_type: jobData.remote_restriction_type,
          allowed_continents: jobData.allowed_continents.length > 0 ? jobData.allowed_continents : null,
          allowed_countries: jobData.allowed_countries.length > 0 ? jobData.allowed_countries : null,
        }
      ]).select().single();

      if (error) throw error;

      // Handle file uploads if any
      if (uploadedFiles.length > 0) {
        const jobId = createdJob.id;
        
        // Move files from temp to job folder and create attachment records
        for (const file of uploadedFiles) {
          const oldPath = `temp/${file.id}.pdf`;
          const newPath = `${jobId}/${file.id}.pdf`;
          
          // Move file in storage
          const { error: moveError } = await supabase.storage
            .from('job-attachments')
            .move(oldPath, newPath);

          if (moveError) {
            console.error('Error moving file:', moveError);
            continue;
          }

          // Create attachment record
          await supabase.from('job_attachments').insert({
            job_id: jobId,
            file_name: file.name,
            file_path: newPath,
            file_size: file.size,
            mime_type: 'application/pdf',
            uploaded_by: user.id,
            is_guideline: true
          });
        }
      }

      toast({
        title: "Opgave oprettet!",
        description: "Din opgave er nu offentliggjort og freelancere kan ansøge",
      });

      navigate('/client');
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast({
        title: "Fejl ved oprettelse",
        description: error.message || "Kunne ikke oprette opgaven. Prøv igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileCompletionGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/client" />
            <h1 className="text-3xl font-bold">Opret ny opgave</h1>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Grundlæggende information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Opgavetitel *</Label>
                <Input
                  id="title"
                  value={jobData.title}
                  onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="F.eks. Udvikling af webshop i React"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse *</Label>
                <Textarea
                  id="description"
                  value={jobData.description}
                  onChange={(e) => setJobData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskriv opgaven i detaljer..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="project_type">Projekttype</Label>
                <Select
                  value={jobData.project_type}
                  onValueChange={(value) => setJobData(prev => ({ ...prev, project_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg projekttype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">Engangsprojekt</SelectItem>
                    <SelectItem value="ongoing">Løbende samarbejde</SelectItem>
                    <SelectItem value="fixed-term">Fastperiode kontrakt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="positions_available">Antal personer der søges</Label>
                <Input
                  id="positions_available"
                  type="number"
                  min="1"
                  max="500"
                  value={jobData.positions_available}
                  onChange={(e) => setJobData(prev => ({ ...prev, positions_available: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Hvor mange freelancere skal du bruge til denne opgave?
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hiring Process */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ansættelsesproces
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Hvordan skal freelancere kunne tage opgaven?</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires_approval"
                      checked={jobData.requires_approval}
                      onCheckedChange={(checked) => setJobData(prev => ({ ...prev, requires_approval: !!checked }))}
                    />
                    <Label htmlFor="requires_approval" className="text-sm">
                      Kræver godkendelse fra virksomheden først
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {jobData.requires_approval 
                      ? "Freelancere skal ansøge og vente på din godkendelse før de kan starte" 
                      : "Freelancere kan acceptere opgaven direkte og starte med det samme"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Løn og deadline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Betalingstype</Label>
                <Select
                  value={jobData.payment_type}
                  onValueChange={(value) => setJobData(prev => ({ ...prev, payment_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg betalingstype" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed_price">Fast pris</SelectItem>
                    <SelectItem value="hourly_rate">Fast time pris</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget_min">
                    {jobData.payment_type === "hourly_rate" ? "Minimum timeløn (EUR/time)" : "Minimum budget (EUR)"}
                  </Label>
                  <Input
                    id="budget_min"
                    type="number"
                    value={jobData.budget_min}
                    onChange={(e) => setJobData(prev => ({ ...prev, budget_min: e.target.value }))}
                    placeholder={jobData.payment_type === "hourly_rate" ? "25" : "1000"}
                  />
                </div>
                <div>
                  <Label htmlFor="budget_max">
                    {jobData.payment_type === "hourly_rate" ? "Maximum timeløn (EUR/time)" : "Maximum budget (EUR)"}
                  </Label>
                  <Input
                    id="budget_max"
                    type="number"
                    value={jobData.budget_max}
                    onChange={(e) => setJobData(prev => ({ ...prev, budget_max: e.target.value }))}
                    placeholder={jobData.payment_type === "hourly_rate" ? "50" : "5000"}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_permanent_consultant"
                  checked={jobData.is_permanent_consultant}
                  onCheckedChange={(checked) => setJobData(prev => ({ ...prev, is_permanent_consultant: !!checked }))}
                />
                <Label htmlFor="is_permanent_consultant">Fast konsulent</Label>
              </div>

              {jobData.is_permanent_consultant && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div>
                    <Label htmlFor="hours_per_week">Timer om ugen</Label>
                    <Input
                      id="hours_per_week"
                      type="number"
                      min="1"
                      max="40"
                      value={jobData.hours_per_week}
                      onChange={(e) => setJobData(prev => ({ ...prev, hours_per_week: e.target.value }))}
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contract_duration_weeks">Kontraktvarighed (uger)</Label>
                    <Input
                      id="contract_duration_weeks"
                      type="number"
                      min="1"
                      value={jobData.contract_duration_weeks}
                      onChange={(e) => setJobData(prev => ({ ...prev, contract_duration_weeks: e.target.value }))}
                      placeholder="12"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={jobData.deadline}
                  onChange={(e) => setJobData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Lokation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Arbejdsplads</Label>
                <Select
                  value={jobData.location_type}
                  onValueChange={(value) => setJobData(prev => ({ 
                    ...prev, 
                    location_type: value,
                    is_remote: value === "remote" 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg arbejdsplads type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Fjernarbejde</SelectItem>
                    <SelectItem value="hybrid">Hybrid (både fjern og lokation)</SelectItem>
                    <SelectItem value="fixed">Fast lokation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(jobData.location_type === "fixed" || jobData.location_type === "hybrid") && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use_company_address"
                      checked={jobData.use_company_address}
                      onCheckedChange={(checked) => setJobData(prev => ({ ...prev, use_company_address: !!checked }))}
                    />
                    <Label htmlFor="use_company_address">Brug virksomhedsadresse fra profil</Label>
                  </div>
                  
                  {!jobData.use_company_address && (
                    <div>
                      <Label htmlFor="company_address">Arbejdsadresse *</Label>
                      <Textarea
                        id="company_address"
                        value={jobData.company_address}
                        onChange={(e) => setJobData(prev => ({ ...prev, company_address: e.target.value }))}
                        placeholder="F.eks. Nørregade 10, 1165 København K, Danmark"
                        rows={3}
                        required={!jobData.use_company_address}
                      />
                    </div>
                  )}
                  
                  {jobData.use_company_address && userProfile && (
                    <div className="p-3 bg-muted rounded-md">
                      <Label className="text-sm font-medium">Valgt adresse:</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {userProfile.address ? `${userProfile.address}, ${userProfile.postal_code} ${userProfile.city}` : 'Ingen adresse fundet i profil'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(jobData.location_type === "remote" || jobData.location_type === "hybrid") && (
                <div className="space-y-4">
                  <div>
                    <Label>Geografisk begrænsning</Label>
                    <Select
                      value={jobData.remote_restriction_type}
                      onValueChange={(value) => setJobData(prev => ({ 
                        ...prev, 
                        remote_restriction_type: value,
                        allowed_continents: [],
                        allowed_countries: []
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg geografisk begrænsning" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ingen begrænsning (globalt)</SelectItem>
                        <SelectItem value="continent">Begræns til kontinent(er)</SelectItem>
                        <SelectItem value="country">Begræns til land(e)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {jobData.remote_restriction_type === "continent" && (
                    <div>
                      <Label>Tilladte kontinenter</Label>
                      <Select
                        onValueChange={(value) => {
                          if (!jobData.allowed_continents.includes(value)) {
                            setJobData(prev => ({
                              ...prev,
                              allowed_continents: [...prev.allowed_continents, value]
                            }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vælg kontinent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe">Europa</SelectItem>
                          <SelectItem value="North America">Nordamerika</SelectItem>
                          <SelectItem value="South America">Sydamerika</SelectItem>
                          <SelectItem value="Asia">Asien</SelectItem>
                          <SelectItem value="Africa">Afrika</SelectItem>
                          <SelectItem value="Oceania">Oceanien</SelectItem>
                        </SelectContent>
                      </Select>
                      {jobData.allowed_continents.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {jobData.allowed_continents.map((continent) => (
                            <div key={continent} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                              {continent}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => setJobData(prev => ({
                                  ...prev,
                                  allowed_continents: prev.allowed_continents.filter(c => c !== continent)
                                }))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {jobData.remote_restriction_type === "country" && (
                    <div>
                      <Label>Tilladte lande</Label>
                      <Select
                        onValueChange={(value) => {
                          if (!jobData.allowed_countries.includes(value)) {
                            setJobData(prev => ({
                              ...prev,
                              allowed_countries: [...prev.allowed_countries, value]
                            }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vælg land" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Denmark">Danmark</SelectItem>
                          <SelectItem value="Sweden">Sverige</SelectItem>
                          <SelectItem value="Norway">Norge</SelectItem>
                          <SelectItem value="Finland">Finland</SelectItem>
                          <SelectItem value="Germany">Tyskland</SelectItem>
                          <SelectItem value="United Kingdom">Storbritannien</SelectItem>
                          <SelectItem value="Netherlands">Holland</SelectItem>
                          <SelectItem value="France">Frankrig</SelectItem>
                          <SelectItem value="Spain">Spanien</SelectItem>
                          <SelectItem value="Italy">Italien</SelectItem>
                          <SelectItem value="Poland">Polen</SelectItem>
                          <SelectItem value="United States">USA</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="India">Indien</SelectItem>
                          <SelectItem value="China">Kina</SelectItem>
                          <SelectItem value="Other">Andet</SelectItem>
                        </SelectContent>
                      </Select>
                      {jobData.allowed_countries.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {jobData.allowed_countries.map((country) => (
                            <div key={country} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                              {country}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => setJobData(prev => ({
                                  ...prev,
                                  allowed_countries: prev.allowed_countries.filter(c => c !== country)
                                }))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="location">Yderligere lokationsinformation (valgfri)</Label>
                <Input
                  id="location"
                  value={jobData.location}
                  onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={jobData.location_type === "remote" ? "F.eks. Tidszone præferencer, mødetider" : "F.eks. Mødesal på 3. sal, parkering tilgængelig"}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Påkrævede færdigheder (3-25 færdigheder)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Tilføj færdighed (f.eks. React, Node.js, Design)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  disabled={jobData.skills_required.length >= 25}
                />
                <Button 
                  type="button" 
                  onClick={addSkill}
                  disabled={jobData.skills_required.length >= 25}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {jobData.skills_required.length}/25 færdigheder tilføjet
                {jobData.skills_required.length < 3 && (
                  <span className="text-destructive ml-2">
                    (Minimum 3 påkrævet)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {jobData.skills_required.map((skill) => (
                  <div
                    key={skill}
                    className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Software */}
          <Card>
            <CardHeader>
              <CardTitle>Påkrævede software (3-30 programmer)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSoftware}
                  onChange={(e) => setNewSoftware(e.target.value)}
                  placeholder="Tilføj software (f.eks. Adobe Photoshop, Figma, VS Code)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSoftware())}
                  disabled={jobData.software_required.length >= 30}
                />
                <Button 
                  type="button" 
                  onClick={addSoftware}
                  disabled={jobData.software_required.length >= 30}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {jobData.software_required.length}/30 softwareprogrammer tilføjet
                {jobData.software_required.length < 3 && (
                  <span className="text-destructive ml-2">
                    (Minimum 3 påkrævet)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {jobData.software_required.map((software) => (
                  <div
                    key={software}
                    className="bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {software}
                    <button
                      type="button"
                      onClick={() => removeSoftware(software)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <JobFileUpload 
            onFilesChange={setUploadedFiles}
            uploadedFiles={uploadedFiles}
          />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/client')}
            >
              Annuller
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Opretter..." : "Opret opgave"}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </ProfileCompletionGuard>
  );
};

export default CreateJob;