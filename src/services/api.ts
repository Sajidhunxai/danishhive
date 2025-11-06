// API Service to replace Supabase with Backend API
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retryCount: number;
  url: string;
}

class ApiService {
  private api: AxiosInstance;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private requestQueue: Map<string, PendingRequest[]> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds cache
  private readonly PERSISTENT_CACHE_TTL = 300000; // 5 minutes for persistent cache
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second base delay

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Log error for debugging
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });

        if (error.response?.status === 401) {
          // Don't try to refresh token for auth endpoints (login, register, etc.)
          // These endpoints should return 401 errors normally
          const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                                 error.config?.url?.includes('/auth/register') ||
                                 error.config?.url?.includes('/auth/refresh-token') ||
                                 error.config?.url?.includes('/auth/forgot-password') ||
                                 error.config?.url?.includes('/auth/reset-password');
          
          if (isAuthEndpoint) {
            // For auth endpoints, just pass through the error
            // Don't try to refresh token or redirect
          } else {
            // For other endpoints, try to refresh token
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              try {
                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                  refreshToken,
                });
                const { token, refreshToken: newRefreshToken } = response.data;
                localStorage.setItem('auth_token', token);
                localStorage.setItem('refresh_token', newRefreshToken);
                
                // Retry original request
                if (error.config) {
                  error.config.headers.Authorization = `Bearer ${token}`;
                  return axios(error.config);
                }
              } catch (refreshError) {
                // Refresh failed, clear auth and redirect
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/auth';
              }
            } else {
              // No refresh token, redirect to login
              localStorage.removeItem('auth_token');
              window.location.href = '/auth';
            }
          }
        }
        
        // Don't retry on rate limit errors (429)
        if (error.response?.status === 429) {
          const errorData = error.response.data as any;
          error.message = errorData?.message || errorData?.error || 'Too many requests. Please wait a moment and try again.';
          return Promise.reject(error);
        }
        
        // Enhance error object with better error message
        if (error.response?.data) {
          const errorData = error.response.data as any;
          if (errorData.error) {
            error.message = errorData.error;
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            error.message = errorData.errors.map((e: any) => e.msg || e.message || e).join(', ');
          }
        } else if (!error.response) {
          // Network error or server not reachable
          error.message = 'Unable to connect to server. Please check your internet connection.';
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Persistent cache using localStorage
  private getPersistentCache(key: string): CacheEntry | null {
    try {
      const cached = localStorage.getItem(`api_cache_${key}`);
      if (!cached) return null;
      
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(`api_cache_${key}`);
        return null;
      }
      return entry;
    } catch (error) {
      console.error('Error reading persistent cache:', error);
      return null;
    }
  }

  private setPersistentCache(key: string, data: any, ttl: number = this.PERSISTENT_CACHE_TTL): void {
    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      localStorage.setItem(`api_cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error('Error writing persistent cache:', error);
      // If localStorage is full, clear old entries
      this.clearOldCacheEntries();
    }
  }

  private clearOldCacheEntries(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith('api_cache_'));
      const now = Date.now();
      
      cacheKeys.forEach(key => {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '{}');
          if (entry.expiresAt && now > entry.expiresAt) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing old cache entries:', error);
    }
  }

  // Get cache from memory or persistent storage
  private getCache(key: string): CacheEntry | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && Date.now() < memoryEntry.expiresAt) {
      return memoryEntry;
    }
    
    // Check persistent cache
    return this.getPersistentCache(key);
  }

  // Set cache in both memory and persistent storage
  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    
    // Store in memory cache
    this.memoryCache.set(key, entry);
    
    // Store in persistent cache for important endpoints
    if (key.includes('my-jobs') || key.includes('users:with-email') || key.includes('profiles:me')) {
      this.setPersistentCache(key, data, this.PERSISTENT_CACHE_TTL);
    }
  }

  // Request queuing to prevent duplicate requests
  private async queueRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    // Check cache first if enabled
    if (useCache) {
      const cached = this.getCache(key);
      if (cached) {
        console.log(`Returning cached data for ${key}`);
        return cached.data;
      }
    }

    // Check if there's already a pending request for this key
    const pending = this.requestQueue.get(key);
    if (pending && pending.length > 0) {
      console.log(`Request already pending for ${key}, queuing...`);
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject, retryCount: 0, url: key });
      });
    }

    // Create new queue for this request
    this.requestQueue.set(key, []);

    try {
      const result = await requestFn();
      
      // Cache the result
      if (useCache) {
        this.setCache(key, result);
      }
      
      // Resolve all pending requests
      const queue = this.requestQueue.get(key) || [];
      queue.forEach(pending => pending.resolve(result));
      this.requestQueue.delete(key);
      
      return result;
    } catch (error: any) {
      // Handle 429 errors with retry logic
      if (error.response?.status === 429) {
        const queue = this.requestQueue.get(key) || [];
        const retryAfter = this.getRetryAfter(error.response);
        
        console.log(`Rate limited for ${key}, retrying after ${retryAfter}ms`);
        
        // Wait and retry
        await this.delay(retryAfter);
        
        try {
          const result = await requestFn();
          if (useCache) {
            this.setCache(key, result);
          }
          
          queue.forEach(pending => pending.resolve(result));
          this.requestQueue.delete(key);
          return result;
        } catch (retryError) {
          // If retry fails, check for cached data
          const cached = this.getCache(key);
          if (cached) {
            console.log(`Retry failed, returning stale cached data for ${key}`);
            queue.forEach(pending => pending.resolve(cached.data));
            this.requestQueue.delete(key);
            return cached.data;
          }
          
          queue.forEach(pending => pending.reject(retryError));
          this.requestQueue.delete(key);
          throw retryError;
        }
      }
      
      // For other errors, reject all pending requests
      const queue = this.requestQueue.get(key) || [];
      queue.forEach(pending => pending.reject(error));
      this.requestQueue.delete(key);
      throw error;
    }
  }

  private getRetryAfter(response: any): number {
    // Check Retry-After header
    const retryAfter = response?.headers?.['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      return seconds * 1000;
    }
    
    // Default exponential backoff
    return this.RETRY_DELAY_BASE * 2; // 2 seconds
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get backend URL for static files (images, etc.)
  getBackendUrl = () => {
    return BACKEND_URL;
  };

  // Auth endpoints
  auth = {
    register: async (data: {
      email: string;
      password: string;
      fullName: string;
      userType: 'FREELANCER' | 'CLIENT';
      companyName?: string;
      cvrNumber?: string;
    }) => {
      const response = await this.api.post('/auth/register', data);
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
      return response.data;
    },

    login: async (email: string, password: string) => {
      const response = await this.api.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
      return response.data;
    },

    logout: async () => {
      try {
        await this.api.post('/auth/logout');
      } finally {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
    },

    getCurrentUser: async () => {
      const response = await this.api.get('/auth/me');
      return response.data.user;
    },

    verifyEmail: async (token: string) => {
      const response = await this.api.post('/auth/verify-email', { token });
      return response.data;
    },

    forgotPassword: async (email: string) => {
      const response = await this.api.post('/auth/forgot-password', { email });
      return response.data;
    },

    resetPassword: async (token: string, newPassword: string) => {
      const response = await this.api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    },
    
    changePassword: async (currentPassword: string, newPassword: string) => {
      const response = await this.api.post('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    },

    updateEmail: async (newEmail: string) => {
      const response = await this.api.post('/auth/update-email', { newEmail });
      return response.data;
    },
  };

  // Profile endpoints
  profiles = {
    getPublicProfile: async (userId: string) => {
      const response = await this.api.get(`/profiles/public/${userId}`);
      return response.data.profile;
    },
    getMyProfile: async () => {
      const cacheKey = 'profiles:me';
      return this.queueRequest(cacheKey, async () => {
        const response = await this.api.get('/profiles/me');
        return response.data;
      }, true);
    },
    isMyProfileComplete: async () => {
      const response = await this.api.get('/profiles/me/verification');
      return response.data.complete as boolean;
    },

    updateMyProfile: async (data: any) => {
      try {
        const response = await this.api.put('/profiles/me', data);
        // Invalidate cache when profile is updated
        this.memoryCache.delete('profiles:me');
        localStorage.removeItem('api_cache_profiles:me');
        return response.data;
      } catch (error: any) {
        throw error;
      }
    },

    getProfileById: async (id: string) => {
      const response = await this.api.get(`/profiles/${id}`);
      return response.data.profile;
    },

    getAllFreelancers: async (filters?: any) => {
      const response = await this.api.get('/profiles/freelancers', { params: filters });
      return response.data.profiles;
    },

    createProject: async (data: any) => {
      const response = await this.api.post('/profiles/projects', data);
      return response.data.project;
    },

    updateProject: async (id: string, data: any) => {
      const response = await this.api.put(`/profiles/projects/${id}`, data);
      return response.data.project;
    },

    deleteProject: async (id: string) => {
      const response = await this.api.delete(`/profiles/projects/${id}`);
      return response.data;
    },
  };

  // Job endpoints
  jobs = {
    getAllJobs: async (filters?: any) => {
      const response = await this.api.get('/jobs', { params: filters });
      return response.data.jobs;
    },

    getJobById: async (id: string) => {
      const response = await this.api.get(`/jobs/${id}`);
      return response.data.job;
    },

    getMyJobs: async () => {
      const cacheKey = 'jobs:my-jobs';
      return this.queueRequest(cacheKey, async () => {
        const response = await this.api.get('/jobs/my/jobs');
        return response.data.jobs;
      });
    },

    createJob: async (data: any) => {
      const response = await this.api.post('/jobs', data);
      // Invalidate cache when job is created
      this.memoryCache.delete('jobs:my-jobs');
      localStorage.removeItem('api_cache_jobs:my-jobs');
      return response.data.job;
    },

    updateJob: async (id: string, data: any) => {
      const response = await this.api.put(`/jobs/${id}`, data);
      // Invalidate cache when job is updated
      this.memoryCache.delete('jobs:my-jobs');
      localStorage.removeItem('api_cache_jobs:my-jobs');
      return response.data.job;
    },

    deleteJob: async (id: string) => {
      const response = await this.api.delete(`/jobs/${id}`);
      // Invalidate cache when job is deleted
      this.memoryCache.delete('jobs:my-jobs');
      localStorage.removeItem('api_cache_jobs:my-jobs');
      return response.data;
    },
  };

  // Application endpoints
  applications = {
    createApplication: async (data: {
      jobId: string;
      coverLetter: string;
      proposedRate?: number;
    }) => {
      const response = await this.api.post('/applications', data);
      return response.data.application;
    },

    getMyApplications: async () => {
      const response = await this.api.get('/applications/my-applications');
      return response.data.applications;
    },

    getJobApplications: async (jobId: string) => {
      const response = await this.api.get(`/applications/job/${jobId}`);
      return response.data.applications;
    },

    updateApplication: async (id: string, data: any) => {
      const response = await this.api.put(`/applications/${id}`, data);
      return response.data.application;
    },

    deleteApplication: async (id: string) => {
      const response = await this.api.delete(`/applications/${id}`);
      return response.data;
    },
  };

  // Contract endpoints
  contracts = {
    getMyContracts: async () => {
      const response = await this.api.get('/contracts/my-contracts');
      return response.data.contracts;
    },
    getAllContracts: async () => {
      const response = await this.api.get('/contracts');
      return response.data.contracts;
    },

    getContractById: async (id: string) => {
      const response = await this.api.get(`/contracts/${id}`);
      return response.data.contract;
    },

    createContract: async (data: any) => {
      const response = await this.api.post('/contracts', data);
      return response.data.contract;
    },

    updateContract: async (id: string, data: any) => {
      const response = await this.api.put(`/contracts/${id}`, data);
      return response.data.contract;
    },

    signContract: async (id: string, signatureData: string) => {
      const response = await this.api.post(`/contracts/${id}/sign`, { signatureData });
      return response.data.contract;
    },
  };

  // Message endpoints
  messages = {
    getAllMessages: async () => {
      const response = await this.api.get('/messages');
      return response.data.messages;
    },

    sendMessage: async (data: {
      receiverId: string;
      content: string;
      conversationId?: string;
    }) => {
      const response = await this.api.post('/messages', data);
      return response.data.message;
    },

    getConversations: async () => {
      const response = await this.api.get('/messages/conversations');
      return response.data.conversations;
    },

    getConversationWithUser: async (userId: string) => {
      const response = await this.api.get(`/messages/conversation/${userId}`);
      return response.data.messages;
    },

    getMessagesByConversationId: async (conversationId: string) => {
      const response = await this.api.get(`/messages/conversation-id/${conversationId}`);
      return response.data;
    },

    markAsRead: async (id: string) => {
      const response = await this.api.put(`/messages/${id}/read`);
      return response.data.message;
    },
  };

  // Forum endpoints
  forum = {
    getCategories: async () => {
      const response = await this.api.get('/forum/categories');
      return response.data.categories;
    },

    getPosts: async (filters?: any) => {
      const response = await this.api.get('/forum/posts', { params: filters });
      return response.data.posts;
    },

    getPostById: async (id: string) => {
      const response = await this.api.get(`/forum/posts/${id}`);
      return response.data.post;
    },

    createPost: async (data: { categoryId: string; title: string; content: string }) => {
      const response = await this.api.post('/forum/posts', data);
      return response.data.post;
    },

    updatePost: async (id: string, data: any) => {
      const response = await this.api.put(`/forum/posts/${id}`, data);
      return response.data.post;
    },

    deletePost: async (id: string) => {
      const response = await this.api.delete(`/forum/posts/${id}`);
      return response.data;
    },

    createReply: async (data: { postId: string; content: string; parentReplyId?: string }) => {
      const response = await this.api.post('/forum/replies', data);
      return response.data.reply;
    },

    updateReply: async (id: string, content: string) => {
      const response = await this.api.put(`/forum/replies/${id}`, { content });
      return response.data.reply;
    },

    deleteReply: async (id: string) => {
      const response = await this.api.delete(`/forum/replies/${id}`);
      return response.data;
    },
  };

  // Honey Drops endpoints
  honey = {
    getBalance: async () => {
      const response = await this.api.get('/honey/balance');
      return response.data.balance;
    },

    getTransactions: async (filters?: any) => {
      const response = await this.api.get('/honey/transactions', { params: filters });
      return response.data.transactions;
    },

    purchase: async (amount: number, paymentId?: string) => {
      const response = await this.api.post('/honey/purchase', { amount, paymentId });
      return response.data.transaction;
    },

    spend: async (amount: number, description?: string) => {
      const response = await this.api.post('/honey/spend', { amount, description });
      return response.data.transaction;
    },

    refund: async (amount: number, description?: string, originalTransactionId?: string) => {
      const response = await this.api.post('/honey/refund', {
        amount,
        description,
        originalTransactionId,
      });
      return response.data.transaction;
    },
  };

  // Referral endpoints
  referrals = {
    getSummary: async () => {
      const response = await this.api.get('/referrals/summary');
      return response.data as { referralLimit: number; referralsUsed: number };
    },
    getMyReferrals: async () => {
      const response = await this.api.get('/referrals');
      return response.data.referrals as Array<{
        id: string;
        referrerId: string;
        referredEmail: string;
        status: string;
        referredEarnings: number;
        bonusPaid: boolean;
        bonusPaidAt: string | null;
        createdAt: string;
      }>;
    },
    getMyBonuses: async () => {
      const response = await this.api.get('/referrals/bonuses');
      return response.data.bonuses as Array<{
        id: string;
        referrerId: string;
        amount: number;
        status: string;
        createdAt: string;
      }>;
    },
    createReferral: async (referredEmail: string) => {
      const response = await this.api.post('/referrals', { referredEmail });
      return response.data.referral;
    },
  };

  // Language Skills endpoints
  languageSkills = {
    getMyLanguageSkills: async () => {
      const response = await this.api.get('/language-skills/me');
      return response.data.languageSkills as Array<{
        id: string;
        userId: string;
        languageCode: string;
        languageName: string;
        proficiencyLevel: string;
        createdAt: string;
        updatedAt: string;
      }>;
    },
    getUserLanguageSkills: async (userId: string) => {
      const response = await this.api.get(`/language-skills/user/${userId}`);
      return response.data.languageSkills as Array<{
        id: string;
        userId: string;
        languageCode: string;
        languageName: string;
        proficiencyLevel: string;
        createdAt: string;
        updatedAt: string;
      }>;
    },
    createLanguageSkill: async (languageCode: string, languageName: string, proficiencyLevel?: string) => {
      const response = await this.api.post('/language-skills', {
        languageCode,
        languageName,
        proficiencyLevel: proficiencyLevel || 'beginner',
      });
      return response.data.languageSkill;
    },
    updateLanguageSkill: async (id: string, proficiencyLevel: string) => {
      const response = await this.api.put(`/language-skills/${id}`, { proficiencyLevel });
      return response.data.languageSkill;
    },
    deleteLanguageSkill: async (id: string) => {
      const response = await this.api.delete(`/language-skills/${id}`);
      return response.data;
    },
  };

  // Earnings endpoints
  earnings = {
    getMyEarnings: async () => {
      const response = await this.api.get('/earnings/me');
      return response.data.earnings as Array<{
        id: string;
        job_id: string | null;
        amount: number;
        currency: string;
        payment_period_start: string;
        payment_period_end: string;
        payout_date: string | null;
        status: string;
        mollie_payment_id: string | null;
        description: string | null;
        created_at: string;
        jobs?: {
          title: string;
          client_id: string;
        } | null;
      }>;
    },
  };

  // Admin endpoints
  admin = {
    getDashboardStats: async () => {
      const response = await this.api.get('/admin/dashboard/stats');
      return response.data.stats;
    },

    getAllUsers: async (filters?: any) => {
      const response = await this.api.get('/admin/users', { params: filters });
      return response.data;
    },

    getUsersWithEmail: async () => {
      const cacheKey = 'admin:users:with-email';
      return this.queueRequest(cacheKey, async () => {
        const response = await this.api.get('/admin/users/with-email');
        return response.data;
      });
    },

    updateUser: async (id: string, data: any) => {
      const response = await this.api.put(`/admin/users/${id}`, data);
      // Invalidate cache when user is updated
      this.memoryCache.delete('admin:users:with-email');
      localStorage.removeItem('api_cache_admin:users:with-email');
      return response.data.user;
    },

    deleteUser: async (id: string) => {
      const response = await this.api.delete(`/admin/users/${id}`);
      // Invalidate cache when user is deleted
      this.memoryCache.delete('admin:users:with-email');
      localStorage.removeItem('api_cache_admin:users:with-email');
      return response.data;
    },

    changeUserRole: async (userId: string, newRole: string) => {
      const response = await this.api.post('/admin/users/change-role', { userId, newRole });
      // Invalidate cache when role is changed
      this.memoryCache.delete('admin:users:with-email');
      localStorage.removeItem('api_cache_admin:users:with-email');
      return response.data;
    },

    createAdminUser: async (email: string, password: string, fullName: string) => {
      const response = await this.api.post('/admin/users/create-admin', { email, password, fullName });
      // Invalidate cache when user is created
      this.memoryCache.delete('admin:users:with-email');
      localStorage.removeItem('api_cache_admin:users:with-email');
      return response.data;
    },

    updateUserPassword: async (userId: string, newPassword: string) => {
      const response = await this.api.post('/admin/users/update-password', { userId, newPassword });
      return response.data;
    },

    getAllCoupons: async (filters?: any) => {
      const response = await this.api.get('/admin/coupons', { params: filters });
      return response.data.coupons;
    },

    createCoupon: async (data: any) => {
      const response = await this.api.post('/admin/coupons', data);
      return response.data.coupon;
    },

    updateCoupon: async (id: string, data: any) => {
      const response = await this.api.put(`/admin/coupons/${id}`, data);
      return response.data.coupon;
    },

    deleteCoupon: async (id: string) => {
      const response = await this.api.delete(`/admin/coupons/${id}`);
      return response.data;
    },

    validateCoupon: async (code: string) => {
      const response = await this.api.get(`/admin/coupons/validate/${code}`);
      return response.data;
    },

    useCoupon: async (code: string) => {
      const response = await this.api.post(`/admin/coupons/use/${code}`);
      return response.data;
    },

    updateVerification: async (userId: string, verificationType: string, verified: boolean) => {
      const response = await this.api.post(`/admin/users/${userId}/verification`, { verificationType, verified });
      return response.data;
    },

    getRevenueOverview: async (month?: number, year?: number) => {
      const response = await this.api.get('/admin/revenue/overview', { params: { month, year } });
      return response.data;
    },

    getAdminUsers: async () => {
      const response = await this.api.get('/admin/users/admin');
      return response.data;
    },
  };

  // Verification endpoints
  verification = {
    checkPhoneAvailability: async (phoneNumber: string) => {
      const response = await this.api.post('/verification/phone/check-availability', { phoneNumber });
      return response.data.available;
    },

    sendSMS: async (phoneNumber: string, countryCode: string) => {
      const response = await this.api.post('/verification/phone/send-sms', { phoneNumber, countryCode });
      return response.data;
    },

    verifySMS: async (phoneNumber: string, countryCode: string, verificationCode: string) => {
      const response = await this.api.post('/verification/phone/verify-sms', {
        phoneNumber,
        countryCode,
        verificationCode,
      });
      return response.data;
    },

    verifyEmailChange: async (token: string) => {
      const response = await this.api.post('/auth/verify-email-change', { token });
      return response.data;
    },
  };

  // Upload endpoints
  upload = {
    uploadJobAttachment: async (file: string, jobId?: string, fileName?: string) => {
      const response = await this.api.post('/upload/job-attachment', { file, jobId, fileName });
      return response.data;
    },

    deleteJobAttachment: async (fileId: string, jobId?: string) => {
      const response = await this.api.delete('/upload/job-attachment', { data: { fileId, jobId } });
      return response.data;
    },

    moveTempFilesToJob: async (jobId: string, fileIds: string[]) => {
      const response = await this.api.post('/upload/move-temp-files', {
        jobId,
        fileIds,
      });
      return response.data;
    },
  };

  // Payment endpoints
  payments = {
    applyCoupon: async (code: string) => {
      const response = await this.api.post('/payments/coupon/apply', { code });
      return response.data;
    },

    applyClientCoupon: async (code: string, jobId?: string) => {
      const response = await this.api.post('/payments/coupon/apply-client', { code, jobId });
      return response.data;
    },

    verifyPaymentMethod: async () => {
      const response = await this.api.post('/payments/verify-method');
      return response.data;
    },

    checkPaymentStatus: async (paymentId: string) => {
      const response = await this.api.post('/payments/check-status', { paymentId });
      return response.data;
    },

    createEscrowPayment: async (contractId: string, amount: number, description?: string) => {
      const response = await this.api.post('/payments/escrow/create', { contractId, amount, description });
      return response.data;
    },

    releaseEscrowPayment: async (contractId: string, paymentId: string) => {
      const response = await this.api.post('/payments/escrow/release', { contractId, paymentId });
      return response.data;
    },

    createHoneyPayment: async (amount: number, couponCode?: string) => {
      const response = await this.api.post('/payments/honey/purchase', { amount, couponCode });
      return response.data;
    },
  };

  // GDPR endpoints
  gdpr = {
    exportData: async () => {
      const response = await this.api.get('/gdpr/export-data');
      return response.data;
    },

    deleteAccount: async (confirmation: string = 'DELETE') => {
      const response = await this.api.post('/gdpr/delete-account', { confirmation });
      return response.data;
    },
  };

  // Image approval endpoints
  imageApproval = {
    getPendingImages: async () => {
      const response = await this.api.get('/image-approval/pending');
      return response.data.images;
    },

    approveImage: async (imageId: string, adminNotes?: string) => {
      const response = await this.api.post(`/image-approval/${imageId}/approve`, { adminNotes });
      return response.data;
    },

    rejectImage: async (imageId: string, adminNotes?: string) => {
      const response = await this.api.post(`/image-approval/${imageId}/reject`, { adminNotes });
      return response.data;
    },
  };

  // Report endpoints
  reports = {
    createReport: async (data: {
      reportedUserId: string;
      reportCategory: string;
      reportReason: string;
      description?: string;
      conversationData?: any;
    }) => {
      const response = await this.api.post('/reports', data);
      return response.data;
    },

    getReports: async (status?: string) => {
      const response = await this.api.get('/reports', { params: { status } });
      return response.data.reports;
    },

    updateReportStatus: async (reportId: string, status: string, adminNotes?: string) => {
      const response = await this.api.patch(`/reports/${reportId}/status`, { status, adminNotes });
      return response.data;
    },
  };

  // Refund endpoints
  refunds = {
    refundApplicationHoneyDrops: async (jobId: string, selectedApplicantId: string) => {
      const response = await this.api.post('/refunds/application-honey-drops', { jobId, selectedApplicantId });
      return response.data;
    },
  };

  // University endpoints
  universities = {
    getUniversities: async () => {
      // This endpoint doesn't require authentication - use direct axios call
      const response = await axios.get(`${API_URL}/universities`);
      return response.data.universities;
    },
  };

  // Under-18 application endpoints
  under18 = {
    createApplication: async (data: {
      email: string;
      birthday: string;
      languageSkills: string[];
      softwareSkills: string[];
      codeLanguages: string[];
      educationInstitution?: string;
      cvFile: string; // base64
      cvFileName: string;
    }) => {
      // This endpoint doesn't require authentication - use direct axios call
      const response = await axios.post(`${API_URL}/under18/applications`, data);
      return response.data;
    },
  };

  // Translation endpoints
  translations = {
    getTranslations: async () => {
      const response = await this.api.get('/translations');
      return response.data.translations;
    },
    getTeamLeaders: async () => {
      const response = await this.api.get('/translations/team-leaders');
      return response.data.teamLeaders;
    },
    assignTranslation: async (translationId: string, assignedTo: string) => {
      const response = await this.api.post(`/translations/assign/${translationId}`, { assignedTo });
      return response.data;
    },
    createTranslationRequest: async (data: {
      jobId: string;
      attachmentId: string;
      originalLanguage?: string;
      targetLanguage: string;
      notes?: string;
    }) => {
      const response = await this.api.post('/translations/requests', data);
      return response.data;
    },
  };
}

// Export singleton instance
export const api = new ApiService();
export default api;

