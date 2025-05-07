import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';

const MyStats = () => {
  const [statistics, setStatistics] = useState({
    weeklyStats: {
      total: 35,
      performed: 30,
      percentage: 85.71
    },
    monthlyStats: {
      total: 150,
      performed: 138,
      percentage: 92.0
    },
    consecutiveDays: 23,
    prayerStats: {
      Fajr: { performed: 19, total: 30, percentage: 63.33 },
      Dhuhr: { performed: 28, total: 30, percentage: 93.33 },
      Asr: { performed: 27, total: 30, percentage: 90.00 },
      Maghrib: { performed: 30, total: 30, percentage: 100.00 },
      Isha: { performed: 26, total: 30, percentage: 86.67 }
    },
    locationStats: {
      mosque: 65,
      home: 73
    },
    monthlyHistory: [
      { month: 'Jan', percentage: 78 },
      { month: 'Feb', percentage: 82 },
      { month: 'Mar', percentage: 90 },
      { month: 'Apr', percentage: 88 },
      { month: 'May', percentage: 92 }
    ],
    achievements: [
      { name: '7 Day Streak', completed: true, progress: 100 },
      { name: '30 Day Streak', completed: false, progress: 76.67 },
      { name: '40 Day Streak', completed: false, progress: 57.50 },
      { name: 'Perfect Week', completed: false, progress: 85.71 },
      { name: 'All Prayers at Mosque', completed: false, progress: 47.10 }
    ]
  });
  
  const [timeframe, setTimeframe] = useState('month');
  
  useEffect(() => {
    // In a real app, you would fetch this data from your API
    // For now, we'll use the static data defined above
  }, []);
  
  // Helper function to generate chart data for the heatmap
  const generateHeatmapData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    // Create an array of the last 4 weeks (28 days)
    const heatmapData = [];
    
    for (let week = 0; week < 4; week++) {
      const weekData = {
        weekNum: 4 - week,
        days: []
      };
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayData = {
          day: days[dayIndex],
          prayers: {}
        };
        
        for (let prayer of prayers) {
          // Generate random prayer attendance (0-2)
          // 0 = missed, 1 = prayed at home, 2 = prayed at mosque
          const random = Math.random();
          let status;
          
          if (random < 0.15) {
            status = 0; // missed
          } else if (random < 0.55) {
            status = 1; // home
          } else {
            status = 2; // mosque
          }
          
          dayData.prayers[prayer] = status;
        }
        
        weekData.days.push(dayData);
      }
      
      heatmapData.push(weekData);
    }
    
    return heatmapData;
  };
  
  const getHeatmapCellColor = (status) => {
    switch(status) {
      case 0: return 'bg-red-200';
      case 1: return 'bg-blue-200';
      case 2: return 'bg-green-200';
      default: return 'bg-gray-100';
    }
  };
  
  const getHeatmapCellText = (status) => {
    switch(status) {
      case 0: return '✗';
      case 1: return 'H';
      case 2: return 'M';
      default: return '';
    }
  };

  const heatmapData = generateHeatmapData();

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Prayer Statistics</h1>
        
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Weekly Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-2">Weekly Performance</h2>
            <div className="flex items-center mb-2">
              <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-green-600 h-4 rounded-full" 
                  style={{ width: `${statistics.weeklyStats.percentage}%` }}
                ></div>
              </div>
              <span className="text-lg font-bold">
                {statistics.weeklyStats.percentage}%
              </span>
            </div>
            <p className="text-gray-600">
              {statistics.weeklyStats.performed} of {statistics.weeklyStats.total} prayers
            </p>
          </div>
          
          {/* Monthly Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-2">Monthly Performance</h2>
            <div className="flex items-center mb-2">
              <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-green-600 h-4 rounded-full" 
                  style={{ width: `${statistics.monthlyStats.percentage}%` }}
                ></div>
              </div>
              <span className="text-lg font-bold">
                {statistics.monthlyStats.percentage}%
              </span>
            </div>
            <p className="text-gray-600">
              {statistics.monthlyStats.performed} of {statistics.monthlyStats.total} prayers
            </p>
          </div>
          
          {/* Consecutive Days */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-2">Consecutive Days</h2>
            <div className="flex items-center mb-2">
              <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-green-600 h-4 rounded-full" 
                  style={{ width: `${(statistics.consecutiveDays / 40) * 100}%` }}
                ></div>
              </div>
              <span className="text-lg font-bold">
                {statistics.consecutiveDays}
              </span>
            </div>
            <p className="text-gray-600">
              Goal: 40 consecutive days
            </p>
          </div>
        </div>
        
        {/* Prayer Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Prayer Performance by Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(statistics.prayerStats).map(([prayer, stats]) => (
              <div key={prayer} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2">{prayer}</h3>
                
                <div className="flex items-center mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                    <div 
                      className="bg-green-600 h-4 rounded-full" 
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold">
                    {stats.percentage}%
                  </span>
                </div>
                
                <p className="text-sm text-gray-600">
                  {stats.performed} of {stats.total}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Location Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Location Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Prayer Location</h2>
            
            <div className="flex items-center mb-4">
              <div className="w-full bg-blue-200 rounded-full h-6">
                <div 
                  className="bg-green-500 h-6 rounded-l-full" 
                  style={{ width: `${(statistics.locationStats.mosque / (statistics.locationStats.mosque + statistics.locationStats.home)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Mosque: {statistics.locationStats.mosque} prayers</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-200 rounded-full mr-2"></div>
                <span>Home: {statistics.locationStats.home} prayers</span>
              </div>
            </div>
          </div>
          
          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Monthly Trends</h2>
            
            <div className="flex h-40 items-end justify-between">
              {statistics.monthlyHistory.map((month, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-green-500 w-10 rounded-t"
                    style={{ height: `${month.percentage}%` }}
                  ></div>
                  <div className="mt-2 text-xs">{month.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Attendance Heatmap */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Prayer Attendance Heatmap</h2>
          
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <div className="text-sm text-gray-500">Last 4 weeks</div>
              <div className="flex space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-200 mr-1"></div>
                  <span>Mosque</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-200 mr-1"></div>
                  <span>Home</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-200 mr-1"></div>
                  <span>Missed</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs">
                  <th className="pb-2 w-16">Week</th>
                  <th className="pb-2 w-16">Day</th>
                  <th className="pb-2 w-20 text-center">Fajr</th>
                  <th className="pb-2 w-20 text-center">Dhuhr</th>
                  <th className="pb-2 w-20 text-center">Asr</th>
                  <th className="pb-2 w-20 text-center">Maghrib</th>
                  <th className="pb-2 w-20 text-center">Isha</th>
                </tr>
              </thead>
              
              <tbody>
                {heatmapData.map((week) => (
                  week.days.map((day, dayIndex) => (
                    <tr key={`${week.weekNum}-${dayIndex}`}>
                      {dayIndex === 0 && (
                        <td 
                          rowSpan={7}
                          className="text-xs font-medium text-gray-500 align-top pt-2"
                        >
                          Week {week.weekNum}
                        </td>
                      )}
                      <td className="py-1 text-xs text-gray-500">{day.day}</td>
                      {Object.entries(day.prayers).map(([prayer, status], i) => (
                        <td key={`${prayer}-${i}`} className="py-1">
                          <div className={`w-8 h-8 mx-auto rounded-md flex items-center justify-center text-xs ${getHeatmapCellColor(status)}`}>
                            {getHeatmapCellText(status)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Achievements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Prayer Achievements</h2>
          
          <div className="space-y-4">
            {statistics.achievements.map((achievement, index) => (
              <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between mb-1">
                  <h3 className="font-medium">{achievement.name}</h3>
                  <span className={`font-medium ${achievement.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {achievement.completed ? 'Completed!' : `${achievement.progress}%`}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${achievement.completed ? 'bg-green-600' : 'bg-blue-500'} h-2 rounded-full`}
                    style={{ width: `${achievement.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default MyStats;