import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CreditCard,
  Calendar,
  TrendingUp,
  DollarSign,
  Briefcase,
  Calculator,
  Receipt,
} from "lucide-react";

interface Earning {
  id: string;
  job_id: string | null;
  amount: number;
  currency: string;
  payment_period_start: string;
  payment_period_end: string;
  payout_date: string | null;
  status: string;
  mollie_payment_id: string | null;
  description: string | null;
  created_at: string;
  jobs?: {
    title: string;
    client_id: string;
  };
}

export const PaymentOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  // Calculate current payment period (19th to 19th)
  const getCurrentPaymentPeriod = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let startDate, endDate;

    if (now.getDate() >= 19) {
      // After 19th, current period is 19th this month to 19th next month
      startDate = new Date(currentYear, currentMonth, 19);
      endDate = new Date(currentYear, currentMonth + 1, 19);
    } else {
      // Before 19th, current period is 19th last month to 19th this month
      startDate = new Date(currentYear, currentMonth - 1, 19);
      endDate = new Date(currentYear, currentMonth, 19);
    }

    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  const getNextPayoutDate = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let payoutDate;
    if (now.getDate() >= 19) {
      // Next payout is 1st of month after next
      payoutDate = new Date(currentYear, currentMonth + 2, 1);
    } else {
      // Next payout is 1st of next month
      payoutDate = new Date(currentYear, currentMonth + 1, 1);
    }

    return payoutDate.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (user) {
      fetchEarnings();
    }
  }, [user]);

  const fetchEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from("earnings")
        .select(
          `
          *,
          jobs (
            title,
            client_id
          )
        `
        )
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEarnings(data || []);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente indtægter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Betalt";
      case "pending":
        return "Afventende";
      case "processing":
        return "Under behandling";
      default:
        return status;
    }
  };

  // Calculate totals
  const totalEarnings = earnings.reduce(
    (sum, earning) => sum + earning.amount,
    0
  );
  const pendingEarnings = earnings
    .filter((e) => e.status === "pending")
    .reduce((sum, earning) => sum + earning.amount, 0);

  // Calculate monthly total (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyEarnings = earnings
    .filter((earning) => {
      const earningDate = new Date(earning.created_at);
      return (
        earningDate.getMonth() === currentMonth &&
        earningDate.getFullYear() === currentYear &&
        earning.status === "completed"
      );
    })
    .reduce((sum, earning) => sum + earning.amount, 0);

  // Calculate yearly total (current year)
  const yearlyEarnings = earnings
    .filter((earning) => {
      const earningDate = new Date(earning.created_at);
      return (
        earningDate.getFullYear() === currentYear &&
        earning.status === "completed"
      );
    })
    .reduce((sum, earning) => sum + earning.amount, 0);

  // Tax calculations (Danish tax system)
  const calculateTaxes = (grossIncome: number) => {
    // AM-skat (Labour Market Contribution): 8% of gross income
    const amTax = grossIncome * 0.08;

    // Taxable income after AM-tax deduction
    const taxableIncome = grossIncome - amTax;

    // Regular income tax: 39% of taxable income (simplified)
    const incomeTax = taxableIncome * 0.39;

    // VAT threshold: 50,000 DKK per year
    const requiresVAT = grossIncome >= 50000;
    const vatRate = requiresVAT ? 0.25 : 0;
    const vatAmount = requiresVAT ? grossIncome * vatRate : 0;

    // Net income after all taxes (excluding VAT as it's handled differently)
    const netIncome = grossIncome - amTax - incomeTax;

    return {
      grossIncome,
      amTax,
      taxableIncome,
      incomeTax,
      netIncome,
      requiresVAT,
      vatAmount,
      totalTaxes: amTax + incomeTax,
    };
  };

  const taxCalculation = calculateTaxes(yearlyEarnings);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Betalingsoversigt
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t("earnings.total")}</span>
            </div>
            <p className="text-xl font-bold">{totalEarnings.toFixed(2)} DKK</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{t("earnings.thisMonth")}</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {monthlyEarnings.toFixed(2)} DKK
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{t("earnings.thisYear")}</span>
            </div>
            <p className="text-xl font-bold text-blue-600">
              {yearlyEarnings.toFixed(2)} DKK
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">{t("earnings.pending")}</span>
            </div>
            <p className="text-xl font-bold text-yellow-600">
              {pendingEarnings.toFixed(2)} DKK
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">{t("earnings.nextPayout")}</span>
            </div>
            <p className="text-sm text-purple-600 font-medium">
              {new Date(getNextPayoutDate()).toLocaleDateString("da-DK")}
            </p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">{t("earnings.paymentInfo")}</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• {t("earnings.paymentWindow")}</li>
            <li>• {t("earnings.payoutDate")}</li>
            <li>• {t("earnings.paymentProcessor")}</li>
            <li>{t("earnings.currencyNote")}</li>
          </ul>
        </div>

        {/* Tax Calculator */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calculator className="h-5 w-5" />
              {t("earnings.taxCalculator")} ({currentYear})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gross Income */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/60 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{t("earnings.grossIncome")}</span>
                </div>
                <p className="text-lg font-bold">
                  {taxCalculation.grossIncome.toLocaleString("da-DK", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  DKK
                </p>
              </div>

              <div className="bg-white/60 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">{t("earnings.amTax")}</span>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  -
                  {taxCalculation.amTax.toLocaleString("da-DK", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  DKK
                </p>
              </div>

              <div className="bg-white/60 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">
                  {t("earnings.incomeTax")}
                  </span>
                </div>
                <p className="text-lg font-bold text-red-600">
                  -
                  {taxCalculation.incomeTax.toLocaleString("da-DK", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  DKK
                </p>
              </div>

              <div className="bg-white/80 p-4 rounded-lg border-2 border-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium"> {t("earnings.netIncome")}</span>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {taxCalculation.netIncome.toLocaleString("da-DK", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  DKK
                </p>
              </div>
            </div>

            {/* VAT Information */}
            <div
              className={`p-4 rounded-lg border-2 ${
                taxCalculation.requiresVAT
                  ? "bg-yellow-50 border-yellow-300"
                  : "bg-green-50 border-green-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Receipt
                  className={`h-5 w-5 ${
                    taxCalculation.requiresVAT
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                />
                <span className="font-medium">{t("earnings.vatStatus")}</span>
              </div>
              {taxCalculation.requiresVAT ? (
                <div className="space-y-2">
                  <p className="text-yellow-800 font-medium">
                    {t("earnings.vatRequired")}
                  </p>
                  <p className="text-sm text-yellow-700">
                  {t("earnings.vatNote")}
                  </p>
                  <div className="bg-yellow-100 p-3 rounded border">
                    <p className="text-sm font-medium text-yellow-800">
                    {t("earnings.vatEstimate")}:{" "}
                      {taxCalculation.vatAmount.toLocaleString("da-DK", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      DKK
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-green-800 font-medium">
                    ✅  {t("earnings.noVat")}
                  </p>
                  <p className="text-sm text-green-700">
                    Du mangler{" "}
                    {(50000 - taxCalculation.grossIncome).toLocaleString(
                      "da-DK",
                      { minimumFractionDigits: 2 }
                    )}{" "}
                    DKK før du skal registrere dig for moms.
                  </p>
                </div>
              )}
            </div>

            {/* Tax Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium mb-3">{t("earnings.taxSummary")}</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("earnings.grossIncome")}:</span>
                  <span className="font-medium">
                    {taxCalculation.grossIncome.toLocaleString("da-DK", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    DKK
                  </span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>{t("earnings.amTax")}:</span>
                  <span>
                    -
                    {taxCalculation.amTax.toLocaleString("da-DK", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    DKK
                  </span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>{t("earnings.incomeTax")}:</span>
                  <span>
                    -
                    {taxCalculation.incomeTax.toLocaleString("da-DK", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    DKK
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>{t("earnings.totalTax")}:</span>
                  <span className="text-red-600">
                    -
                    {taxCalculation.totalTaxes.toLocaleString("da-DK", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    DKK
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("earnings.netIncome")}:</span>
                  <span className="text-green-600">
                    {taxCalculation.netIncome.toLocaleString("da-DK", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    DKK
                  </span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>{t("earnings.disclaimerTitle")}:</strong> {t("earnings.disclaimerText")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Earnings List */}
        <div className="space-y-4">
          <h4 className="font-medium">{t("earnings.listTitle")}</h4>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("earnings.noEarnings")}</p>
              <p className="text-sm">
              {t("earnings.noEarningsDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="font-medium">
                        {earning.jobs?.title ||
                          earning.description ||
                          "Indtægt"}
                      </h5>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(earning.status)}
                      >
                        {getStatusText(earning.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                      {t("earnings.amount")}: {earning.amount.toFixed(2)} {earning.currency}
                      </p>
                      <p>
                      {t("earnings.period")}:{" "}
                        {new Date(
                          earning.payment_period_start
                        ).toLocaleDateString("da-DK")}{" "}
                        -{" "}
                        {new Date(
                          earning.payment_period_end
                        ).toLocaleDateString("da-DK")}
                      </p>
                      {earning.payout_date && (
                        <p>
                          {t("earnings.payout")}:{" "}
                          {new Date(earning.payout_date).toLocaleDateString(
                            "da-DK"
                          )}
                        </p>
                      )}
                      {earning.mollie_payment_id && (
                        <p>{t("earnings.mollieId")}: {earning.mollie_payment_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {earning.amount.toFixed(2)} DKK
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
