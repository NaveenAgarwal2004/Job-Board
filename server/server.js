import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import route modules
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';

// Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001; // Changed to 8001 to match supervisor expectation

// Track database connection status
let dbConnected = false;

// Basic middleware with production-ready CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173';
    const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim()).filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Production-ready security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Mock data for when database is not available
const mockJobs = [
  {
    _id: '1',
    title: 'Senior Frontend Developer',
    company: { name: 'TechCorp Inc.' },
    location: 'San Francisco, CA',
    type: 'Full-time',
    category: 'Technology',
    experience: 'Senior',
    description: 'We are looking for a senior frontend developer to join our team. You will be responsible for building user interfaces using React and modern web technologies.',
    requirements: 'Bachelor\'s degree in Computer Science or equivalent\n5+ years of experience with React\nExperience with TypeScript\nStrong CSS skills',
    salary: { min: 120000, max: 150000, currency: 'USD', period: 'yearly' },
    skills: ['React', 'TypeScript', 'CSS'],
    benefits: ['Health Insurance', '401k', 'Remote Work'],
    remote: true,
    featured: true,
    createdAt: new Date().toISOString(),
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    applicationsCount: 15
  },
  {
    _id: '2',
    title: 'Backend Engineer',
    company: { name: 'StartupXYZ' },
    location: 'New York, NY',
    type: 'Full-time',
    category: 'Technology',
    experience: 'Mid-level',
    description: 'Join our backend team to build scalable APIs and microservices. Experience with Node.js and databases required.',
    requirements: 'Bachelor\'s degree in Computer Science or equivalent\n3+ years of experience with Node.js\nExperience with MongoDB\nRESTful API design experience',
    salary: { min: 90000, max: 120000, currency: 'USD', period: 'yearly' },
    skills: ['Node.js', 'MongoDB', 'Express'],
    benefits: ['Health Insurance', 'Stock Options'],
    remote: false,
    featured: false,
    createdAt: new Date().toISOString(),
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    applicationsCount: 8
  },
  {
    _id: '3',
    title: 'UX Designer',
    company: { name: 'Design Studio' },
    location: 'Remote',
    type: 'Contract',
    category: 'Design',
    experience: 'Mid-level',
    description: 'Create beautiful and intuitive user experiences for our digital products. Portfolio required.',
    requirements: 'Bachelor\'s degree in Design or equivalent\n3+ years of UX design experience\nProficiency in Figma\nExperience with user research',
    salary: { min: 70000, max: 90000, currency: 'USD', period: 'yearly' },
    skills: ['Figma', 'User Research', 'Prototyping'],
    benefits: ['Flexible Hours', 'Remote Work'],
    remote: true,
    featured: false,
    createdAt: new Date().toISOString(),
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    applicationsCount: 12
  }
];

// Connect to MongoDB with graceful error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobboard';
    
    // Set connection timeout to fail faster
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });
    
    console.log('📦 Connected to MongoDB');
    dbConnected = true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Server will continue running with mock data');
    console.log('💡 To fix this: Start MongoDB service or provide a valid MONGODB_URI');
    console.log('📋 Instructions:');
    console.log('   1. Install MongoDB: https://docs.mongodb.com/manual/installation/');
    console.log('   2. Start MongoDB service');
    console.log('   3. Or update MONGODB_URI in .env file');
    dbConnected = false;
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    mode: dbConnected ? 'production' : 'mock',
    port: PORT
  });
});

// Database status endpoint
app.get('/api/db-status', (req, res) => {
  res.json({
    connected: dbConnected,
    mode: dbConnected ? 'production' : 'mock',
    mockJobsCount: mockJobs.length
  });
});

// Mock routes when database is not available
const createMockRoutes = (app) => {
  // Mock jobs endpoint
  app.get('/api/jobs', (req, res) => {
    res.json({
      success: true,
      data: {
        jobs: mockJobs,
        pagination: {
          total: mockJobs.length,
          pages: 1,
          hasPrev: false,
          hasNext: false
        },
        mockMode: true
      }
    });
  });

  app.get('/api/jobs/:id', (req, res) => {
    const job = mockJobs.find(j => j._id === req.params.id);
    if (job) {
      res.json({
        success: true,
        data: { job },
        mockMode: true
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
  });

  app.get('/api/jobs/categories/stats', (req, res) => {
    res.json({
      success: true,
      data: {
        categories: [
          { name: 'Technology', count: 2 },
          { name: 'Design', count: 1 }
        ]
      }
    });
  });

  // Mock auth endpoints
  app.post('/api/auth/register', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Registration not available in mock mode',
      suggestion: 'Connect to database to use this feature'
    });
  });

  app.post('/api/auth/login', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Login not available in mock mode',
      suggestion: 'Connect to database to use this feature'
    });
  });

  // Mock other endpoints
  app.use('/api/applications', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Applications not available in mock mode',
      suggestion: 'Connect to database to use this feature'
    });
  });

  app.use('/api/users', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'User management not available in mock mode',
      suggestion: 'Connect to database to use this feature'
    });
  });

  app.use('/api/admin', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Admin features not available in mock mode',
      suggestion: 'Connect to database to use this feature'
    });
  });
};

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    if (dbConnected) {
      // Register real API routes
      app.use('/api/auth', authRoutes);
      app.use('/api/jobs', jobRoutes);
      app.use('/api/applications', applicationRoutes);
      app.use('/api/users', userRoutes);
      app.use('/api/admin', adminRoutes);
    } else {
      // Register mock routes
      createMockRoutes(app);
    }

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    });

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
      console.log(`🔍 Database status at http://localhost:${PORT}/api/db-status`);
      console.log(`🌐 API base URL: http://localhost:${PORT}/api`);
      
      if (!dbConnected) {
        console.log('\n⚠️  Running in MOCK MODE - Limited functionality available');
        console.log('📋 Available endpoints:');
        console.log('   • GET /api/jobs - View sample jobs');
        console.log('   • GET /api/jobs/:id - View job details');
        console.log('   • GET /api/jobs/categories/stats - Category statistics');
        console.log('\n💡 To enable full functionality:');
        console.log('   1. Install MongoDB: https://docs.mongodb.com/manual/installation/');
        console.log('   2. Start MongoDB service');
        console.log('   3. Restart this server');
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

