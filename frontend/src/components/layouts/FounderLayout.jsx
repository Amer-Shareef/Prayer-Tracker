import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FounderLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const menuItems = [
    { 
      path: '/founder/dashboard', 
      label: 'Dashboard', 
      bgColor: 'bg-green-700', // Darkest green
      hoverColor: 'hover:bg-green-600',
      textColor: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 130 125">
          <path d="M12.01 111.6a1.794 1.794 0 0 0 1.794 1.794h100.388a1.794 1.794 0 0 0 1.794-1.794V51.926a.852.852 0 0 0 0-.66V37.245a1.711 1.711 0 0 0 .067-.33 12.7 12.7 0 0 0-10.9-12.553V16.4a1.794 1.794 0 0 0-3.588 0v7.961a12.7 12.7 0 0 0-10.9 12.554 1.7 1.7 0 0 0 .067.33v20.582a30.3 30.3 0 0 0-24.9-15.919V34a1.794 1.794 0 0 0-3.588 0v7.91a30.294 30.294 0 0 0-24.973 16.055v-6.039a.852.852 0 0 0 0-.66V37.245a1.7 1.7 0 0 0 .067-.33 12.7 12.7 0 0 0-10.9-12.553V16.4a1.794 1.794 0 1 0-3.588 0v7.961a12.7 12.7 0 0 0-10.9 12.553 1.7 1.7 0 0 0 .063.313zm21.673-61.8H15.6V38.709h18.083zM15.6 53.389h18.083v56.416H15.6zm75.127 56.416H75.171V95.034a11.173 11.173 0 1 0-22.346 0v14.771H37.271V73.894h53.455zm-19.143 0h-15.17V95.034a7.585 7.585 0 1 1 15.169 0zm22.731-71.1H112.4V49.8H94.314zm9.044-10.9a9.12 9.12 0 0 1 8.926 7.313H94.429a9.123 9.123 0 0 1 8.929-7.31zm-9.045 25.584H112.4v56.416H94.314zm-30.282-7.984a26.708 26.708 0 0 1 26.6 24.9H37.428a26.708 26.708 0 0 1 26.604-24.9zm-39.389-17.6a9.12 9.12 0 0 1 8.926 7.313H15.716a9.12 9.12 0 0 1 8.926-7.31z"/>
        </svg>
      ) 
    },
    { 
      path: '/founder/reminder', 
      label: 'Daily Reminder', 
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-500',
      textColor: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ) 
    },
    { 
      path: '/founder/meetings', 
      label: 'Meetings & Counselling', 
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-400',
      textColor: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ) 
    },
    { 
      path: '/founder/wake-up-call', 
      label: 'Call Centre', 
      bgColor: 'bg-green-400',
      hoverColor: 'hover:bg-green-300',
      textColor: 'text-white',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 48 48">
          <path class="cls-1" d="M10 21H9a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h1a1 1 0 0 0 1-1V22a1 1 0 0 0-1-1zM7 31v-6a2 2 0 0 1 2-2v10a2 2 0 0 1-2-2z"/><path class="cls-2" d="M9 23v10a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"/><path class="cls-1" d="M12 19a3 3 0 0 0-2.82 2A2.77 2.77 0 0 0 9 22v12a2.77 2.77 0 0 0 .18 1A3 3 0 0 0 15 34V22a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-2 0V22a1 1 0 0 1 2 0z"/><path class="cls-3" d="M13 22v12a1 1 0 0 1-2 0V22a1 1 0 0 1 2 0z"/><path class="cls-1" d="M39 21h-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h1a4 4 0 0 0 4-4v-6a4 4 0 0 0-4-4zm2 10a2 2 0 0 1-2 2V23a2 2 0 0 1 2 2z"/><path class="cls-2" d="M41 25v6a2 2 0 0 1-2 2V23a2 2 0 0 1 2 2z"/><path class="cls-1" d="M38.82 21A3 3 0 0 0 33 22v12a3 3 0 0 0 5.82 1 2.77 2.77 0 0 0 .18-1V22a2.77 2.77 0 0 0-.18-1zM36 35a1 1 0 0 1-1-1V22a1 1 0 0 1 2 0v12a1 1 0 0 1-1 1z"/><path class="cls-3" d="M37 22v12a1 1 0 0 1-2 0V22a1 1 0 0 1 2 0z"/><path class="cls-1" d="M38 32a1 1 0 0 1-1-1V20a13 13 0 0 0-26 0v11a1 1 0 0 1-2 0V20a15 15 0 0 1 30 0v11a1 1 0 0 1-1 1zM30 43h-6a1 1 0 0 1 0-2h6a7 7 0 0 0 7-7 1 1 0 0 1 2 0 9 9 0 0 1-9 9z"/><path class="cls-1" d="M24 37a3 3 0 0 0 0 6h2a1 1 0 0 0 1-1v-2a3 3 0 0 0-3-3zm1 4h-1a1 1 0 1 1 1-1z"/><circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
      ) 
    },
    { 
      path: '/founder/transport', 
      label: 'Transport & Mobility', 
      bgColor: 'bg-green-300',
      hoverColor: 'hover:bg-green-200',
      textColor: 'text-gray-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H16V4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM10 4H14V5H10V4ZM6.5 16C5.67 16 5 15.33 5 14.5C5 13.67 5.67 13 6.5 13C7.33 13 8 13.67 8 14.5C8 15.33 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5C16 13.67 16.67 13 17.5 13C18.33 13 19 13.67 19 14.5C19 15.33 18.33 16 17.5 16ZM5 11L6.5 7H17.5L19 11H5Z"/>
        </svg>
      ) 
    },
    { 
      path: '/founder/knowledge-program', 
      label: 'Knowledge & Motivation', 
      bgColor: 'bg-green-200',
      hoverColor: 'hover:bg-green-100',
      textColor: 'text-gray-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) 
    },
    { 
      path: '/founder/manage-members', 
      label: 'Members', 
      bgColor: 'bg-green-100',
      hoverColor: 'hover:bg-green-50',
      textColor: 'text-gray-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ) 
    },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-20'} bg-gradient-to-b from-green-700 to-green-400 text-gray-800 transition-all duration-300 ease-in-out fixed h-screen z-10 overflow-y-auto shadow-2xl`}>
        <div className={`${sidebarOpen ? 'px-6 py-4' : 'px-3 py-4'} flex ${sidebarOpen ? 'justify-between' : 'justify-center'} items-center border-b border-green-800 bg-green-200`}>
          {sidebarOpen ? (
            <>
              <h1 className="text-xl font-bold text-grey tracking-wide"><img src="/images/Fajr_Council_Logo.png" alt="FAJR" className="h-12 w-12 object-contain"/></h1>
              <button 
                onClick={toggleSidebar}
                className="text-white hover:bg-green-600 hover:bg-opacity-50 p-2 rounded-lg transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </>
          ) : (
            <div className="flex justify-center w-full">
              <button 
                onClick={toggleSidebar}
                className="text-white hover:bg-green-600 hover:bg-opacity-50 p-2 rounded-lg transition-all duration-200"
              >
                {/* Fajr Council Logo */}
                <img src="/images/Fajr_Council_Logo.png" alt="FAJR" className="h-10 w-10 object-contain" />
              </button>
            </div>
          )}
        </div>
        
        <nav className="mt-6 px-4 space-y-2">
          {/* Founder Menu Items */}
          {menuItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center px-5 py-4 rounded-3xl transition-all duration-300 ${item.textColor} ${item.hoverColor} shadow-lg transform hover:scale-105 hover:shadow-xl
                ${location.pathname === item.path ? `${item.bgColor} shadow-2xl scale-105 ring-2 ring-white ring-opacity-50` : item.bgColor}
                backdrop-blur-sm
                ${!sidebarOpen ? 'justify-center w-12 h-12 p-0' : ''}
              `}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className={`inline-block transform transition-transform duration-200 hover:scale-110 ${!sidebarOpen ? 'flex items-center justify-center' : ''}`}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="ml-4 text-sm font-semibold tracking-wide">{item.label}</span>
              )}
            </Link>
          ))}
          
          {/* Logout Button */}
          <button
            onClick={logout}
            className={`w-full flex items-center px-4 py-4 mt-8 rounded-3xl transition-all duration-300 hover:bg-rose-200 text-rose-600 bg-rose-200 border-t-2 border-rose-300 shadow-lg transform hover:scale-105 hover:shadow-xl backdrop-blur-sm
              ${!sidebarOpen ? 'justify-center w-12 h-12 p-0' : ''}
            `}
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform transition-transform duration-200 hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span className="ml-4 text-sm font-semibold tracking-wide">Logout</span>}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-80' : 'ml-20'} transition-all duration-300 ease-in-out`}>
        {/* Page Content */}
        <main className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default FounderLayout;