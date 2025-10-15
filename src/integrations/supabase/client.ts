// DEPRECATED: This file is kept for backward compatibility only.
// All authentication now uses the backend API.
// DO NOT use this for new features. Use src/services/api.ts instead.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fmgbsampskpmcaabyznk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZ2JzYW1wc2twbWNhYWJ5em5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDgyNTksImV4cCI6MjA3MjkyNDI1OX0.VPkt6ndZfV1PhzixVAb_jwQJO8eRmgIjPXM7sD3BGZE";

// Supabase client with auto-refresh DISABLED to prevent token refresh attempts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: false, // Disabled - using backend API
    autoRefreshToken: false, // Disabled - no auto token refresh
    detectSessionInUrl: false, // Disabled
  }
});