import { Resend } from 'resend';

/**
 * Production-Ready Email Service for JobBoard Application
 * Supports both development and production environments with proper domain handling
 */

// Email configuration
const EMAIL_CONFIG = {
  FROM_ADDRESS: process.env.EMAIL_FROM || 'JobBoard <noreply@jobboard.dev>',
  BRAND_NAME: 'JobBoard',
  CURRENT_YEAR: new Date().getFullYear(),
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  DASHBOARD_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BASE_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DEV_MODE: process.env.NODE_ENV !== 'production',
  ENABLE_EMAIL_LOGGING: process.env.ENABLE_EMAIL_LOGGING === 'true' || process.env.NODE_ENV !== 'production',
  // Production email handling
  PRODUCTION_EMAIL_ENABLED: process.env.NODE_ENV === 'production' && process.env.RESEND_PRODUCTION_ENABLED === 'true',
};

// Email status types
const EMAIL_STATUS = {
  REVIEWING: 'reviewing',
  SHORTLISTED: 'shortlisted',
  INTERVIEW: 'interview',
  REJECTED: 'rejected',
  HIRED: 'hired',
  ON_HOLD: 'on_hold',
  WITHDRAWN: 'withdrawn',
};

// Initialize Resend client
let resendClient = null;

/**
 * Get or initialize the Resend client
 */
const getResendClient = () => {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

/**
 * Validate email address format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Enhanced domain verification check
 */
const isDomainVerified = (email) => {
  if (!email || EMAIL_CONFIG.DEV_MODE) return true; // Allow all in dev mode
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  // In production, you'll add your verified domains here
  const verifiedDomains = [
    'resend.dev',
    'jobboard.dev', // Your production domain
    // Add more verified domains as needed
  ];
  
  return verifiedDomains.includes(domain);
};

/**
 * Sanitize HTML content
 */
const sanitizeHtml = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Log email activity
 */
const logEmailActivity = (emailData, status, reason = '') => {
  if (!EMAIL_CONFIG.ENABLE_EMAIL_LOGGING) return;
  
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    status,
    reason,
    to: emailData.to,
    subject: emailData.subject,
    from: emailData.from || EMAIL_CONFIG.FROM_ADDRESS,
    environment: process.env.NODE_ENV || 'development',
  };
  
  console.log('📧 EMAIL LOG:', JSON.stringify(logData, null, 2));
};

/**
 * Generate responsive HTML email template
 */
const generateEmailTemplate = (title, headerColor, content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${sanitizeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f8fafc;
        }
        .email-wrapper {
          width: 100%;
          padding: 20px 0;
          background-color: #f8fafc;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .header { 
          background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
        }
        .header h1 { 
          font-size: 28px; 
          font-weight: 700;
          margin-bottom: 8px;
        }
        .header .subtitle {
          font-size: 16px;
          opacity: 0.9;
        }
        .content { 
          padding: 40px 30px; 
        }
        .content h2 { 
          color: #1a202c; 
          margin: 0 0 20px 0;
          font-size: 22px;
          font-weight: 600;
        }
        .content p { 
          margin-bottom: 16px; 
          font-size: 16px;
          line-height: 1.7;
        }
        .content ul { 
          padding-left: 20px; 
          margin-bottom: 20px;
        }
        .content li { 
          margin-bottom: 8px; 
          font-size: 16px;
        }
        .status-badge { 
          background: linear-gradient(45deg, #667eea, #764ba2); 
          color: white; 
          padding: 12px 20px; 
          border-radius: 25px; 
          font-weight: 600; 
          display: inline-block; 
          margin: 20px 0; 
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 1px;
        }
        .success-badge { 
          background: linear-gradient(45deg, #48bb78, #38a169); 
        }
        .danger-badge { 
          background: linear-gradient(45deg, #f56565, #e53e3e); 
        }
        .info-badge {
          background: linear-gradient(45deg, #4299e1, #3182ce);
        }
        .warning-badge {
          background: linear-gradient(45deg, #ed8936, #dd6b20);
        }
        .footer { 
          background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
          color: #e2e8f0; 
          padding: 30px; 
          text-align: center;
        }
        .footer p { 
          margin-bottom: 10px;
          font-size: 14px;
        }
        .footer a { 
          color: #63b3ed; 
          text-decoration: none; 
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(45deg, #4299e1, #3182ce);
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          margin: 24px 0;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(66, 153, 225, 0.4);
        }
        .highlight-box {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-left: 6px solid ${headerColor};
          padding: 20px;
          margin: 20px 0;
          border-radius: 6px;
        }
        .highlight-box p {
          margin: 0;
          font-style: italic;
          color: #4a5568;
        }
        @media only screen and (max-width: 600px) {
          .email-wrapper { padding: 10px; }
          .content, .header { padding: 20px; }
          .cta-button { padding: 14px 24px; font-size: 15px; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <div class="header">
            <h1>${EMAIL_CONFIG.BRAND_NAME}</h1>
            <div class="subtitle">${sanitizeHtml(title)}</div>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>&copy; ${EMAIL_CONFIG.CURRENT_YEAR} ${EMAIL_CONFIG.BRAND_NAME}. All rights reserved.</p>
            <p>
              <a href="mailto:support@jobboard.dev">Contact Support</a> | 
              <a href="${EMAIL_CONFIG.BASE_URL}/privacy">Privacy Policy</a> |
              <a href="${EMAIL_CONFIG.BASE_URL}/unsubscribe">Unsubscribe</a>
            </p>
            <p style="font-size: 12px; margin-top: 15px; opacity: 0.8;">
              This email was sent to you as a registered user of ${EMAIL_CONFIG.BRAND_NAME}.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Retry mechanism for email operations
 */
const retryEmailOperation = async (emailOperation, retries = EMAIL_CONFIG.MAX_RETRIES) => {
  try {
    return await emailOperation();
  } catch (error) {
    if (retries > 0 && (
      error.message.includes('network') || 
      error.message.includes('timeout') || 
      error.message.includes('ECONNRESET') ||
      error.message.includes('rate limit')
    )) {
      const delay = EMAIL_CONFIG.RETRY_DELAY * (EMAIL_CONFIG.MAX_RETRIES - retries + 1);
      console.log(`📧 Email retry attempt ${EMAIL_CONFIG.MAX_RETRIES - retries + 1}/${EMAIL_CONFIG.MAX_RETRIES} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryEmailOperation(emailOperation, retries - 1);
    }
    throw error;
  }
};

/**
 * Enhanced email sending with production domain support
 */
const sendEmail = async (emailData, options = {}) => {
  try {
    // Validate required fields
    if (!emailData.to || !isValidEmail(emailData.to)) {
      throw new Error('Valid recipient email address is required');
    }
    if (!emailData.subject || emailData.subject.trim().length === 0) {
      throw new Error('Email subject is required');
    }
    if (!emailData.html || emailData.html.trim().length === 0) {
      throw new Error('Email content is required');
    }

    const fromAddress = process.env.EMAIL_FROM || EMAIL_CONFIG.FROM_ADDRESS;

    // Development mode - always log instead of sending
    if (EMAIL_CONFIG.DEV_MODE) {
      console.log('📧 DEV MODE: Email would be sent in production');
      
      logEmailActivity(
        { ...emailData, from: fromAddress },
        'DEV_LOGGED',
        'Development mode - email logged instead of sent'
      );

      console.log('📧 EMAIL PREVIEW:', {
        from: fromAddress,
        to: emailData.to,
        subject: emailData.subject,
        contentLength: emailData.html.length,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: { id: `dev_${Date.now()}` },
        messageId: `dev_${Date.now()}`,
        devMode: true,
        message: 'Email logged in development mode'
      };
    }

    // Production mode email sending
    if (!isDomainVerified(emailData.to) && !options.skipDomainCheck) {
      console.warn('⚠️  Sending to unverified domain:', emailData.to.split('@')[1]);
      
      // In production, you might want to queue these emails or handle them differently
      if (!EMAIL_CONFIG.PRODUCTION_EMAIL_ENABLED) {
        logEmailActivity(
          { ...emailData, from: fromAddress },
          'BLOCKED_UNVERIFIED',
          'Email blocked - unverified domain in production'
        );
        
        return {
          success: false,
          error: 'Email domain not verified for production sending',
          suggestion: 'Emails to unverified domains are blocked in production for deliverability',
          devMode: false
        };
      }
    }

    // Send email via Resend
    const emailOperation = async () => {
      const { data, error } = await getResendClient().emails.send({
        from: fromAddress,
        ...emailData,
        // Add additional headers for better deliverability
        headers: {
          'X-Entity-Ref-ID': `jobboard-${Date.now()}`,
          'List-Unsubscribe': `<${EMAIL_CONFIG.BASE_URL}/unsubscribe>`,
          ...emailData.headers
        }
      });

      if (error) {
        console.error('📧 Resend API error:', error);
        
        // Handle specific Resend errors
        let errorMessage = 'Email service error';
        if (error.message?.includes('domain')) {
          errorMessage = 'Email domain not configured or verified';
        } else if (error.message?.includes('rate limit')) {
          errorMessage = 'Email rate limit exceeded - please try again later';
        } else if (error.message?.includes('invalid')) {
          errorMessage = 'Invalid email configuration';
        }
        
        logEmailActivity(
          { ...emailData, from: fromAddress },
          'FAILED',
          `${errorMessage}: ${error.message}`
        );
        
        throw new Error(errorMessage);
      }

      return data;
    };

    const data = await retryEmailOperation(emailOperation);
    
    console.log(`📧 Email sent successfully: ${emailData.subject} → ${emailData.to}`);
    logEmailActivity(
      { ...emailData, from: fromAddress },
      'SENT',
      'Email sent successfully via Resend'
    );

    return { 
      success: true, 
      data,
      messageId: data?.id,
      timestamp: new Date().toISOString(),
      provider: 'resend'
    };

  } catch (error) {
    console.error('📧 Email sending failed:', {
      error: error.message,
      recipient: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString()
    });
    
    logEmailActivity(
      emailData,
      'FAILED',
      error.message
    );
    
    return { 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Send welcome email to new user
 */
const sendWelcomeEmail = async (email, name, options = {}) => {
  if (!email || !name) {
    throw new Error('Email and name are required parameters');
  }

  const safeName = sanitizeHtml(name);
  const dashboardUrl = options.dashboardUrl || `${EMAIL_CONFIG.DASHBOARD_URL}/dashboard`;
  
  const content = `
    <h2>Welcome to your career journey! 🚀</h2>
    <p>Hi <strong>${safeName}</strong>,</p>
    <p>We're absolutely thrilled to welcome you to ${EMAIL_CONFIG.BRAND_NAME}! Your account has been successfully created, and you're now part of a community that's passionate about connecting talented individuals with amazing opportunities.</p>
    
    <div class="highlight-box">
      <p><strong>🎯 Your account is ready!</strong> You can now explore thousands of job opportunities and take control of your career path.</p>
    </div>
    
    <p><strong>Here's what you can do right now:</strong></p>
    <ul>
      <li>🔍 <strong>Browse Jobs</strong> - Discover opportunities that match your skills and interests</li>
      <li>⚡ <strong>Quick Apply</strong> - Apply to positions with just a few clicks using our streamlined process</li>
      <li>📊 <strong>Track Applications</strong> - Monitor your application status and get real-time updates</li>
      <li>💼 <strong>Build Your Profile</strong> - Showcase your experience and attract employers</li>
      <li>🔔 <strong>Job Alerts</strong> - Get notified when new positions match your criteria</li>
    </ul>
    
    <a href="${dashboardUrl}" class="cta-button">Explore Your Dashboard</a>
    
    <p><strong>Pro Tips for Success:</strong></p>
    <ul>
      <li>Complete your profile to stand out to employers</li>
      <li>Set up job alerts for positions you're interested in</li>
      <li>Apply quickly to new postings for better visibility</li>
      <li>Follow up on your applications through the dashboard</li>
    </ul>
    
    <p>Ready to find your dream job? Your next career opportunity is just a click away!</p>
    
    <p>If you have any questions or need assistance, our support team is here to help 24/7. Just reply to this email or contact us through the platform.</p>
    
    <p>Best wishes on your job search journey!</p>
    <p><strong>The ${EMAIL_CONFIG.BRAND_NAME} Team</strong></p>
  `;

  return sendEmail({
    to: email,
    subject: `🎉 Welcome to ${EMAIL_CONFIG.BRAND_NAME} - Your Career Journey Starts Now!`,
    html: generateEmailTemplate('Welcome to Your Career Journey!', '#4299e1', content)
  }, options);
};

/**
 * Send application confirmation email
 */
const sendApplicationConfirmation = async (email, candidateName, jobTitle, companyName, options = {}) => {
  if (!email || !candidateName || !jobTitle || !companyName) {
    throw new Error('All parameters (email, candidateName, jobTitle, companyName) are required');
  }

  const safeName = sanitizeHtml(candidateName);
  const safeJobTitle = sanitizeHtml(jobTitle);
  const safeCompanyName = sanitizeHtml(companyName);
  const applicationId = options.applicationId || 'N/A';
  const dashboardUrl = options.dashboardUrl || `${EMAIL_CONFIG.DASHBOARD_URL}/applications`;
  
  const content = `
    <h2>Application Submitted Successfully! ✅</h2>
    <p>Hi <strong>${safeName}</strong>,</p>
    <p>Excellent news! Your application for the position of <strong>${safeJobTitle}</strong> at <strong>${safeCompanyName}</strong> has been successfully submitted and is now in the hands of the hiring team.</p>
    
    <div class="status-badge success-badge">Application Submitted</div>
    
    ${applicationId !== 'N/A' ? `
    <div class="highlight-box">
      <p><strong>Application Reference ID:</strong> ${sanitizeHtml(applicationId)}</p>
      <p>Keep this ID for your records and future reference.</p>
    </div>
    ` : ''}
    
    <p><strong>What happens next?</strong></p>
    <ul>
      <li>📋 <strong>Initial Review</strong> - The hiring team will review your application within 3-5 business days</li>
      <li>📧 <strong>Status Updates</strong> - You'll receive automatic email notifications about any changes to your application status</li>
      <li>📅 <strong>Interview Invitations</strong> - If you're selected, you'll be contacted directly for the next steps</li>
      <li>💬 <strong>Direct Messages</strong> - Any communication from the employer will appear in your dashboard</li>
    </ul>
    
    <a href="${dashboardUrl}" class="cta-button">View Application Status</a>
    
    <p><strong>💡 Pro Tips while you wait:</strong></p>
    <ul>
      <li>Keep your profile updated with your latest experience</li>
      <li>Consider applying to similar positions to increase your chances</li>
      <li>Research the company and role to prepare for potential interviews</li>
      <li>Check your dashboard regularly for updates and messages</li>
    </ul>
    
    <p>We're rooting for you! Best of luck with your application, and remember - every application is a step closer to your dream job.</p>
    
    <p>If you have any questions about your application or need technical support, don't hesitate to reach out to our team.</p>
    
    <p><strong>The ${EMAIL_CONFIG.BRAND_NAME} Team</strong></p>
  `;

  return sendEmail({
    to: email,
    subject: `✅ Application Confirmed: ${safeJobTitle} at ${safeCompanyName}`,
    html: generateEmailTemplate('Application Submitted Successfully!', '#48bb78', content)
  }, options);
};

/**
 * Send application status update email
 */
const sendStatusUpdateEmail = async (email, candidateName, jobTitle, companyName, status, options = {}) => {
  if (!email || !candidateName || !jobTitle || !companyName || !status) {
    throw new Error('All required parameters must be provided');
  }

  const safeName = sanitizeHtml(candidateName);
  const safeJobTitle = sanitizeHtml(jobTitle);
  const safeCompanyName = sanitizeHtml(companyName);
  const notes = options.notes ? sanitizeHtml(options.notes) : '';
  const nextSteps = options.nextSteps ? sanitizeHtml(options.nextSteps) : '';
  const dashboardUrl = options.dashboardUrl || `${EMAIL_CONFIG.DASHBOARD_URL}/applications`;

  const statusConfig = {
    [EMAIL_STATUS.REVIEWING]: {
      title: 'Application Under Review',
      message: 'is currently being carefully reviewed by our hiring team',
      badgeClass: 'status-badge info-badge',
      emoji: '👀',
      color: '#4299e1',
      encouragement: 'Hang tight! The team is taking time to properly evaluate your qualifications.'
    },
    [EMAIL_STATUS.SHORTLISTED]: {
      title: 'Great News - You\'ve Been Shortlisted!',
      message: 'has been shortlisted! You\'re among the top candidates',
      badgeClass: 'status-badge success-badge',
      emoji: '🎉',
      color: '#48bb78',
      encouragement: 'Congratulations! You\'re one step closer to landing this role.'
    },
    [EMAIL_STATUS.INTERVIEW]: {
      title: 'Interview Invitation',
      message: 'has progressed to the interview stage',
      badgeClass: 'status-badge success-badge',
      emoji: '🤝',
      color: '#4299e1',
      encouragement: 'This is exciting! Time to prepare and show them what you\'ve got.'
    },
    [EMAIL_STATUS.REJECTED]: {
      title: 'Application Update',
      message: 'was not selected for this position',
      badgeClass: 'status-badge danger-badge',
      emoji: '💪',
      color: '#f56565',
      encouragement: 'Don\'t let this discourage you! Every "no" brings you closer to the right "yes".'
    },
    [EMAIL_STATUS.HIRED]: {
      title: 'Congratulations - You Got the Job!',
      message: 'has been accepted! Welcome to your new role',
      badgeClass: 'status-badge success-badge',
      emoji: '🎊',
      color: '#48bb78',
      encouragement: 'Amazing! We\'re so excited for you and your new journey.'
    },
    [EMAIL_STATUS.ON_HOLD]: {
      title: 'Application on Hold',
      message: 'has been temporarily placed on hold',
      badgeClass: 'status-badge warning-badge',
      emoji: '⏸️',
      color: '#ed8936',
      encouragement: 'Sometimes good things take time. Stay positive!'
    },
    [EMAIL_STATUS.WITHDRAWN]: {
      title: 'Application Withdrawn',
      message: 'has been withdrawn',
      badgeClass: 'status-badge',
      emoji: '↩️',
      color: '#718096',
      encouragement: 'No worries! There are plenty of other opportunities waiting for you.'
    }
  };

  const config = statusConfig[status] || statusConfig[EMAIL_STATUS.REVIEWING];
  
  const content = `
    <h2>${config.title} ${config.emoji}</h2>
    <p>Hi <strong>${safeName}</strong>,</p>
    <p>We have an important update regarding your application for <strong>${safeJobTitle}</strong> at <strong>${safeCompanyName}</strong>.</p>
    
    <p>Your application ${config.message}.</p>
    
    <div class="${config.badgeClass}">
      ${status.replace('_', ' ').toUpperCase()}
    </div>

    ${notes ? `
      <div class="highlight-box">
        <p><strong>Message from ${safeCompanyName}:</strong></p>
        <p>${notes}</p>
      </div>
    ` : ''}

    ${nextSteps ? `
      <p><strong>Next Steps:</strong></p>
      <div class="highlight-box">
        <p>${nextSteps}</p>
      </div>
    ` : ''}
    
    <a href="${dashboardUrl}" class="cta-button">View Full Details</a>
    
    <p>${config.encouragement}</p>
    
    ${status === EMAIL_STATUS.REJECTED ? `
      <p><strong>Keep Moving Forward!</strong></p>
      <ul>
        <li>This is just one opportunity among many</li>
        <li>Use this as motivation to keep improving</li>
        <li>Consider asking for feedback to grow from this experience</li>
        <li>Keep applying - your perfect match is out there!</li>
      </ul>
    ` : ''}
    
    ${status === EMAIL_STATUS.HIRED ? `
      <p><strong>🎉 Welcome to your new chapter!</strong></p>
      <p>We couldn't be happier for you. Wishing you tremendous success and fulfillment in your new role at ${safeCompanyName}!</p>
    ` : ''}

    ${status === EMAIL_STATUS.INTERVIEW ? `
      <p><strong>Interview Preparation Tips:</strong></p>
      <ul>
        <li>Research the company culture and recent news</li>
        <li>Prepare examples that showcase your relevant experience</li>
        <li>Think of thoughtful questions to ask the interviewer</li>
        <li>Test your technology if it's a virtual interview</li>
      </ul>
    ` : ''}
    
    <p>As always, if you have any questions or need support, our team is here to help. Just reach out anytime!</p>
    
    <p><strong>The ${EMAIL_CONFIG.BRAND_NAME} Team</strong></p>
  `;

  const subjectPrefix = status === EMAIL_STATUS.HIRED ? '🎊 Congratulations!' : 
                       status === EMAIL_STATUS.INTERVIEW ? '🗓️ Interview Invitation' :
                       status === EMAIL_STATUS.SHORTLISTED ? '🎉 Great News!' : 
                       status === EMAIL_STATUS.REJECTED ? '📄 Application Update' :
                       '📬 Application Update';

  return sendEmail({
    to: email,
    subject: `${subjectPrefix} ${safeJobTitle} at ${safeCompanyName}`,
    html: generateEmailTemplate(config.title, config.color, content)
  }, options);
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, resetToken, options = {}) => {
  if (!email || !name || !resetToken) {
    throw new Error('Email, name, and reset token are required');
  }

  const safeName = sanitizeHtml(name);
  const baseUrl = options.baseUrl || EMAIL_CONFIG.BASE_URL;
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const expiryHours = options.expiryHours || 1;
  
  const content = `
    <h2>Password Reset Request 🔒</h2>
    <p>Hi <strong>${safeName}</strong>,</p>
    <p>We received a request to reset the password for your ${EMAIL_CONFIG.BRAND_NAME} account. If you made this request, you can reset your password by clicking the button below.</p>
    
    <a href="${resetUrl}" class="cta-button">Reset Your Password</a>
    
    <div class="highlight-box">
      <p><strong>⚠️ Important Security Information:</strong></p>
      <ul style="margin: 10px 0;">
        <li>This link will expire in ${expiryHours} hour${expiryHours > 1 ? 's' : ''} for your security</li>
        <li>If you didn't request this reset, please ignore this email</li>
        <li>Your password will remain unchanged unless you use the link above</li>
        <li>Never share this link with anyone else</li>
      </ul>
    </div>
    
    <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 14px; background: #f7fafc; padding: 10px; border-radius: 4px;">${resetUrl}</p>
    
    <p><strong>Didn't request this?</strong> If you didn't ask to reset your password, someone else might have entered your email address by mistake. You can safely ignore this email - your account remains secure.</p>
    
    <p>If you continue to receive these emails or have security concerns, please contact our support team immediately.</p>
    
    <p><strong>The ${EMAIL_CONFIG.BRAND_NAME} Team</strong></p>
  `;

  return sendEmail({
    to: email,
    subject: `🔐 Reset Your ${EMAIL_CONFIG.BRAND_NAME} Password`,
    html: generateEmailTemplate('Password Reset Request', '#f56565', content)
  }, options);
};

/**
 * Send employer notification email when someone applies to their job
 */
const sendEmployerApplicationNotification = async (employerEmail, employerName, candidateName, jobTitle, applicationId, options = {}) => {
  if (!employerEmail || !employerName || !candidateName || !jobTitle) {
    throw new Error('All required parameters must be provided');
  }

  const safeEmployerName = sanitizeHtml(employerName);
  const safeCandidateName = sanitizeHtml(candidateName);
  const safeJobTitle = sanitizeHtml(jobTitle);
  const dashboardUrl = options.dashboardUrl || `${EMAIL_CONFIG.DASHBOARD_URL}/employer/applications`;
  
  const content = `
    <h2>New Job Application Received! 📬</h2>
    <p>Hi <strong>${safeEmployerName}</strong>,</p>
    <p>Great news! You've received a new application for your job posting.</p>
    
    <div class="highlight-box">
      <p><strong>Application Details:</strong></p>
      <ul style="margin: 10px 0;">
        <li><strong>Position:</strong> ${safeJobTitle}</li>
        <li><strong>Candidate:</strong> ${safeCandidateName}</li>
        <li><strong>Application ID:</strong> ${sanitizeHtml(applicationId)}</li>
        <li><strong>Received:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
    </div>
    
    <a href="${dashboardUrl}" class="cta-button">Review Application</a>
    
    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Review the candidate's resume and cover letter</li>
      <li>Update the application status to keep the candidate informed</li>
      <li>Schedule an interview if they seem like a good fit</li>
      <li>Respond promptly to maintain a positive candidate experience</li>
    </ul>
    
    <p>Remember: Quick responses and clear communication help attract the best talent to your company!</p>
    
    <p><strong>The ${EMAIL_CONFIG.BRAND_NAME} Team</strong></p>
  `;

  return sendEmail({
    to: employerEmail,
    subject: `📬 New Application: ${safeJobTitle} - ${safeCandidateName}`,
    html: generateEmailTemplate('New Application Received', '#4299e1', content)
  }, options);
};

// Export all functions and utilities
export {
  sendWelcomeEmail,
  sendApplicationConfirmation,
  sendStatusUpdateEmail,
  sendPasswordResetEmail,
  sendEmployerApplicationNotification,
  EMAIL_STATUS,
  EMAIL_CONFIG,
  isValidEmail,
  sanitizeHtml,
  logEmailActivity,
  isDomainVerified,
  getResendClient
};