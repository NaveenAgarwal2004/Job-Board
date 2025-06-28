import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  FileText, Clock, CheckCircle, XCircle, User, Building, 
  MapPin, Calendar, Filter, Search, Eye 
} from 'lucide-react';
import { applicationsAPI, jobsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const Applications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Candidate applications
  const { data: candidateApplicationsData, isLoading: candidateLoading } = useQuery(
    'myApplications',
    applicationsAPI.getMyApplications,
    { enabled: user?.role === 'candidate' }
  );

  // Employer jobs for applications
  const { data: employerJobsData } = useQuery(
    'employerJobs',
    () => jobsAPI.getJobs({ company: user?._id }),
    { enabled: user?.role === 'employer' }
  );

  // Get applications for specific job (when employer selects a job)
  const [selectedJobId, setSelectedJobId] = useState('');
  const { data: jobApplicationsData, isLoading: jobApplicationsLoading } = useQuery(
    ['jobApplications', selectedJobId],
    () => applicationsAPI.getJobApplications(selectedJobId),
    { enabled: !!selectedJobId && user?.role === 'employer' }
  );

  const updateStatusMutation = useMutation(applicationsAPI.updateStatus, {
    onSuccess: () => {
      toast.success('Application status updated successfully!');
      queryClient.invalidateQueries(['jobApplications', selectedJobId]);
      setShowApplicationModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const applications = user?.role === 'candidate' 
    ? candidateApplicationsData?.data?.applications || []
    : jobApplicationsData?.data?.applications || [];

  const employerJobs = employerJobsData?.data?.jobs || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewing': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'shortlisted': return <User className="w-4 h-4 text-purple-500" />;
      case 'interview': return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'hired': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'interview': return 'bg-indigo-100 text-indigo-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (applicationId: string, status: string, notes?: string) => {
    updateStatusMutation.mutate({
      id: applicationId,
      status,
      notes
    });
  };

  const filteredApplications = applications.filter((app: any) => {
    const matchesStatus = !selectedStatus || app.status === selectedStatus;
    const matchesSearch = !searchTerm || 
      (user?.role === 'candidate' 
        ? app.job?.title.toLowerCase().includes(searchTerm.toLowerCase())
        : app.candidate?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (user?.role === 'candidate' && candidateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'candidate' ? 'My Applications' : 'Manage Applications'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'candidate' 
              ? 'Track the status of your job applications'
              : 'Review and manage applications for your job postings'
            }
          </p>
        </div>

        {/* Employer Job Selection */}
        {user?.role === 'employer' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Job to View Applications</h2>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a job...</option>
              {employerJobs.map((job: any) => (
                <option key={job._id} value={job._id}>
                  {job.title} ({job.applicationsCount} applications)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={user?.role === 'candidate' ? 'Search jobs...' : 'Search candidates...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {user?.role === 'employer' && !selectedJobId
                  ? 'Select a job to view applications'
                  : 'No applications found'
                }
              </h3>
              <p className="text-gray-500">
                {user?.role === 'candidate' 
                  ? "You haven't applied for any jobs yet"
                  : "No applications match your current filters"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filteredApplications.length} Application{filteredApplications.length !== 1 ? 's' : ''}
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredApplications.map((application: any) => (
                  <div key={application._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user?.role === 'candidate' ? application.job?.title : application.candidate?.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(application.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                          {user?.role === 'candidate' ? (
                            <>
                              <div className="flex items-center space-x-1">
                                <Building className="w-4 h-4" />
                                <span>{application.job?.company?.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{application.job?.location}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{application.candidate?.email}</span>
                              </div>
                              {application.candidate?.profile?.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{application.candidate.profile.location}</span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Applied {format(new Date(application.appliedAt), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>

                        {application.coverLetter && (
                          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                            {application.coverLetter}
                          </p>
                        )}

                        {application.notes && user?.role === 'employer' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-yellow-800">
                              <strong>Notes:</strong> {application.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowApplicationModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Details
                        </button>

                        {user?.role === 'employer' && application.status !== 'hired' && application.status !== 'rejected' && (
                          <div className="flex flex-col space-y-1">
                            {application.status === 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(application._id, 'reviewing')}
                                className="text-blue-600 hover:text-blue-700 text-xs"
                              >
                                Mark as Reviewing
                              </button>
                            )}
                            {(application.status === 'reviewing' || application.status === 'pending') && (
                              <button
                                onClick={() => handleStatusUpdate(application._id, 'shortlisted')}
                                className="text-purple-600 hover:text-purple-700 text-xs"
                              >
                                Shortlist
                              </button>
                            )}
                            {(application.status === 'shortlisted' || application.status === 'reviewing') && (
                              <button
                                onClick={() => handleStatusUpdate(application._id, 'interview')}
                                className="text-indigo-600 hover:text-indigo-700 text-xs"
                              >
                                Schedule Interview
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusUpdate(application._id, 'rejected')}
                              className="text-red-600 hover:text-red-700 text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Application Details
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {user?.role === 'candidate' ? 'Job Information' : 'Candidate Information'}
                  </h3>
                  
                  {user?.role === 'candidate' ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Job Title:</span>
                        <p className="text-gray-900">{selectedApplication.job?.title}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Company:</span>
                        <p className="text-gray-900">{selectedApplication.job?.company?.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Location:</span>
                        <p className="text-gray-900">{selectedApplication.job?.location}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Type:</span>
                        <p className="text-gray-900">{selectedApplication.job?.type}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Name:</span>
                        <p className="text-gray-900">{selectedApplication.candidate?.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <p className="text-gray-900">{selectedApplication.candidate?.email}</p>
                      </div>
                      {selectedApplication.candidate?.profile?.phone && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Phone:</span>
                          <p className="text-gray-900">{selectedApplication.candidate.profile.phone}</p>
                        </div>
                      )}
                      {selectedApplication.candidate?.profile?.location && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Location:</span>
                          <p className="text-gray-900">{selectedApplication.candidate.profile.location}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6">
                    <span className="text-sm font-medium text-gray-600">Application Status:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(selectedApplication.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                        {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-600">Applied On:</span>
                    <p className="text-gray-900">{format(new Date(selectedApplication.appliedAt), 'MMMM dd, yyyy at h:mm a')}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  {selectedApplication.coverLetter && (
                    <div className="mb-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-2">Cover Letter</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Resume/CV</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.resume}</p>
                    </div>
                  </div>

                  {user?.role === 'employer' && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-2">Update Status</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleStatusUpdate(selectedApplication._id, 'reviewing')}
                          className="block w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                        >
                          Mark as Reviewing
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedApplication._id, 'shortlisted')}
                          className="block w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                        >
                          Shortlist Candidate
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedApplication._id, 'interview')}
                          className="block w-full text-left px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100"
                        >
                          Schedule Interview
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedApplication._id, 'hired')}
                          className="block w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
                        >
                          Hire Candidate
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedApplication._id, 'rejected')}
                          className="block w-full text-left px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                        >
                          Reject Application
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowApplicationModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;