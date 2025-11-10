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

export interface FreelancerSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  location: string | null;
  hourlyRate: number | null;
  skills: string[];
  bio: string | null;
}

export interface FreelancerDetail extends FreelancerSummary {
  userId: string;
  availability: string | null;
  rating: number;
  ratingCount: number;
  createdAt: string | null;
  projects: any[];
  languageSkills: any[];
  jobHistory: any[];
}

interface FreelancerDetailState {
  profile: FreelancerDetail | null;
  loading: boolean;
  error: string | null;
}

interface FreelancersContextValue {
  freelancers: FreelancerSummary[];
  freelancersLoading: boolean;
  freelancersError: string | null;
  loadFreelancers: (filters?: Record<string, any>) => Promise<FreelancerSummary[]>;
  getFreelancerState: (userId: string) => FreelancerDetailState | undefined;
  loadFreelancer: (userId: string, options?: { force?: boolean }) => Promise<FreelancerDetail | null>;
  clearFreelancerState: (userId: string) => void;
}

const FreelancersContext = createContext<FreelancersContextValue | null>(null);

const createInitialFreelancerDetailState = (): FreelancerDetailState => ({
  profile: null,
  loading: false,
  error: null,
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
  return "Kunne ikke hente freelancerdata.";
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

const normalizeFreelancerSummary = (data: any): FreelancerSummary => {
  const skillsValue = data?.skills ?? data?.profile?.skills ?? null;

  return {
    id: String(data?.userId ?? data?.id ?? ""),
    fullName: data?.fullName ?? data?.profile?.fullName ?? "Freelancer",
    avatarUrl: data?.avatarUrl ?? data?.profile?.avatarUrl ?? null,
    location: data?.location ?? data?.profile?.location ?? null,
    hourlyRate: data?.hourlyRate
      ? Number(data.hourlyRate)
      : data?.profile?.hourlyRate
      ? Number(data.profile.hourlyRate)
      : null,
    skills: parseSkills(skillsValue),
    bio: data?.bio ?? data?.profile?.bio ?? null,
  };
};

const mapFreelancerDetail = (data: any): FreelancerDetail => {
  const summary = normalizeFreelancerSummary(data);

  return {
    ...summary,
    userId: String(data?.userId ?? data?.id ?? ""),
    availability: data?.availability ?? data?.profile?.availability ?? null,
    rating: data?.rating ? Number(data.rating) : 0,
    ratingCount: data?.ratingCount ? Number(data.ratingCount) : 0,
    createdAt: data?.createdAt ?? null,
    projects: Array.isArray(data?.projects) ? data.projects : [],
    languageSkills: Array.isArray(data?.language_skills ?? data?.languageSkills)
      ? data?.language_skills ?? data?.languageSkills
      : [],
    jobHistory: Array.isArray(data?.job_history ?? data?.jobHistory)
      ? data?.job_history ?? data?.jobHistory
      : [],
  };
};

export const FreelancersProvider = ({ children }: { children: ReactNode }) => {
  const api = useApi();
  const [freelancers, setFreelancers] = useState<FreelancerSummary[]>([]);
  const [freelancersLoading, setFreelancersLoading] = useState(false);
  const [freelancersError, setFreelancersError] = useState<string | null>(null);
  const [freelancerStates, setFreelancerStates] = useState<Record<string, FreelancerDetailState>>({});
  const freelancersRequestRef = useRef<string | null>(null);

  const loadFreelancers = useCallback(
    async (filters?: Record<string, any>) => {
      const serializedFilters = JSON.stringify(filters ?? {});
      if (freelancersRequestRef.current === serializedFilters && freelancers.length > 0 && !freelancersLoading) {
        return freelancers;
      }

      freelancersRequestRef.current = serializedFilters;
      setFreelancersLoading(true);
      setFreelancersError(null);

      try {
        const response = await api.profiles.getAllFreelancers(filters);
        const normalized = Array.isArray(response) ? response.map(normalizeFreelancerSummary) : [];
        setFreelancers(normalized);
        return normalized;
      } catch (error) {
        const message = extractErrorMessage(error);
        setFreelancersError(message);
        setFreelancers([]);
        return [];
      } finally {
        setFreelancersLoading(false);
      }
    },
    [api.profiles, freelancers, freelancersLoading],
  );

  const getFreelancerState = useCallback(
    (userId: string) => {
      if (!userId) return undefined;
      return freelancerStates[userId];
    },
    [freelancerStates],
  );

  const loadFreelancer = useCallback(
    async (userId: string, options?: { force?: boolean }) => {
      if (!userId) return null;

      setFreelancerStates((prev) => {
        const previous = prev[userId] ?? createInitialFreelancerDetailState();
        if (previous.loading && !options?.force) {
          return prev;
        }

        return {
          ...prev,
          [userId]: {
            ...previous,
            loading: true,
            error: null,
          },
        };
      });

      try {
        const response = await api.profiles.getPublicProfile(userId);
        if (!response) {
          throw new Error("Freelancer ikke fundet.");
        }

        const detail = mapFreelancerDetail(response);

        setFreelancerStates((prev) => {
          const previous = prev[userId] ?? createInitialFreelancerDetailState();
          return {
            ...prev,
            [userId]: {
              ...previous,
              profile: detail,
              loading: false,
              error: null,
            },
          };
        });

        return detail;
      } catch (error) {
        const message = extractErrorMessage(error);
        setFreelancerStates((prev) => {
          const previous = prev[userId] ?? createInitialFreelancerDetailState();
          return {
            ...prev,
            [userId]: {
              ...previous,
              loading: false,
              error: message,
            },
          };
        });

        return null;
      }
    },
    [api.profiles],
  );

  const clearFreelancerState = useCallback((userId: string) => {
    setFreelancerStates((prev) => {
      if (!prev[userId]) return prev;
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  }, []);

  const value = useMemo<FreelancersContextValue>(
    () => ({
      freelancers,
      freelancersLoading,
      freelancersError,
      loadFreelancers,
      getFreelancerState,
      loadFreelancer,
      clearFreelancerState,
    }),
    [freelancers, freelancersLoading, freelancersError, loadFreelancers, getFreelancerState, loadFreelancer, clearFreelancerState],
  );

  return <FreelancersContext.Provider value={value}>{children}</FreelancersContext.Provider>;
};

export const useFreelancers = (): FreelancersContextValue => {
  const context = useContext(FreelancersContext);
  if (!context) {
    throw new Error("useFreelancers must be used within a FreelancersProvider");
  }
  return context;
};


