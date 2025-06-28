import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('profile.phone').optional().trim(),
  body('profile.location').optional().trim(),
  body('profile.bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('profile.skills').optional().isArray(),
  body('company.name').optional().trim(),
  body('company.description').optional().trim().isLength({ max: 1000 }).withMessage('Company description cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = { ...req.body };
    
    // Remove sensitive fields that shouldn't be updated here
    delete updateData.email;
    delete updateData.password;
    delete updateData.role;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// Change password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
});

// Get employer dashboard stats
router.get('/employer/stats', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const Job = (await import('../models/Job.js')).default;
    const Application = (await import('../models/Application.js')).default;

    const totalJobs = await Job.countDocuments({ company: req.user._id });
    const activeJobs = await Job.countDocuments({ company: req.user._id, isActive: true });
    const totalApplications = await Application.countDocuments({
      job: { $in: await Job.find({ company: req.user._id }).distinct('_id') }
    });

    res.json({
      stats: {
        totalJobs,
        activeJobs,
        totalApplications,
        inactiveJobs: totalJobs - activeJobs
      }
    });
  } catch (error) {
    console.error('Get employer stats error:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
});

export default router;