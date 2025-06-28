import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Plus, Briefcase, Users, Eye, Calendar, MapPin, Clock, FileText } from 'lucide-react';
import { jobsAPI, applicationsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const EmployerDashboard = () => {
  const { user } = useAuth();
  
  const { data: employerStats } = useQuery('employerStats', usersAPI.getEmployerStats);
  const { data: jobsData } = useQuery('employerJobs', () => jobsAPI.getJobs({ company: user?._id }));

  const stats = employerStats?.data?.stats || {};
  const jobs = jobsData?.data?.jobs || [];

  const dashboardStats = [
    {
      title: 'Total Jobs Posted',
      value: stats.totalJobs || 0,
      icon: Briefcase,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs || 0,
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications || 0,
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      title: 'Inactive Jobs',
      value: stats.inactiveJobs || 0,
      icon: Clock,
      color: 'bg-gray-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your job postings and applications</p>
          </div>
          <Link
            to="/post-job"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Post New Job</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          to="/post-job"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <Plus className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Post a Job</h3>
          <p className="text-blue-100 text-sm">Create new job listing</p>
        </Link>

        <Link
          to="/applications"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <Users className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Manage Applications</h3>
          <p className="text-green-100 text-sm">Review candidates</p>
        </Link>

        <Link
          to="/profile"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <Briefcase className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Company Profile</h3>
          <p className="text-purple-100 text-sm">Update company info</p>
        </Link>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
          <Eye className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Analytics</h3>
          <p className="text-orange-100 text-sm">View job performance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
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

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Your Job Postings</h2>
            <Link to="/post-job" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Post New Job
            </Link>
          </div>
        </div>
        <div className="p-6">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
              <p className="text-gray-500 mb-6">Start by posting your first job to attract candidates</p>
              <Link
                to="/post-job"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Post Your First Job</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {jobs.map((job: any) => (
                <div key={job._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                          <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {job.featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                          {job.remote && (
                            <span className="text-green-600 font-medium">(Remote)</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{job.applicationsCount}</p>
                          <p className="text-gray-500">Applications</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{job.views}</p>
                          <p className="text-gray-500">Views</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {job.description.substring(0, 200)}...
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {job.category}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {job.experience}
                    </span>
                    {job.skills?.slice(0, 3).map((skill: string, index: number) => (
                      <span key={index} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Deadline: {format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex space-x-3">
                      <Link
                        to={`/applications?job=${job._id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Applications ({job.applicationsCount})
                      </Link>
                      <Link
                        to={`/jobs/${job._id}/edit`}
                        className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;