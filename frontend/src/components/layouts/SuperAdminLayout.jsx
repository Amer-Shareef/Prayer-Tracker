import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuperAdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();
  
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
      path: '/superadmin/view-mosques', 
      label: 'View Mosques', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ) 
    },
    { 
      path: '/superadmin/assign-founder', 
      label: 'Assign Founder', 
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
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-purple-700 text-white transition-width duration-300 ease-in-out fixed h-screen z-10 overflow-y-auto`}>
        <div className="p-4 flex justify-between items-center">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold">Prayer Tracker</h1>
          ) : (
            <h1 className="text-xl font-bold">PT</h1>
          )}
          <button 
            onClick={toggleSidebar}
            className="text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div className="p-4 text-sm text-purple-200">
          {sidebarOpen ? 'Super Admin' : 'SA'}
        </div>
        
        <nav className="mt-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center px-4 py-3 mb-1 transition-colors hover:bg-purple-800
                ${location.pathname === item.path ? 'bg-purple-800' : ''}
              `}
            >
              <span className="inline-block">{item.icon}</span>
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
          
          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 mb-1 transition-colors hover:bg-purple-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-margin duration-300 ease-in-out`}>
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
