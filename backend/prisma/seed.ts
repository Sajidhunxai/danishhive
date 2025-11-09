import { PrismaClient, UserType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PUBLIC_SHOWCASE_FREELANCER_ID = 'c47f5160-e2a3-4054-ab7e-8f0505b823fe';

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.honeyTransaction.deleteMany();
  await prisma.forumReply.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.forumCategory.deleteMany();
  await prisma.message.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.job.deleteMany();
  await prisma.project.deleteMany();
  await prisma.phoneVerification.deleteMany();
  await prisma.emailChangeRequest.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@talentforge.com',
      password: hashedPassword,
      userType: UserType.ADMIN,
      isAdmin: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      profile: {
        create: {
          fullName: 'Admin User',
          bio: 'Platform Administrator',
          location: 'Copenhagen, Denmark',
          honeyDropsBalance: 1000,
        },
      },
    },
  });

  // Create Client Users
  const client1 = await prisma.user.create({
    data: {
      email: 'client1@company.com',
      password: hashedPassword,
      userType: UserType.CLIENT,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      phoneNumber: '+4512345678',
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      profile: {
        create: {
          fullName: 'John Anderson',
          companyName: 'Tech Solutions ApS',
          cvrNumber: '12345678',
          bio: 'Looking for talented freelancers to help build innovative solutions',
          location: 'Copenhagen, Denmark',
          honeyDropsBalance: 500,
          paymentVerified: true,
        },
      },
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'client2@startup.com',
      password: hashedPassword,
      userType: UserType.CLIENT,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      phoneNumber: '+4587654321',
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      profile: {
        create: {
          fullName: 'Sarah Johnson',
          companyName: 'Startup Nordic',
          cvrNumber: '87654321',
          bio: 'Building the future of e-commerce',
          location: 'Aarhus, Denmark',
          honeyDropsBalance: 300,
          paymentVerified: true,
        },
      },
    },
  });

  // Create Freelancer Users
  const freelancer1 = await prisma.user.create({
    data: {
      id: PUBLIC_SHOWCASE_FREELANCER_ID,
      email: 'freelancer1@example.com',
      password: hashedPassword,
      userType: UserType.FREELANCER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      phoneNumber: '+4523456789',
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      profile: {
        create: {
          fullName: 'Emma Nielsen',
          bio: 'Full-stack developer with 5+ years of experience in React, Node.js, and cloud technologies',
          skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL']),
          hourlyRate: 750.00,
          location: 'Copenhagen, Denmark',
          honeyDropsBalance: 200,
          paymentVerified: true,
        },
      },
    },
  });

  const freelancer2 = await prisma.user.create({
    data: {
      email: 'freelancer2@example.com',
      password: hashedPassword,
      userType: UserType.FREELANCER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      phoneNumber: '+4534567890',
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      profile: {
        create: {
          fullName: 'Michael Hansen',
          bio: 'UI/UX Designer passionate about creating beautiful and intuitive interfaces',
          skills: JSON.stringify(['UI Design', 'UX Design', 'Figma', 'Adobe XD', 'Prototyping']),
          hourlyRate: 650.00,
          location: 'Odense, Denmark',
          honeyDropsBalance: 150,
          paymentVerified: true,
        },
      },
    },
  });

  const freelancer3 = await prisma.user.create({
    data: {
      email: 'freelancer3@example.com',
      password: hashedPassword,
      userType: UserType.FREELANCER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      phoneNumber: '+4545678901',
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      profile: {
        create: {
          fullName: 'Sophie Larsen',
          bio: 'Data Scientist specializing in machine learning and AI solutions',
          skills: JSON.stringify(['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis', 'SQL']),
          hourlyRate: 850.00,
          location: 'Aalborg, Denmark',
          honeyDropsBalance: 100,
          paymentVerified: true,
        },
      },
    },
  });

  console.log('✅ Created users and profiles');

  // Get freelancer profiles
  const freelancer1Profile = await prisma.profile.findUnique({
    where: { userId: freelancer1.id },
  });
  
  const freelancer2Profile = await prisma.profile.findUnique({
    where: { userId: freelancer2.id },
  });
  
  const freelancer3Profile = await prisma.profile.findUnique({
    where: { userId: freelancer3.id },
  });

  // Create Projects/Portfolio for freelancers
  await prisma.project.createMany({
    data: [
      {
        profileId: freelancer1Profile!.id,
        title: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce platform with React and Node.js',
        clientName: 'RetailCo',
        projectUrl: 'https://example.com/project1',
        projectType: 'portfolio',
        technologies: JSON.stringify(['React', 'Node.js', 'MongoDB', 'Stripe']),
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-06-30'),
      },
      {
        profileId: freelancer1Profile!.id,
        title: 'Real-time Chat Application',
        description: 'Developed a real-time messaging app using WebSockets',
        clientName: 'ChatApp Inc',
        projectUrl: 'https://example.com/project2',
        projectType: 'portfolio',
        technologies: JSON.stringify(['React', 'Socket.io', 'Express', 'PostgreSQL']),
        startDate: new Date('2023-07-01'),
        endDate: new Date('2023-09-30'),
      },
      {
        profileId: freelancer2Profile!.id,
        title: 'Mobile Banking App Design',
        description: 'Complete UI/UX redesign for a mobile banking application',
        clientName: 'BankCorp',
        projectType: 'portfolio',
        technologies: JSON.stringify(['Figma', 'Adobe XD', 'Prototyping']),
        startDate: new Date('2023-02-01'),
        endDate: new Date('2023-05-31'),
      },
      {
        profileId: freelancer3Profile!.id,
        title: 'Customer Churn Prediction Model',
        description: 'Built ML model to predict customer churn with 85% accuracy',
        clientName: 'TelecomCo',
        projectType: 'portfolio',
        technologies: JSON.stringify(['Python', 'Scikit-learn', 'Pandas', 'Jupyter']),
        startDate: new Date('2023-03-01'),
        endDate: new Date('2023-07-31'),
      },
    ],
  });

  console.log('✅ Created portfolio projects');
  console.log(`🔗 Public showcase freelancer id: ${PUBLIC_SHOWCASE_FREELANCER_ID}`);

  // Create Jobs
  const job1 = await prisma.job.create({
    data: {
      clientId: client1.id,
      title: 'Full-Stack Developer for SaaS Platform',
      description: 'We are looking for an experienced full-stack developer to help build our new SaaS platform. Must have experience with React, Node.js, and cloud deployment.',
      budget: 50000.00,
      hourlyRate: 700.00,
      location: 'Remote',
      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'AWS', 'Docker']),
      status: 'open',
      deadline: new Date('2025-12-31'),
      viewCount: 45,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      clientId: client1.id,
      title: 'UI/UX Designer for Mobile App',
      description: 'Need a talented UI/UX designer to create mockups and prototypes for our new mobile application.',
      budget: 30000.00,
      hourlyRate: 600.00,
      location: 'Copenhagen, Denmark',
      skills: JSON.stringify(['UI Design', 'UX Design', 'Figma', 'Mobile Design']),
      status: 'open',
      deadline: new Date('2025-11-30'),
      viewCount: 32,
    },
  });

  const job3 = await prisma.job.create({
    data: {
      clientId: client2.id,
      title: 'Data Scientist for Analytics Platform',
      description: 'Looking for a data scientist to help build analytics and reporting features for our platform.',
      budget: 60000.00,
      hourlyRate: 800.00,
      location: 'Remote',
      skills: JSON.stringify(['Python', 'Machine Learning', 'Data Analysis', 'SQL']),
      status: 'open',
      deadline: new Date('2025-10-31'),
      viewCount: 28,
    },
  });

  const job4 = await prisma.job.create({
    data: {
      clientId: client2.id,
      title: 'Backend Developer - API Development',
      description: 'Need an experienced backend developer to build RESTful APIs for our e-commerce platform.',
      budget: 40000.00,
      hourlyRate: 650.00,
      location: 'Aarhus, Denmark',
      skills: JSON.stringify(['Node.js', 'Express', 'PostgreSQL', 'REST API']),
      status: 'in_progress',
      deadline: new Date('2025-09-30'),
      viewCount: 51,
    },
  });

  console.log('✅ Created jobs');

  // Create Job Applications
  const application1 = await prisma.jobApplication.create({
    data: {
      jobId: job1.id,
      freelancerId: freelancer1.id,
      coverLetter: 'I am very interested in this position. I have 5+ years of experience building SaaS platforms with React and Node.js. I recently completed a similar project for RetailCo.',
      proposedRate: 700.00,
      status: 'accepted',
      submittedAt: new Date('2024-10-10'),
      reviewedAt: new Date('2024-10-12'),
    },
  });

  await prisma.jobApplication.create({
    data: {
      jobId: job2.id,
      freelancerId: freelancer2.id,
      coverLetter: 'I would love to work on your mobile app design. I have extensive experience in mobile UI/UX and have worked with several successful apps.',
      proposedRate: 600.00,
      status: 'pending',
      submittedAt: new Date('2024-10-11'),
    },
  });

  await prisma.jobApplication.create({
    data: {
      jobId: job3.id,
      freelancerId: freelancer3.id,
      coverLetter: 'Your analytics platform project is right up my alley. I have built several ML models for data analysis and would be happy to discuss your requirements.',
      proposedRate: 800.00,
      status: 'pending',
      submittedAt: new Date('2024-10-12'),
    },
  });

  await prisma.jobApplication.create({
    data: {
      jobId: job1.id,
      freelancerId: freelancer3.id,
      coverLetter: 'While I specialize in data science, I also have backend development experience and would be interested in contributing to your SaaS platform.',
      proposedRate: 750.00,
      status: 'rejected',
      submittedAt: new Date('2024-10-09'),
      reviewedAt: new Date('2024-10-11'),
    },
  });

  console.log('✅ Created job applications');

  // Create Contract
  await prisma.contract.create({
    data: {
      jobId: job1.id,
      clientId: client1.id,
      freelancerId: freelancer1.id,
      contractNumber: 'CONTRACT-2024-001',
      title: 'Full-Stack Development Services for SaaS Platform',
      content: 'This contract outlines the terms and conditions for the development of the SaaS platform as described in the job posting.',
      terms: 'Payment will be made in milestones. First milestone: 30% upon contract signing. Second milestone: 40% upon completion of backend. Final milestone: 30% upon project completion.',
      paymentTerms: 'Net 14 days',
      deadline: new Date('2025-12-31'),
      totalAmount: 50000.00,
      status: 'active',
      clientSignatureDate: new Date('2024-10-13'),
      freelancerSignatureDate: new Date('2024-10-14'),
    },
  });

  console.log('✅ Created contracts');

  // Create Messages - Comprehensive test data
  const now = new Date();
  const messages = [
    // Conversation 1: Client1 <-> Freelancer1 (About Job Application)
    {
      senderId: client1.id,
      receiverId: freelancer1.id,
      content: 'Hi Emma, I saw your application for the Full-Stack Developer position. Your portfolio looks impressive!',
      conversationId: 'conv-1',
      isRead: true,
      readAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
    },
    {
      senderId: freelancer1.id,
      receiverId: client1.id,
      content: 'Thank you! I would love to discuss the project in more detail. When would be a good time for a call?',
      conversationId: 'conv-1',
      isRead: true,
      readAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 45 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 10 * 45 * 60 * 1000),
    },
    {
      senderId: client1.id,
      receiverId: freelancer1.id,
      content: 'How about tomorrow at 2 PM? We can discuss the technical requirements and timeline.',
      conversationId: 'conv-1',
      isRead: true,
      readAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 15 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 15 * 60 * 1000),
    },
    {
      senderId: freelancer1.id,
      receiverId: client1.id,
      content: 'That works perfectly for me! I\'ll send you a calendar invite. Looking forward to our conversation.',
      conversationId: 'conv-1',
      isRead: true,
      readAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 30 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 11 * 30 * 60 * 1000),
    },
    {
      senderId: client1.id,
      receiverId: freelancer1.id,
      content: 'Great! Also, I wanted to ask about your experience with AWS. We\'re planning to deploy on AWS infrastructure.',
      conversationId: 'conv-1',
      isRead: true,
      readAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    },
    {
      senderId: freelancer1.id,
      receiverId: client1.id,
      content: 'I have extensive experience with AWS. I\'ve deployed multiple projects using EC2, S3, RDS, and Lambda. I can share some examples during our call.',
      conversationId: 'conv-1',
      isRead: true,
      readAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 20 * 60 * 1000),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 20 * 60 * 1000),
    },

    // Conversation 2: Client2 <-> Freelancer3 (Data Science Position)
    {
      senderId: client2.id,
      receiverId: freelancer3.id,
      content: 'Hi Sophie, are you available for a quick chat about the data science position?',
      conversationId: 'conv-2',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    },
    {
      senderId: client2.id,
      receiverId: freelancer3.id,
      content: 'We\'re looking for someone with strong Python skills and experience in machine learning models. Your background looks very relevant!',
      conversationId: 'conv-2',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 14 * 15 * 60 * 1000),
    },
    {
      senderId: freelancer3.id,
      receiverId: client2.id,
      content: 'Hi Sarah! Yes, I\'m definitely interested. I\'m available for a call this week. What times work best for you?',
      conversationId: 'conv-2',
      isRead: false,
      createdAt: new Date(now.getTime() - 5 * 60 * 1000),
    },

    // Conversation 3: Client1 <-> Freelancer2 (UI/UX Design)
    {
      senderId: client1.id,
      receiverId: freelancer2.id,
      content: 'Hi Michael, I saw your application for the UI/UX Designer position. Your portfolio is amazing!',
      conversationId: 'conv-3',
      isRead: true,
      readAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
    },
    {
      senderId: freelancer2.id,
      receiverId: client1.id,
      content: 'Thank you so much! I\'m really excited about this opportunity. I\'ve been following your company for a while and love your brand aesthetic.',
      conversationId: 'conv-3',
      isRead: true,
      readAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 16 * 30 * 60 * 1000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 16 * 30 * 60 * 1000),
    },
    {
      senderId: client1.id,
      receiverId: freelancer2.id,
      content: 'That\'s great to hear! We\'re looking for someone who can help us redesign our mobile app. Do you have experience with mobile-first design?',
      conversationId: 'conv-3',
      isRead: true,
      readAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000),
    },
    {
      senderId: freelancer2.id,
      receiverId: client1.id,
      content: 'Absolutely! Mobile-first design is one of my specialties. I\'ve designed several mobile apps that have been downloaded over 100k times. I can share some case studies.',
      conversationId: 'conv-3',
      isRead: true,
      readAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 17 * 15 * 60 * 1000),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 17 * 15 * 60 * 1000),
    },
    {
      senderId: client1.id,
      receiverId: freelancer2.id,
      content: 'Hi Michael, I wanted to follow up on our previous conversation. Are you still interested in the mobile app design project?',
      conversationId: 'conv-3',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },

    // Conversation 4: Client2 <-> Freelancer1 (New Project Inquiry)
    {
      senderId: client2.id,
      receiverId: freelancer1.id,
      content: 'Hi Emma, I saw your profile and I\'m impressed with your React expertise. We have a new project starting next month and would love to discuss it with you.',
      conversationId: 'conv-4',
      isRead: true,
      readAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
    },
    {
      senderId: freelancer1.id,
      receiverId: client2.id,
      content: 'Hi Sarah! Thank you for reaching out. I\'d be happy to learn more about the project. What kind of application are you building?',
      conversationId: 'conv-4',
      isRead: true,
      readAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 9 * 30 * 60 * 1000),
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 9 * 30 * 60 * 1000),
    },
    {
      senderId: client2.id,
      receiverId: freelancer1.id,
      content: 'It\'s an e-commerce platform with a focus on user experience. We need someone who can build a responsive frontend with React and integrate with our backend API.',
      conversationId: 'conv-4',
      isRead: true,
      readAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
    },
    {
      senderId: client2.id,
      receiverId: freelancer1.id,
      content: 'Emma, I sent you the project brief yesterday. Have you had a chance to review it? Let me know if you have any questions.',
      conversationId: 'conv-4',
      isRead: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
    },

    // Conversation 5: Client1 <-> Freelancer3 (Rejected Application Follow-up)
    {
      senderId: client1.id,
      receiverId: freelancer3.id,
      content: 'Hi Sophie, I wanted to personally reach out regarding your application. While we decided to go with another candidate for this position, we were very impressed with your data science background.',
      conversationId: 'conv-5',
      isRead: true,
      readAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
    },
    {
      senderId: freelancer3.id,
      receiverId: client1.id,
      content: 'Thank you for letting me know. I appreciate the feedback. If you have any data science projects in the future, I\'d love to be considered.',
      conversationId: 'conv-5',
      isRead: true,
      readAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 30 * 60 * 1000),
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 15 * 30 * 60 * 1000),
    },
    {
      senderId: client1.id,
      receiverId: freelancer3.id,
      content: 'Absolutely! We\'ll definitely keep you in mind. We actually have a data analytics project starting in Q2 next year that might be a perfect fit.',
      conversationId: 'conv-5',
      isRead: true,
      readAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
    },

    // Conversation 6: Freelancer2 <-> Admin (Support/Technical Issue)
    {
      senderId: freelancer2.id,
      receiverId: admin.id,
      content: 'Hi Admin, I\'m having trouble uploading my portfolio images. The upload keeps failing. Can you help?',
      conversationId: 'conv-6',
      isRead: true,
      readAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
    },
    {
      senderId: admin.id,
      receiverId: freelancer2.id,
      content: 'Hi Michael, I\'m sorry to hear about the upload issue. Can you tell me what file size and format you\'re trying to upload? Also, what error message are you seeing?',
      conversationId: 'conv-6',
      isRead: true,
      readAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 11 * 30 * 60 * 1000),
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 11 * 30 * 60 * 1000),
    },
    {
      senderId: freelancer2.id,
      receiverId: admin.id,
      content: 'I\'m trying to upload PNG files, each around 2MB. The error says "Upload failed. Please try again." I\'ve tried multiple times.',
      conversationId: 'conv-6',
      isRead: true,
      readAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    },
    {
      senderId: admin.id,
      receiverId: freelancer2.id,
      content: 'I see the issue. The file size limit is 5MB per file, so that should be fine. Let me check our server logs. In the meantime, can you try compressing the images or uploading them one at a time?',
      conversationId: 'conv-6',
      isRead: true,
      readAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 12 * 30 * 60 * 1000),
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000 + 12 * 30 * 60 * 1000),
    },
    {
      senderId: freelancer2.id,
      receiverId: admin.id,
      content: 'Thanks! I\'ll try that. One more question - when will the new messaging feature be available? I saw it mentioned in the roadmap.',
      conversationId: 'conv-6',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
    },

    // Conversation 7: Client2 <-> Freelancer2 (Quick Questions)
    {
      senderId: client2.id,
      receiverId: freelancer2.id,
      content: 'Hi Michael, quick question - do you have experience designing dashboards for SaaS products?',
      conversationId: 'conv-7',
      isRead: true,
      readAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000),
    },
    {
      senderId: freelancer2.id,
      receiverId: client2.id,
      content: 'Yes, absolutely! I\'ve designed several SaaS dashboards for analytics and project management tools. I can show you examples if you\'d like.',
      conversationId: 'conv-7',
      isRead: true,
      readAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 13 * 15 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 13 * 15 * 60 * 1000),
    },

    // Conversation 8: Freelancer1 <-> Freelancer2 (Peer Discussion)
    {
      senderId: freelancer1.id,
      receiverId: freelancer2.id,
      content: 'Hey Michael! I saw your recent project on the forum. The design looks amazing! How long did it take you to complete?',
      conversationId: 'conv-8',
      isRead: true,
      readAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    },
    {
      senderId: freelancer2.id,
      receiverId: freelancer1.id,
      content: 'Hi Emma! Thanks so much! It took about 6 weeks from initial concept to final delivery. The client was really happy with the result.',
      conversationId: 'conv-8',
      isRead: true,
      readAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 14 * 30 * 60 * 1000),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 14 * 30 * 60 * 1000),
    },
    {
      senderId: freelancer1.id,
      receiverId: freelancer2.id,
      content: 'That\'s impressive! I\'m working on a similar timeline for my current project. Any tips for keeping the client happy throughout the process?',
      conversationId: 'conv-8',
      isRead: true,
      readAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
    },
    {
      senderId: freelancer2.id,
      receiverId: freelancer1.id,
      content: 'Communication is key! I send weekly updates with progress screenshots and always ask for feedback early. It helps catch issues before they become big problems.',
      conversationId: 'conv-8',
      isRead: true,
      readAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 15 * 30 * 60 * 1000),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 15 * 30 * 60 * 1000),
    },
  ];

  await prisma.message.createMany({
    data: messages,
  });

  console.log(`✅ Created ${messages.length} messages across ${new Set(messages.map(m => m.conversationId)).size} conversations`);

  // Create Forum Categories
  const forumCat1 = await prisma.forumCategory.create({
    data: {
      name: 'General Discussion',
      description: 'General topics about freelancing and the platform',
      icon: 'MessageSquare',
      postCount: 2,
    },
  });

  const forumCat2 = await prisma.forumCategory.create({
    data: {
      name: 'Tips & Tricks',
      description: 'Share your best practices and learn from others',
      icon: 'Lightbulb',
      postCount: 1,
    },
  });

  const forumCat3 = await prisma.forumCategory.create({
    data: {
      name: 'Job Opportunities',
      description: 'Discuss available jobs and project opportunities',
      icon: 'Briefcase',
      postCount: 1,
    },
  });

  console.log('✅ Created forum categories');

  // Create Forum Posts
  const post1 = await prisma.forumPost.create({
    data: {
      categoryId: forumCat1.id,
      authorId: freelancer1.id,
      title: 'Welcome to Talent Forge!',
      content: 'Hello everyone! I\'m excited to be part of this community. Looking forward to connecting with talented professionals and clients.',
      replyCount: 2,
      lastReplyBy: freelancer2.id,
      isPinned: true,
    },
  });

  const post2 = await prisma.forumPost.create({
    data: {
      categoryId: forumCat2.id,
      authorId: freelancer2.id,
      title: 'How to Write a Great Cover Letter',
      content: 'After working on many projects, I\'ve learned that a personalized cover letter makes all the difference. Here are my top tips:\n\n1. Research the client\n2. Highlight relevant experience\n3. Be specific about your approach\n4. Keep it concise',
      replyCount: 1,
      lastReplyBy: freelancer3.id,
    },
  });

  const post3 = await prisma.forumPost.create({
    data: {
      categoryId: forumCat3.id,
      authorId: client1.id,
      title: 'Looking for React Developers',
      content: 'Our company is constantly looking for talented React developers. If you have experience with React and TypeScript, feel free to reach out!',
      replyCount: 0,
    },
  });

  console.log('✅ Created forum posts');

  // Create Forum Replies
  await prisma.forumReply.createMany({
    data: [
      {
        postId: post1.id,
        authorId: freelancer2.id,
        content: 'Welcome Emma! Great to have you here. This platform has been amazing for finding quality projects.',
      },
      {
        postId: post1.id,
        authorId: client1.id,
        content: 'Welcome to the community! Looking forward to working with talented freelancers like you.',
      },
      {
        postId: post2.id,
        authorId: freelancer3.id,
        content: 'Great tips! I would also add: always proofread your cover letter before submitting.',
      },
    ],
  });

  console.log('✅ Created forum replies');

  // Create Honey Transactions
  await prisma.honeyTransaction.createMany({
    data: [
      {
        userId: client1.id,
        amount: 500,
        type: 'purchase',
        description: 'Purchased 500 Honey Drops',
        paymentId: 'pay_123456',
      },
      {
        userId: client1.id,
        amount: -50,
        type: 'spend',
        description: 'Job posting fee',
      },
      {
        userId: freelancer1.id,
        amount: 200,
        type: 'purchase',
        description: 'Purchased 200 Honey Drops',
        paymentId: 'pay_789012',
      },
      {
        userId: freelancer1.id,
        amount: -25,
        type: 'spend',
        description: 'Featured profile boost',
      },
      {
        userId: client2.id,
        amount: 300,
        type: 'purchase',
        description: 'Purchased 300 Honey Drops',
        paymentId: 'pay_345678',
      },
    ],
  });

  console.log('✅ Created honey transactions');

  // Create Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME10',
        discount: 10.00,
        maxUses: 100,
        usedCount: 15,
        expiresAt: new Date('2025-12-31'),
        isActive: true,
      },
      {
        code: 'SUMMER2024',
        discount: 20.00,
        maxUses: 50,
        usedCount: 32,
        expiresAt: new Date('2024-08-31'),
        isActive: false,
      },
      {
        code: 'PREMIUM50',
        discount: 50.00,
        maxUses: 10,
        usedCount: 5,
        expiresAt: new Date('2025-12-31'),
        isActive: true,
      },
    ],
  });

  console.log('✅ Created coupons');

  console.log('\n🎉 Database seed completed successfully!\n');
  console.log('📝 Login credentials for testing:');
  console.log('Admin: admin@talentforge.com / password123');
  console.log('Client 1: client1@company.com / password123');
  console.log('Client 2: client2@startup.com / password123');
  console.log('Freelancer 1: freelancer1@example.com / password123');
  console.log('Freelancer 2: freelancer2@example.com / password123');
  console.log('Freelancer 3: freelancer3@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

