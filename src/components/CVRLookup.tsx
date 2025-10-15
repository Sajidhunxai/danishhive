import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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

interface CVRData {
  virksomhedsnavn?: string;
  adresse?: {
    vejnavn?: string;
    husnummerFra?: string;
    postnummer?: string;
    postdistrikt?: string;
  };
}

export const CVRLookup: React.FC<CVRLookupProps> = ({
  cvrNumber,
  companyName,
  hasCVR,
  userRole = 'client',
  onCVRChange,
  onCompanyNameChange,
  onHasCVRChange,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const lookupCVR = async () => {
    if (!cvrNumber || cvrNumber.length !== 8) {
      toast({
        title: "Ugyldigt CVR nummer",
        description: "CVR nummer skal være 8 cifre",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Danish CVR API endpoint (Erhvervsstyrelsen public API)
      const response = await fetch(
        `https://datacvr.virk.dk/data/visenhed?cvrnummer=${cvrNumber}&format=json`,
        {
          headers: {
            'User-Agent': 'Danish-Hive-CVR-Lookup'
          }
        }
      );

      if (!response.ok) {
        throw new Error("Kunne ikke hente data fra CVR registeret");
      }

      const data = await response.json();

      if (data.navn && data.navn.length > 0) {
        const companyName = data.navn[0].navn;
        onCompanyNameChange(companyName);
        toast({
          title: "CVR fundet!",
          description: `Virksomhed: ${companyName}`,
        });
      } else {
        toast({
          title: "CVR ikke fundet",
          description: "Kunne ikke finde virksomhed med dette CVR nummer",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("CVR lookup error:", error);
      toast({
        title: "Fejl ved CVR opslag",
        description: "Kunne ikke slå CVR nummer op. Indtast virksomhedsnavn manuelt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCVRInput = (value: string) => {
    // Only allow numbers and limit to 8 digits
    const cleanValue = value.replace(/\D/g, "").slice(0, 8);
    onCVRChange(cleanValue);
  };

  return (
    <div className="space-y-4">
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
          {userRole === 'freelancer' ? 'Har ikke CVR nummer (arbejder som privatperson)' : 'Har ikke CVR nummer'}
        </Label>
      </div>

      {hasCVR ? (
        <div className="space-y-2">
          <Label htmlFor="cvr">CVR Nummer *</Label>
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
            Indtast 8-cifret CVR nummer og klik søg for automatisk udfyldning
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="company">
          {userRole === 'freelancer' 
            ? (hasCVR ? "Virksomhedsnavn * (fyldes automatisk ved CVR opslag)" : "Virksomhedsnavn (valgfrit)") 
            : (hasCVR ? "Firmanavn * (fyldes automatisk ved CVR opslag)" : "Firmanavn *")
          }
        </Label>
        <Input
          id="company"
          value={companyName}
          onChange={(e) => onCompanyNameChange(e.target.value)}
          placeholder={userRole === 'freelancer' ? "Dit virksomhedsnavn" : "Dit firmanavn"}
          disabled={hasCVR && loading}
          required={userRole === 'client' || (userRole === 'freelancer' && hasCVR)}
        />
      </div>
    </div>
  );
};