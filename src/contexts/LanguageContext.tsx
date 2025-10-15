import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Language = 'da' | 'en' | 'zh' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  da: {
    // Auth translations
    welcome: 'Velkommen',
    loginOrSignup: 'Log ind eller opret en konto som freelancer',
    login: 'Log ind',
    signup: 'Opret konto',
    email: 'Email',
    password: 'Adgangskode',
    fullName: 'Fulde navn',
    rememberMe: 'Husk mig på denne enhed',
    forgotPassword: 'Glemt adgangskode?',
    continueWithGoogle: 'Fortsæt med Google',
    createWithGoogle: 'Opret konto med Google',
    orContinueWith: 'Eller fortsæt med email',
    orCreateWith: 'Eller opret konto med email',
    loggingIn: 'Logger ind...',
    creatingAccount: 'Opretter konto...',
    createFreelancerAccount: 'Opret freelancer konto',
    loginFailed: 'Login fejlede',
    signupFailed: 'Registrering fejlede',
    googleLoginFailed: 'Google login fejlede',
    welcomeBack: 'Velkommen tilbage!',
    nowLoggedIn: 'Du er nu logget ind.',
    checkEmail: 'Check din email for at bekræfte din konto.',
    invalidCredentials: 'Forkerte login oplysninger',
    userAlreadyRegistered: 'Brugeren er allerede registreret',
    passwordRequirements: 'Adgangskoden skal indeholde:',
    minLength: 'Minimum 8 tegn',
    uppercase: 'Store bogstaver (A-Z)',
    lowercase: 'Små bogstaver (a-z)',
    numbers: 'Tal (0-9)',
    specialChars: 'Specialtegn (!@#$%^&*)',
    invalidPassword: 'Ugyldig adgangskode',
    passwordRequirementsNotMet: 'Adgangskoden opfylder ikke alle krav.',
    resetPassword: 'Nulstil adgangskode',
    resetPasswordDesc: 'Indtast din email for at modtage et link til nulstilling af adgangskode',
    sendResetLink: 'Send nulstillings link',
    backToLogin: 'Tilbage til login',
    resetEmailSent: 'Nulstillings email sendt',
    checkEmailReset: 'Check din email for link til nulstilling af adgangskode.',
    resetFailed: 'Nulstilling fejlede',
    
    // Navigation and general
    'nav.jobs': 'Opgaver',
    'nav.profile': 'Profil',
    'nav.settings': 'Indstillinger',
    'nav.logout': 'Log ud',
    'nav.login': 'Log ind',
    'nav.signup': 'Tilmeld',
    'common.save': 'Gem',
    'common.cancel': 'Annuller',
    'common.delete': 'Slet',
    'common.edit': 'Rediger',
    'common.back': 'Tilbage',
    'common.loading': 'Indlæser...',
    
    // Profile page
    'profile.title': 'Min Profil',
    'profile.basic_info': 'Grundlæggende Information',
    'profile.full_name': 'Fuldt Navn',
    'profile.company': 'Firma',
    'profile.phone': 'Telefon',
    'profile.location': 'Lokation',
    'profile.hourly_rate': 'Timepris (DKK)',
    'profile.about': 'Om Mig',
    'profile.skills': 'Kompetencer',
    'profile.languages': 'Sprog',
    'profile.projects': 'Mine Projekter',
    'profile.active_status': 'Aktiv',
    'profile.not_available': 'Ikke tilgængelig',
    'profile.total_earnings': 'Total indtjening',
    'profile.highly_recommended': 'Highly recommended bee',
    'profile.language_skills': 'Sprogfærdigheder',
    
    // Language levels
    'language.beginner': 'Begynder',
    'language.intermediate': 'Mellem',
    'language.advanced': 'Avanceret',
    'language.native': 'Modersmål',
  },
  en: {
    // Auth translations
    welcome: 'Welcome',
    loginOrSignup: 'Log in or create an account as a freelancer',
    login: 'Log in',
    signup: 'Sign up',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    rememberMe: 'Remember me on this device',
    forgotPassword: 'Forgot password?',
    continueWithGoogle: 'Continue with Google',
    createWithGoogle: 'Sign up with Google',
    orContinueWith: 'Or continue with email',
    orCreateWith: 'Or create account with email',
    loggingIn: 'Logging in...',
    creatingAccount: 'Creating account...',
    createFreelancerAccount: 'Create freelancer account',
    loginFailed: 'Login failed',
    signupFailed: 'Registration failed',
    googleLoginFailed: 'Google login failed',
    welcomeBack: 'Welcome back!',
    nowLoggedIn: 'You are now logged in.',
    checkEmail: 'Check your email to confirm your account.',
    invalidCredentials: 'Invalid login credentials',
    userAlreadyRegistered: 'User already registered',
    passwordRequirements: 'Password must contain:',
    minLength: 'Minimum 8 characters',
    uppercase: 'Uppercase letters (A-Z)',
    lowercase: 'Lowercase letters (a-z)',
    numbers: 'Numbers (0-9)',
    specialChars: 'Special characters (!@#$%^&*)',
    invalidPassword: 'Invalid password',
    passwordRequirementsNotMet: 'Password does not meet all requirements.',
    resetPassword: 'Reset password',
    resetPasswordDesc: 'Enter your email to receive a password reset link',
    sendResetLink: 'Send reset link',
    backToLogin: 'Back to login',
    resetEmailSent: 'Reset email sent',
    checkEmailReset: 'Check your email for the password reset link.',
    resetFailed: 'Reset failed',
    
    // Navigation and general
    'nav.jobs': 'Jobs',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.signup': 'Sign up',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    
    // Profile page
    'profile.title': 'My Profile',
    'profile.basic_info': 'Basic Information',
    'profile.full_name': 'Full Name',
    'profile.company': 'Company',
    'profile.phone': 'Phone',
    'profile.location': 'Location',
    'profile.hourly_rate': 'Hourly Rate (DKK)',
    'profile.about': 'About Me',
    'profile.skills': 'Skills',
    'profile.languages': 'Languages',
    'profile.projects': 'My Projects',
    'profile.active_status': 'Active',
    'profile.not_available': 'Not Available',
    'profile.total_earnings': 'Total Earnings',
    'profile.highly_recommended': 'Highly recommended bee',
    'profile.language_skills': 'Language Skills',
    
    // Language levels
    'language.beginner': 'Beginner',
    'language.intermediate': 'Intermediate',
    'language.advanced': 'Advanced',
    'language.native': 'Native',
  },
  zh: {
    // Auth translations
    welcome: '欢迎',
    loginOrSignup: '登录或注册自由职业者账户',
    login: '登录',
    signup: '注册',
    email: '邮箱',
    password: '密码',
    fullName: '全名',
    rememberMe: '在此设备上记住我',
    forgotPassword: '忘记密码？',
    continueWithGoogle: '使用Google继续',
    createWithGoogle: '使用Google注册',
    orContinueWith: '或使用邮箱继续',
    orCreateWith: '或使用邮箱创建账户',
    loggingIn: '正在登录...',
    creatingAccount: '正在创建账户...',
    createFreelancerAccount: '创建自由职业者账户',
    loginFailed: '登录失败',
    signupFailed: '注册失败',
    googleLoginFailed: 'Google登录失败',
    welcomeBack: '欢迎回来！',
    nowLoggedIn: '您已成功登录。',
    checkEmail: '请检查您的邮箱以确认您的账户。',
    invalidCredentials: '登录凭证无效',
    userAlreadyRegistered: '用户已注册',
    passwordRequirements: '密码必须包含：',
    minLength: '至少8个字符',
    uppercase: '大写字母 (A-Z)',
    lowercase: '小写字母 (a-z)',
    numbers: '数字 (0-9)',
    specialChars: '特殊字符 (!@#$%^&*)',
    invalidPassword: '密码无效',
    passwordRequirementsNotMet: '密码不符合所有要求。',
    resetPassword: '重置密码',
    resetPasswordDesc: '输入您的邮箱以接收密码重置链接',
    sendResetLink: '发送重置链接',
    backToLogin: '返回登录',
    resetEmailSent: '重置邮件已发送',
    checkEmailReset: '请检查您的邮箱获取密码重置链接。',
    resetFailed: '重置失败',
    
    // Navigation and general
    'nav.jobs': '工作',
    'nav.profile': '个人资料',
    'nav.settings': '设置',
    'nav.logout': '退出登录',
    'nav.login': '登录',
    'nav.signup': '注册',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.back': '返回',
    'common.loading': '加载中...',
    
    // Profile page
    'profile.title': '我的资料',
    'profile.basic_info': '基本信息',
    'profile.full_name': '全名',
    'profile.company': '公司',
    'profile.phone': '电话',
    'profile.location': '位置',
    'profile.hourly_rate': '小时费率 (DKK)',
    'profile.about': '关于我',
    'profile.skills': '技能',
    'profile.languages': '语言',
    'profile.projects': '我的项目',
    'profile.active_status': '活跃',
    'profile.not_available': '不可用',
    'profile.total_earnings': '总收入',
    'profile.highly_recommended': '强烈推荐的蜂蜜',
    'profile.language_skills': '语言技能',
    
    // Language levels
    'language.beginner': '初级',
    'language.intermediate': '中级',
    'language.advanced': '高级',
    'language.native': '母语',
  },
  hi: {
    // Auth translations
    welcome: 'स्वागत है',
    loginOrSignup: 'फ्रीलांसर के रूप में लॉग इन करें या खाता बनाएं',
    login: 'लॉग इन करें',
    signup: 'साइन अप करें',
    email: 'ईमेल',
    password: 'पासवर्ड',
    fullName: 'पूरा नाम',
    rememberMe: 'मुझे इस डिवाइस पर याद रखें',
    forgotPassword: 'पासवर्ड भूल गए?',
    continueWithGoogle: 'Google के साथ जारी रखें',
    createWithGoogle: 'Google के साथ साइन अप करें',
    orContinueWith: 'या ईमेल के साथ जारी रखें',
    orCreateWith: 'या ईमेल के साथ खाता बनाएं',
    loggingIn: 'लॉग इन हो रहा है...',
    creatingAccount: 'खाता बन रहा है...',
    createFreelancerAccount: 'फ्रीलांसर खाता बनाएं',
    loginFailed: 'लॉगिन असफल',
    signupFailed: 'पंजीकरण असफल',
    googleLoginFailed: 'Google लॉगिन असफल',
    welcomeBack: 'वापस स्वागत है!',
    nowLoggedIn: 'आप अब लॉग इन हैं।',
    checkEmail: 'अपने खाते की पुष्टि के लिए अपना ईमेल जांचें।',
    invalidCredentials: 'अमान्य लॉगिन क्रेडेंशियल',
    userAlreadyRegistered: 'उपयोगकर्ता पहले से पंजीकृत है',
    passwordRequirements: 'पासवर्ड में होना चाहिए:',
    minLength: 'न्यूनतम 8 वर्ण',
    uppercase: 'बड़े अक्षर (A-Z)',
    lowercase: 'छोटे अक्षर (a-z)',
    numbers: 'संख्याएं (0-9)',
    specialChars: 'विशेष वर्ण (!@#$%^&*)',
    invalidPassword: 'अमान्य पासवर्ड',
    passwordRequirementsNotMet: 'पासवर्ड सभी आवश्यकताओं को पूरा नहीं करता।',
    resetPassword: 'पासवर्ड रीसेट करें',
    resetPasswordDesc: 'पासवर्ड रीसेट लिंक प्राप्त करने के लिए अपना ईमेल दर्ज करें',
    sendResetLink: 'रीसेट लिंक भेजें',
    backToLogin: 'लॉगिन पर वापस जाएं',
    resetEmailSent: 'रीसेट ईमेल भेजा गया',
    checkEmailReset: 'पासवर्ड रीसेट लिंक के लिए अपना ईमेल जांचें।',
    resetFailed: 'रीसेट असफल',
    
    // Navigation and general
    'nav.jobs': 'नौकरियां',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.settings': 'सेटिंग्स',
    'nav.logout': 'लॉगआउट',
    'nav.login': 'लॉग इन करें',
    'nav.signup': 'साइन अप करें',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.back': 'वापस',
    'common.loading': 'लोड हो रहा है...',
    
    // Profile page
    'profile.title': 'मेरी प्रोफ़ाइल',
    'profile.basic_info': 'बुनियादी जानकारी',
    'profile.full_name': 'पूरा नाम',
    'profile.company': 'कंपनी',
    'profile.phone': 'फोन',
    'profile.location': 'स्थान',
    'profile.hourly_rate': 'घंटे की दर (DKK)',
    'profile.about': 'मेरे बारे में',
    'profile.skills': 'कौशल',
    'profile.languages': 'भाषाएं',
    'profile.projects': 'मेरी परियोजनाएं',
    'profile.active_status': 'सक्रिय',
    'profile.not_available': 'उपलब्ध नहीं',
    'profile.total_earnings': 'कुल कमाई',
    'profile.highly_recommended': 'अत्यधिक अनुशंसित मधुमक्खी',
    'profile.language_skills': 'भाषा कौशल',
    
    // Language levels
    'language.beginner': 'शुरुआती',
    'language.intermediate': 'मध्यम',
    'language.advanced': 'उन्नत',
    'language.native': 'मातृभाषा',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>('da');

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && ['da', 'en', 'zh', 'hi'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['da']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};