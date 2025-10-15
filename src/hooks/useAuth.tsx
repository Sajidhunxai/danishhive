/**
 * Legacy Supabase Auth Hook - Now redirects to Backend Auth
 * This file is kept for backward compatibility.
 * All auth now uses the custom backend API instead of Supabase.
 */

// Re-export everything from the new backend auth
export { 
  useBackendAuth as useAuth,
  BackendAuthProvider as AuthProvider,
} from './useBackendAuth';