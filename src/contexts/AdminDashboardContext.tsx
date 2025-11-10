import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

interface AdminDashboardContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  resetActiveTab: () => void;
}

const AdminDashboardContext = createContext<AdminDashboardContextValue | null>(null);

export const AdminDashboardProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTabState] = useState("overview");

  const setActiveTab = useCallback((value: string) => {
    setActiveTabState(value);
  }, []);

  const resetActiveTab = useCallback(() => {
    setActiveTabState("overview");
  }, []);

  const value = useMemo<AdminDashboardContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      resetActiveTab,
    }),
    [activeTab, setActiveTab, resetActiveTab],
  );

  return <AdminDashboardContext.Provider value={value}>{children}</AdminDashboardContext.Provider>;
};

export const useAdminDashboard = (): AdminDashboardContextValue => {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error("useAdminDashboard must be used within an AdminDashboardProvider");
  }
  return context;
};


