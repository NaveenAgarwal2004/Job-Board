import express from 'express';
import { body, validationResult } from 'express-validator';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply for a job (candidates only)
router.post('/', authenticate, authorize('candidate'), [
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('coverLetter').optional().trim().isLength({ max: 2000 }).withMessage('Cover letter cannot exceed 2000 characters'),
  body('resume').notEmpty().withMessage('Resume is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, coverLetter, resume } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job || !job.isActive) {
      return res.status(404).json({ message: 'Job not found or no longer active' });
    }

    // Check if application deadline has passed
    if (new Date() > job.applicationDeadline) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      candidate: req.user._id,
      coverLetter,
      resume
    });

    // Increment job applications count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

    await application.populate([
      { path: 'job', select: 'title company' },
      { path: 'candidate', select: 'name email profile' }
    ]);

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ message: 'Server error while submitting application' });
  }
});

// Get candidate's applications
router.get('/my-applications', authenticate, authorize('candidate'), async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate('job', 'title company location type salary createdAt')
      .populate({
        path: 'job',
        populate: {
          path: 'company',
          select: 'name company.logo'
        }
      })
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Get applications for employer's jobs
router.get('/job/:jobId', authenticate, authorize('employer'), async (req, res) => {
  try {
    // First verify the job belongs to this employer
    const job = await Job.findOne({ 
      _id: req.params.jobId, 
      company: req.user._id 
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email profile')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// Update application status (employers only)
router.patch('/:id/status', authenticate, authorize('employer'), [
  body('status').isIn(['pending', 'reviewing', 'shortlisted', 'interview', 'rejected', 'hired']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await Application.findById(req.params.id)
      .populate('job', 'company');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the job belongs to this employer
    if (application.job.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = req.body.status;
    application.notes = req.body.notes || application.notes;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;

    await application.save();

    await application.populate('candidate', 'name email profile');

    res.json({
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error while updating application status' });
  }
});

// Get single application
router.get('/:id', authenticate, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company location type salary')
      .populate('candidate', 'name email profile')
      .populate({
        path: 'job',
        populate: {
          path: 'company',
          select: 'name company'
        }
      });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check access permissions
    const isCandidate = req.user.role === 'candidate' && application.candidate._id.toString() === req.user._id.toString();
    const isEmployer = req.user.role === 'employer' && application.job.company._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCandidate && !isEmployer && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Server error while fetching application' });
  }
});

export default router;