import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FounderLayout from "../layouts/FounderLayout";
import feedService from "../../services/feedService"; // Import feed service
import { areaService, userService } from "../../services/api"; // Import area and user services

const FounderDashboard = () => {
  const { user } = useAuth();
  
  // Area information state
  const [area, setArea] = useState({
    name: "Loading...",
    address: "Loading area information...",
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
      percentage: 0,
      prayerBreakdown: {
        fajr: { count: 0, percentage: 0 },
        dhuhr: { count: 0, percentage: 0 },
        asr: { count: 0, percentage: 0 },
        maghrib: { count: 0, percentage: 0 },
        isha: { count: 0, percentage: 0 }
      }
    },
    weekly: {
      total: 0,
      percentage: 0,
      trend: 'stable'
    },
    monthly: {
      total: 0,
      percentage: 0,
      trend: 'stable'
    }
  });

  // Loading states
  const [loadingAreaData, setLoadingAreaData] = useState(true);
  const [attendanceError, setAttendanceError] = useState(null);
  
  // Feeds state with loading and error handling
  const [feeds, setFeeds] = useState([]);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [feedsError, setFeedsError] = useState(null);
    
  const [currentDate, setCurrentDate] = useState({
    gregorian: 'Loading Todays Date...',
    hijri: 'Loading Hijiri Date...'
  });
  
  // Fetch area data and attendance statistics
  useEffect(() => {
  const today = new Date();

  // Gregorian date
  const gregorianDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Hijri date (using built-in Intl API)
  let hijriDate;
  try {
    hijriDate = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(today);
  } catch (error) {
    console.warn("Hijri date not supported in this browser.");
    hijriDate = "Hijri date not supported";
  }

  setCurrentDate({
    gregorian: gregorianDate,
    hijri: hijriDate
  });



    
    const fetchAreaData = async () => {
      setLoadingAreaData(true);
      setAttendanceError(null);
      
      try {
        // First, get fresh user profile to ensure we have latest area info
        console.log('🔍 Fetching fresh user profile and area data');
        
        try {
          const profileResponse = await userService.getProfile();
          if (profileResponse.data.success) {
            const freshUser = profileResponse.data.data;
            console.log('📋 Fresh user profile:', freshUser);
            
            const userAreaId = freshUser.areaId || freshUser.area_id;
            if (userAreaId) {
              console.log('📊 Found area_id:', userAreaId, 'fetching area stats');
              
              // Fetch attendance statistics for founder's specific area
              const attendanceResponse = await areaService.getAreaStats(userAreaId);
          
          if (attendanceResponse.data.success) {
            const stats = attendanceResponse.data.data;
            
            // Update area info from stats response
            setArea({
              name: stats.area.name || "Area",
              address: "Area information", // Can be enhanced later
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
                percentage: stats.today.percentage,
                prayerBreakdown: {
                  fajr: { count: stats.today.prayerBreakdown.fajr.count, percentage: stats.today.prayerBreakdown.fajr.percentage },
                  dhuhr: { count: stats.today.prayerBreakdown.dhuhr.count, percentage: stats.today.prayerBreakdown.dhuhr.percentage },
                  asr: { count: stats.today.prayerBreakdown.asr.count, percentage: stats.today.prayerBreakdown.asr.percentage },
                  maghrib: { count: stats.today.prayerBreakdown.maghrib.count, percentage: stats.today.prayerBreakdown.maghrib.percentage },
                  isha: { count: stats.today.prayerBreakdown.isha.count, percentage: stats.today.prayerBreakdown.isha.percentage }
                }
              },
              weekly: {
                total: stats.weekly.total,
                percentage: stats.weekly.percentage,
                trend: stats.weekly.percentage >= 70 ? 'up' : stats.weekly.percentage >= 50 ? 'stable' : 'down'
              },
              monthly: {
                total: stats.monthly.total,
                percentage: stats.monthly.percentage,
                trend: stats.monthly.percentage >= 70 ? 'up' : stats.monthly.percentage >= 50 ? 'stable' : 'down'
              }
            });
            
            console.log('✅ Attendance data loaded successfully for area:', stats.area.name);
          } else {
            console.error('❌ Failed to fetch area stats:', attendanceResponse.data.message);
            setAttendanceError('Failed to load attendance statistics');
          }
        } else {
          console.warn('⚠️ Fresh user profile shows no area_id assigned. User profile:', freshUser);
          setAttendanceError('No area associated with this user. Please contact admin to assign an area.');
        }
      }
    } catch (profileError) {
      console.error('❌ Failed to fetch fresh user profile:', profileError);
      
      // Fallback: try with cached user data
      console.log('🔄 Falling back to cached user data:', user);
      const userAreaId = user?.areaId || user?.area_id;
      if (userAreaId) {
        console.log('📊 Using cached area_id:', userAreaId);
        
        try {
          const attendanceResponse = await areaService.getAreaStats(userAreaId);
          if (attendanceResponse.data.success) {
            const stats = attendanceResponse.data.data;
            
            setArea({
              name: stats.area.name || "Area",
              address: "Area information",
              prayerTimes: {
                fajr: '4:43 AM',
                dhuhr: '12:15 PM',
                asr: '3:45 PM',
                maghrib: '6:23 PM',
                isha: '7:43 PM',
                jumuah: '1:30 PM'
              }
            });
            
            setAttendanceStats({
              today: {
                total: stats.today.total,
                percentage: stats.today.percentage,
                prayerBreakdown: {
                  fajr: { count: stats.today.prayerBreakdown.fajr.count, percentage: stats.today.prayerBreakdown.fajr.percentage },
                  dhuhr: { count: stats.today.prayerBreakdown.dhuhr.count, percentage: stats.today.prayerBreakdown.dhuhr.percentage },
                  asr: { count: stats.today.prayerBreakdown.asr.count, percentage: stats.today.prayerBreakdown.asr.percentage },
                  maghrib: { count: stats.today.prayerBreakdown.maghrib.count, percentage: stats.today.prayerBreakdown.maghrib.percentage },
                  isha: { count: stats.today.prayerBreakdown.isha.count, percentage: stats.today.prayerBreakdown.isha.percentage }
                }
              },
              weekly: {
                total: stats.weekly.total,
                percentage: stats.weekly.percentage,
                trend: stats.weekly.percentage >= 70 ? 'up' : stats.weekly.percentage >= 50 ? 'stable' : 'down'
              },
              monthly: {
                total: stats.monthly.total,
                percentage: stats.monthly.percentage,
                trend: stats.monthly.percentage >= 70 ? 'up' : stats.monthly.percentage >= 50 ? 'stable' : 'down'
              }
            });
            
            console.log('✅ Fallback: Attendance data loaded with cached user data');
          } else {
            setAttendanceError('Failed to load attendance statistics');
          }
        } catch (statsError) {
          console.error('❌ Failed to fetch area stats with cached data:', statsError);
          setAttendanceError('Failed to load attendance statistics');
        }
      } else {
        console.warn('⚠️ No area_id found in cached user data either');
        setAttendanceError('No area associated with this user. Please contact admin.');
      }
    }
      } catch (error) {
        console.error('❌ Error fetching area data:', error);
        setAttendanceError('Failed to load area information');
      } finally {
        setLoadingAreaData(false);
      }
    };
    
    if (user) {
      fetchAreaData();
    }
  }, [user]);
  
  // Fetch latest feeds from the API
  useEffect(() => {
    const fetchFeeds = async () => {
      setFeedsLoading(true);
      setFeedsError(null);
      try {
        // Fetch feeds with limit param = 3 for latest 3 feeds only
        const response = await feedService.getAllFeeds({ limit: 3 });
        
        if (response && response.data) {
          setFeeds(response.data);
          console.log('✅ Feeds loaded successfully:', response.data.length);
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
  
  // Handler for deleting a feed
  const handleDeleteFeed = async (id) => {
    try {
      await feedService.deleteFeed(id);
      // Update feeds state to remove the deleted feed
      setFeeds(prevFeeds => prevFeeds.filter(feed => feed.id !== id));
      console.log(`✅ Feed ${id} deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete feed ${id}:`, error);
    }
  };

  return (
    <FounderLayout>
      <div className="p-4 sm:p-6 md:p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {user.role === "Founder" ? "Working Committee Dashboard" : "Super Admin Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {area.name} • {currentDate.gregorian} • {currentDate.hijri}
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
              <h2 className="text-xl font-bold">Attendance Overview</h2>
              <Link to="/founder/view-attendance" className="text-green-600 hover:text-green-800 text-sm font-medium">
                View Full Report
              </Link>
            </div>
            
            {loadingAreaData ? (
              <div className="flex items-center justify-center p-8">
                <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Feeds Card - Updated with real data */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Feeds</h2>
              <Link to="/founder/post-feeds" className="text-green-600 hover:text-green-800 text-sm font-medium">
                Manage All
              </Link>
            </div>
            
            {feedsLoading ? (
              <div className="flex items-center justify-center p-6">
                <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                {feeds.map(feed => (
                  <div key={feed.id} className="border-l-4 border-green-500 pl-4 py-2 flex justify-between">
                    <div>
                      <h3 className="font-bold">{feed.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                        {feed.content}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(feed.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <button 
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => handleDeleteFeed(feed.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <Link 
                        to={`/founder/post-feeds?edit=${feed.id}`}
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
        
        {/* Quick Actions - Updated to match sidebar */}
        <div className="bg-gray-200 rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link 
              to="/founder/reminder" 
              className="flex flex-col items-center justify-center p-4 bg-green-600 rounded-lg hover:bg-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-green-100">Daily Reminders</span>
            </Link>
            
            <Link 
              to="/founder/meetings" 
              className="flex flex-col items-center justify-center p-4 bg-green-500 rounded-lg hover:bg-green-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-green-100">Personal Meetings</span>
            </Link>
            
            <Link 
              to="/founder/wake-up-call" 
              className="flex flex-col items-center justify-center p-4 bg-green-400 rounded-lg hover:bg-green-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-100" fill="currentColor" viewBox="0 0 48 48">
                <path class="cls-1" d="M10 21H9a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4h1a1 1 0 0 0 1-1V22a1 1 0 0 0-1-1zM7 31v-6a2 2 0 0 1 2-2v10a2 2 0 0 1-2-2z"/><path class="cls-2" d="M9 23v10a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"/><path class="cls-1" d="M12 19a3 3 0 0 0-2.82 2A2.77 2.77 0 0 0 9 22v12a2.77 2.77 0 0 0 .18 1A3 3 0 0 0 15 34V22a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-2 0V22a1 1 0 0 1 2 0z"/><path class="cls-3" d="M13 22v12a1 1 0 0 1-2 0V22a1 1 0 0 1 2 0z"/><path class="cls-1" d="M39 21h-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h1a4 4 0 0 0 4-4v-6a4 4 0 0 0-4-4zm2 10a2 2 0 0 1-2 2V23a2 2 0 0 1 2 2z"/><path class="cls-2" d="M41 25v6a2 2 0 0 1-2 2V23a2 2 0 0 1 2 2z"/><path class="cls-1" d="M38.82 21A3 3 0 0 0 33 22v12a3 3 0 0 0 5.82 1 2.77 2.77 0 0 0 .18-1V22a2.77 2.77 0 0 0-.18-1zM36 35a1 1 0 0 1-1-1V22a1 1 0 0 1 2 0v12a1 1 0 0 1-1 1z"/><path class="cls-3" d="M37 22v12a1 1 0 0 1-2 0V22a1 1 0 0 1 2 0z"/><path class="cls-1" d="M38 32a1 1 0 0 1-1-1V20a13 13 0 0 0-26 0v11a1 1 0 0 1-2 0V20a15 15 0 0 1 30 0v11a1 1 0 0 1-1 1zM30 43h-6a1 1 0 0 1 0-2h6a7 7 0 0 0 7-7 1 1 0 0 1 2 0 9 9 0 0 1-9 9z"/><path class="cls-1" d="M24 37a3 3 0 0 0 0 6h2a1 1 0 0 0 1-1v-2a3 3 0 0 0-3-3zm1 4h-1a1 1 0 1 1 1-1z"/><circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-green-100">Call Center</span>
            </Link>
            
            <Link 
              to="/founder/transport" 
              className="flex flex-col items-center justify-center p-4 bg-green-300 rounded-lg hover:bg-green-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H16V4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM10 4H14V5H10V4ZM6.5 16C5.67 16 5 15.33 5 14.5C5 13.67 5.67 13 6.5 13C7.33 13 8 13.67 8 14.5C8 15.33 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5C16 13.67 16.67 13 17.5 13C18.33 13 19 13.67 19 14.5C19 15.33 18.33 16 17.5 16ZM5 11L6.5 7H17.5L19 11H5Z"/>
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-green-800">Transport & Mobility</span>
            </Link>
            
            <Link 
              to="/founder/knowledge-program" 
              className="flex flex-col items-center justify-center p-4 bg-green-200 rounded-lg hover:bg-green-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-green-800">Knowledge Program</span>
            </Link>
            
            <Link 
              to="/founder/manage-members" 
              className="flex flex-col items-center justify-center p-4 bg-green-100 rounded-lg hover:bg-green-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="mt-2 text-xs font-medium text-center text-green-800">Members</span>
            </Link>
          </div>
        </div>
      </div>
    </FounderLayout>
  );
};

export default FounderDashboard;