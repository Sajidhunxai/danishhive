import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/contexts/ApiContext";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

export interface JobData {
  title: string;
  description: string;
  budget_min: string;
  budget_max: string;
  deadline: string;
  location: string;
  is_remote: boolean;
  project_type: string;
  skills_required: string[];
  software_required: string[];
  positions_available: number;
  requires_approval: boolean;
  payment_type: "fixed_price" | "hourly_rate";
  currency: string;
  is_permanent_consultant: boolean;
  hours_per_week: string;
  contract_duration_weeks: string;
  company_address: string;
  location_type: "remote" | "fixed" | "hybrid";
  use_company_address: boolean;
  remote_restriction_type: "none" | "continent" | "country";
  allowed_continents: string[];
  allowed_countries: string[];
}

interface UserProfile {
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

interface CreateJobContextValue {
  jobData: JobData;
  updateJobData: (field: keyof JobData, value: any) => void;
  setJobData: React.Dispatch<React.SetStateAction<JobData>>;
  newSkill: string;
  setNewSkill: (value: string) => void;
  newSoftware: string;
  setNewSoftware: (value: string) => void;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  addSkill: () => void;
  removeSkill: (skill: string) => void;
  addSoftware: () => void;
  removeSoftware: (software: string) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  loading: boolean;
  userProfile: UserProfile | null;
}

const defaultJobData: JobData = {
  title: "",
  description: "",
  budget_min: "",
  budget_max: "",
  deadline: "",
  location: "",
  is_remote: true,
  project_type: "one-time",
  skills_required: [],
  software_required: [],
  positions_available: 1,
  requires_approval: true,
  payment_type: "fixed_price",
  currency: "EUR",
  is_permanent_consultant: false,
  hours_per_week: "",
  contract_duration_weeks: "",
  company_address: "",
  location_type: "remote",
  use_company_address: true,
  remote_restriction_type: "none",
  allowed_continents: [],
  allowed_countries: [],
};

const CreateJobContext = createContext<CreateJobContextValue | null>(null);

export const CreateJobProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = useApi();
  const navigate = useNavigate();

  const [jobData, setJobData] = useState<JobData>({ ...defaultJobData });
  const [newSkill, setNewSkill] = useState("");
  const [newSoftware, setNewSoftware] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const updateJobData = useCallback((field: keyof JobData, value: any) => {
    setJobData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const profile = await api.profiles.getMyProfile();
        if (profile) {
          setUserProfile(profile);

          if (profile.address && profile.postalCode && profile.city) {
            const fullAddress = `${profile.address}, ${profile.postalCode} ${profile.city}`;
            setJobData((prev) => ({
              ...prev,
              company_address: fullAddress,
              location: profile.city || prev.location,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [api.profiles, user]);

  const addSkill = useCallback(() => {
    const normalized = newSkill.trim();
    if (!normalized) {
      return;
    }

    const normalizedValue = normalized.toLowerCase();
    const existing = jobData.skills_required.map((skill) => skill.toLowerCase());

    if (jobData.skills_required.length >= 25) {
      toast({
        title: "Maksimum antal færdigheder nået",
        description: "Du kan højst tilføje 25 færdigheder til en opgave",
        variant: "destructive",
      });
      return;
    }

    if (existing.includes(normalizedValue)) {
      toast({
        title: "Færdighed findes allerede",
        description: "Denne færdighed er allerede tilføjet til opgaven",
        variant: "destructive",
      });
      return;
    }

    updateJobData("skills_required", [...jobData.skills_required, normalized]);
    setNewSkill("");
  }, [jobData.skills_required, newSkill, toast, updateJobData]);

  const removeSkill = useCallback(
    (skillToRemove: string) => {
      updateJobData(
        "skills_required",
        jobData.skills_required.filter(
          (skill) => skill.toLowerCase() !== skillToRemove.toLowerCase(),
        ),
      );
    },
    [jobData.skills_required, updateJobData],
  );

  const addSoftware = useCallback(() => {
    const normalized = newSoftware.trim();

    if (!normalized) {
      return;
    }

    const normalizedValue = normalized.toLowerCase();
    const existing = jobData.software_required.map((software) => software.toLowerCase());

    if (jobData.software_required.length >= 30) {
      toast({
        title: "Maksimum antal software nået",
        description: "Du kan højst tilføje 30 softwareprogrammer til en opgave",
        variant: "destructive",
      });
      return;
    }

    if (existing.includes(normalizedValue)) {
      toast({
        title: "Software findes allerede",
        description: "Dette software er allerede tilføjet til opgaven",
        variant: "destructive",
      });
      return;
    }

    updateJobData("software_required", [...jobData.software_required, normalized]);
    setNewSoftware("");
  }, [jobData.software_required, newSoftware, toast, updateJobData]);

  const removeSoftware = useCallback(
    (softwareToRemove: string) => {
      updateJobData(
        "software_required",
        jobData.software_required.filter(
          (software) => software.toLowerCase() !== softwareToRemove.toLowerCase(),
        ),
      );
    },
    [jobData.software_required, updateJobData],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!user) {
        toast({
          title: "Fejl",
          description: "Du skal være logget ind for at oprette en opgave",
          variant: "destructive",
        });
        return;
      }

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
        const budget =
          jobData.budget_min && jobData.budget_max
            ? (parseFloat(jobData.budget_min) + parseFloat(jobData.budget_max)) / 2
            : jobData.budget_min
            ? parseFloat(jobData.budget_min)
            : null;

        const jobPayload = {
          title: jobData.title,
          description: jobData.description,
          budget,
          hourlyRate:
            jobData.payment_type === "hourly_rate" && jobData.budget_min ? parseFloat(jobData.budget_min) : null,
          location: jobData.use_company_address && userProfile
            ? userProfile.city || ""
            : jobData.company_address || jobData.location || null,
          skills: jobData.skills_required,
        software: jobData.software_required,
          deadline: jobData.deadline || null,
          attachments: uploadedFiles.map((file) => ({
            fileId: file.id,
            fileName: file.name,
            fileUrl: file.url,
            fileSize: file.size,
          })),
          metadata: {
            budget_min: jobData.budget_min ? parseFloat(jobData.budget_min) : null,
            budget_max: jobData.budget_max ? parseFloat(jobData.budget_max) : null,
            is_remote: jobData.is_remote,
            project_type: jobData.project_type,
            software_required: jobData.software_required,
            positions_available: jobData.positions_available,
            requires_approval: jobData.requires_approval,
            payment_type: jobData.payment_type,
            currency: jobData.currency,
            is_permanent_consultant: jobData.is_permanent_consultant,
            hours_per_week: jobData.hours_per_week ? parseInt(jobData.hours_per_week, 10) : null,
            contract_duration_weeks: jobData.contract_duration_weeks
              ? parseInt(jobData.contract_duration_weeks, 10)
              : null,
            remote_restriction_type: jobData.remote_restriction_type,
            allowed_continents: jobData.allowed_continents.length > 0 ? jobData.allowed_continents : null,
            allowed_countries: jobData.allowed_countries.length > 0 ? jobData.allowed_countries : null,
          },
        };

        const createdJob = await api.jobs.createJob(jobPayload);

        if (uploadedFiles.length > 0 && createdJob?.id) {
          const fileIds = uploadedFiles.map((file) => file.id);
          try {
            await api.upload.moveTempFilesToJob(createdJob.id, fileIds);
          } catch (fileError) {
            console.error("Error moving files to job folder:", fileError);
          }
        }

        toast({
          title: "Opgave oprettet!",
          description: "Din opgave er nu offentliggjort og freelancere kan ansøge",
        });

        navigate("/client");
      } catch (error: unknown) {
        console.error("Error creating job:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Kunne ikke oprette opgaven. Prøv igen.";
        toast({
          title: "Fejl ved oprettelse",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [api.jobs, api.upload, jobData, navigate, toast, uploadedFiles, user, userProfile],
  );

  const value = useMemo<CreateJobContextValue>(
    () => ({
      jobData,
      updateJobData,
      setJobData,
      newSkill,
      setNewSkill,
      newSoftware,
      setNewSoftware,
      uploadedFiles,
      setUploadedFiles,
      addSkill,
      removeSkill,
      addSoftware,
      removeSoftware,
      handleSubmit,
      loading,
      userProfile,
    }),
    [
      jobData,
      updateJobData,
      newSkill,
      newSoftware,
      uploadedFiles,
      addSkill,
      removeSkill,
      addSoftware,
      removeSoftware,
      handleSubmit,
      loading,
      userProfile,
    ],
  );

  return <CreateJobContext.Provider value={value}>{children}</CreateJobContext.Provider>;
};

export const useCreateJob = () => {
  const context = useContext(CreateJobContext);
  if (!context) {
    throw new Error("useCreateJob must be used within a CreateJobProvider");
  }
  return context;
};


