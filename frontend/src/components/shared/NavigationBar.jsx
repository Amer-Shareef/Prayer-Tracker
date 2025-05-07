import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Only show navbar if user is logged in
  if (!user) return null;

  // Determine base path based on user role
  const basePath = user.role === 'Member' 
    ? '/member' 
    : user.role === 'Founder' 
      ? '/founder' 
      : '/superadmin';

  // Generate navigation links based on user role
  const getNavLinks = () => {
    switch (user.role) {
      case 'Member':
        return [
          { to: '/member/dashboard', label: 'Dashboard' },
          { to: '/member/prayers', label: 'My Prayers' },
          { to: '/member/mosque', label: 'My Mosque' },
          { to: '/member/stats', label: 'Statistics' },
          { to: '/member/profile', label: 'Profile' }
        ];
      case 'Founder':
        return [
          { to: '/founder/dashboard', label: 'Dashboard' },
          { to: '/founder/view-attendance', label: 'Attendance' },
          { to: '/founder/post-announcement', label: 'Announcements' },
          { to: '/founder/approve-pickup', label: 'Pickup Requests' }
        ];
      case 'SuperAdmin':
        return [
          { to: '/superadmin/dashboard', label: 'Dashboard' },
          { to: '/superadmin/view-mosques', label: 'Mosques' },
          { to: '/superadmin/assign-founder', label: 'Assign Founders' },
          { to: '/superadmin/promote-user', label: 'Manage Users' }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-green-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Nav Links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to={basePath} className="font-bold text-xl">Prayer Tracker</Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === link.to
                      ? 'bg-green-700 text-white'
                      : 'text-green-50 hover:bg-green-500'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* User dropdown and mobile menu button */}
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex items-center">
                <span className="mr-3 text-sm font-medium">{user.role}</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === link.to
                  ? 'bg-green-700 text-white'
                  : 'text-green-50 hover:bg-green-500'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="mt-2 w-full block px-3 py-2 rounded-md text-base font-medium bg-green-800 text-white hover:bg-green-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;