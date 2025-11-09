import React, { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { ApiService, api as defaultApi } from "@/services/api";

interface ApiProviderProps {
  children: ReactNode;
  instance?: ApiService;
}

const ApiContext = createContext<ApiService | null>(null);

export const ApiProvider = ({ children, instance }: ApiProviderProps) => {
  const apiInstance = useMemo(() => instance ?? defaultApi, [instance]);

  return <ApiContext.Provider value={apiInstance}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }

  return context;
};

