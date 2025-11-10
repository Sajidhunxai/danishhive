import React from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { Eye, EyeOff } from "lucide-react";
import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { AuthPageProvider, useAuthPage } from "@/contexts/AuthPageContext";

const AuthContent = () => {
  const { t } = useLanguage();
  const {
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
    rememberMe,
    setRememberMe,
    showForgotPassword,
    setShowForgotPassword,
    showPassword,
    setShowPassword,
    resetLoading,
    passwordValidation,
    calculateAge,
    handleLogin,
    handleSignUp,
    handleForgotPassword,
  } = useAuthPage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center gap-4 mb-6" />
        <Card className="border-0 shadow-lg bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("welcome")}</CardTitle>
            <CardDescription>{t("loginOrSignup")}</CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{t("resetPassword")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t("resetPasswordDesc")}</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t("email")}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="din@email.dk"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="bg-input border-input"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={resetLoading}>
                    {resetLoading ? t("loggingIn") : t("sendResetLink")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    {t("backToLogin")}
                  </Button>
                </form>
              </div>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-secondary">
                  <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {t("login")}
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    {t("signup")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <div className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="din@email.dk"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          className="bg-input border-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">{t("password")}</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
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
                            onCheckedChange={(checked) => setRememberMe(!!checked)}
                          />
                          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                            {t("rememberMe")}
                          </Label>
                        </div>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 text-sm"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          {t("forgotPassword")}
                        </Button>
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t("loggingIn") : t("login")}
                      </Button>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="signup">
                  <div className="space-y-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullname">{t("fullName")}</Label>
                        <Input
                          id="fullname"
                          type="text"
                          placeholder="Dit fulde navn"
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
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
                        <BirthdayPicker date={birthday} onSelect={setBirthday} placeholder="Vælg fødselsdato" className="w-full" />
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
                        <Label htmlFor="signup-email">{t("email")}</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="din@email.dk"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          required
                          className="bg-input border-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{t("password")}</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                          minLength={8}
                          className="bg-input border-input"
                        />
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">{t("passwordRequirements")}</p>
                          <ul className="space-y-1">
                            <li
                              className={`flex items-center gap-2 ${
                                passwordValidation.requirements.minLength ? "text-green-600" : "text-muted-foreground"
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                                {passwordValidation.requirements.minLength ? "✓" : ""}
                              </span>
                              {t("minLength")}
                            </li>
                            <li
                              className={`flex items-center gap-2 ${
                                passwordValidation.requirements.hasUppercase ? "text-green-600" : "text-muted-foreground"
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                                {passwordValidation.requirements.hasUppercase ? "✓" : ""}
                              </span>
                              {t("uppercase")}
                            </li>
                            <li
                              className={`flex items-center gap-2 ${
                                passwordValidation.requirements.hasLowercase ? "text-green-600" : "text-muted-foreground"
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                                {passwordValidation.requirements.hasLowercase ? "✓" : ""}
                              </span>
                              {t("lowercase")}
                            </li>
                            <li
                              className={`flex items-center gap-2 ${
                                passwordValidation.requirements.hasNumber ? "text-green-600" : "text-muted-foreground"
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                                {passwordValidation.requirements.hasNumber ? "✓" : ""}
                              </span>
                              {t("numbers")}
                            </li>
                            <li
                              className={`flex items-center gap-2 ${
                                passwordValidation.requirements.hasSpecialChar ? "text-green-600" : "text-muted-foreground"
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs">
                                {passwordValidation.requirements.hasSpecialChar ? "✓" : ""}
                              </span>
                              {t("specialChars")}
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="accept-terms"
                          checked={acceptTerms}
                          onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                          required
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="accept-terms" className="text-sm font-normal cursor-pointer leading-relaxed">
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

                      <Button type="submit" className="w-full" disabled={loading || !passwordValidation.isValid || !acceptTerms}>
                        {loading ? t("creatingAccount") : `Opret ${selectedRole === "client" ? "Klient" : "Freelancer"} Konto`}
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

const Auth = () => (
  <AuthPageProvider>
    <AuthContent />
  </AuthPageProvider>
);

export default Auth;