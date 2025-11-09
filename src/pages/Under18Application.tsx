import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useApi } from "@/contexts/ApiContext";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, CalendarIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface University {
  id: string;
  name: string;
  city: string;
  type: string;
}

const Under18Application = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState<Date>();
  const [languageSkills, setLanguageSkills] = useState<string[]>([]);
  const [newLanguage, setNewLanguage] = useState("");
  const [softwareSkills, setSoftwareSkills] = useState<string[]>([]);
  const [newSoftware, setNewSoftware] = useState("");
  const [codeLanguages, setCodeLanguages] = useState<string[]>([]);
  const [newCodeLanguage, setNewCodeLanguage] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const api = useApi();

  // Common programming languages and software
  const commonLanguages = [
    t("language.danish"),
    t("language.english"),
    t("language.german"),
    t("language.french"),
    t("language.spanish"),
    t("language.italian"),
    t("language.russian"),
    t("language.arabic"),
    t("language.chinese"),
    t("language.japanese")
  ];
  const commonSoftware = ["Microsoft Office", "Adobe Creative Suite", "AutoCAD", "SolidWorks", "Figma", "Sketch", "Canva", "Google Workspace"];
  const commonCodeLanguages = ["JavaScript", "Python", "Java", "C#", "C++", "PHP", "Ruby", "Go", "Swift", "Kotlin", "HTML/CSS", "SQL", "TypeScript", "React", "Vue.js", "Angular", "Node.js"];

  useEffect(() => {
    // Load stored data from localStorage
    const storedData = localStorage.getItem('under18FormData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setEmail(data.email || "");
      if (data.birthday) {
        setBirthday(new Date(data.birthday));
      }
    }

    // Fetch universities
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const universitiesData = await api.universities.getUniversities();
      setUniversities(universitiesData);
    } catch (error: any) {
      console.error('Error fetching universities:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke hente universiteter",
        variant: "destructive",
      });
    }
  };

  const addSkill = (skill: string, currentSkills: string[], setSkills: (skills: string[]) => void) => {
    if (skill.trim() && !currentSkills.includes(skill.trim())) {
      setSkills([...currentSkills, skill.trim()]);
    }
  };

  const removeSkill = (skillToRemove: string, currentSkills: string[], setSkills: (skills: string[]) => void) => {
    setSkills(currentSkills.filter(skill => skill !== skillToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type (PDF only)
      if (file.type !== 'application/pdf') {
        toast({
          title: "Ugyldig filtype",
          description: "Kun PDF filer er tilladt",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fil for stor",
          description: "Filen må maksimalt være 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setCvFile(file);
    }
  };

  const uploadCV = async (file: File): Promise<string | null> => {
    try {
      // Convert file to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          // Remove data:application/pdf;base64, prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error reading CV file:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!birthday) {
      toast({
        title: "Fødselsdato mangler",
        description: "Venligst vælg din fødselsdato",
        variant: "destructive",
      });
      return;
    }

    if (!cvFile) {
      toast({
        title: "CV mangler",
        description: "Venligst upload dit CV",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Convert CV to base64
      const cvBase64 = await uploadCV(cvFile);
      if (!cvBase64) {
        throw new Error("Failed to read CV file");
      }

      // Submit application
      await api.under18.createApplication({
        email,
        birthday: birthday.toISOString().split('T')[0],
        languageSkills,
        softwareSkills,
        codeLanguages,
        educationInstitution: selectedUniversity || undefined,
        cvFile: cvBase64,
        cvFileName: cvFile.name,
      });

      // Clear localStorage
      localStorage.removeItem('under18FormData');

      toast({
        title: "Ansøgning sendt!",
        description: "Din ansøgning er modtaget og vil blive gennemgået. Du vil høre fra os inden for 1-2 uger.",
      });

      navigate('/auth');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke sende ansøgning",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbage til login
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ansøgning for unge under 18 år</CardTitle>
            <CardDescription>
              Som freelancer under 18 år skal du udfylde denne særlige ansøgningsformular. 
              Vi gennemgår alle ansøgninger individuelt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border-input"
                />
              </div>

              {/* Birthday */}
              <div className="space-y-2">
                <Label>Fødselsdato *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-input border-input",
                        !birthday && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthday ? format(birthday, "dd/MM/yyyy") : <span>Vælg fødselsdato</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthday}
                      onSelect={setBirthday}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2000-01-01")
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Language Skills */}
              <div className="space-y-2">
                <Label>Sprogfærdigheder</Label>
                <div className="flex gap-2">
                  <Select value={newLanguage} onValueChange={setNewLanguage}>
                    <SelectTrigger className="flex-1 bg-input border-input">
                      <SelectValue placeholder="Vælg sprog" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonLanguages.map((lang) => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (newLanguage) {
                        addSkill(newLanguage, languageSkills, setLanguageSkills);
                        setNewLanguage("");
                      }
                    }}
                    disabled={!newLanguage}
                  >
                    Tilføj
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {languageSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSkill(skill, languageSkills, setLanguageSkills)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Software Skills */}
              <div className="space-y-2">
                <Label>Software kendskab</Label>
                <div className="flex gap-2">
                  <Select value={newSoftware} onValueChange={setNewSoftware}>
                    <SelectTrigger className="flex-1 bg-input border-input">
                      <SelectValue placeholder="Vælg software" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonSoftware.map((software) => (
                        <SelectItem key={software} value={software}>{software}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (newSoftware) {
                        addSkill(newSoftware, softwareSkills, setSoftwareSkills);
                        setNewSoftware("");
                      }
                    }}
                    disabled={!newSoftware}
                  >
                    Tilføj
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {softwareSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSkill(skill, softwareSkills, setSoftwareSkills)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Code Languages */}
              <div className="space-y-2">
                <Label>Programmering og teknologi</Label>
                <div className="flex gap-2">
                  <Select value={newCodeLanguage} onValueChange={setNewCodeLanguage}>
                    <SelectTrigger className="flex-1 bg-input border-input">
                      <SelectValue placeholder="Vælg teknologi" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonCodeLanguages.map((lang) => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (newCodeLanguage) {
                        addSkill(newCodeLanguage, codeLanguages, setCodeLanguages);
                        setNewCodeLanguage("");
                      }
                    }}
                    disabled={!newCodeLanguage}
                  >
                    Tilføj
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {codeLanguages.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSkill(skill, codeLanguages, setCodeLanguages)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-2">
                <Label>Uddannelsesinstitution (valgfri)</Label>
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                  <SelectTrigger className="bg-input border-input">
                    <SelectValue placeholder="Vælg uddannelsesinstitution" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((uni) => (
                      <SelectItem key={uni.id} value={uni.name}>
                        {uni.name} ({uni.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CV Upload */}
              <div className="space-y-2">
                <Label>Upload CV (PDF) *</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {cvFile ? cvFile.name : "Klik for at uploade dit CV (kun PDF, max 5MB)"}
                    </p>
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sender ansøgning..." : "Send ansøgning"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Under18Application;