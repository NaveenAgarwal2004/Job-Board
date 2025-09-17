import { useAuth } from '../contexts/AuthContext';
import CandidateDashboard from '../components/CandidateDashboard';
import EmployerDashboard from '../components/EmployerDashboard';
import AdminDashboard from '../components/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.role === 'candidate' && <CandidateDashboard />}
      {user.role === 'employer' && <EmployerDashboard />}
      {user.role === 'admin' && <AdminDashboard />}
    </div>
  );
};

export default Dashboard;