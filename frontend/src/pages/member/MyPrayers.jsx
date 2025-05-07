import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';

const MyPrayers = () => {
  const [prayers, setPrayers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, you would fetch the user's prayers from your API based on filter
    // For now, we'll create some mock data
    setLoading(true);
    
    const mockPrayers = generateMockPrayers();
    
    // Filter by status if needed
    let filteredPrayers = mockPrayers;
    if (filter !== 'all') {
      filteredPrayers = mockPrayers.filter(prayer => prayer.status === filter);
    }
    
    // Filter by date range
    const today = new Date();
    let startDate;
    
    if (dateRange === 'today') {
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (dateRange === 'month') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
    }
    
    if (startDate) {
      filteredPrayers = filteredPrayers.filter(prayer => new Date(prayer.date) >= startDate);
    }
    
    // Sort by date (newest first)
    filteredPrayers.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setPrayers(filteredPrayers);
    setLoading(false);
  }, [filter, dateRange]);
  
  const generateMockPrayers = () => {
    const prayers = [];
    const prayerTypes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      for (const type of prayerTypes) {
        // Randomly generate prayer status
        const random = Math.random();
        let status, location;
        
        if (random < 0.1) {
          status = 'missed';
          location = null;
        } else if (random < 0.6) {
          status = 'prayed';
          location = 'home';
        } else {
          status = 'prayed';
          location = 'mosque';
        }
        
        // Create prayer time
        let time;
        switch(type) {
          case 'Fajr':
            time = '05:30 AM';
            break;
          case 'Dhuhr':
            time = '12:30 PM';
            break;
          case 'Asr':
            time = '03:45 PM';
            break;
          case 'Maghrib':
            time = '07:15 PM';
            break;
          case 'Isha':
            time = '08:45 PM';
            break;
        }
        
        prayers.push({
          id: `prayer-${i}-${type}`,
          type,
          date: date.toISOString().split('T')[0],
          time,
          status,
          location,
          notes: ""
        });
      }
    }
    
    return prayers;
  };
  
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'prayed': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getLocationIcon = (location) => {
    switch(location) {
      case 'mosque': return '🕌';
      case 'home': return '🏠';
      default: return '';
    }
  };
  
  const handlePrayerStatusUpdate = (prayerId, newStatus, location) => {
    setPrayers(prevPrayers => 
      prevPrayers.map(prayer => {
        if (prayer.id === prayerId) {
          return {
            ...prayer,
            status: newStatus,
            location: location || prayer.location
          };
        }
        return prayer;
      })
    );
  };
  
  const groupPrayersByDate = (prayers) => {
    const grouped = {};
    
    for (const prayer of prayers) {
      if (!grouped[prayer.date]) {
        grouped[prayer.date] = [];
      }
      grouped[prayer.date].push(prayer);
    }
    
    return grouped;
  };
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const groupedPrayers = groupPrayersByDate(prayers);

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Prayers</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex space-x-4 mb-4 md:mb-0">
              <div>
                <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status Filter
                </label>
                <select
                  id="filter"
                  className="border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Prayers</option>
                  <option value="prayed">Completed</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  id="dateRange"
                  className="border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
            
            <div>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Download Report
              </button>
            </div>
          </div>
        </div>
        
        {/* Prayer List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-green-600 h-10 w-10 mb-4"></div>
            <p className="text-gray-500">Loading prayers...</p>
          </div>
        ) : prayers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No prayers found</h3>
            <p className="text-gray-500">
              No prayers match your current filters. Try changing your filters or date range.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedPrayers).map(date => (
              <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="text-lg font-medium text-gray-900">
                    {formatDate(date)}
                  </h3>
                </div>
                
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prayer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedPrayers[date].map(prayer => (
                      <tr key={prayer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{prayer.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{prayer.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(prayer.status)}`}>
                            {prayer.status === 'prayed' ? 'Completed' : prayer.status.charAt(0).toUpperCase() + prayer.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">
                            {prayer.location && (
                              <span>
                                {getLocationIcon(prayer.location)} {prayer.location.charAt(0).toUpperCase() + prayer.location.slice(1)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {prayer.status === 'missed' ? (
                            <div className="space-x-2">
                              <button
                                onClick={() => handlePrayerStatusUpdate(prayer.id, 'prayed', 'home')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Mark as prayed
                              </button>
                            </div>
                          ) : prayer.status === 'prayed' ? (
                            <div className="space-x-2">
                              <button
                                onClick={() => handlePrayerStatusUpdate(prayer.id, 'missed', null)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Mark as missed
                              </button>
                              
                              <span className="text-gray-300">|</span>
                              
                              <button
                                onClick={() => handlePrayerStatusUpdate(prayer.id, 'prayed', prayer.location === 'home' ? 'mosque' : 'home')}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                {prayer.location === 'home' ? 'At mosque' : 'At home'}
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
};

export default MyPrayers;