import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApi } from "@/contexts/ApiContext";

export interface ProfileData {
  full_name: string;
  company?: string;
  cvr_number?: string;
  has_cvr: boolean;
  country: string;
  country_code: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
  card_holder_name?: string;
}

interface CompleteProfileContextValue {
  profileData: ProfileData;
  updateProfileData: (field: keyof ProfileData, value: string) => void;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  phoneVerified: boolean;
  setPhoneVerified: (verified: boolean) => void;
  paymentVerified: boolean;
  setPaymentVerified: (verified: boolean) => void;
  loading: boolean;
  isSubmitting: boolean;
  userRole: string | null;
  user: ReturnType<typeof useAuth>["user"];
  computeStep1Valid: () => boolean;
  validateStep2: () => boolean;
  handleNext: () => void;
  handleComplete: () => Promise<void>;
}

const CompleteProfileContext = createContext<CompleteProfileContextValue | null>(null);

export const CompleteProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const api = useApi();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    company: "",
    cvr_number: "",
    has_cvr: false,
    country: "Danmark",
    country_code: "+45",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    card_number: "",
    card_expiry: "",
    card_cvv: "",
    card_holder_name: "",
  });

  const hasCheckedRef = useRef(false);

  const updateProfileData = useCallback((field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const computeStep1Valid = useCallback(() => {
    const required = [
      profileData.full_name.trim(),
      profileData.phone.trim(),
      profileData.address.trim(),
      profileData.city.trim(),
      profileData.postal_code.trim(),
    ];

    if (userRole === "client") {
      required.push(profileData.company?.trim() || "");
    }

    if (profileData.has_cvr) {
      required.push(profileData.cvr_number?.trim() || "");
      if (userRole === "freelancer") {
        required.push(profileData.company?.trim() || "");
      }
    }

    const allFieldsFilled = required.every((field) => field && field.length > 0);
    return allFieldsFilled && phoneVerified === true;
  }, [profileData, userRole, phoneVerified]);

  const validateStep2 = useCallback(() => {
    if (userRole === "freelancer") {
      return true;
    }

    const cardValid =
      profileData.card_number?.trim() &&
      profileData.card_expiry?.trim() &&
      profileData.card_cvv?.trim() &&
      profileData.card_holder_name?.trim();

    return Boolean(cardValid && paymentVerified === true);
  }, [profileData, paymentVerified, userRole]);

  const checkProfileCompleteness = useCallback(async () => {
    if (!user || !userRole) return;

    try {
      const response = await api.profiles.getMyProfile();
      const data =
        response?.profile ||
        (response as {
          fullName?: string;
          address?: string;
          city?: string;
          postalCode?: string;
          paymentVerified?: boolean;
          role?: string;
          user?: { phoneNumber?: string; phoneVerified?: boolean };
        });

      if (!data) return;
      const resolvedRole = data.role || userRole;

      if (resolvedRole === "client") {
        const isProfileComplete =
          data.fullName &&
          data.user?.phoneNumber &&
          data.address &&
          data.city &&
          data.postalCode &&
          data.paymentVerified &&
          data.user?.phoneVerified;

        if (isProfileComplete) {
          navigate("/client");
        }
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  }, [api.profiles, navigate, user, userRole]);

  useEffect(() => {
    if (hasCheckedRef.current) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    if (userRole && !["client", "freelancer"].includes(userRole)) {
      navigate("/");
      return;
    }

    if (!userRole) return;

    hasCheckedRef.current = true;
    checkProfileCompleteness();
  }, [user, userRole, navigate, checkProfileCompleteness]);

  const validateStep1 = useCallback(() => {
    return computeStep1Valid();
  }, [computeStep1Valid]);

  const handleComplete = useCallback(async () => {
    if (isSubmitting || loading) {
      return;
    }

    if (!user) {
      toast({
        title: t("completeProfile.error"),
        description: t("completeProfile.notLoggedIn"),
        variant: "destructive",
      });
      return;
    }

    if (userRole === "freelancer") {
      const europeanCountries = [
        "Danmark",
        "Norge",
        "Sverige",
        "Finland",
        "Tyskland",
        "Frankrig",
        "Storbritannien",
        "Italien",
        "Spanien",
        "Holland",
        "Belgien",
        "Østrig",
        "Schweiz",
        "Polen",
        "Tjekkiet",
        "Portugal",
        "Irland",
      ];

      if (!europeanCountries.includes(profileData.country)) {
        toast({
          title: t("completeProfile.europeanOnly"),
          description: t("completeProfile.europeanOnlyDesc"),
          variant: "destructive",
        });
        return;
      }
    }

    if (!validateStep1()) {
      toast({
        title: t("completeProfile.missingInfo1"),
        description: t("completeProfile.missingInfo1Desc"),
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }

    if (userRole === "client" && !validateStep2()) {
      toast({
        title: t("completeProfile.missingInfo2"),
        description: t("completeProfile.missingInfo2Desc"),
        variant: "destructive",
      });
      return;
    }

    if (!phoneVerified) {
      toast({
        title: t("completeProfile.phoneNotVerified"),
        description: t("completeProfile.phoneNotVerifiedDesc"),
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }

    if (userRole === "client" && !paymentVerified) {
      toast({
        title: t("completeProfile.paymentNotVerified"),
        description: t("completeProfile.paymentNotVerifiedDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      if (
        !profileData.full_name ||
        !profileData.phone ||
        !profileData.address ||
        !profileData.city ||
        !profileData.postal_code
      ) {
        throw new Error(t("completeProfile.allFieldsRequired"));
      }

      const updateData: Record<string, unknown> = {
        fullName: profileData.full_name.trim(),
        companyName:
          userRole === "client" || (userRole === "freelancer" && profileData.has_cvr)
            ? profileData.company?.trim() || null
            : null,
        cvrNumber: profileData.has_cvr ? profileData.cvr_number?.trim() || null : null,
        location: profileData.country,
        address: profileData.address.trim(),
        city: profileData.city.trim(),
        postalCode: profileData.postal_code.trim(),
        phoneNumber: `${profileData.country_code} ${profileData.phone.trim()}`,
        phoneVerified: phoneVerified,
        paymentVerified: userRole === "client" ? paymentVerified : true,
      };

      await api.profiles.updateMyProfile(updateData);

      toast({
        title: t("completeProfile.profileCompleted"),
        description: t("completeProfile.profileCompletedDesc"),
      });

      if (userRole === "client") {
        navigate("/client");
      } else {
        navigate("/");
      }
    } catch (error: unknown) {
      console.error("Error completing profile:", error);

      let errorMessage = "Kunne ikke gemme profil. Prøv igen.";

      const err = error as {
        response?: { status?: number; data?: { error?: string; message?: string } };
        message?: string;
      };

      if (err.response?.status === 429) {
        errorMessage = "For mange anmodninger. Vent venligst et øjeblik og prøv igen.";
        toast({
          title: "For mange anmodninger",
          description: errorMessage,
          variant: "destructive",
        });
        setLoading(false);
        setIsSubmitting(false);
        return;
      }

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (errorMessage.toLowerCase().includes("telefon") || errorMessage.toLowerCase().includes("phone")) {
        errorMessage = t("completeProfile.phoneAlreadyRegistered");
      }

      toast({
        title: t("completeProfile.completionError"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  }, [
    api.profiles,
    navigate,
    paymentVerified,
    phoneVerified,
    profileData,
    t,
    toast,
    user,
    userRole,
    validateStep1,
    validateStep2,
    isSubmitting,
    loading,
  ]);

  const handleNext = useCallback(() => {
    if (currentStep === 1 && validateStep1()) {
      if (userRole === "freelancer") {
        void handleComplete();
      } else {
        setCurrentStep(2);
      }
    }
  }, [currentStep, handleComplete, userRole, validateStep1]);

  const contextValue = useMemo<CompleteProfileContextValue>(
    () => ({
      profileData,
      updateProfileData,
      setProfileData,
      currentStep,
      setCurrentStep,
      phoneVerified,
      setPhoneVerified,
      paymentVerified,
      setPaymentVerified,
      loading,
      isSubmitting,
      userRole: userRole ?? null,
      user,
      computeStep1Valid,
      validateStep2,
      handleNext,
      handleComplete,
    }),
    [
      profileData,
      updateProfileData,
      currentStep,
      phoneVerified,
      paymentVerified,
      loading,
      isSubmitting,
      userRole,
      user,
      computeStep1Valid,
      validateStep2,
      handleNext,
      handleComplete,
    ],
  );

  return <CompleteProfileContext.Provider value={contextValue}>{children}</CompleteProfileContext.Provider>;
};

export const useCompleteProfile = () => {
  const context = useContext(CompleteProfileContext);
  if (!context) {
    throw new Error("useCompleteProfile must be used within a CompleteProfileProvider");
  }
  return context;
};


