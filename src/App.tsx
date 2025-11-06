import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { BackendAuthProvider } from "@/hooks/useBackendAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TopNavigation } from "@/components/TopNavigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Under18Application from "./pages/Under18Application";
import Profile from "./pages/Profile";
import FreelancerProfile from "./pages/FreelancerProfile";
import Settings from "./pages/Settings";
import JobDetails from "./pages/JobDetails";
import JobApplication from "./pages/JobApplication";
import JobApplications from "./pages/JobApplications";
import ClientDashboard from "./pages/ClientDashboard";
import CreateJob from "./pages/CreateJob";
import NotFound from "./pages/NotFound";
import CompleteProfile from "./pages/CompleteProfile";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyEmail from "./pages/VerifyEmail";
import Messages from "./pages/Messages";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Forum from "./pages/Forum";
import ForumCategory from "./pages/ForumCategory";
import ForumNewPost from "./pages/ForumNewPost";
import ForumPostDetail from "./pages/ForumPostDetail";
import { CookieConsent } from "@/components/CookieConsent";
import { ContractSystem } from "@/components/ContractSystem";
import { preloadSound } from "@/utils/sound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  // Preload sound on app initialization
  React.useEffect(() => {
    preloadSound();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <LanguageProvider>
            <BackendAuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <TopNavigation />
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/client" element={<ClientDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/create-job" element={<CreateJob />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/freelancer/:userId" element={<FreelancerProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/job/:id" element={<JobDetails />} />
                <Route path="/job/:id/apply" element={<JobApplication />} />
                <Route path="/job/:id/applications" element={<JobApplications />} />
                 <Route path="/messages" element={<Messages />} />
                 <Route path="/verify-email" element={<VerifyEmail />} />
                 <Route path="/under-18-application" element={<Under18Application />} />
                 <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                 <Route path="/terms-of-service" element={<TermsOfService />} />
                 <Route path="/forum" element={<Forum />} />
                 <Route path="/forum/category/:categoryId" element={<ForumCategory />} />
                 <Route path="/forum/post/:postId" element={<ForumPostDetail />} />
                 <Route path="/forum/new-post" element={<ForumNewPost />} />
                  <Route path="/forum/category/:categoryId/new-post" element={<ForumNewPost />} />
                 <Route path="/contracts" element={
                   <div className="min-h-screen bg-background">
                     <main className="max-w-7xl mx-auto p-6">
                       <h1 className="text-3xl font-bold mb-6">Kontrakter</h1>
                       <ContractSystem />
                     </main>
                   </div>
                 } />
                 {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CookieConsent />
            </BrowserRouter>
          </BackendAuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
