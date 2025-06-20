import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FounderLayout from "../layouts/FounderLayout";

const FounderDashboard = () => {
  const { user } = useAuth();
  
  // Mosque information state
  const [mosque, setMosque] = useState({
    name: "Masjid Al-Taqwa",
    address: "123 Faith Avenue, Cityville, CA 90210",
    prayerTimes: {
      fajr: '5:03 AM',
      dhuhr: '12:15 PM',
      asr: '3:45 PM',
      maghrib: '6:23 PM',
      isha: '7:43 PM',
      jumuah: '1:30 PM'
    }
  });
  
  // Attendance stats
  const [attendanceStats, setAttendanceStats] = useState({
    today: {
      total: 142,
      percentage: 75,
      prayerBreakdown: {
        fajr: { count: 32, percentage: 65 },
        dhuhr: { count: 28, percentage: 57 },
        asr: { count: 26, percentage: 53 },
        maghrib: { count: 36, percentage: 73 },
        isha: { count: 20, percentage: 41 }
      }
    },
    weekly: {
      total: 934,
      percentage: 68,
      trend: 'up'
    },
    monthly: {
      total: 3850,
      percentage: 71,
      trend: 'up'
    }
  });
  
  // Announcements
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "Ramadan Preparation Workshop",
      date: "2025-05-12",
      content: "Join us for a special workshop to prepare for the upcoming Ramadan."
    },
    {
      id: 2,
      title: "Community Iftar Planning",
      date: "2025-05-15",
      content: "We are organizing community iftars for the coming Ramadan."
    }
  ]);
  
  // Member engagement stats
  const [memberStats, setMemberStats] = useState({
    total: 250,
    active: 186,
    new: 12,
    engaged: 145,
    prayerCompletion: 72
  });
  
  const [currentDate, setCurrentDate] = useState({
    gregorian: 'Thursday, May 8, 2025',
    hijri: '15 Shawwal 1447'
  });
  
  useEffect(() => {
    // In a real app, fetch this data from your API
    // For now, we'll use the static data defined above
  }, []);
  
  // Handler for deleting announcements
  const handleDeleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
    
    // In a real app, send a delete request to the API
    console.log(`Announcement ${id} deleted`);
  };

  return (
    <FounderLayout>
      <div className="p-4 sm:p-6 md:p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Working Committee Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            {mosque.name} • {currentDate.gregorian} • {currentDate.hijri}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Attendance Overview Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Attendance Overview</h2>
              <Link to="/founder/view-attendance" className="text-green-600 hover:text-green-800 text-sm font-medium">
                View Full Report
              </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">Today</p>
                <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.today.total}</h3>
                <p className="text-sm font-medium text-green-600">{attendanceStats.today.percentage}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">This Week</p>
                <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.weekly.total}</h3>
                <p className="text-sm font-medium text-green-600">{attendanceStats.weekly.percentage}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">This Month</p>
                <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.monthly.total}</h3>
                <p className="text-sm font-medium text-green-600">{attendanceStats.monthly.percentage}%</p>
              </div>
            </div>
            
            <h3 className="font-bold text-gray-700 mb-2">Today's Prayer Breakdown</h3>
            <div className="space-y-2">
              {Object.entries(attendanceStats.today.prayerBreakdown).map(([prayer, stats]) => (
                <div key={prayer} className="flex items-center">
                  <div className="w-20 capitalize">{prayer}</div>
                  <div className="w-full mx-4">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 w-24 text-right">
                    {stats.count} ({stats.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Member Stats Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Member Engagement</h2>
              <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                Export Data
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900">{memberStats.total}</h3>
                <p className="text-sm text-gray-500">Total Members</p>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900">{memberStats.active}</h3>
                <p className="text-sm text-gray-500">Active Members</p>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold text-green-600">+{memberStats.new}</h3>
                <p className="text-sm text-gray-500">New This Month</p>
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900">{memberStats.prayerCompletion}%</h3>
                <p className="text-sm text-gray-500">Prayer Completion</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2">Engagement Insights</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Fajr attendance improved by 12% this week</span>
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span>Isha attendance dropped by 8% this week</span>
                </li>
                <li className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>28 members haven't prayed at the mosque this month</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Announcements Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Feeds</h2>
              <Link to="/founder/post-feeds" className="text-green-600 hover:text-green-800 text-sm font-medium">
                Manage All
              </Link>
            </div>
            
            {announcements.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">No recent feeds</p>
                <Link 
                  to="/founder/post-feeds"
                  className="mt-2 inline-block text-green-600 hover:text-green-800 font-medium"
                >
                  Create a feed
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="border-l-4 border-green-500 pl-4 py-2 flex justify-between">
                    <div>
                      <h3 className="font-bold">{announcement.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-gray-500">{announcement.date}</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <button 
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <Link 
                        to={`/founder/post-feeds?edit=${announcement.id}`}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 md:mt-0">
              <Link 
                to="/founder/post-feeds" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Post New Feed
              </Link>
            </div>
          </div>
        </div>
        
        {/* Quick Actions - Updated to match sidebar */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link 
              to="/founder/reminder" 
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center">Reminders</span>
            </Link>
            
            <Link 
              to="/founder/meetings" 
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center">Meetings & Counselling</span>
            </Link>
            
            <Link 
              to="/founder/wake-up-call" 
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center">Call Center</span>
            </Link>
            
            <Link 
              to="/founder/transport" 
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center">Transport & Mobility</span>
            </Link>
            
            <Link 
              to="/founder/knowledge-program" 
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center">Knowledge Program</span>
            </Link>
            
            <Link 
              to="/founder/manage-members" 
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center">Members</span>
            </Link>
          </div>
        </div>
      </div>
    </FounderLayout>
  );
};

export default FounderDashboard;