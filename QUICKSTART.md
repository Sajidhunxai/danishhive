# 🚀 Quick Start Guide

Get up and running with the Talent Forge platform in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- MySQL database running
- Terminal/Command prompt

## 1️⃣ Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env and set your MySQL connection
# DATABASE_URL="mysql://root:password@localhost:3306/talentforge"

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed

# Start backend server
npm run dev
```

✅ Backend should now be running on http://localhost:5001

## 2️⃣ Frontend Setup (1 minute)

Open a new terminal:

```bash
# Navigate to project root (if in backend folder)
cd ..

# Install axios (required for API calls)
npm install axios

# Create .env file
echo "VITE_API_URL=http://localhost:5001/api" > .env

# Start frontend
npm run dev
```

✅ Frontend should now be running on http://localhost:5173

## 3️⃣ Test It Out!

### Login with Test Accounts

**Freelancer Account:**
```
Email: freelancer1@example.com
Password: password123
```

**Client Account:**
```
Email: client1@company.com
Password: password123
```

**Admin Account:**
```
Email: admin@talentforge.com
Password: password123
```

### What's Included

✅ 6 Test users (1 admin, 2 clients, 3 freelancers)
✅ 4 Sample jobs
✅ Job applications
✅ Active contract
✅ Messages between users
✅ Forum posts and replies
✅ Honey Drops transactions
✅ Active coupons

## 4️⃣ Explore the API

### Test Backend API Directly

```bash
# Health check
curl http://localhost:5001/health

# Login (get token)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"freelancer1@example.com","password":"password123"}'

# Get all jobs
curl http://localhost:5001/api/jobs
```

### View Database

```bash
cd backend
npm run prisma:studio
```

Opens a GUI at http://localhost:5555 to browse all database tables.

## 🔧 Common Issues

### MySQL Connection Error
```bash
# Create database if it doesn't exist
mysql -u root -p
CREATE DATABASE talentforge;
exit
```

### Port Already in Use
Change PORT in `backend/.env`:
```env
PORT=5002
```

Update `VITE_API_URL` in frontend `.env`:
```env
VITE_API_URL=http://localhost:5002/api
```

### Token/Auth Issues
Clear browser storage:
```javascript
// In browser console (F12)
localStorage.clear()
location.reload()
```

## 📚 Next Steps

1. **Read Full Documentation:**
   - [`BACKEND_INTEGRATION.md`](./BACKEND_INTEGRATION.md) - Complete API docs
   - [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) - What was implemented
   - [`backend/SETUP.md`](./backend/SETUP.md) - Backend details

2. **Integrate with Frontend:**
   - Update `src/main.tsx` to use `BackendAuthProvider`
   - Replace Supabase calls with API service

3. **Customize:**
   - Update email templates in `backend/src/services/email.service.ts`
   - Configure payment providers
   - Add your branding

## 🎯 API Service Usage

```typescript
import { api } from '@/services/api';

// Login
await api.auth.login(email, password);

// Get jobs
const jobs = await api.jobs.getAllJobs();

// Get my profile
const profile = await api.profiles.getMyProfile();

// Send message
await api.messages.sendMessage({
  receiverId: 'user-id',
  content: 'Hello!'
});

// Create job application
await api.applications.createApplication({
  jobId: 'job-id',
  coverLetter: 'I am interested...',
  proposedRate: 750
});
```

## ✨ Features Ready to Use

### For Freelancers
- ✅ Browse and search jobs
- ✅ Submit applications
- ✅ Manage portfolio projects
- ✅ Direct messaging with clients
- ✅ Forum participation
- ✅ Honey Drops system

### For Clients
- ✅ Post jobs
- ✅ Review applications
- ✅ Create and sign contracts
- ✅ Message freelancers
- ✅ Browse freelancer profiles

### For Admins
- ✅ User management
- ✅ Dashboard statistics
- ✅ Coupon management
- ✅ Platform moderation

## 🆘 Need Help?

1. Check error messages in terminal
2. Review documentation files
3. Use Prisma Studio to inspect database
4. Check browser console (F12) for frontend errors

---

**Ready to build something amazing!** 🚀

All backend APIs are fully implemented and tested. The seeded data provides a realistic testing environment.

