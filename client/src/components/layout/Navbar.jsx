import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineUserCircle, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { useState } from 'react';
import logo from '../../assets/App-logo.png';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide navbar on login/signup pages
  const hideNavbarOn = ['/auth/login', '/auth/signup'];
  if (hideNavbarOn.includes(location.pathname)) return null;

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  // ✅ V1.2 — Updated links with Campaigns & Quizzes
  const navLinks = [
    { path: '/leaderboard', label: 'Leaderboard', roles: ['Citizen', 'Authority', 'Admin'] },
    { path: '/campaigns', label: 'Campaigns', roles: ['Citizen', 'Authority', 'Admin'] },
    { path: '/quizzes', label: 'Quizzes', roles: ['Citizen', 'Authority', 'Admin'] },
    { path: '/report', label: 'Report Issue', roles: ['Citizen'] },
    { path: '/admin', label: 'Authority Panel', roles: ['Authority', 'Admin'] },
    { path: '/profile', label: 'Profile', roles: ['Citizen', 'Authority', 'Admin'] },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-lg bg-gray-900/90 border-b border-white/10 shadow-md">
      <div className="flex justify-between items-center w-full px-2 sm:px-4 lg:px-6 py-3">
        
        {/* Logo + App Name */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <HiOutlineUserCircle className="text-indigo-600 text-3xl" />
            )}
          </div>
          <span className="text-white font-extrabold text-3xl sm:text-4xl cursor-pointer drop-shadow-lg">
            reACT
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {navLinks.map(({ path, label, roles }) => {
                if (!roles.includes(user.role)) return null;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform ${
                      location.pathname === path
                        ? 'bg-teal-500 text-white shadow-md scale-105 text-lg sm:text-xl'
                        : 'text-gray-200 hover:bg-gray-800 hover:text-teal-400 hover:scale-105 text-lg sm:text-xl'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md transition-transform duration-200 transform hover:scale-105 text-lg sm:text-xl"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth/login"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-md transition-transform duration-200 transform hover:scale-105 text-lg sm:text-xl"
            >
              Login / Register
            </Link>
          )}
        </div>

        {/* Hamburger Icon */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white text-3xl focus:outline-none">
            {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-800/90 backdrop-blur-lg w-full px-4 py-4 space-y-2 border-t border-gray-700">
          {isAuthenticated ? (
            <>
              {navLinks.map(({ path, label, roles }) => {
                if (!roles.includes(user.role)) return null;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform ${
                      location.pathname === path
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'text-gray-200 hover:bg-gray-700 hover:text-teal-400'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="w-full text-left px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-semibold"
            >
              Login / Register
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
