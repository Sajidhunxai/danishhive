# Frontend Migration Guide: Supabase → Backend API

This guide shows how to replace Supabase calls with backend API calls.

## 🔄 Quick Reference

### Authentication

```typescript
// ❌ OLD - Supabase
import { supabase } from '@/integrations/supabase/client';
const { data, error } = await supabase.auth.signUp({ email, password });

// ✅ NEW - Backend API
import { api } from '@/services/api';
const user = await api.auth.register({ email, password, fullName, userType });
```

### Data Fetching

```typescript
// ❌ OLD - Supabase
const { data: jobs } = await supabase
  .from('jobs')
  .select('*')
  .eq('status', 'open');

// ✅ NEW - Backend API
const jobs = await api.jobs.getAllJobs({ status: 'open' });
```

### Data Creation

```typescript
// ❌ OLD - Supabase
const { data, error } = await supabase
  .from('jobs')
  .insert({ title, description, clientId });

// ✅ NEW - Backend API
const job = await api.jobs.createJob({ title, description });
```

### Data Update

```typescript
// ❌ OLD - Supabase
const { data, error } = await supabase
  .from('profiles')
  .update({ fullName })
  .eq('id', userId);

// ✅ NEW - Backend API
const profile = await api.profiles.updateMyProfile({ fullName });
```

## 📋 Complete Migration Examples

### Auth Page

```typescript
import { api } from '@/services/api';
import { useBackendAuth } from '@/hooks/useBackendAuth';

const Auth = () => {
  const { signIn, signUp } = useBackendAuth();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  const handleRegister = async (formData: any) => {
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        userType: formData.userType,
        companyName: formData.companyName,
        cvrNumber: formData.cvrNumber,
      });
      navigate('/complete-profile');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };
  
  // ... rest of component
};
```

### Profile Page

```typescript
import { api } from '@/services/api';
import { useBackendAuth } from '@/hooks/useBackendAuth';
import { useQuery, useMutation } from '@tanstack/react-query';

const Profile = () => {
  const { user } = useBackendAuth();
  
  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.profiles.getMyProfile(),
    enabled: !!user,
  });
  
  // Update profile
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.profiles.updateMyProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
  });
  
  const handleUpdate = (formData: any) => {
    updateMutation.mutate(formData);
  };
  
  // ... rest of component
};
```

### Jobs List

```typescript
import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

const JobsSection = () => {
  const [filters, setFilters] = useState({ status: 'open' });
  
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.jobs.getAllJobs(filters),
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {jobs?.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};
```

### Create Job

```typescript
import { api } from '@/services/api';
import { useMutation } from '@tanstack/react-query';

const CreateJob = () => {
  const navigate = useNavigate();
  
  const createMutation = useMutation({
    mutationFn: (data: any) => api.jobs.createJob(data),
    onSuccess: (job) => {
      toast.success('Job created successfully');
      navigate(`/job/${job.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create job');
    },
  });
  
  const handleSubmit = (formData: any) => {
    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      budget: formData.budget,
      hourlyRate: formData.hourlyRate,
      skills: formData.skills,
      location: formData.location,
      deadline: formData.deadline,
    });
  };
  
  // ... rest of component
};
```

### Job Applications

```typescript
import { api } from '@/services/api';
import { useQuery, useMutation } from '@tanstack/react-query';

const JobApplications = () => {
  const { jobId } = useParams();
  
  // Get applications for a job (client view)
  const { data: applications } = useQuery({
    queryKey: ['applications', jobId],
    queryFn: () => api.applications.getJobApplications(jobId!),
    enabled: !!jobId,
  });
  
  // Update application status
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => 
      api.applications.updateApplication(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['applications', jobId]);
    },
  });
  
  // ... rest of component
};
```

### Messages

```typescript
import { api } from '@/services/api';
import { useQuery, useMutation } from '@tanstack/react-query';

const Messages = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Get conversations
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.messages.getConversations(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  // Get messages with specific user
  const { data: messages } = useQuery({
    queryKey: ['messages', selectedUserId],
    queryFn: () => api.messages.getConversationWithUser(selectedUserId!),
    enabled: !!selectedUserId,
  });
  
  // Send message
  const sendMutation = useMutation({
    mutationFn: (content: string) => 
      api.messages.sendMessage({
        receiverId: selectedUserId!,
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedUserId]);
    },
  });
  
  // ... rest of component
};
```

### Forum

```typescript
import { api } from '@/services/api';
import { useQuery, useMutation } from '@tanstack/react-query';

const Forum = () => {
  // Get categories
  const { data: categories } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: () => api.forum.getCategories(),
  });
  
  // Get posts
  const { data: posts } = useQuery({
    queryKey: ['forum-posts', selectedCategory],
    queryFn: () => api.forum.getPosts({ categoryId: selectedCategory }),
  });
  
  // Create post
  const createPostMutation = useMutation({
    mutationFn: (data: any) => api.forum.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['forum-posts']);
    },
  });
  
  // ... rest of component
};
```

### Contracts

```typescript
import { api } from '@/services/api';
import { useQuery, useMutation } from '@tanstack/react-query';

const ContractSystem = () => {
  // Get all contracts
  const { data: contracts } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => api.contracts.getAllContracts(),
  });
  
  // Create contract
  const createMutation = useMutation({
    mutationFn: (data: any) => api.contracts.createContract(data),
  });
  
  // Sign contract
  const signMutation = useMutation({
    mutationFn: ({ id, signature }: any) => 
      api.contracts.signContract(id, signature),
  });
  
  // ... rest of component
};
```

### Admin Dashboard

```typescript
import { api } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

const AdminDashboard = () => {
  // Get dashboard stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.admin.getDashboardStats(),
  });
  
  // Get all users
  const { data: usersData } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => api.admin.getAllUsers({ page, limit: 50 }),
  });
  
  // ... rest of component
};
```

## 🔑 Common Patterns

### Error Handling

```typescript
try {
  const result = await api.jobs.createJob(data);
  toast.success('Success!');
} catch (error: any) {
  const message = error.response?.data?.error || error.message || 'Failed';
  toast.error(message);
}
```

### With React Query

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['jobs'],
  queryFn: () => api.jobs.getAllJobs(),
  onError: (error: any) => {
    toast.error(error.response?.data?.error || 'Failed to load jobs');
  },
});
```

### Mutations with Optimistic Updates

```typescript
const updateMutation = useMutation({
  mutationFn: (data: any) => api.profiles.updateMyProfile(data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['profile']);
    
    // Snapshot previous value
    const previousProfile = queryClient.getQueryData(['profile']);
    
    // Optimistically update
    queryClient.setQueryData(['profile'], (old: any) => ({
      ...old,
      ...newData,
    }));
    
    return { previousProfile };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['profile'], context?.previousProfile);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['profile']);
  },
});
```

## 📊 API Service Reference

All available endpoints in `/src/services/api.ts`:

### Authentication
- `api.auth.register(data)`
- `api.auth.login(email, password)`
- `api.auth.logout()`
- `api.auth.getCurrentUser()`
- `api.auth.verifyEmail(token)`
- `api.auth.forgotPassword(email)`
- `api.auth.resetPassword(token, newPassword)`

### Profiles
- `api.profiles.getMyProfile()`
- `api.profiles.updateMyProfile(data)`
- `api.profiles.getProfileById(id)`
- `api.profiles.getAllFreelancers(filters)`
- `api.profiles.createProject(data)`
- `api.profiles.updateProject(id, data)`
- `api.profiles.deleteProject(id)`

### Jobs
- `api.jobs.getAllJobs(filters)`
- `api.jobs.getJobById(id)`
- `api.jobs.getMyJobs()`
- `api.jobs.createJob(data)`
- `api.jobs.updateJob(id, data)`
- `api.jobs.deleteJob(id)`

### Applications
- `api.applications.createApplication(data)`
- `api.applications.getMyApplications()`
- `api.applications.getJobApplications(jobId)`
- `api.applications.updateApplication(id, data)`
- `api.applications.deleteApplication(id)`

### Contracts
- `api.contracts.getAllContracts()`
- `api.contracts.getContractById(id)`
- `api.contracts.createContract(data)`
- `api.contracts.updateContract(id, data)`
- `api.contracts.signContract(id, signatureData)`

### Messages
- `api.messages.getAllMessages()`
- `api.messages.sendMessage(data)`
- `api.messages.getConversations()`
- `api.messages.getConversationWithUser(userId)`
- `api.messages.markAsRead(id)`

### Forum
- `api.forum.getCategories()`
- `api.forum.getPosts(filters)`
- `api.forum.getPostById(id)`
- `api.forum.createPost(data)`
- `api.forum.updatePost(id, data)`
- `api.forum.deletePost(id)`
- `api.forum.createReply(data)`
- `api.forum.updateReply(id, content)`
- `api.forum.deleteReply(id)`

### Honey Drops
- `api.honey.getBalance()`
- `api.honey.getTransactions(filters)`
- `api.honey.purchase(amount, paymentId)`
- `api.honey.spend(amount, description)`
- `api.honey.refund(amount, description, originalTransactionId)`

### Admin
- `api.admin.getDashboardStats()`
- `api.admin.getAllUsers(filters)`
- `api.admin.updateUser(id, data)`
- `api.admin.deleteUser(id)`
- `api.admin.getAllCoupons(filters)`
- `api.admin.createCoupon(data)`
- `api.admin.updateCoupon(id, data)`
- `api.admin.deleteCoupon(id)`
- `api.admin.validateCoupon(code)`
- `api.admin.useCoupon(code)`

## 🎯 Migration Checklist

- [ ] Replace `supabase.auth` with `api.auth` or `useBackendAuth` hook
- [ ] Replace `supabase.from('table').select()` with `api.resource.getAll()`
- [ ] Replace `supabase.from('table').insert()` with `api.resource.create()`
- [ ] Replace `supabase.from('table').update()` with `api.resource.update()`
- [ ] Replace `supabase.from('table').delete()` with `api.resource.delete()`
- [ ] Update error handling to use `error.response.data.error`
- [ ] Test all CRUD operations
- [ ] Clear browser localStorage
- [ ] Verify no Supabase errors in console

## 🔍 Finding What Needs Migration

```bash
# Find all Supabase imports
grep -r "from '@/integrations/supabase/client'" src/

# Find all Supabase database calls
grep -r "supabase\.from(" src/

# Find all Supabase auth calls
grep -r "supabase\.auth\." src/
```

---

**Migration Progress:** Start with Auth, then Profile, Jobs, Applications, and work through other features systematically.

