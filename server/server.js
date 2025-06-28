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
const PORT = process.env.PORT || 5000;

// Track database connection status
let dbConnected = false;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    salary: { min: 120000, max: 150000 },
    skills: ['React', 'TypeScript', 'CSS'],
    remote: true,
    featured: true,
    createdAt: new Date().toISOString(),
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
    salary: { min: 90000, max: 120000 },
    skills: ['Node.js', 'MongoDB', 'Express'],
    remote: false,
    featured: false,
    createdAt: new Date().toISOString(),
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
    salary: { min: 70000, max: 90000 },
    skills: ['Figma', 'User Research', 'Prototyping'],
    remote: true,
    featured: false,
    createdAt: new Date().toISOString(),
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

// Middleware to provide fallback data when database is not available
const handleDBFallback = (req, res, next) => {
  if (!dbConnected) {
    // Add mock data to request for fallback
    req.mockMode = true;
    req.mockJobs = mockJobs;
  }
  next();
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
      app.use('/api/auth', (req, res) => {
        res.status(404).json({ message: 'Endpoint not available in mock mode' });
      });
      app.use('/api/jobs', (req, res) => {
        res.status(404).json({ message: 'Endpoint not available in mock mode' });
      });
      app.use('/api/applications', (req, res) => {
        res.status(503).json({ 
          message: 'Applications not available in mock mode',
          suggestion: 'Connect to database to use this feature'
        });
      });
      app.use('/api/users', (req, res) => {
        res.status(503).json({ 
          message: 'User management not available in mock mode',
          suggestion: 'Connect to database to use this feature'
        });
      });
      app.use('/api/admin', (req, res) => {
        res.status(503).json({ 
          message: 'Admin features not available in mock mode',
          suggestion: 'Connect to database to use this feature'
        });
      });
    }

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
        console.log('   • POST /api/auth/register - Mock registration');
        console.log('   • POST /api/auth/login - Mock login');
        console.log('\n💡 To enable full functionality:');
        console.log('   1. Install MongoDB: https://docs.mongodb.com/manual/installation/');
        console.log('   2. Start MongoDB service');
        console.log('   3. Restart this server');
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

