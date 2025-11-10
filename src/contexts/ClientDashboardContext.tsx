import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useApi } from "@/contexts/ApiContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  deadline: string | null;
}

export interface JobApplication {
  id: string;
  status: string;
  applied_at: string;
  job_id: string;
  applicant: {
    full_name: string | null;
  };
}

interface BackendJob {
  id: string;
  title: string;
  description: string;
  status: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  createdAt: string;
  deadline?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  created_at?: string;
  freelancerId?: string | null;
  freelancer_id?: string | null;
  finalAmount?: number | null;
  final_amount?: number | null;
}

interface BackendApplication {
  id: string;
  status: string;
  appliedAt?: string;
  applied_at?: string;
  jobId?: string;
  job_id?: string;
  applicant?: { fullName?: string | null };
  applicant_full_name?: string | null;
}

export interface ClientStats {
  totalJobs: number;
  openJobs: number;
  totalApplications: number;
  pendingApplications: number;
  totalSpent: number;
  totalPayments: number;
}

interface WorkedWithFreelancer {
  user_id: string;
  full_name?: string;
  hourly_rate?: number;
  skills?: string[];
}

interface RecentPayment {
  id: string;
  description?: string;
  status?: string;
  created_at: string;
  amount: number;
  currency: string;
}

interface ClientDashboardContextValue {
  myJobs: Job[];
  recentApplications: JobApplication[];
  stats: ClientStats;
  workedWithFreelancers: WorkedWithFreelancer[];
  recentPayments: RecentPayment[];
  showInviteDialog: boolean;
  selectedJobForInvite: string | null;
  openInviteDialog: (jobId: string) => void;
  closeInviteDialog: () => void;
  deleteJob: (jobId: string, jobTitle: string) => Promise<void>;
  formatBudget: (min: number | null, max: number | null) => string;
}

const INITIAL_STATS: ClientStats = {
  totalJobs: 0,
  openJobs: 0,
  totalApplications: 0,
  pendingApplications: 0,
  totalSpent: 0,
  totalPayments: 0,
};

const ClientDashboardContext = createContext<ClientDashboardContextValue | null>(null);

const mapBackendJobToJob = (job: BackendJob): Job => ({
  id: job.id,
  title: job.title,
  description: job.description,
  status: job.status,
  budget_min: job.budgetMin ?? job.budget_min ?? null,
  budget_max: job.budgetMax ?? job.budget_max ?? null,
  created_at: job.createdAt ?? job.created_at ?? new Date().toISOString(),
  deadline: job.deadline ?? null,
});

const transformApplication = (application: BackendApplication): JobApplication => ({
  id: application.id,
  status: application.status,
  applied_at: application.appliedAt || application.applied_at || new Date().toISOString(),
  job_id: application.jobId || application.job_id || "",
  applicant: {
    full_name: application.applicant?.fullName || application.applicant_full_name || null,
  },
});

export const ClientDashboardProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole } = useAuth();
  const api = useApi();
  const { toast } = useToast();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<ClientStats>(INITIAL_STATS);
  const [workedWithFreelancers, setWorkedWithFreelancers] = useState<WorkedWithFreelancer[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedJobForInvite, setSelectedJobForInvite] = useState<string | null>(null);

  const fetchingDataRef = useRef(false);

  const fetchClientData = useCallback(async () => {
    if (fetchingDataRef.current) {
      console.log("fetchClientData already in progress, skipping...");
      return;
    }

    fetchingDataRef.current = true;

    try {
      const jobs: BackendJob[] = await api.jobs.getMyJobs();
      const mappedJobs = (jobs || []).map(mapBackendJobToJob);
      setMyJobs(mappedJobs);

      if (mappedJobs.length === 0) {
        setRecentApplications([]);
        setStats(INITIAL_STATS);
        setWorkedWithFreelancers([]);
        setRecentPayments([]);
        return;
      }

      const jobIds = mappedJobs.map((job) => job.id);
      const firstFew = jobIds.slice(0, 5);

      const lists: BackendApplication[][] = await Promise.all(
        firstFew.map(async (jobId) => {
          try {
            const apps: BackendApplication[] = await api.applications.getJobApplications(jobId);
            return apps || [];
          } catch {
            return [];
          }
        }),
      );

      const flattened = lists
        .flat()
        .sort(
          (a, b) =>
            new Date(b.appliedAt || b.applied_at || "").getTime() -
            new Date(a.appliedAt || a.applied_at || "").getTime(),
        );

      const transformedApplications = flattened.slice(0, 5).map(transformApplication);
      setRecentApplications(transformedApplications);

      const allLists: BackendApplication[][] = await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            const apps: BackendApplication[] = await api.applications.getJobApplications(jobId);
            return apps || [];
          } catch {
            return [];
          }
        }),
      );

      const allApplications = allLists.flat();
      const totalApplicationsCount = allApplications.length;
      const pendingApplicationsCount = allApplications.filter((app) => app.status === "pending").length;

      const completedJobs = (jobs || []).filter(
        (job) => job.status === "completed" && (job.finalAmount || job.final_amount),
      );
      const totalSpent = completedJobs.reduce(
        (sum: number, job) => sum + (job.finalAmount || job.final_amount || 0),
        0,
      );

      const earningsData: RecentPayment[] = [];
      const totalPayments = 0;

      const completedJobsWithFreelancers = (jobs || []).filter(
        (job) => job.status === "completed" && (job.freelancerId || job.freelancer_id),
      );

      if (completedJobsWithFreelancers.length > 0) {
        setWorkedWithFreelancers([]);
      }

      if (earningsData.length > 0) {
        setRecentPayments(earningsData.slice(0, 5));
      }

      setStats({
        totalJobs: mappedJobs.length,
        openJobs: mappedJobs.filter((job) => job.status === "open").length,
        totalApplications: totalApplicationsCount || 0,
        pendingApplications: pendingApplicationsCount || 0,
        totalSpent,
        totalPayments,
      });
    } catch (error: unknown) {
      console.error("Error fetching client data:", error);

      const err = error as { response?: { status?: number } };
      if (err.response?.status === 429) {
        toast({
          title: "For mange anmodninger",
          description: "Vent venligst et øjeblik og prøv igen.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Fejl",
          description: "Kunne ikke hente data.",
          variant: "destructive",
        });
      }
    } finally {
      fetchingDataRef.current = false;
    }
  }, [api, toast]);

  useEffect(() => {
    if (user && (userRole === "client" || userRole === "admin")) {
      fetchClientData();
    } else if (!user) {
      setMyJobs([]);
      setRecentApplications([]);
      setStats(INITIAL_STATS);
      setWorkedWithFreelancers([]);
      setRecentPayments([]);
    }
  }, [fetchClientData, user, userRole]);

  const deleteJob = useCallback(
    async (jobId: string, jobTitle: string) => {
      if (!confirm(`Er du sikker på at du vil slette opgaven "${jobTitle}"? Dette kan ikke fortrydes.`)) {
        return;
      }

      try {
        await api.jobs.deleteJob(jobId);

        toast({
          title: "Opgave slettet",
          description: `Opgaven "${jobTitle}" er blevet slettet.`,
        });

        await fetchClientData();
      } catch (error) {
        console.error("Error deleting job:", error);
        toast({
          title: "Fejl",
          description: "Kunne ikke slette opgaven. Prøv igen senere.",
          variant: "destructive",
        });
      }
    },
    [api, fetchClientData, toast],
  );

  const openInviteDialog = useCallback((jobId: string) => {
    setSelectedJobForInvite(jobId);
    setShowInviteDialog(true);
  }, []);

  const closeInviteDialog = useCallback(() => {
    setShowInviteDialog(false);
    setSelectedJobForInvite(null);
  }, []);

  const formatBudget = useCallback((min: number | null, max: number | null) => {
    if (!min && !max) return "Ikke angivet";
    if (min && max) return `${min.toLocaleString("da-DK")} - ${max.toLocaleString("da-DK")} kr.`;
    if (min) return `Fra ${min.toLocaleString("da-DK")} kr.`;
    if (max) return `Op til ${max.toLocaleString("da-DK")} kr.`;
    return "Ikke angivet";
  }, []);

  const value = useMemo<ClientDashboardContextValue>(
    () => ({
      myJobs,
      recentApplications,
      stats,
      workedWithFreelancers,
      recentPayments,
      showInviteDialog,
      selectedJobForInvite,
      openInviteDialog,
      closeInviteDialog,
      deleteJob,
      formatBudget,
    }),
    [
      closeInviteDialog,
      deleteJob,
      formatBudget,
      myJobs,
      openInviteDialog,
      recentApplications,
      recentPayments,
      selectedJobForInvite,
      showInviteDialog,
      stats,
      workedWithFreelancers,
    ],
  );

  return <ClientDashboardContext.Provider value={value}>{children}</ClientDashboardContext.Provider>;
};

export const useClientDashboard = (): ClientDashboardContextValue => {
  const context = useContext(ClientDashboardContext);
  if (!context) {
    throw new Error("useClientDashboard must be used within a ClientDashboardProvider");
  }
  return context;
};


