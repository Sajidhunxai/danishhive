import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Crown, Eye, EyeOff, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { BirthdayPicker } from "@/components/ui/birthday-picker";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthday, setBirthday] = useState<Date>();
  const [selectedRole, setSelectedRole] = useState("freelancer");
  const [selectedGender, setSelectedGender] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { user, signIn, signUp } = useAuth();

  // Calculate age from birthday
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const createInitialAdmin = async () => {
    setCreatingAdmin(true);
    try {
      // Admin creation should be done via backend seeder or database directly
      toast({
        title: "Info",
        description: "Admin accounts are created via database seeder. Use: admin@talentforge.com / password123",
      });
    } catch (error: any) {
      console.error('Admin creation error:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke oprette admin bruger",
        variant: "destructive",
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    return {
      isValid: Object.values(requirements).every(Boolean),
      requirements
    };
  };

  const passwordValidation = validatePassword(password);

  useEffect(() => {
    // Check if user is already authenticated when component mounts
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      
      toast({
        title: t('welcomeBack'),
        description: t('nowLoggedIn'),
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('loginFailed'),
        description: error.message || t('invalidCredentials'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      toast({
        variant: "destructive",
        title: t('invalidPassword'),
        description: t('passwordRequirementsNotMet'),
      });
      return;
    }

    // Check if gender is provided
    if (!selectedGender) {
      toast({
        variant: "destructive",
        title: "Køn mangler",
        description: "Venligst vælg dit køn for at fortsætte.",
      });
      return;
    }

    // Check if terms are accepted
    if (!acceptTerms) {
      toast({
        variant: "destructive",
        title: "Accepter servicevilkår",
        description: "Du skal acceptere servicevilkår og privatlivspolitik for at oprette en konto.",
      });
      return;
    }

    // Check if birthday is provided
    if (!birthday) {
      toast({
        variant: "destructive",
        title: "Fødselsdato mangler",
        description: "Venligst vælg din fødselsdato for at fortsætte.",
      });
      return;
    }

    // Check age - if under 18 and freelancer, redirect to special form
    const age = calculateAge(birthday);
    if (age < 18 && selectedRole === "freelancer") {
      // Store data in localStorage and redirect to under-18 form
      localStorage.setItem('under18FormData', JSON.stringify({
        email,
        birthday: birthday.toISOString(),
        fullName
      }));
      navigate('/under-18-application');
      return;
    }

    // Email conflict check will be handled by backend during registration

    // Check if freelancer is from Europe - only allow European freelancers
    if (selectedRole === "freelancer") {
      // For now, we'll add this check during profile completion where location is selected
      // This ensures all necessary data is available for validation
    }
    
    setLoading(true);

    try {
      await signUp({
        email,
        password,
        fullName,
        userType: selectedRole.toUpperCase() as 'FREELANCER' | 'CLIENT',
      });

      toast({
        title: t('welcome'),
        description: "Du vil nu blive videresendt til at udfylde din profil.",
      });
      // Redirect to profile completion after successful signup
      navigate('/complete-profile');
    } catch (error: any) {
      let errorMessage = error.message || "Kunne ikke oprette konto";
      let errorTitle = t('signupFailed');
      
      if (errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
        errorTitle = "Email allerede registreret";
        errorMessage = "Denne email er allerede registreret. Hver email kan kun have én konto. Prøv at logge ind i stedet.";
      }
      
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { api } = await import('@/services/api');
      await api.auth.forgotPassword(email);

      toast({
        title: t('resetEmailSent'),
        description: t('checkEmailReset'),
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('resetFailed'),
        description: error.message || "Kunne ikke sende reset email",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Selection and Theme Toggle */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* Logo */}

        <Card className="border-0 shadow-lg bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('welcome')}</CardTitle>
            <CardDescription>
              {t('loginOrSignup')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{t('resetPassword')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('resetPasswordDesc')}
                  </p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t('email')}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="din@email.dk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-input border-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetLoading}
                  >
                    {resetLoading ? t('loggingIn') : t('sendResetLink')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    {t('backToLogin')}
                  </Button>
                </form>
              </div>
            ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {t('login')}
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {t('signup')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <div className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="din@email.dk"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-input border-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('password')}</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-input border-input pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <Label
                          htmlFor="remember"
                          className="text-sm font-normal cursor-pointer"
                        >
                          {t('rememberMe')}
                        </Label>
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-sm"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        {t('forgotPassword')}
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? t('loggingIn') : t('login')}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <div className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">{t('fullName')}</Label>
                    <Input
                      id="fullname"
                      type="text"
                      placeholder="Dit fulde navn"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="bg-input border-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Vælg din rolle</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="bg-input border-input">
                        <SelectValue placeholder="Vælg rolle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freelancer">
                          <div className="flex items-center space-x-2">
                            <span>💼</span>
                            <div>
                              <p className="font-medium">Freelancer</p>
                              <p className="text-xs text-muted-foreground">Jeg tilbyder mine tjenester</p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="client">
                          <div className="flex items-center space-x-2">
                            <span>🏢</span>
                            <div>
                              <p className="font-medium">Klient</p>
                              <p className="text-xs text-muted-foreground">Jeg har brug for hjælp til projekter</p>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                   </div>
                   
                    <div className="space-y-2">
                      <Label htmlFor="birthday">Fødselsdato *</Label>
                      <BirthdayPicker
                        date={birthday}
                        onSelect={setBirthday}
                        placeholder="Vælg fødselsdato"
                        className="w-full"
                      />
                      {birthday && selectedRole === "freelancer" && calculateAge(birthday) < 18 && (
                        <p className="text-sm text-blue-600">
                          Da du er under 18, vil du blive dirigeret til en særlig ansøgningsformular.
                        </p>
                      )}
                     </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Køn *</Label>
                      <Select value={selectedGender} onValueChange={setSelectedGender} required>
                        <SelectTrigger className="bg-input border-input">
                          <SelectValue placeholder="Vælg køn" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">
                            <div className="flex items-center space-x-2">
                              <span>♂️</span>
                              <span>Mand</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="female">
                            <div className="flex items-center space-x-2">
                              <span>♀️</span>
                              <span>Kvinde</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="prefer_not_to_say">
                            <div className="flex items-center space-x-2">
                              <span>🤐</span>
                              <span>Ønsker ikke at oplyse</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('email')}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="din@email.dk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-input border-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('password')}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="bg-input border-input"
                    />
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">{t('passwordRequirements')}</p>
                      <ul className="space-y-1">
                        <li className={`flex items-center gap-2 ${passwordValidation.requirements.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                            {passwordValidation.requirements.minLength ? '✓' : ''}
                          </span>
                          {t('minLength')}
                        </li>
                        <li className={`flex items-center gap-2 ${passwordValidation.requirements.hasUppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                            {passwordValidation.requirements.hasUppercase ? '✓' : ''}
                          </span>
                          {t('uppercase')}
                        </li>
                        <li className={`flex items-center gap-2 ${passwordValidation.requirements.hasLowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                            {passwordValidation.requirements.hasLowercase ? '✓' : ''}
                          </span>
                          {t('lowercase')}
                        </li>
                        <li className={`flex items-center gap-2 ${passwordValidation.requirements.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                            {passwordValidation.requirements.hasNumber ? '✓' : ''}
                          </span>
                          {t('numbers')}
                        </li>
                        <li className={`flex items-center gap-2 ${passwordValidation.requirements.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                            {passwordValidation.requirements.hasSpecialChar ? '✓' : ''}
                          </span>
                          {t('specialChars')}
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="accept-terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      required
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="accept-terms"
                        className="text-sm font-normal cursor-pointer leading-relaxed"
                      >
                        Jeg accepterer{" "}
                        <a
                          href="/terms-of-service"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          servicevilkårene
                        </a>{" "}
                        og{" "}
                        <a
                          href="/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          privatlivspolitikken
                        </a>
                        .
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Ved at acceptere bekræfter du, at du har læst og forstået vores vilkår.
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || !passwordValidation.isValid || !acceptTerms}
                  >
                    {loading ? t('creatingAccount') : `Opret ${selectedRole === 'client' ? 'Klient' : 'Freelancer'} Konto`}
                  </Button>
                </form>
                </div>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;