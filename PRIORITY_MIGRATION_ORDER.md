# Priority Migration Order

## 🎯 Migration Strategy

Since we've already updated the `useAuth` hook to use the backend API, most authentication is now working. The remaining Supabase calls are mainly for data operations.

### ✅ Already Complete
1. **Authentication System** - All auth now uses backend API
2. **Auth Hook** - `useAuth` redirects to `useBackendAuth`
3. **App.tsx** - Uses `BackendAuthProvider`
4. **API Service** - Complete backend API client ready

### 🔄 Files That Need Migration (Priority Order)

#### Priority 1: Core Pages (High Impact)
These pages are critical for the app to function:

1. **src/pages/Auth.tsx**
   - Replace Supabase auth calls (mostly done via hook)
   - May have direct Supabase.auth calls for password reset
   - Update: Use `api.auth.forgotPassword()` and `api.auth.resetPassword()`

2. **src/pages/Profile.tsx**
   - Replace profile data fetching
   - Update: Use `api.profiles.getMyProfile()` and `api.profiles.updateMyProfile()`

3. **src/components/JobsSection.tsx**
   - Replace job listing queries
   - Update: Use `api.jobs.getAllJobs(filters)`

4. **src/pages/CreateJob.tsx**
   - Replace job creation
   - Update: Use `api.jobs.createJob(data)`

5. **src/pages/ClientDashboard.tsx**
   - Replace client dashboard data
   - Update: Use `api.jobs.getMyJobs()` and `api.applications.getJobApplications()`

#### Priority 2: User Features (Medium Impact)
These enhance user experience:

6. **src/pages/FreelancerProfile.tsx**
   - Replace freelancer profile viewing
   - Update: Use `api.profiles.getProfileById(id)`

7. **src/components/FreelancerSearch.tsx**
   - Replace freelancer search
   - Update: Use `api.profiles.getAllFreelancers(filters)`

8. **src/components/ContractSystem.tsx**
   - Replace contract operations
   - Update: Use `api.contracts.*` methods

9. **src/pages/Settings.tsx**
   - Replace settings updates
   - Update: Use `api.profiles.updateMyProfile()`

#### Priority 3: Admin Features (Admin Only)
Admin-specific functionality:

10. **src/components/AdminPanel.tsx**
    - Replace admin operations
    - Update: Use `api.admin.*` methods

11. **src/components/AdminUserProfilePopup.tsx**
    - Replace user management
    - Update: Use `api.admin.getAllUsers()` and `api.admin.updateUser()`

12. **src/components/AdminRevenueOverview.tsx**
    - Replace revenue data
    - Update: Use `api.admin.getDashboardStats()`

#### Priority 4: Secondary Features (Lower Impact)
Nice-to-have features:

13. **src/components/PaymentOverview.tsx**
14. **src/components/ReferralSystem.tsx**
15. **src/components/MembershipPayments.tsx**
16. Other remaining files...

### 🚀 Quick Start Guide

For each file, follow this pattern:

#### Step 1: Add Import
```typescript
import { api } from '@/services/api';
import { useQuery, useMutation } from '@tanstack/react-query';
```

#### Step 2: Replace Data Fetching
```typescript
// Old Supabase
const { data: jobs } = await supabase.from('jobs').select('*');

// New Backend API
const { data: jobs } = useQuery({
  queryKey: ['jobs'],
  queryFn: () => api.jobs.getAllJobs(),
});
```

#### Step 3: Replace Mutations
```typescript
// Old Supabase
const { error } = await supabase.from('jobs').insert(data);

// New Backend API
const mutation = useMutation({
  mutationFn: (data) => api.jobs.createJob(data),
  onSuccess: () => {
    toast.success('Job created!');
  },
});
```

### 📝 Migration Checklist Template

For each file:
- [ ] Identify all Supabase calls
- [ ] Find corresponding API service method
- [ ] Update imports
- [ ] Replace data fetching with `useQuery`
- [ ] Replace mutations with `useMutation`
- [ ] Update error handling
- [ ] Test the functionality
- [ ] Remove Supabase imports

### 🔧 Testing Strategy

1. **After each file migration:**
   - Clear browser localStorage
   - Reload the app
   - Test the specific feature
   - Check console for errors

2. **Full app test:**
   - Login/logout
   - View profile
   - Browse jobs
   - Create job (client)
   - Apply to job (freelancer)
   - Send messages
   - Admin features

### 💡 Pro Tips

1. **Don't migrate everything at once** - Do it file by file
2. **Test after each change** - Easier to catch issues
3. **Keep backups** - Use git commits frequently
4. **Use the migration guide** - Refer to FRONTEND_MIGRATION_GUIDE.md
5. **Clear localStorage often** - Old tokens can cause issues

### 🎓 Example Workflow

```bash
# 1. Pick a file from Priority 1
# 2. Open the file
# 3. Find Supabase calls (Ctrl+F "supabase")
# 4. Check FRONTEND_MIGRATION_GUIDE.md for equivalent
# 5. Update the code
# 6. Save and test
# 7. Commit if working
# 8. Move to next file
```

### 📊 Progress Tracking

Create a checklist:
```
[ ] Auth.tsx
[ ] Profile.tsx
[ ] JobsSection.tsx
[ ] CreateJob.tsx
[ ] ClientDashboard.tsx
... etc
```

### 🆘 Need Help?

1. Check `FRONTEND_MIGRATION_GUIDE.md` for examples
2. Check `src/services/api.ts` for available methods
3. Check backend API endpoints in `BACKEND_INTEGRATION.md`
4. Test with Postman/curl if unsure about API

---

**Remember:** The backend API is fully functional and ready. The migration is mainly about updating the frontend calls from Supabase to the new API service. Take it one file at a time! 🚀

