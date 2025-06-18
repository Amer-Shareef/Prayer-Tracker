import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import { prayerService, announcementService, mosqueService, dailyActivitiesService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import SimpleChart from '../../components/charts/SimpleChart';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todayPrayers, setTodayPrayers] = useState([]);
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [mosque, setMosque] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [todayActivities, setTodayActivities] = useState({
    zikr_count: 0,
    quran_minutes: 0
  });
  const [currentDate, setCurrentDate] = useState(new Date()); // NEW: Track current date

  // Get today's date in YYYY-MM-DD format in local timezone - FIXED
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getTodayDate(); // Use local date instead of ISO string
  const prayerTypes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  useEffect(() => {
    fetchDashboardData();
    
    // Update current date every minute to ensure it's always current
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(dateInterval);
  }, []);

  const fetchDashboardData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError('');

      // Fetch today's prayers
      const prayerResponse = await prayerService.getPrayers({ date: today });
      if (prayerResponse.data.success) {
        setTodayPrayers(prayerResponse.data.data);
      }

      // Fetch mosque data
      const mosqueResponse = await mosqueService.getMosques();
      if (mosqueResponse.data.success && mosqueResponse.data.data.length > 0) {
        setMosque(mosqueResponse.data.data[0]);
      }

      // Fetch stats
      const statsResponse = await prayerService.getStats(7);
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      // Fetch announcements
      const announcementResponse = await announcementService.getAnnouncements();
      if (announcementResponse.data.success) {
        setAnnouncements(announcementResponse.data.data.slice(0, 3));
      }

      // Fetch daily activities
      const activitiesResponse = await dailyActivitiesService.getActivities({
        date: today
      });
      if (activitiesResponse.data.success) {
        const activities = activitiesResponse.data.data;
        const zikrToday = activities.find(a => a.activity_type === 'zikr');
        const quranToday = activities.find(a => a.activity_type === 'quran');

        setTodayActivities({
          zikr_count: zikrToday?.count_value || 0,
          quran_minutes: quranToday?.minutes_value || 0
        });
      }

      // Fetch activity statistics
      const activityStatsResponse = await dailyActivitiesService.getStats(7);
      if (activityStatsResponse.data.success) {
        setActivityStats(activityStatsResponse.data.data);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);

      if (err.response?.data?.isRetryable && retryCount < 2) {
        console.log(`🔄 Retrying dashboard data fetch (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => fetchDashboardData(retryCount + 1), 2000 * (retryCount + 1));
        return;
      }

      const errorMessage = err.response?.data?.message || 'Error loading dashboard data';
      setError(errorMessage);
      setTimeout(() => setError(''), 10000);
    } finally {
      setLoading(false);
    }
  };

  const quickRecordPrayer = async (prayerType, status) => {
    try {
      setError('');
      
      const response = await prayerService.recordPrayer({
        prayer_type: prayerType,
        prayer_date: today,
        status: status,
        location: status === 'prayed' ? 'mosque' : 'mosque'
      });

      if (response.data.success) {
        setTodayPrayers(prevPrayers => {
          const filtered = prevPrayers.filter(p => {
            const prayerDate = p.prayer_date;
            return !(p.prayer_type === prayerType && prayerDate === today);
          });
          return [...filtered, response.data.data];
        });
        
        fetchStats();
        const successMsg = `${prayerType} marked as ${status}`;
        console.log(successMsg);
      }
    } catch (err) {
      console.error('Error recording prayer:', err);
      const errorMsg = err.response?.data?.message || 'Error recording prayer';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    }
  };

  const quickRecordActivity = async (type, value) => {
    try {
      setError('');

      // Use recordToday for dashboard (always today)
      await dailyActivitiesService.recordToday(type, value, type === 'quran');

      // Update local state
      setTodayActivities(prev => ({
        ...prev,
        [type === 'zikr' ? 'zikr_count' : 'quran_minutes']: value
      }));

      // Refresh activity stats
      const activityStatsResponse = await dailyActivitiesService.getStats(7);
      if (activityStatsResponse.data.success) {
        setActivityStats(activityStatsResponse.data.data);
      }

    } catch (err) {
      console.error('Error recording activity:', err);
      setError('Error recording activity');
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchStats = async () => {
    try {
      const statsResponse = await prayerService.getStats(7);
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const getChartData = () => {
    if (!stats || !activityStats) return null;

    return {
      zikr: [
        {
          label: 'ZIKR Ring',
          value: todayActivities.zikr_count,
          total: 300, // Target daily zikr
          color: 'stroke-purple-500'
        }
      ],
      quran: [
        {
          label: 'Quran Ring',
          value: todayActivities.quran_minutes,
          total: 60, // Target daily minutes
          color: 'stroke-blue-500'
        }
      ]
    };
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg">Loading dashboard...</div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header - UPDATED with real-time date */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600">
            Today is {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-sm text-gray-500">
            📅 {today} • {currentDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchDashboardData()}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Prayer Stats */}
          {stats && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Prayer Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.overall.attendance_rate || 0}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Zikr Stats */}
          {activityStats && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">📿</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Daily Zikr</p>
                  <p className="text-2xl font-semibold text-gray-900">{activityStats.zikr.average_daily}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quran Stats */}
          {activityStats && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <span className="text-2xl">📖</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Quran Daily</p>
                  <p className="text-2xl font-semibold text-gray-900">{activityStats.quran.average_daily}m</p>
                </div>
              </div>
            </div>
          )}

          {/* Streak */}
          {stats && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 716.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Prayer Streak</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.currentStreak || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Progress - UPDATED with current date display */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Today's Progress ({currentDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })})
            </h2>
            
            {chartData ? (
              <div className="grid grid-cols-2 gap-6">
                <SimpleChart
                  data={chartData.zikr}
                  title="Daily Zikr"
                  type="ring"
                />
                <SimpleChart
                  data={chartData.quran}
                  title="Quran Reading"
                  type="ring"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading progress data...</p>
              </div>
            )}

            {/* Quick action buttons for activities - UPDATED */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📿</span>
                  <div>
                    <p className="font-medium text-gray-900">Zikr Count</p>
                    <p className="text-sm text-gray-500">
                      {todayActivities.zikr_count} times today ({today})
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => quickRecordActivity('zikr', todayActivities.zikr_count + 33)}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                  >
                    +33
                  </button>
                  <button
                    onClick={() => quickRecordActivity('zikr', todayActivities.zikr_count + 99)}
                    className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                  >
                    +99
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📖</span>
                  <div>
                    <p className="font-medium text-gray-900">Quran Recitation</p>
                    <p className="text-sm text-gray-500">
                      {todayActivities.quran_minutes} minutes today ({today})
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => quickRecordActivity('quran', todayActivities.quran_minutes + 15)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                  >
                    +15m
                  </button>
                  <button
                    onClick={() => quickRecordActivity('quran', todayActivities.quran_minutes + 30)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                  >
                    +30m
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Announcements</h2>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      By {announcement.author_name} • {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No announcements available</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button 
              onClick={() => navigate('/member/prayers')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium">My Prayers</span>
            </button>

            <button 
              onClick={() => navigate('/member/stats')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012-2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium">Statistics</span>
            </button>

            <button 
              onClick={() => navigate('/member/mosque')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm font-medium">My Area</span>
            </button>

            <button 
              onClick={() => navigate('/member/profile')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">Profile</span>
            </button>

            <button 
              onClick={() => navigate('/member/daily-activities')}
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
            >
              <span className="text-3xl mb-2">📊</span>
              <span className="text-sm font-medium">Activities</span>
            </button>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Dashboard;