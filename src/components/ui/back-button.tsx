import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  to?: string; // Optional specific route to navigate to
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  className = "", 
  variant = "outline",
  to 
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button 
      variant={variant}
      onClick={handleBack}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {t('common.back')}
    </Button>
  );
};