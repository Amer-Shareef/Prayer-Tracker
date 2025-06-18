import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import { dailyActivitiesService } from '../../services/api';

const DailyActivities = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const [formData, setFormData] = useState({
    activity_type: 'zikr',
    count_value: 0,
    minutes_value: 0
  });

  useEffect(() => {
    fetchActivities();
    fetchStats();

    const dateInterval = setInterval(() => {
      const newCurrentDate = new Date();
      setCurrentDate(newCurrentDate);

      const newToday = getTodayDate();
      if (selectedDate === getTodayDate() && newToday !== selectedDate) {
        setSelectedDate(newToday);
      }
    }, 60000);

    return () => clearInterval(dateInterval);
  }, [selectedDate]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await dailyActivitiesService.getActivities({
        date: selectedDate
      });

      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Error loading activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await dailyActivitiesService.getStats(30);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');

      await dailyActivitiesService.recordActivity(
        selectedDate,
        formData.activity_type,
        formData.activity_type === 'zikr' ? formData.count_value : formData.minutes_value,
        formData.activity_type === 'quran'
      );

      setFormData({
        activity_type: 'zikr',
        count_value: 0,
        minutes_value: 0
      });

      fetchActivities();
      fetchStats();

      console.log(`✅ Activity recorded for ${selectedDate}`);
    } catch (err) {
      console.error('Error recording activity:', err);
      setError(`Error recording activity for ${selectedDate}`);
    }
  };

  const quickRecordActivity = async (type, value) => {
    try {
      setError('');

      await dailyActivitiesService.recordActivity(
        selectedDate,
        type,
        value,
        type === 'quran'
      );

      fetchActivities();
      fetchStats();

      console.log(`✅ Quick ${type} recorded for ${selectedDate}`);
    } catch (err) {
      console.error('Error recording activity:', err);
      setError(`Error recording ${type} for ${selectedDate}`);
    }
  };

  const getTodayActivity = (type) => {
    return activities.find(a => a.activity_type === type);
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg">Loading activities...</div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Daily Activities</h1>
            <p className="text-gray-600">
              Today is {currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Time</p>
            <p className="text-lg font-semibold text-blue-600">
              {currentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
        </div>
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <span className="text-3xl mr-4">📿</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Zikr Statistics</h3>
                  <p className="text-sm text-gray-600">Last 30 days</p>
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-purple-600">{stats.zikr.average_daily}</p>
                    <p className="text-sm text-gray-500">Average daily count</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <span className="text-3xl mr-4">📖</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Quran Statistics</h3>
                  <p className="text-sm text-gray-600">Last 30 days</p>
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-indigo-600">{stats.quran.average_daily}m</p>
                    <p className="text-sm text-gray-500">Average daily minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Date</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-sm text-gray-600">
                {selectedDate === getTodayDate()
                  ? '📅 Today (Current)'
                  : `📅 ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}`}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedDate(getTodayDate())}
                className={`px-3 py-1 rounded text-sm ${
                  selectedDate === getTodayDate()
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const year = yesterday.getFullYear();
                  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
                  const day = String(yesterday.getDate()).padStart(2, '0');
                  const yesterdayStr = `${year}-${month}-${day}`;
                  setSelectedDate(yesterdayStr);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded text-sm"
              >
                Yesterday
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Activities for {selectedDate === getTodayDate()
                ? 'Today'
                : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
            </h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📿</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Zikr Count</h3>
                      <p className="text-sm text-gray-500">
                        {getTodayActivity('zikr')?.count_value || 0} times
                        {selectedDate === getTodayDate() && ' today'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => quickRecordActivity('zikr', (getTodayActivity('zikr')?.count_value || 0) + 33)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                    >
                      +33
                    </button>
                    <button
                      onClick={() => quickRecordActivity('zikr', (getTodayActivity('zikr')?.count_value || 0) + 99)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                    >
                      +99
                    </button>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📖</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Quran Recitation</h3>
                      <p className="text-sm text-gray-500">
                        {getTodayActivity('quran')?.minutes_value || 0} minutes
                        {selectedDate === getTodayDate() && ' today'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => quickRecordActivity('quran', (getTodayActivity('quran')?.minutes_value || 0) + 15)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      +15m
                    </button>
                    <button
                      onClick={() => quickRecordActivity('quran', (getTodayActivity('quran')?.minutes_value || 0) + 30)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      +30m
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Record Activity for {selectedDate === getTodayDate()
                ? 'Today'
                : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
            </h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                📅 Recording for: <strong>{selectedDate}</strong>
                {selectedDate === getTodayDate() && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    TODAY
                  </span>
                )}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Type
                </label>
                <select
                  value={formData.activity_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, activity_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="zikr">📿 Zikr Count</option>
                  <option value="quran">📖 Quran Minutes</option>
                </select>
              </div>
              {formData.activity_type === 'zikr' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.count_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, count_value: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter zikr count"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minutes_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, minutes_value: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter minutes"
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Record Activity for {selectedDate === getTodayDate() ? 'Today' : selectedDate}
              </button>
            </form>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default DailyActivities;
