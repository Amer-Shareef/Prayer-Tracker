import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import { useAuth } from "../../context/AuthContext";

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  
  // Statistics state
  const [stats, setStats] = useState({
    totalMosques: 42,
    totalUsers: 1250,
    activeUsers: 876,
    pendingApprovals: 8
  });
  
  // Recent activities
  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      action: "New mosque registered",
      mosque: "Zainab Mosque",
      date: "2 hours ago"
    },
    {
      id: 2,
      action: "Founder assigned",
      mosque: "Rathmala Jummah Mosque",
      user: "Ahmed Saleh",
      date: "5 hours ago"
    },
    {
      id: 3,
      action: "User promoted to founder",
      user: "Hasan Ali",
      mosque: "Dehiwala Junction Masjid",
      date: "Yesterday"
    },
    {
      id: 4,
      action: "New user registered",
      user: "Omar Farooq",
      date: "2 days ago"
    }
  ]);

  return (
    <SuperAdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-purple-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold">{stats.totalMosques}</h3>
            <p className="text-gray-500">Total Mosques</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-purple-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            <p className="text-gray-500">Total Users</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-purple-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold">{stats.activeUsers}</h3>
            <p className="text-gray-500">Active Users</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-purple-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold">{stats.pendingApprovals}</h3>
            <p className="text-gray-500">Pending Approvals</p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/superadmin/view-mosques" 
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="mt-2 text-sm font-medium">View Mosques</span>
            </Link>
            
            <Link 
              to="/superadmin/assign-founder" 
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="mt-2 text-sm font-medium">Assign Founder</span>
            </Link>
            
            <Link 
              to="/superadmin/promote-user" 
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="mt-2 text-sm font-medium">Promote User</span>
            </Link>
            
            <Link 
              to="/superadmin/profile" 
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="mt-2 text-sm font-medium">My Profile</span>
            </Link>
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
          
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          ) : (
            <div className="divide-y">
              {recentActivities.map(activity => (
                <div key={activity.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-500">
                      {activity.mosque && <span className="text-purple-600">{activity.mosque}</span>}
                      {activity.mosque && activity.user && <span> | </span>}
                      {activity.user && <span>{activity.user}</span>}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;