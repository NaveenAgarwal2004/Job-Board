import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  MapPin, Clock, DollarSign, Building, Users, Calendar, 
  Bookmark, Share2, ChevronLeft, CheckCircle, AlertCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState('');

  const { data: jobData, isLoading, error } = useQuery(
    ['job', id],
    () => jobsAPI.getJob(id!),
    { enabled: !!id }
  );

  const { data: myApplicationsData } = useQuery(
    'myApplications',
    applicationsAPI.getMyApplications,
    { enabled: !!user && user.role === 'candidate' }
  );

  const applyMutation = useMutation(applicationsAPI.apply, {
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      queryClient.invalidateQueries('myApplications');
      setShowApplicationModal(false);
      setCoverLetter('');
      setResume('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    }
  });

  const job = jobData?.data?.job;
  const applications = myApplicationsData?.data?.applications || [];
  const hasApplied = applications.some((app: any) => app.job._id === id);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume.trim()) {
      toast.error('Resume is required');
      return;
    }

    applyMutation.mutate({
      jobId: id,
      coverLetter: coverLetter.trim(),
      resume: resume.trim()
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist.</p>
          <Link to="/jobs" className="text-blue-600 hover:text-blue-700">
            Browse other jobs
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = new Date() > new Date(job.applicationDeadline);
  const canApply = user?.role === 'candidate' && !hasApplied && !isExpired;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            to="/jobs"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Jobs
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              {/* Job Header */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
                    <div className="flex items-center space-x-4 text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-5 h-5" />
                        <span className="font-medium">{job.company?.name || 'Company Name'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5" />
                        <span>{job.location}</span>
                        {job.remote && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                            Remote
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{job.type}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{job.applicationsCount} applicants</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="p-2 text-gray-400 hover:text-blue-600 border border-gray-300 rounded-lg">
                      <Bookmark className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 border border-gray-300 rounded-lg">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Salary & Benefits */}
                {job.salary && job.salary.min && (
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-xl font-semibold text-green-600">
                      ${job.salary.min.toLocaleString()} - ${job.salary.max?.toLocaleString() || job.salary.min.toLocaleString()}
                    </span>
                    <span className="text-gray-600">per {job.salary.period}</span>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {job.category}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                    {job.experience}
                  </span>
                  {job.skills?.slice(0, 5).map((skill: string, index: number) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                <div className="prose max-w-none text-gray-700">
                  {job.description.split('\n').map((paragraph: string, index: number) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                <div className="prose max-w-none text-gray-700">
                  {job.requirements.split('\n').map((requirement: string, index: number) => (
                    <p key={index} className="mb-2 flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {requirement}
                    </p>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {job.benefits.map((benefit: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Info */}
              {job.company && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Company</h2>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                        <Building className="w-8 h-8 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.company.name}</h3>
                        {job.company.company?.industry && (
                          <p className="text-gray-600">{job.company.company.industry}</p>
                        )}
                      </div>
                    </div>
                    {job.company.company?.description && (
                      <p className="text-gray-700">{job.company.company.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              {/* Application Status */}
              {hasApplied && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Application Submitted</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    You have already applied for this position.
                  </p>
                </div>
              )}

              {/* Deadline Warning */}
              {isExpired && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Application Closed</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    The deadline for this job has passed.
                  </p>
                </div>
              )}

              {/* Apply Button */}
              {canApply ? (
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-6"
                >
                  Apply Now
                </button>
              ) : user?.role === 'employer' ? (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    You are viewing this as an employer.
                  </p>
                </div>
              ) : !user ? (
                <div className="mb-6">
                  <Link
                    to="/login"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center block"
                  >
                    Sign in to Apply
                  </Link>
                </div>
              ) : null}

              {/* Job Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Job Details</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Type:</span>
                    <span className="font-medium">{job.type}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium">{job.experience}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{job.category}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium">
                      {format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Applications:</span>
                    <span className="font-medium">{job.applicationsCount}</span>
                  </div>
                </div>
              </div>

              {/* Skills Required */}
              {job.skills && job.skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Apply for {job.title}</h2>
            </div>
            
            <form onSubmit={handleApply} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us why you're interested in this position..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {coverLetter.length}/2000 characters
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume/CV *
                </label>
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  rows={8}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste your resume content here or provide a link to your resume..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can paste your resume text or provide a link to your resume/portfolio
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowApplicationModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyMutation.isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {applyMutation.isLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;