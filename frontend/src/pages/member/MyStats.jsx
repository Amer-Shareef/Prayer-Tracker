import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { prayerService } from '../../services/api';

const MyStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await prayerService.getStats(period);
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg">Loading statistics...</div>
        </div>
      </MemberLayout>
    );
  }

  if (error) {
    return (
      <MemberLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            <div className="flex">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
          <button 
            onClick={fetchStats}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </MemberLayout>
    );
  }

  const getPrayerColor = (prayerType) => {
    const colors = {
      'Fajr': 'bg-purple-500',
      'Dhuhr': 'bg-yellow-500',
      'Asr': 'bg-orange-500',
      'Maghrib': 'bg-red-500',
      'Isha': 'bg-indigo-500'
    };
    return colors[prayerType] || 'bg-gray-500';
  };

  const getPeriodText = () => {
    switch (period) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case '90': return 'Last 90 days';
      case '365': return 'Last year';
      default: return `Last ${period} days`;
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Prayer Statistics</h1>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {stats && (
          <>
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Prayers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.overall.total_prayers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.overall.prayed_count || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Missed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.overall.missed_count || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.overall.attendance_rate || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Streak */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Streak</h3>
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-900">{stats.currentStreak}</p>
                  <p className="text-gray-600">consecutive prayers completed</p>
                </div>
                {stats.currentStreak > 0 && (
                  <div className="ml-auto">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      🔥 On Fire!
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prayer Type Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Prayer Performance by Type ({getPeriodText()})</h3>
              
              {stats.byPrayerType && stats.byPrayerType.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {stats.byPrayerType.map((prayer) => (
                    <div key={prayer.prayer_type} className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 ${getPrayerColor(prayer.prayer_type)}`}>
                        {Math.round(prayer.rate || 0)}%
                      </div>
                      <h4 className="font-semibold text-gray-800">{prayer.prayer_type}</h4>
                      <p className="text-sm text-gray-600">{prayer.prayed}/{prayer.total}</p>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${getPrayerColor(prayer.prayer_type)}`}
                          style={{ width: `${prayer.rate || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No prayer data</h3>
                  <p className="mt-1 text-sm text-gray-500">Start recording your prayers to see statistics here.</p>
                </div>
              )}
            </div>

            {/* Performance Insights */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Insights</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Rate Card */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      (stats.overall.attendance_rate || 0) >= 80 ? 'bg-green-500' :
                      (stats.overall.attendance_rate || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <h4 className="font-semibold">Overall Performance</h4>
                  </div>
                  <p className="text-2xl font-bold mb-2">{stats.overall.attendance_rate || 0}%</p>
                  <p className="text-sm text-gray-600">
                    {(stats.overall.attendance_rate || 0) >= 80 ? '🎉 Excellent! Keep up the great work!' :
                     (stats.overall.attendance_rate || 0) >= 60 ? '👍 Good progress! Try to be more consistent.' :
                     '💪 There\'s room for improvement. You can do it!'}
                  </p>
                </div>

                {/* Best Prayer Time */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <h4 className="font-semibold">Best Prayer Time</h4>
                  </div>
                  {stats.byPrayerType && stats.byPrayerType.length > 0 ? (
                    (() => {
                      const bestPrayer = stats.byPrayerType.reduce((best, current) => 
                        (current.rate || 0) > (best.rate || 0) ? current : best
                      );
                      return (
                        <>
                          <p className="text-2xl font-bold mb-2">{bestPrayer.prayer_type}</p>
                          <p className="text-sm text-gray-600">
                            {Math.round(bestPrayer.rate || 0)}% attendance rate
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-gray-600">No data available</p>
                  )}
                </div>

                {/* Prayer Count */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <h4 className="font-semibold">Prayer Count</h4>
                  </div>
                  <p className="text-2xl font-bold mb-2">{stats.overall.total_prayers || 0}</p>
                  <p className="text-sm text-gray-600">
                    Total prayers in {getPeriodText().toLowerCase()}
                  </p>
                </div>

                {/* Consistency Score */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <h4 className="font-semibold">Consistency</h4>
                  </div>
                  <p className="text-2xl font-bold mb-2">{stats.currentStreak}</p>
                  <p className="text-sm text-gray-600">
                    Current streak of completed prayers
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!stats && !loading && !error && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No statistics available</h3>
            <p className="mt-1 text-sm text-gray-500">Start recording your prayers to see your statistics.</p>
          </div>
        )}
      </div>
    </MemberLayout>
  );
};

export default MyStats;