import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, FileText, User, Search, TrendingUp, Clock, MapPin, Building } from 'lucide-react';
import { applicationsAPI, jobsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const CandidateDashboard = () => {
  const { user } = useAuth();
  
  const { data: applicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: applicationsAPI.getMyApplications
  });
  const { data: jobsData } = useQuery({
    queryKey: ['recentJobs'],
    queryFn: () => jobsAPI.getJobs({ limit: 6 })
  });

  const applications = applicationsData?.data?.applications || [];
  const recentJobs = jobsData?.data?.jobs || [];

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

  const stats = [
    {
      title: 'Applications Submitted',
      value: applications.length,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'In Review',
      value: applications.filter((app: any) => ['reviewing', 'shortlisted', 'interview'].includes(app.status)).length,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Interviews',
      value: applications.filter((app: any) => app.status === 'interview').length,
      icon: User,
      color: 'bg-purple-500'
    },
    {
      title: 'Job Offers',
      value: applications.filter((app: any) => app.status === 'hired').length,
      icon: TrendingUp,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-2">Track your job applications and discover new opportunities</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          to="/jobs"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <Search className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Browse Jobs</h3>
          <p className="text-blue-100 text-sm">Find your next opportunity</p>
        </Link>

        <Link
          to="/profile"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <User className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Update Profile</h3>
          <p className="text-green-100 text-sm">Keep your profile current</p>
        </Link>

        <Link
          to="/applications"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <FileText className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">My Applications</h3>
          <p className="text-purple-100 text-sm">Track application status</p>
        </Link>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
          <Briefcase className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Job Alerts</h3>
          <p className="text-orange-100 text-sm">Set up job notifications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
              <Link to="/applications" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No applications yet</p>
                <Link
                  to="/jobs"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((application: any) => (
                  <div key={application._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{application.job?.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{application.job?.company?.name}</span>
                        <MapPin className="w-4 h-4 text-gray-400 ml-2" />
                        <span className="text-sm text-gray-600">{application.job?.location}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied on {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recommended Jobs</h2>
              <Link to="/jobs" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentJobs.slice(0, 5).map((job: any) => (
                <div key={job._id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 hover:text-blue-600">
                        <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{job.company?.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{job.location}</span>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {format(new Date(job.createdAt), 'MMM dd')}
                      </p>
                      {job.salary && job.salary.min && (
                        <p className="text-sm font-medium text-green-600">
                          ${job.salary.min.toLocaleString()}+
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
