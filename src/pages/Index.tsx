import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import JobsSection from "@/components/JobsSection";
import FreelancerSearch from "@/components/FreelancerSearch";
import { AdminPanel } from "@/components/AdminPanel";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/services/api";

const Index = () => {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const hasCheckedRef = useRef(false);
useEffect(() => {
    if (hasCheckedRef.current) return;
    if (!loading) {
      hasCheckedRef.current = true;
      if (!user) {
        navigate("/auth");
        return;
      }
      // Check profile completion for all user types
      checkProfileCompletion();
    }
  }, [loading, user, navigate]);

  const checkProfileCompletion = async () => {
    if (!user) return;

    try {
      // Use backend API to check profile
      const profile = await api.profiles.getMyProfile();
      console.log('Profile from backend:', profile);

      // If no profile exists, redirect to complete profile page
      if (!profile) {
        navigate("/complete-profile");
        return;
      }

      // Admin users can bypass ALL profile completion requirements and stay on any page
      if (profile.user?.isAdmin === true) {
        console.log('Admin user detected - staying on current page');
        return; // Stay on current page, no redirects for admins
      }

      // Check basic profile completion for all users
      const hasBasicProfile = profile.fullName && 
        profile.fullName.trim() !== '' &&
        profile.fullName !== 'Incomplete Profile';

      // For clients (non-admin only), check full profile completion including verifications
      if (profile.user?.userType === 'CLIENT' && !profile.user?.isAdmin) {
        const isClientProfileComplete = hasBasicProfile &&
          profile.phoneNumber && 
          profile.phoneNumber.trim() !== '' &&
          profile.address && 
          profile.address.trim() !== '' &&
          profile.city && 
          profile.city.trim() !== '' &&
          profile.postalCode && 
          profile.postalCode.trim() !== '' &&
          profile.user?.phoneVerified === true;

        if (!isClientProfileComplete) {
          navigate("/complete-profile");
        } else {
          // Only auto-redirect to client dashboard if user manually logs in as client
          // Don't auto-redirect when they're just browsing the main page
          console.log('Client profile complete - staying on current page for navigation choice');
        }
      } else if (profile.user?.userType === 'FREELANCER') {
        // For freelancers, always allow access to home/dashboard, even if profile is incomplete
        if (!hasBasicProfile) {
          console.log('Freelancer profile incomplete - allowing access to home');
          return;
        }
        
        // For freelancers, check if profile is complete
        const isFreelancerProfileComplete = hasBasicProfile &&
          profile.phoneNumber && 
          profile.phoneNumber.trim() !== '' &&
          profile.address && 
          profile.address.trim() !== '' &&
          profile.city && 
          profile.city.trim() !== '' &&
          profile.postalCode && 
          profile.postalCode.trim() !== '' &&
          profile.user?.phoneVerified === true;

        if (!isFreelancerProfileComplete) {
          console.log('Freelancer profile not complete - allowing access to home');
          return;
        }
        
        // If freelancer profile is complete, stay on main page
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      // If there's an error checking profile, redirect to complete-profile to be safe
      navigate("/complete-profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto p-6">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground animate-pulse">Indlæser...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className="text-center py-12">
          <h2 className="mb-4 text-4xl font-bold text-header-dark">
            Velkommen til Danish Hive
          </h2>
          <p className="text-xl text-muted-foreground mb-4">
            Danmarks førende platform for freelancere og virksomheder
          </p>
          <p className="text-lg text-muted-foreground">Logget ind som: {user.email}</p>
        </div>

        {/* Role Navigation Buttons - Only show for admin users */}
        {userRole === 'admin' && (
          <div className="flex justify-center gap-4 py-6">
            <Button 
              onClick={() => navigate("/client")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            >
              🏢 Gå til Klient Dashboard
            </Button>
            <Button 
              onClick={() => navigate("/")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
            >
              💼 Gå til Freelancer Side
            </Button>
            <Button 
              onClick={() => navigate("/admin")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
            >
              ⚙️ Gå til Admin Panel
            </Button>
          </div>
        )}

        {/* Available Jobs for Freelancers */}
        <JobsSection />
      </main>
    </div>
  );
};

export default Index;
