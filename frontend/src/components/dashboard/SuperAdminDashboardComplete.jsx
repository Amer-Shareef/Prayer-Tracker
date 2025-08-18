import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import { feedsService, areaService } from "../../services/api";

const SuperAdminDashboardComplete = () => {
  const { user } = useAuth();
  
  // Mosque information state 
  const [mosque, setMosque] = useState({
    name: "Loading...",
    address: "Loading mosque information...",
    prayerTimes: {
      fajr: '4:43 AM',
      dhuhr: '12:15 PM',
      asr: '3:45 PM',
      maghrib: '6:23 PM',
      isha: '7:43 PM',
      jumuah: '1:30 PM'
    }
  });
  
  // Attendance stats - will be populated from API
  const [attendanceStats, setAttendanceStats] = useState({
    today: {
      total: 0,
      percentage: 0
    },
    thisWeek: {
      total: 0,
      percentage: 0
    },
    thisMonth: {
      total: 0,
      percentage: 0
    }
  });

  // Prayer breakdown stats - will be populated from API
  const [prayerStats, setPrayerStats] = useState([
    { name: 'Fajr', count: 0, percentage: 0 },
    { name: 'Dhuhr', count: 0, percentage: 0 },
    { name: 'Asr', count: 0, percentage: 0 },
    { name: 'Maghrib', count: 0, percentage: 0 },
    { name: 'Isha', count: 0, percentage: 0 }
  ]);

  // Loading states
  const [loadingMosqueData, setLoadingMosqueData] = useState(true);
  const [attendanceError, setAttendanceError] = useState(null);

  // Feeds state for recent announcements
  const [feeds, setFeeds] = useState([]);
  const [feedsLoading, setFeedsLoading] = useState(false);
  const [feedsError, setFeedsError] = useState(null);

  // Current date display
  const [currentDate, setCurrentDate] = useState({
    gregorian: 'Thursday, June 29, 2025',
    hijri: '03 Muharram 1447'
  });
  
  // Fetch global data and attendance statistics for SuperAdmin
  useEffect(() => {
    const fetchGlobalData = async () => {
      setLoadingMosqueData(true);
      setAttendanceError(null);
      
      try {
        // For SuperAdmin, fetch global statistics across all areas
        const globalStatsResponse = await areaService.getGlobalStats();
        
        if (globalStatsResponse.data.success) {
          const stats = globalStatsResponse.data.data;
          
          // Update mosque info with global data
          setMosque({
            name: "Global Stats (All Areas)",
            address: `${stats.global.totalMembers} total members across ${stats.global.totalAreas} areas`,
            prayerTimes: {
              fajr: '4:43 AM',
              dhuhr: '12:15 PM',
              asr: '3:45 PM',
              maghrib: '6:23 PM',
              isha: '7:43 PM',
              jumuah: '1:30 PM'
            }
          });
          
          // Update attendance stats
          setAttendanceStats({
            today: {
              total: stats.today.total,
              percentage: stats.today.percentage
            },
            thisWeek: {
              total: stats.weekly.total,
              percentage: stats.weekly.percentage
            },
            thisMonth: {
              total: stats.monthly.total,
              percentage: stats.monthly.percentage
            }
          });
          
          // Update prayer breakdown stats
          const breakdown = stats.today.prayerBreakdown;
          setPrayerStats([
            { name: 'Fajr', count: breakdown.fajr.count, percentage: breakdown.fajr.percentage },
            { name: 'Dhuhr', count: breakdown.dhuhr.count, percentage: breakdown.dhuhr.percentage },
            { name: 'Asr', count: breakdown.asr.count, percentage: breakdown.asr.percentage },
            { name: 'Maghrib', count: breakdown.maghrib.count, percentage: breakdown.maghrib.percentage },
            { name: 'Isha', count: breakdown.isha.count, percentage: breakdown.isha.percentage }
          ]);
          
          console.log('✅ Global stats loaded successfully:', stats);
        }
      } catch (error) {
        console.error('❌ Error fetching global stats:', error);
        setAttendanceError('Failed to load global statistics');
        
        // Keep default/fallback stats in case of error
        setAttendanceStats({
          today: { total: 0, percentage: 0 },
          thisWeek: { total: 0, percentage: 0 },
          thisMonth: { total: 0, percentage: 0 }
        });
        
        setPrayerStats([
          { name: 'Fajr', count: 0, percentage: 0 },
          { name: 'Dhuhr', count: 0, percentage: 0 },
          { name: 'Asr', count: 0, percentage: 0 },
          { name: 'Maghrib', count: 0, percentage: 0 },
          { name: 'Isha', count: 0, percentage: 0 }
        ]);
      } finally {
        setLoadingMosqueData(false);
      }
    };
    
    if (user) {
      fetchGlobalData();
    }
  }, [user]);
  
  // Fetch latest feeds from all mosques (Super Admin sees all)
  useEffect(() => {
    const fetchFeeds = async () => {
      setFeedsLoading(true);
      setFeedsError(null);
      try {
        // Fetch feeds with limit param = 5 for latest feeds from all mosques
        const response = await feedsService.getAllFeeds({ limit: 5 });
        
        if (response && response.data) {
          setFeeds(response.data);
          console.log('✅ Super Admin Feeds loaded successfully:', response.data.length);
        } else {
          console.error('❌ Invalid feeds data structure:', response);
          setFeedsError('Failed to load feeds data');
        }
      } catch (error) {
        console.error('❌ Error fetching feeds:', error);
        setFeedsError(error.message || 'Failed to load feeds');
      } finally {
        setFeedsLoading(false);
      }
    };
    
    fetchFeeds();
  }, []);

  // Handler for deleting a feed (Super Admin can delete any feed)
  const handleDeleteFeed = async (id) => {
    try {
      await feedsService.deleteFeed(id);
      // Update feeds state to remove the deleted feed
      setFeeds(prevFeeds => prevFeeds.filter(feed => feed.id !== id));
      console.log(`✅ Feed ${id} deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete feed ${id}:`, error);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="p-4 sm:p-6 md:p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {user.role === "SuperAdmin" ? "Super Admin Dashboard" : "Working Committee Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {mosque.name} • {currentDate.gregorian} • {currentDate.hijri}
          </p>
          {attendanceError && (
            <p className="mt-1 text-sm text-red-600">
              ⚠️ {attendanceError}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Attendance Overview Card - Now full width */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {user.role === "SuperAdmin" ? "Mosque Attendance Overview" : "Attendance Overview"}
              </h2>
              <Link to="/superadmin/view-attendance" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                View Full Report
              </Link>
            </div>
            
            {loadingMosqueData ? (
              <div className="flex items-center justify-center p-8">
                <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-3 text-gray-500">Loading attendance data...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">Today</p>
                    <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.today.total}</h3>
                    <p className="text-sm font-medium text-purple-600">{attendanceStats.today.percentage}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">This Week</p>
                    <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.thisWeek.total}</h3>
                    <p className="text-sm font-medium text-purple-600">{attendanceStats.thisWeek.percentage}%</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">This Month</p>
                    <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.thisMonth.total}</h3>
                    <p className="text-sm font-medium text-purple-600">{attendanceStats.thisMonth.percentage}%</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Today's Prayer Breakdown</h3>
                  {prayerStats.map((stats) => (
                    <div key={stats.name} className="flex items-center">
                      <div className="w-16 text-sm font-medium text-gray-700">{stats.name}</div>
                      <div className="w-full mx-4">
                        <div className="bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-purple-600 h-2.5 rounded-full" 
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
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Feeds Card - Updated with real data for all mosques */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Feeds (All Mosques)</h2>
              <Link to="/superadmin/post-feeds" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                Manage All
              </Link>
            </div>
            
            {feedsLoading ? (
              <div className="flex items-center justify-center p-6">
                <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : feedsError ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-md">
                <p>Error loading feeds: {feedsError}</p>
                <button 
                  className="text-red-700 font-medium underline mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : feeds.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">No recent feeds from any mosque</p>
                <Link 
                  to="/superadmin/post-feeds"
                  className="mt-2 inline-block text-purple-600 hover:text-purple-800 font-medium"
                >
                  Create a feed
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {feeds.map(feed => (
                  <div key={feed.id} className="border-l-4 border-purple-500 pl-4 py-2 flex justify-between">
                    <div>
                      <h3 className="font-bold">{feed.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{feed.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        By {feed.author_name} • {feed.mosque_name} • {new Date(feed.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <button 
                        onClick={() => handleDeleteFeed(feed.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <Link 
                        to={`/superadmin/post-feeds?edit=${feed.id}`}
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
          </div>
        </div>
        
        {/* Quick Actions - Updated to match founder dashboard but with Super Admin features */}
        <div className="bg-gray-200 rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link 
              to="/superadmin/reminder" 
              className="flex flex-col items-center justify-center p-4 bg-purple-600 rounded-lg hover:bg-purple-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-purple-100">Daily Reminders</span>
            </Link>
            
            <Link 
              to="/superadmin/meetings" 
              className="flex flex-col items-center justify-center p-4 bg-purple-500 rounded-lg hover:bg-purple-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-purple-100">Personal Meetings</span>
            </Link>
            
            <Link 
              to="/superadmin/wake-up-call" 
              className="flex flex-col items-center justify-center p-4 bg-purple-400 rounded-lg hover:bg-purple-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-100" fill="currentColor" viewBox="0 0 48 48">
                <path d="M10 21H9a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h1a1 1 0 0 0 1-1V22a1 1 0 0 0-1-1zM7 31v-6a2 2 0 0 1 2-2v10a2 2 0 0 1-2-2z"/>
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-purple-100">Call Centre</span>
            </Link>
            
            <Link 
              to="/superadmin/transport" 
              className="flex flex-col items-center justify-center p-4 bg-purple-300 rounded-lg hover:bg-purple-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H16V4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM10 4H14V5H10V4ZM6.5 16C5.67 16 5 15.33 5 14.5C5 13.67 5.67 13 6.5 13C7.33 13 8 13.67 8 14.5C8 15.33 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5C16 13.67 16.67 13 17.5 13C18.33 13 19 13.67 19 14.5C19 15.33 18.33 16 17.5 16Z"/>
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-purple-800">Transport & Mobility</span>
            </Link>
            
            <Link 
              to="/superadmin/knowledge-program" 
              className="flex flex-col items-center justify-center p-4 bg-purple-200 rounded-lg hover:bg-purple-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-purple-800">Knowledge Program</span>
            </Link>
            
            <Link 
              to="/superadmin/manage-members" 
              className="flex flex-col items-center justify-center p-4 bg-purple-100 rounded-lg hover:bg-purple-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-purple-800">Members</span>
            </Link>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboardComplete;
