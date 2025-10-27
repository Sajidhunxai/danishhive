import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, Loader2 } from "lucide-react";

interface CVRLookupProps {
  cvrNumber: string;
  companyName: string;
  hasCVR: boolean;
  userRole?: string;
  onCVRChange: (cvr: string) => void;
  onCompanyNameChange: (name: string) => void;
  onHasCVRChange: (hasCVR: boolean) => void;
}

export const CVRLookup: React.FC<CVRLookupProps> = ({
  cvrNumber,
  companyName,
  hasCVR,
  userRole = "client",
  onCVRChange,
  onCompanyNameChange,
  onHasCVRChange,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const lookupCVR = async () => {
    if (!cvrNumber || cvrNumber.length !== 8) {
      toast({
        title: t("cvr.invalidCVR"),
        description: t("cvr.invalidCVRDesc"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://datacvr.virk.dk/data/visenhed?cvrnummer=${cvrNumber}&format=json`,
        {
          headers: { "User-Agent": "Danish-Hive-CVR-Lookup" },
        }
      );

      if (!response.ok) {
        throw new Error(t("cvr.lookupFailedDesc"));
      }

      const data = await response.json();

      if (data.navn && data.navn.length > 0) {
        const companyName = data.navn[0].navn;
        onCompanyNameChange(companyName);
        toast({
          title: t("cvr.lookupSuccess"),
          description: `${t("cvr.companyName")}: ${companyName}`,
        });
      } else {
        toast({
          title: t("cvr.lookupFailed"),
          description: t("cvr.lookupFailedDesc"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("CVR lookup error:", error);
      toast({
        title: t("cvr.lookupFailed"),
        description: t("cvr.lookupFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCVRInput = (value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 8);
    onCVRChange(cleanValue);
  };

  return (
    <div className="space-y-4">
      {/* Has no CVR checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="has-cvr"
          checked={!hasCVR}
          onCheckedChange={(checked) => {
            onHasCVRChange(!checked);
            if (checked) {
              onCVRChange("");
            }
          }}
        />
        <Label htmlFor="has-cvr" className="text-sm font-normal">
          {t("cvr.noCVR")}
        </Label>
      </div>

      {/* CVR Number field */}
      {hasCVR && (
        <div className="space-y-2">
          <Label htmlFor="cvr">{t("cvr.cvrNumberLabel")}</Label>
          <div className="flex gap-2">
            <Input
              id="cvr"
              value={cvrNumber}
              onChange={(e) => handleCVRInput(e.target.value)}
              placeholder="12345678"
              className="flex-1"
              maxLength={8}
            />
            <Button
              type="button"
              variant="outline"
              onClick={lookupCVR}
              disabled={loading || cvrNumber.length !== 8}
              className="px-3"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("cvr.cvrHint")}
          </p>
        </div>
      )}

      {/* Company name */}
      <div className="space-y-2">
        <Label htmlFor="company">
          {t("cvr.companyNameLabel")}
        </Label>
        <Input
          id="company"
          value={companyName}
          onChange={(e) => onCompanyNameChange(e.target.value)}
          placeholder={t("cvr.companyNamePlaceholder")}
          disabled={hasCVR && loading}
          required={userRole === "client" || (userRole === "freelancer" && hasCVR)}
        />
      </div>
    </div>
  );
};
