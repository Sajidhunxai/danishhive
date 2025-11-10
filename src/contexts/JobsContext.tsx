import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useApi } from "@/contexts/ApiContext";

export interface JobSummary {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  projectType: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  status: string | null;
  deadline: string | null;
  createdAt: string | null;
}

export interface JobClientProfile {
  fullName: string | null;
  avatarUrl: string | null;
  location: string | null;
  companyName: string | null;
}

export interface JobDetail {
  id: string;
  title: string;
  description: string;
  skillsRequired: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  location: string | null;
  isRemote: boolean;
  deadline: string | null;
  status: string;
  projectType: string;
  paymentType: string;
  createdAt: string;
  clientId: string;
  clientProfile: JobClientProfile | null;
}

export interface JobApplicationItem {
  id: string;
  applicantId: string;
  coverLetter: string | null;
  proposedRate: number | null;
  availability: string | null;
  status: string;
  appliedAt: string;
  applicantProfile: {
    fullName: string | null;
    avatarUrl: string | null;
    location: string | null;
    skills: string[];
  } | null;
}

interface JobDetailState {
  job: JobDetail | null;
  loading: boolean;
  error: string | null;
  applications: JobApplicationItem[];
  applicationsLoading: boolean;
  applicationsError: string | null;
}

interface JobsContextValue {
  jobs: JobSummary[];
  jobsLoading: boolean;
  jobsError: string | null;
  loadJobs: (filters?: Record<string, any>) => Promise<JobSummary[]>;
  getJobState: (id: string) => JobDetailState | undefined;
  loadJob: (id: string, options?: { includeApplications?: boolean; force?: boolean }) => Promise<JobDetail | null>;
  loadJobApplications: (id: string, options?: { force?: boolean }) => Promise<JobApplicationItem[]>;
  clearJobState: (id: string) => void;
}

const JobsContext = createContext<JobsContextValue | null>(null);

const createInitialJobDetailState = (): JobDetailState => ({
  job: null,
  loading: false,
  error: null,
  applications: [],
  applicationsLoading: false,
  applicationsError: null,
});

const extractErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object") {
    const maybeError = error as { message?: string; response?: { data?: any } };
    if (maybeError.response?.data?.error) {
      return String(maybeError.response.data.error);
    }
    if (Array.isArray(maybeError.response?.data?.errors)) {
      return maybeError.response?.data?.errors.map((entry: any) => entry?.message || entry?.msg || entry).join(", ");
    }
    if (maybeError.message) {
      return maybeError.message;
    }
  }
  return "Kunne ikke hente opgaveoplysninger.";
};

const parseSkills = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((skill) => String(skill));
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((skill) => String(skill));
      }
    } catch {
      return value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const normalizeJobSummary = (job: any): JobSummary => {
  const budgetMin = job?.budgetMin ?? job?.budget_min ?? null;
  const budgetMax = job?.budgetMax ?? job?.budget_max ?? null;

  return {
    id: String(job?.id ?? ""),
    title: job?.title || "Projekt",
    description: job?.description ?? job?.summary ?? null,
    location: job?.location ?? job?.city ?? null,
    projectType: job?.projectType ?? job?.project_type ?? null,
    budgetMin: typeof budgetMin === "number" ? budgetMin : budgetMin ? Number(budgetMin) : null,
    budgetMax: typeof budgetMax === "number" ? budgetMax : budgetMax ? Number(budgetMax) : null,
    status: job?.status ?? null,
    deadline: job?.deadline ?? job?.closingDate ?? job?.closing_date ?? null,
    createdAt: job?.createdAt ?? job?.created_at ?? job?.postedAt ?? job?.posted_at ?? null,
  };
};

const mapJobDetail = (job: any): JobDetail => {
  const budgetValue = job?.budget ?? null;
  const normalizedBudget = typeof budgetValue === "number" ? budgetValue : budgetValue ? Number(budgetValue) : null;

  return {
    id: String(job?.id ?? ""),
    title: job?.title ?? "Projekt",
    description: job?.description ?? "",
    skillsRequired: parseSkills(job?.skills),
    budgetMin: normalizedBudget,
    budgetMax: normalizedBudget,
    location: job?.location ?? null,
    isRemote: !job?.location || String(job.location).toLowerCase().includes("remote"),
    deadline: job?.deadline ?? null,
    status: job?.status ?? "open",
    projectType: job?.projectType ?? job?.project_type ?? "one-time",
    paymentType: job?.paymentType ?? job?.payment_type ?? "fixed",
    createdAt: job?.createdAt ?? job?.created_at ?? new Date().toISOString(),
    clientId: job?.clientId ?? job?.client_id ?? "",
    clientProfile: job?.client?.profile
      ? {
          fullName: job.client.profile.fullName ?? null,
          avatarUrl: job.client.profile.avatarUrl ?? null,
          location: job.client.profile.location ?? null,
          companyName: job.client.profile.companyName ?? null,
        }
      : null,
  };
};

const mapJobApplication = (application: any): JobApplicationItem => ({
  id: String(application?.id ?? ""),
  applicantId: String(application?.freelancerId ?? application?.applicantId ?? ""),
  coverLetter: application?.coverLetter ?? application?.cover_letter ?? null,
  proposedRate: application?.proposedRate
    ? Number(application.proposedRate)
    : application?.proposed_rate
    ? Number(application.proposed_rate)
    : null,
  availability: application?.availability ?? null,
  status: application?.status ?? "pending",
  appliedAt: application?.submittedAt ?? application?.applied_at ?? new Date().toISOString(),
  applicantProfile: application?.freelancer?.profile
    ? {
        fullName: application.freelancer.profile.fullName ?? null,
        avatarUrl: application.freelancer.profile.avatarUrl ?? null,
        location: application.freelancer.profile.location ?? null,
        skills: parseSkills(application.freelancer.profile.skills),
      }
    : null,
});

export const JobsProvider = ({ children }: { children: ReactNode }) => {
  const api = useApi();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobStates, setJobStates] = useState<Record<string, JobDetailState>>({});
  const jobsRequestRef = useRef<string | null>(null);

  const loadJobs = useCallback(
    async (filters?: Record<string, any>) => {
      const serializedFilters = JSON.stringify(filters ?? {});
      if (jobsRequestRef.current === serializedFilters && jobs.length > 0 && !jobsLoading) {
        return jobs;
      }

      jobsRequestRef.current = serializedFilters;
      setJobsLoading(true);
      setJobsError(null);

      try {
        const response = await api.jobs.getAllJobs(filters);
        const normalized = Array.isArray(response) ? response.map(normalizeJobSummary) : [];
        setJobs(normalized);
        setJobsError(null);
        return normalized;
      } catch (error) {
        const message = extractErrorMessage(error);
        setJobsError(message);
        setJobs([]);
        return [];
      } finally {
        setJobsLoading(false);
      }
    },
    [api.jobs, jobs, jobsLoading],
  );

  const getJobState = useCallback(
    (id: string) => {
      if (!id) return undefined;
      return jobStates[id];
    },
    [jobStates],
  );

  const loadJobApplications = useCallback(
    async (id: string, options?: { force?: boolean }) => {
      if (!id) return [];

      setJobStates((prev) => {
        const previous = prev[id] ?? createInitialJobDetailState();
        if (previous.applicationsLoading && !options?.force) {
          return prev;
        }
        return {
          ...prev,
          [id]: {
            ...previous,
            applicationsLoading: true,
            applicationsError: null,
          },
        };
      });

      try {
        const response = await api.applications.getJobApplications(id);
        const mapped = Array.isArray(response) ? response.map(mapJobApplication) : [];

        setJobStates((prev) => {
          const previous = prev[id] ?? createInitialJobDetailState();
          return {
            ...prev,
            [id]: {
              ...previous,
              applications: mapped,
              applicationsLoading: false,
              applicationsError: null,
            },
          };
        });

        return mapped;
      } catch (error) {
        const message = extractErrorMessage(error);
        setJobStates((prev) => {
          const previous = prev[id] ?? createInitialJobDetailState();
          return {
            ...prev,
            [id]: {
              ...previous,
              applicationsLoading: false,
              applicationsError: message,
            },
          };
        });
        return [];
      }
    },
    [api.applications],
  );

  const loadJob = useCallback(
    async (id: string, options?: { includeApplications?: boolean; force?: boolean }) => {
      if (!id) return null;

      setJobStates((prev) => {
        const previous = prev[id] ?? createInitialJobDetailState();
        if (previous.loading && !options?.force) {
          return prev;
        }

        return {
          ...prev,
          [id]: {
            ...previous,
            loading: true,
            error: null,
          },
        };
      });

      try {
        const response = await api.jobs.getJobById(id);
        const detail = mapJobDetail(response);

        setJobStates((prev) => {
          const previous = prev[id] ?? createInitialJobDetailState();
          return {
            ...prev,
            [id]: {
              ...previous,
              job: detail,
              loading: false,
              error: null,
            },
          };
        });

        if (options?.includeApplications) {
          await loadJobApplications(id, { force: options.force });
        }

        return detail;
      } catch (error) {
        const message = extractErrorMessage(error);
        setJobStates((prev) => {
          const previous = prev[id] ?? createInitialJobDetailState();
          return {
            ...prev,
            [id]: {
              ...previous,
              loading: false,
              error: message,
            },
          };
        });

        return null;
      }
    },
    [api.jobs, loadJobApplications],
  );

  const clearJobState = useCallback((id: string) => {
    setJobStates((prev) => {
      if (!prev[id]) return prev;
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }, []);

  const value = useMemo<JobsContextValue>(
    () => ({
      jobs,
      jobsLoading,
      jobsError,
      loadJobs,
      getJobState,
      loadJob,
      loadJobApplications,
      clearJobState,
    }),
    [jobs, jobsLoading, jobsError, loadJobs, getJobState, loadJob, loadJobApplications, clearJobState],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};

export const useJobs = (): JobsContextValue => {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
};


