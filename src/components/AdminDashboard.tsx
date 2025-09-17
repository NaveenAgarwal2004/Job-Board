import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, FileText, Building, TrendingUp, UserCheck, Calendar } from 'lucide-react';
import { adminAPI } from '../services/api';
import { format } from 'date-fns';

const AdminDashboard = () => {
    const { data: adminData } = useQuery({
      queryKey: ['adminStats'],
      queryFn: adminAPI.getStats
    });

    const stats = adminData?.data?.stats || {};
    const recentUsers = adminData?.data?.recentUsers || [];
    const recentJobs = adminData?.data?.recentJobs || [];

    const dashboardStats = [
        {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Jobs',
      value: stats.totalJobs || 0,
      icon: Briefcase,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications || 0,
      icon: FileText,
      color: 'bg-purple-500',
      change: '+23%'
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+5%'
    }
  ];

  const userStats = [
    {
      title: 'Candidates',
      value: stats.totalCandidates || 0,
      icon: UserCheck,
      color: 'bg-indigo-500'
    },
    {
      title: 'Employers',
      value: stats.totalEmployers || 0,
      icon: Building,
      color: 'bg-pink-500'
    }
]


return(
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* welcome to the admin dashboard */}
        <div className='mb-8'>
            <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
            <p className='text-gray-600 mt-2'>Welcome to the admin dashboard. Here you can manage users, jobs, and view statistics.</p>
        </div>

        {/* Stats Section */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            {dashboardStats.map((stat, index)=>(
                <div key={index} className='bg-white p-6 rounded-xl shadow-sm border'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-gray-600'>{stat.title}</p>
                            <p className='text-3xl font-bold text-gray-900 mt-1'>{stat.value}</p>
                            <div className='flex items-center mt-2'>
                                <span className='text-green-600 text-sm font-medium'>{stat.change}</span>
                                <span className='text-gray-500 text-sm ml-2'> Vs Last Month</span>
                            </div>
                        </div>
                        <div className={`${stat.color} p-3 rounded-lg`}>
                            <stat.icon className='h-8 w-8 text-white' />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* User Stats Section */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8'>
            {userStats.map((stat , index)=>(
                <div key={index} className='bg-white p-6 rounded-xl shadow-sm border'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm font-medium text-gray-600'>{stat.title}</p>
                            <p className='text-3xl font-bold text-gray-900 mt-1'>{stat.value}</p>
                        </div>
                        <div className={`${stat.color} p-3 rounded-lg`}>
                            <stat.icon className='h-8 w-8 text-white' />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Recent Users */}
            <div className='bg-white rounded-xl shadow border'>
                <div className='p-6 border-b border-gray-200'>
                    <h2 className='text-xl font-semibold text-gray-900'> Recent Users</h2>
                </div>
                <div className='p-6'>
                    {recentUsers.length === 0 ? (
                        <div className='text-center py-8'>
                            <Users className='w-12 h-12 text-gray-400 mx-auto mb-4'/>
                            <p className='text-gray-500'>No recent users</p>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {recentUsers.map((user: any) => (
                                <div key={user._id} className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                                    <div className='flex items-center space-x-3'>
                                        <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center'>
                                            <Users className='w-6 h-6 text-gray-600' />
                                        </div>
                                        <div>
                                            <h3 className='font-medium text-gray-900'>{user.name}</h3>
                                            <p className='text-sm text-gray-600'>{user.email}</p>
                                            <p className='text-xs text-gray-500'>
                                                Joined on {format(new Date(user.createdAt), 'MMMM dd, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'candidate' ? 'bg-blue-100 text-blue-800'
                                        : user.role === 'employer' ? 'bg-green-100 text-green-800'
                                        : 'bg-purple-100 text-purple-800'
                                    }`}>
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* recent Jobs */}
            <div className='bg-white rounded-xl shadow-sm border'>
                <div className='p-6 border-b border-gray-200'>
                    <h2 className='text-xl font-semibold text-gray-900'>Recent Jobs</h2>
                </div>
                <div className='p-6'>
                    {recentJobs.length === 0 ? (
                        <div className='text-center py-8'>
                            <Briefcase className='w-12 h-12 text-gray-400 mx-auto mb-4'/>
                            <p className='text-gray-500'> No recent jobs</p>
                        </div>
                    ):(
                        <div className='space-y-4'>
                            {recentJobs.map((job: any)=>(
                                <div key={job._id} className='p-4 bg-gray-50 rounded-lg'>
                                    <div className='flex justify-between items-start'>
                                        <div className='flex-1'>
                                            <h3 className='font-medium text-gray-900'>{job.title}</h3>
                                            <div className='flex items-center space-x-2 mt-1'>
                                                <Building className='w-4 h-4 text-gray-600'/>
                                                <span className='text-sm text-gray-600'>{job.company?.name}</span>
                                            </div>
                                            <div className='flex items-center space-x-4 mt-2'>
                                                <span className='bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded'>{job.category}</span>
                                                <div className='flex items-center space-x-1'>
                                                    <Calendar className='w-4 h-4 text-gray-600'/>
                                                    <span className='text-xs text-gray-500'>
                                                        {format(new Date(job.createdAt), 'MMMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Management Actions */}
        <div className='mt-8 bg-white rounded-xl shadow-sm border '>
            <div className='p-6 border-b border-gray-200'>
                <h2 className='text-xl font-semibold text-gray-900'> Quick Actions</h2>
            </div>
            <div className='p-6'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <button className='bg-blue-50 text-blue-700 p-4 rounded-lg hover:bg-blue-100 transition-colors text-left'>
                        <Briefcase className='w-6 h-6 mb-2' />
                        <h3 className='font-medium'>Manage Jobs</h3>
                        <p className='text-sm text-green-600'>View and manage job listings</p>
                    </button>
                    <button className='bg-orange-50 text-orange-700 p-4 rounded-lg hover:bg-orange-100 transition-colors text-left'>
                        <TrendingUp className='w-6 h-6 mb-2' />
                        <h3 className='font-medium'>View Analytics</h3>
                        <p className='text-sm text-orange-600'>Check site performance and trends</p>
                    </button>
                </div>
            </div>
        </div>
    </div>
)
};

export default AdminDashboard;