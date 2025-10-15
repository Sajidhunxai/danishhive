# Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the backend directory:
```bash
cp env.example .env
```

Update the following variables:
```env
DATABASE_URL="mysql://username:password@localhost:3306/talentforge"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret-change-in-production"
PORT=5001
FRONTEND_URL="http://localhost:5173"
```

### 3. Setup Database
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

### 4. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:5001`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with test data
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Test Credentials

After seeding, you can login with:

**Admin:**
- Email: admin@talentforge.com
- Password: password123

**Client:**
- Email: client1@company.com
- Password: password123

**Freelancer:**
- Email: freelancer1@example.com
- Password: password123

## API Documentation

See the main BACKEND_INTEGRATION.md file for complete API documentation.

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts            # Database seeder
│   └── migrations/        # Database migrations
├── src/
│   ├── config/
│   │   └── database.ts    # Prisma client config
│   ├── controllers/       # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── job.controller.ts
│   │   ├── profile.controller.ts
│   │   ├── application.controller.ts
│   │   ├── contract.controller.ts
│   │   ├── message.controller.ts
│   │   ├── forum.controller.ts
│   │   ├── honey.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/
│   │   └── auth.middleware.ts  # JWT authentication
│   ├── routes/            # API routes
│   │   ├── auth.routes.ts
│   │   ├── job.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── application.routes.ts
│   │   ├── contract.routes.ts
│   │   ├── message.routes.ts
│   │   ├── forum.routes.ts
│   │   ├── honey.routes.ts
│   │   ├── coupon.routes.ts
│   │   ├── admin.routes.ts
│   │   └── verification.routes.ts
│   ├── services/
│   │   ├── email.service.ts   # Email sending
│   │   └── sms.service.ts     # SMS sending (Twilio)
│   └── server.ts          # Express app setup
├── env.example            # Environment variables template
├── package.json
└── tsconfig.json
```

## Database Schema

The application uses MySQL with Prisma ORM. Key models:

- **User** - Authentication and user data
- **Profile** - Extended user profile information
- **Job** - Job postings by clients
- **JobApplication** - Applications from freelancers
- **Contract** - Contracts between clients and freelancers
- **Message** - Direct messaging
- **ForumCategory/ForumPost/ForumReply** - Forum system
- **HoneyTransaction** - Virtual currency transactions
- **Project** - Portfolio projects
- **Coupon** - Discount coupons

## Development Tips

### View Database with Prisma Studio
```bash
npm run prisma:studio
```

### Reset Database
```bash
npx prisma migrate reset
npm run prisma:seed
```

### Create New Migration
```bash
npx prisma migrate dev --name migration_name
```

### Update Prisma Schema
After modifying `prisma/schema.prisma`:
```bash
npm run prisma:generate
npm run prisma:migrate
```

## Common Issues

### Port 5001 Already in Use
Change the PORT in `.env`:
```env
PORT=5002
```

### Database Connection Failed
- Check MySQL is running
- Verify database credentials in DATABASE_URL
- Ensure database exists: `CREATE DATABASE talentforge;`

### JWT Token Issues
- Ensure JWT_SECRET and JWT_REFRESH_SECRET are set in .env
- Tokens expire after 7 days (access) / 30 days (refresh)
- Clear browser localStorage if having auth issues

## Production Deployment

1. Set strong JWT secrets
2. Configure production database
3. Set NODE_ENV=production
4. Enable proper logging
5. Set up SSL/TLS
6. Configure CORS for production domain
7. Set up proper error monitoring

## Security Notes

- JWT secrets should be strong random strings in production
- Never commit `.env` file to version control
- Use environment-specific configuration
- Implement rate limiting (already configured)
- Use HTTPS in production
- Regularly update dependencies

