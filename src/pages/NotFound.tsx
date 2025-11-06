import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="fixed top-4 right-4">
      </div>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t('common.oops')} {t('common.pageNotFound')}</p>
        <a href="/" className="text-primary underline hover:text-primary/80">
          {t('common.returnHome')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
