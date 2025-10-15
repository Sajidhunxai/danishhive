# Talent Forge Backend - Custom Node.js API

A completely custom, self-hosted backend for the Talent Forge freelance platform. Built with Node.js, Express, TypeScript, and MySQL.

## 🚀 Features

- **100% Independent** - No third-party backend dependencies
- **JWT Authentication** - Secure user authentication and authorization
- **MySQL Database** - Self-hosted database with Prisma ORM
- **RESTful API** - Clean and organized API endpoints
- **Role-Based Access** - Freelancer, Client, and Admin roles
- **Email Service** - Custom email notifications
- **SMS Service** - Phone verification with Twilio
- **Payment Processing** - Stripe/Mollie integration
- **File Uploads** - Local file storage
- **Real-time Ready** - Socket.io support for messaging

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Profiles
- `GET /api/profiles/me` - Get my profile
- `PUT /api/profiles/me` - Update my profile
- `GET /api/profiles/:id` - Get profile by ID

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create job (Client only)
- `PUT /api/jobs/:id` - Update job (Client only)
- `DELETE /api/jobs/:id` - Delete job (Client only)

### Applications
- `POST /api/applications` - Create application (Freelancer only)
- `GET /api/applications/my-applications` - Get my applications
- `GET /api/applications/job/:jobId` - Get applications for job
- `PUT /api/applications/:id` - Update application

### Contracts
- `GET /api/contracts` - Get all contracts
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
- `GET /api/forum/categories/:id` - Get category
- `GET /api/forum/posts` - Get forum posts
- `POST /api/forum/posts` - Create forum post
- `GET /api/forum/posts/:id` - Get post
- `PUT /api/forum/posts/:id` - Update post
- `POST /api/forum/posts/:id/replies` - Create reply
- `GET /api/forum/posts/:id/replies` - Get replies

### Payments
- `POST /api/payments/verify-method` - Verify payment method
- `POST /api/payments/check-status` - Check payment status
- `POST /api/payments/escrow/create` - Create escrow payment
- `POST /api/payments/escrow/release` - Release escrow payment
- `POST /api/payments/webhook/escrow` - Escrow webhook
- `POST /api/payments/webhook/honey` - Honey webhook

### Honey Drops (Virtual Currency)
- `GET /api/honey/balance` - Get honey drops balance
- `POST /api/honey/purchase` - Purchase honey drops
- `GET /api/honey/transactions` - Get transaction history

### Coupons
- `POST /api/coupons/apply` - Apply coupon
- `POST /api/coupons/validate` - Validate coupon

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/password` - Update user password
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/coupons` - Get all coupons
- `POST /api/admin/coupons/generate` - Generate coupons
- `PUT /api/admin/coupons/:id/toggle` - Toggle coupon
- `GET /api/admin/coupons/usage` - Get coupon usage
- `GET /api/admin/analytics` - Get analytics
- `GET /api/admin/revenue` - Get revenue overview
- `GET /api/admin/verifications/pending` - Get pending verifications
- `POST /api/admin/verifications/:id/approve` - Approve verification
- `POST /api/admin/verifications/:id/reject` - Reject verification

### Verification
- `POST /api/verify/phone/send-sms` - Send SMS verification
- `POST /api/verify/phone/verify-sms` - Verify SMS code
- `POST /api/verify/email/send` - Send email verification
- `POST /api/verify/email/verify` - Verify email
- `POST /api/verify/email/change` - Request email change
- `GET /api/verify/cvr/:number` - CVR lookup

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Setup

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Setup MySQL database**
```bash
mysql -u root -p
CREATE DATABASE talent_forge_db;
```

4. **Run Prisma migrations**
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. **Start development server**
```bash
npm run dev
```

## 🔧 Environment Variables

See `env.example` for all required environment variables:

- Database (MySQL)
- JWT secrets
- SMTP email configuration
- Twilio SMS configuration
- Stripe/Mollie payment keys
- CORS and security settings

## 📦 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **SMS**: Twilio
- **Payments**: Stripe/Mollie
- **Security**: Helmet, CORS, bcrypt
- **Validation**: express-validator

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.ts  # Prisma database connection
│   ├── controllers/     # Request handlers
│   │   └── auth.controller.ts
│   ├── middleware/      # Custom middleware
│   │   └── auth.middleware.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── job.routes.ts
│   │   └── ... (all other routes)
│   ├── services/        # Business logic
│   │   ├── email.service.ts
│   │   └── sms.service.ts
│   └── server.ts        # Main entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── package.json
├── tsconfig.json
└── env.example
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment
Set `NODE_ENV=production` in your `.env` file

## 📝 Development

### Run in development mode
```bash
npm run dev
```

### Database migrations
```bash
npm run prisma:migrate
```

### Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS protection
- Input validation
- SQL injection prevention (Prisma ORM)

## 📊 Database Schema

The database includes tables for:
- Users & Authentication
- Profiles & Projects
- Jobs & Applications
- Contracts
- Messages
- Forum (Categories, Posts, Replies)
- Honey Drops (Virtual Currency)
- Phone/Email Verifications
- Coupons

## 🎯 Next Steps

1. Implement full controller logic for all endpoints
2. Add Socket.io for real-time messaging
3. Implement file upload handling
4. Add comprehensive error handling
5. Write unit and integration tests
6. Set up CI/CD pipeline
7. Add API documentation (Swagger/OpenAPI)

## 📞 Support

For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved

