import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/contexts/ApiContext";

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface PasswordValidation {
  isValid: boolean;
  requirements: PasswordRequirements;
}

interface AuthPageContextValue {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  fullName: string;
  setFullName: (value: string) => void;
  birthday: Date | undefined;
  setBirthday: (value: Date | undefined) => void;
  selectedRole: string;
  setSelectedRole: (value: string) => void;
  selectedGender: string;
  setSelectedGender: (value: string) => void;
  acceptTerms: boolean;
  setAcceptTerms: (value: boolean) => void;
  loading: boolean;
  creatingAdmin: boolean;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  showForgotPassword: boolean;
  setShowForgotPassword: (value: boolean) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  resetLoading: boolean;
  calculateAge: (birthDate: Date) => number;
  passwordValidation: PasswordValidation;
  handleLogin: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleSignUp: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleForgotPassword: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  createInitialAdmin: () => Promise<void>;
}

const AuthPageContext = createContext<AuthPageContextValue | null>(null);

const validatePassword = (password: string): PasswordValidation => {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  return {
    isValid: Object.values(requirements).every(Boolean),
    requirements,
  };
};

export const AuthPageProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, signIn, signUp } = useAuth();
  const api = useApi();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [selectedRole, setSelectedRole] = useState("freelancer");
  const [selectedGender, setSelectedGender] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const calculateAge = useCallback((birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  }, []);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  const createInitialAdmin = useCallback(async () => {
    setCreatingAdmin(true);
    try {
      toast({
        title: "Info",
        description: "Admin accounts are created via database seeder. Use: admin@talentforge.com / password123",
      });
    } catch (error: any) {
      console.error("Admin creation error:", error);
      toast({
        title: "Fejl",
        description: error?.message || "Kunne ikke oprette admin bruger",
        variant: "destructive",
      });
    } finally {
      setCreatingAdmin(false);
    }
  }, [toast]);

  const handleLogin = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setLoading(true);

      try {
        await signIn(email, password);

        toast({
          title: t("welcomeBack"),
          description: t("nowLoggedIn"),
        });

        navigate("/");
      } catch (error: any) {
        console.error("Login error:", error);

        let errorMessage = error?.message || t("invalidCredentials");

        if (errorMessage.includes("Server configuration error") || errorMessage.includes("JWT")) {
          errorMessage = "Server configuration error. Please contact support.";
        } else if (errorMessage.includes("Unable to connect")) {
          errorMessage = "Unable to connect to server. Please check your internet connection and try again.";
        } else if (errorMessage.includes("500") || errorMessage.includes("Server error")) {
          errorMessage = "Server error occurred. Please try again later or contact support.";
        }

        toast({
          variant: "destructive",
          title: t("loginFailed"),
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    },
    [email, password, signIn, toast, t, navigate],
  );

  const handleSignUp = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const currentValidation = validatePassword(password);

      if (!currentValidation.isValid) {
        toast({
          variant: "destructive",
          title: t("invalidPassword"),
          description: t("passwordRequirementsNotMet"),
        });
        return;
      }

      if (!selectedGender) {
        toast({
          variant: "destructive",
          title: "Køn mangler",
          description: "Venligst vælg dit køn for at fortsætte.",
        });
        return;
      }

      if (!acceptTerms) {
        toast({
          variant: "destructive",
          title: "Accepter servicevilkår",
          description: "Du skal acceptere servicevilkår og privatlivspolitik for at oprette en konto.",
        });
        return;
      }

      if (!birthday) {
        toast({
          variant: "destructive",
          title: "Fødselsdato mangler",
          description: "Venligst vælg din fødselsdato for at fortsætte.",
        });
        return;
      }

      const age = calculateAge(birthday);
      if (age < 18 && selectedRole === "freelancer") {
        localStorage.setItem(
          "under18FormData",
          JSON.stringify({
            email,
            birthday: birthday.toISOString(),
            fullName,
          }),
        );
        navigate("/under-18-application");
        return;
      }

      setLoading(true);

      try {
        await signUp({
          email,
          password,
          fullName,
          userType: selectedRole.toUpperCase() as "FREELANCER" | "CLIENT",
        });

        toast({
          title: t("welcome"),
          description: "Du vil nu blive videresendt til at udfylde din profil.",
        });

        navigate("/complete-profile");
      } catch (error: any) {
        let errorMessage = error?.message || "Kunne ikke oprette konto";
        let errorTitle = t("signupFailed");

        if (errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
          errorTitle = "Email allerede registreret";
          errorMessage =
            "Denne email er allerede registreret. Hver email kan kun have én konto. Prøv at logge ind i stedet.";
        }

        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    },
    [acceptTerms, birthday, calculateAge, email, fullName, navigate, password, selectedGender, selectedRole, signUp, t, toast],
  );

  const handleForgotPassword = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setResetLoading(true);

      try {
        await api.auth.forgotPassword(email);

        toast({
          title: t("resetEmailSent"),
          description: t("checkEmailReset"),
        });
        setShowForgotPassword(false);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: t("resetFailed"),
          description: error?.message || "Kunne ikke sende reset email",
        });
      } finally {
        setResetLoading(false);
      }
    },
    [api, email, t, toast],
  );

  const value = useMemo<AuthPageContextValue>(
    () => ({
      email,
      setEmail,
      password,
      setPassword,
      fullName,
      setFullName,
      birthday,
      setBirthday,
      selectedRole,
      setSelectedRole,
      selectedGender,
      setSelectedGender,
      acceptTerms,
      setAcceptTerms,
      loading,
      creatingAdmin,
      rememberMe,
      setRememberMe,
      showForgotPassword,
      setShowForgotPassword,
      showPassword,
      setShowPassword,
      resetLoading,
      calculateAge,
      passwordValidation,
      handleLogin,
      handleSignUp,
      handleForgotPassword,
      createInitialAdmin,
    }),
    [
      acceptTerms,
      birthday,
      calculateAge,
      createInitialAdmin,
      creatingAdmin,
      email,
      fullName,
      handleForgotPassword,
      handleLogin,
      handleSignUp,
      loading,
      password,
      passwordValidation,
      rememberMe,
      resetLoading,
      selectedGender,
      selectedRole,
      showForgotPassword,
      showPassword,
    ],
  );

  return <AuthPageContext.Provider value={value}>{children}</AuthPageContext.Provider>;
};

export const useAuthPage = (): AuthPageContextValue => {
  const context = useContext(AuthPageContext);
  if (!context) {
    throw new Error("useAuthPage must be used within an AuthPageProvider");
  }
  return context;
};


