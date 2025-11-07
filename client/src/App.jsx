import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import ReportIssue from './pages/ReportIssue';
import IssueDetail from './pages/IssueDetail';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import AllReports from './pages/AllReports';
import Onboarding from './pages/Onboarding';
import Campaigns from './pages/Campaigns'; // V1.2 Import
import Quizzes from './pages/Quizzes';

// Private Route Component
const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
};

function App() {
  const { isAuthenticated } = useAuth();

  const initialPath = () => {
    const onboarded = localStorage.getItem('onboarding_complete') === 'true';
    if (isAuthenticated) return '/dashboard';
    if (onboarded) return '/auth/login';
    return '/welcome';
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-900 text-white overflow-x-hidden">
  <Navbar />
  <main className="flex-grow w-full">
    <div className="w-full max-w-full px-2 sm:px-4 lg:px-6 overflow-x-hidden">
        <Routes>
          {/* Root path redirects based on onboarding/auth */}
          <Route path="/" element={<Navigate to={initialPath()} replace />} />

          {/* Onboarding */}
          <Route path="/welcome" element={<Onboarding />} />

          {/* Auth & Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/:type" element={<AuthPage />} />

          {/* V1.2 Public/Citizen Routes */}
          <Route path="/campaigns" element={<Campaigns />} />
          <Route 
            path="/quizzes" 
            element={
              <PrivateRoute>
                <Quizzes />
              </PrivateRoute>
            } 
          />

          {/* Public */}
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/reports" element={<AllReports />} />

          {/* Private */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/report"
            element={
              <PrivateRoute roles={['Citizen']}>
                <ReportIssue />
              </PrivateRoute>
            }
          />
          <Route path="/issues/:id" element={<IssueDetail />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={['Authority', 'Admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<h1 className="text-center mt-20 text-3xl text-red-400">404 Not Found</h1>} />
        </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
