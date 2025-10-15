# Backend Integration Guide

This document explains how to integrate the custom Node.js backend with the frontend application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MySQL database running
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp env.example .env
   ```

4. **Update `.env` file with your configuration:**
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/talentforge"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-refresh-token-secret"
   PORT=5001
   FRONTEND_URL="http://localhost:5173"
   ```

5. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

6. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

7. **Seed the database with sample data:**
   ```bash
   npm run prisma:seed
   ```

8. **Start the development server:**
   ```bash
   npm run dev
   ```

   The backend API will be available at `http://localhost:5001`

### Frontend Setup

1. **Navigate to frontend directory (project root):**
   ```bash
   cd ..
   ```

2. **Install axios (required for API calls):**
   ```bash
   npm install axios
   ```

3. **Create/Update `.env` file in project root:**
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

4. **Update your main App file to use the backend auth provider:**

   In `src/main.tsx`, replace the Supabase auth provider with the backend auth provider:

   ```tsx
   import { BackendAuthProvider } from "@/hooks/useBackendAuth";
   
   // Wrap your app with BackendAuthProvider instead of AuthProvider
   <BackendAuthProvider>
     <App />
   </BackendAuthProvider>
   ```

5. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

## 📝 Seeded Test Accounts

The database seeder creates the following test accounts (all passwords: `password123`):

### Admin Account
- Email: `admin@talentforge.com`
- Role: Admin
- Features: Full platform access

### Client Accounts
1. **Tech Solutions ApS**
   - Email: `client1@company.com`
   - Company: Tech Solutions ApS
   - Location: Copenhagen, Denmark

2. **Startup Nordic**
   - Email: `client2@startup.com`
   - Company: Startup Nordic
   - Location: Aarhus, Denmark

### Freelancer Accounts
1. **Emma Nielsen** (Full-stack Developer)
   - Email: `freelancer1@example.com`
   - Skills: React, Node.js, TypeScript, AWS, PostgreSQL
   - Rate: 750 DKK/hour

2. **Michael Hansen** (UI/UX Designer)
   - Email: `freelancer2@example.com`
   - Skills: UI Design, UX Design, Figma, Adobe XD
   - Rate: 650 DKK/hour

3. **Sophie Larsen** (Data Scientist)
   - Email: `freelancer3@example.com`
   - Skills: Python, Machine Learning, TensorFlow
   - Rate: 850 DKK/hour

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Profiles
- `GET /api/profiles/me` - Get my profile
- `PUT /api/profiles/me` - Update my profile
- `GET /api/profiles/:id` - Get profile by ID
- `GET /api/profiles/freelancers` - Get all freelancers
- `POST /api/profiles/projects` - Create portfolio project
- `PUT /api/profiles/projects/:id` - Update project
- `DELETE /api/profiles/projects/:id` - Delete project

### Jobs
- `GET /api/jobs` - Get all jobs (with filters)
- `GET /api/jobs/:id` - Get job by ID
- `GET /api/jobs/my/jobs` - Get my jobs (client only)
- `POST /api/jobs` - Create job (client only)
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Applications
- `POST /api/applications` - Submit application (freelancer only)
- `GET /api/applications/my-applications` - Get my applications
- `GET /api/applications/job/:jobId` - Get job applications (client only)
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

### Contracts
- `GET /api/contracts` - Get my contracts
- `POST /api/contracts` - Create contract
- `GET /api/contracts/:id` - Get contract by ID
- `PUT /api/contracts/:id` - Update contract
- `POST /api/contracts/:id/sign` - Sign contract

### Messages
- `GET /api/messages` - Get all messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversation/:userId` - Get conversation with user
- `PUT /api/messages/:id/read` - Mark message as read

### Forum
- `GET /api/forum/categories` - Get forum categories
- `GET /api/forum/posts` - Get forum posts
- `POST /api/forum/posts` - Create post
- `GET /api/forum/posts/:id` - Get post with replies
- `PUT /api/forum/posts/:id` - Update post
- `DELETE /api/forum/posts/:id` - Delete post
- `POST /api/forum/replies` - Create reply
- `PUT /api/forum/replies/:id` - Update reply
- `DELETE /api/forum/replies/:id` - Delete reply

### Honey Drops
- `GET /api/honey/balance` - Get balance
- `GET /api/honey/transactions` - Get transaction history
- `POST /api/honey/purchase` - Purchase Honey Drops
- `POST /api/honey/spend` - Spend Honey Drops
- `POST /api/honey/refund` - Refund Honey Drops

### Admin (Admin access required)
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/coupons` - Get all coupons
- `POST /api/admin/coupons` - Create coupon
- `PUT /api/admin/coupons/:id` - Update coupon
- `DELETE /api/admin/coupons/:id` - Delete coupon
- `GET /api/admin/coupons/validate/:code` - Validate coupon
- `POST /api/admin/coupons/use/:code` - Use coupon

## 📦 Using the API Service

The API service is located at `src/services/api.ts` and provides a clean interface for all backend calls:

```typescript
import { api } from '@/services/api';

// Example: Login
const handleLogin = async () => {
  try {
    const response = await api.auth.login(email, password);
    console.log('User:', response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Example: Get all jobs
const fetchJobs = async () => {
  try {
    const jobs = await api.jobs.getAllJobs({ status: 'open' });
    console.log('Jobs:', jobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
  }
};

// Example: Create application
const applyToJob = async (jobId: string) => {
  try {
    const application = await api.applications.createApplication({
      jobId,
      coverLetter: 'I am interested in this position...',
      proposedRate: 750
    });
    console.log('Application submitted:', application);
  } catch (error) {
    console.error('Failed to submit application:', error);
  }
};
```

## 🔄 Migration from Supabase

To migrate existing components from Supabase to the backend API:

1. **Replace Supabase imports:**
   ```typescript
   // Before
   import { supabase } from '@/integrations/supabase/client';
   
   // After
   import { api } from '@/services/api';
   ```

2. **Update authentication calls:**
   ```typescript
   // Before
   const { data, error } = await supabase.auth.signIn({ email, password });
   
   // After
   const user = await api.auth.login(email, password);
   ```

3. **Update data fetching:**
   ```typescript
   // Before
   const { data: jobs } = await supabase
     .from('jobs')
     .select('*')
     .eq('status', 'open');
   
   // After
   const jobs = await api.jobs.getAllJobs({ status: 'open' });
   ```

4. **Use the new auth hook:**
   ```typescript
   // Before
   import { useAuth } from '@/hooks/useAuth';
   
   // After
   import { useBackendAuth } from '@/hooks/useBackendAuth';
   ```

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check DATABASE_URL in `.env`
- Verify database credentials

### CORS Errors
- Ensure CORS_ORIGIN in backend `.env` matches frontend URL
- Check that backend is running on correct port

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Check JWT_SECRET is set in backend `.env`
- Verify token is being sent in Authorization header

### Port Already in Use
- Change PORT in backend `.env`
- Update VITE_API_URL in frontend `.env` accordingly

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [JWT Authentication Guide](https://jwt.io/introduction)

## 🎯 Next Steps

1. Customize email templates in `backend/src/services/email.service.ts`
2. Configure payment providers (Stripe/Mollie)
3. Set up production environment variables
4. Deploy backend to a hosting service
5. Update frontend environment variables for production

