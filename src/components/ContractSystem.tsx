import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContractDialog } from "@/components/ContractDialog";
import { ContractView } from "@/components/ContractView";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Clock,
  CheckCircle,
  Send
} from "lucide-react";

export const ContractSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [contracts, setContracts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractView, setShowContractView] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchContracts();
      fetchJobs();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const profile = await api.profiles.getMyProfile();
      setUserRole(profile.userType?.toLowerCase() || null);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchContracts = async () => {
    try {
      const data = await api.contracts.getMyContracts();
      const mapped = data.map((c: any) => ({
        ...c,
        total_amount: c.totalAmount ? Number(c.totalAmount) : null,
        jobTitle: c.job?.title || "",
      }));
      setContracts(mapped);
    } catch (error: any) {
      console.error("Error fetching contracts:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("contracts.errorFetching"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const jobsData = await api.jobs.getMyJobs();
      const openJobs = jobsData
        .filter((j: any) => j.status === "open")
        .map((j: any) => ({
          id: j.id,
          title: j.title,
          description: j.description,
        }));
      setJobs(openJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const getStatus = (status: string) => {
    const map = {
      sent: { color: "bg-blue-100 text-blue-800", text: t("contracts.sent") },
      signed: { color: "bg-green-100 text-green-800", text: t("contracts.signed") },
      default: { color: "bg-gray-100 text-gray-800", text: status },
    };
    return map[status] || map.default;
  };

  const getIcon = (status: string) =>
    status === "sent" ? (
      <Send className="h-4 w-4" />
    ) : status === "signed" ? (
      <CheckCircle className="h-4 w-4" />
    ) : (
      <Clock className="h-4 w-4" />
    );

  const filteredContracts = contracts.filter((contract: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      contract.title?.toLowerCase().includes(q) ||
      contract.contractNumber?.toLowerCase().includes(q) ||
      contract.jobTitle?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading)
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {userRole === "client"
                ? t("contracts.titleClient")
                : t("contracts.titleFreelancer")}
            </CardTitle>
            {userRole === "client" && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={jobs.length === 0}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("contracts.createContract")}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("contracts.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">{t("contracts.status.all")}</option>
              <option value="sent">{t("contracts.status.sent")}</option>
              <option value="signed">{t("contracts.status.signed")}</option>
            </select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-600">{t("contracts.stats.sent")}</div>
              <div className="text-2xl font-bold text-blue-700">
                {contracts.filter((c: any) => c.status === "sent").length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-600">{t("contracts.stats.signed")}</div>
              <div className="text-2xl font-bold text-green-700">
                {contracts.filter((c: any) => c.status === "signed").length}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            <h4 className="font-medium">
              {t("contracts.listTitle", { count: filteredContracts.length })}
            </h4>
            {filteredContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {contracts.length === 0 ? (
                  <>
                    <p>{t("contracts.noneCreated")}</p>
                    <p className="text-sm">{t("contracts.createFirst")}</p>
                  </>
                ) : (
                  <>
                    <p>{t("contracts.noMatch")}</p>
                    <p className="text-sm">{t("contracts.adjustSearch")}</p>
                  </>
                )}
              </div>
            ) : (
              filteredContracts.map((contract: any) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h5 className="font-medium">{contract.title}</h5>
                      <Badge variant="secondary" className={getStatus(contract.status).color}>
                        <div className="flex items-center gap-1">
                          {getIcon(contract.status)}
                          {getStatus(contract.status).text}
                        </div>
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{t("contracts.number", { num: contract.contractNumber })}</p>
                      <p>{t("contracts.jobTitle", { title: contract.jobTitle })}</p>
                      {contract.total_amount && (
                        <p>{t("contracts.amount", { amt: contract.total_amount.toFixed(2) })}</p>
                      )}
                      {contract.deadline && (
                        <p>
                          {t("contracts.deadline")}:{" "}
                          {new Date(contract.deadline).toLocaleDateString("da-DK")}
                        </p>
                      )}
                      <p>
                        {t("contracts.created")}:{" "}
                        {new Date(contract.createdAt).toLocaleDateString("da-DK")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContract(contract);
                      setShowContractView(true);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {t("contracts.view")}
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Tip for clients */}
          {userRole === "client" && jobs.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>{t("contracts.tipTitle")}</strong>{" "}
                {t("contracts.tipText")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {userRole === "client" && (
        <ContractDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onContractCreated={() => {
            fetchContracts();
            setShowCreateDialog(false);
          }}
          jobs={jobs}
          editContract={selectedContract}
        />
      )}

      {selectedContract && (
        <ContractView
          contract={selectedContract}
          isOpen={showContractView}
          onClose={() => {
            setShowContractView(false);
            setSelectedContract(null);
          }}
          onContractUpdated={fetchContracts}
        />
      )}
    </>
  );
};
