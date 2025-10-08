import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuperAdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const { user, logout } = useAuth();
  const [hijriDate, setHijriDate] = useState('Loading...');

  // Fetch Hijri date
  useEffect(() => {
    const today = new Date();
    try {
      const hijri = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(today);
      setHijriDate(hijri);
    } catch (error) {
      setHijriDate("Date not available");
    }
  }, []);

  // Handle click outside sidebar to minimize it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only minimize if sidebar is open and click is outside sidebar
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);
  
  const menuItems = [
    { 
      path: '/superadmin/dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ) 
    },
    { 
      path: '/superadmin/view-areas', 
      label: 'Manage Areas', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) 
    },
    { 
      path: '/superadmin/assign-founder', 
      label: 'Create Founder', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ) 
    },
    { 
      path: '/superadmin/promote-user', 
      label: 'Promote User', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ) 
    },
    { 
      path: '/superadmin/profile', 
      label: 'Profile', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ) 
    }
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gradient-to-b from-purple-700 to-purple-800 text-white transition-all duration-300 ease-in-out fixed h-screen z-10 overflow-y-auto shadow-xl`}
      >
        <div className={`${sidebarOpen ? 'px-4 py-3' : 'px-2 py-3'} flex ${sidebarOpen ? 'justify-between' : 'justify-center'} items-center border-b border-purple-600`}>
          {sidebarOpen ? (
            <>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold transition-opacity duration-300">Super Admin</h1>
                <p className="text-xs text-purple-300 mt-0.5">{hijriDate}</p>
              </div>
              <button 
                onClick={toggleSidebar}
                className="text-white hover:bg-purple-600 rounded-lg p-1.5 transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </>
          ) : (
            <button 
              onClick={toggleSidebar}
              className="text-white hover:bg-purple-600 rounded-lg p-1.5 transition-colors duration-200"
              title="Expand menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
        {sidebarOpen && (
          <div className="px-4 py-2 text-xs text-purple-300 font-medium uppercase tracking-wider transition-opacity duration-300">
            Admin Panel
          </div>
        )}
        
        <nav className={`${sidebarOpen ? 'px-2 py-3' : 'px-1 py-3'} space-y-1.5`}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center ${sidebarOpen ? 'px-3 py-3 rounded-2xl' : 'w-12 h-12 rounded-full justify-center'} transition-all duration-200 group
                ${location.pathname === item.path 
                  ? 'bg-purple-800 shadow-lg' 
                  : 'hover:bg-purple-600 hover:bg-opacity-50'
                }
              `}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className={`inline-block flex-shrink-0 ${location.pathname === item.path ? 'text-white' : 'text-purple-200 group-hover:text-white'} transition-colors duration-200`}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="ml-3 text-sm font-medium transition-opacity duration-300 opacity-100 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          ))}
          
          {/* Logout Button */}
          <button
            onClick={logout}
            className={`
              flex items-center ${sidebarOpen ? 'w-full px-3 py-3 rounded-2xl' : 'w-12 h-12 rounded-full justify-center mx-auto'} transition-all duration-200 
              hover:bg-red-500 hover:bg-opacity-20 border-t border-purple-600 ${sidebarOpen ? 'mt-4 pt-3' : 'mt-3 pt-3'} group
            `}
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-red-300 group-hover:text-red-200 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && (
              <span className="ml-3 text-sm font-medium transition-opacity duration-300 opacity-100 whitespace-nowrap">
                Logout
              </span>
            )}
          </button>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
