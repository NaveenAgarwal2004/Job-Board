import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Filter, Clock, DollarSign, Building, ChevronLeft, ChevronRight, AlertCircle, Database } from 'lucide-react';
import { jobsAPI } from '../services/api';
import { format } from 'date-fns';

interface Job {
  _id: string;
  title: string;
  featured?: boolean;
  company?: {
    name: string;
  };
  location: string;
  remote: boolean;
  type: string;
  createdAt: string;
  salary?: {
    min: number;
    max?: number;
  };
  description: string;
  category: string;
  experience: string;
  skills?: string[];
  applicationsCount: number;
}

interface Pagination {
  total: number;
  pages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface JobsResponse {
  jobs: Job[];
  pagination: Pagination;
  mockMode?: boolean;
}

const Jobs = () => {
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    category: '',
    type: '',
    remote: false,
    page: 1
  });

  const { data, isLoading, error } = useQuery<JobsResponse>({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const response = await jobsAPI.getJobs(filters);
      return response.data;
    },
    retry: (failureCount: number, error: any) => {
      if (error?.response?.status === 503) {
        return false;
      }
      return failureCount < 3;
    }
  });

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing',
    'Sales', 'Customer Service', 'Operations', 'HR', 'Design', 'Engineering'
  ];

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];

  const isMockMode = data?.mockMode || false;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600">Failed to load jobs. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isMockMode && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  <strong>Demo Mode:</strong> Showing sample jobs. Database connection not available.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Jobs</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center space-x-2 mb-6">
                <Filter className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Job Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {jobTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={filters.remote}
                    onChange={(e) => handleFilterChange('remote', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Remote Work</span>
                </label>
              </div>
              <button
                onClick={() => setFilters({
                  search: '',
                  location: '',
                  category: '',
                  type: '',
                  remote: false,
                  page: 1
                })}
                className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    {data?.pagination?.total || data?.jobs?.length || 0} jobs found
                    {isMockMode && <span className="text-yellow-600 ml-2">(Sample Data)</span>}
                  </p>
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Sort by: Most Recent</option>
                    <option>Sort by: Salary High to Low</option>
                    <option>Sort by: Salary Low to High</option>
                  </select>
                </div>
                <div className="space-y-6">
                  {(data?.jobs || []).map((job: Job) => (
                    <div key={job._id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                              <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                            </h3>
                            {job.featured && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                Featured
                              </span>
                            )}
                            {isMockMode && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                Demo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <Building className="w-4 h-4" />
                              <span>{job.company?.name || 'Company Name'}</span>
                            </div>
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
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">
                            {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                          </div>
                          {job.salary && job.salary.min && (
                            <div className="flex items-center text-green-600 font-semibold">
                              <DollarSign className="w-4 h-4" />
                              <span>
                                ${job.salary.min.toLocaleString()} - ${job.salary.max?.toLocaleString() || job.salary.min.toLocaleString()}
                              </span>
                            </div>
                          )}
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
                          {job.applicationsCount} applications
                        </div>
                        <Link
                          to={`/jobs/${job._id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {data?.pagination && data.pagination.pages > 1 && (
                  <div className="flex justify-center items-center space-x-4 mt-8">
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={!data.pagination.hasPrev}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      {[...Array(Math.min(5, data.pagination.pages))].map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-lg ${
                              page === filters.page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={!data.pagination.hasNext}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Jobs;