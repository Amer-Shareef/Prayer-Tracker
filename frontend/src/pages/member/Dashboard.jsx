import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';

const Dashboard = () => {
  const [prayerTimes, setPrayerTimes] = useState({
    fajr: '5:03 AM',
    dhuhr: '12:15 PM',
    asr: '3:45 PM',
    maghrib: '7:23 PM',
    isha: '8:53 PM'
  });
  
  const [prayerStatus, setPrayerStatus] = useState({
    fajr: { status: 'pending', prayed: false },
    dhuhr: { status: 'prayed-mosque', prayed: true },
    asr: { status: 'pending', prayed: false },
    maghrib: { status: 'upcoming', prayed: false },
    isha: { status: 'upcoming', prayed: false }
  });
  
  const [stats, setStats] = useState({
    weeklyPercentage: 86,
    monthlyPercentage: 92,
    consecutiveDays: 23
  });
  
  const [currentDate, setCurrentDate] = useState({
    gregorian: 'Thursday, May 8, 2025',
    hijri: '15 Shawwal 1447'
  });
  
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Friday Prayer Time Change',
      content: 'Starting next week, Friday prayers will be at 1:30 PM instead of 1:15 PM.',
      date: '2025-05-07'
    },
    {
      id: 2,
      title: 'Community Iftar',
      content: 'We will be hosting a community iftar on Saturday at 7:30 PM. All are welcome!',
      date: '2025-05-05'
    }
  ]);
  
  const markAsPrayed = (prayer, location) => {
    setPrayerStatus(prev => ({
      ...prev,
      [prayer]: { 
        status: location === 'mosque' ? 'prayed-mosque' : 'prayed-home',
        prayed: true
      }
    }));
  };
  
  const getStatusClass = (status) => {
    switch(status) {
      case 'prayed-mosque':
        return 'bg-green-500 text-white';
      case 'prayed-home':
        return 'bg-blue-500 text-white';
      case 'upcoming':
        return 'bg-gray-200 text-gray-500';
      default:
        return 'bg-gray-200 text-gray-500';
    }
  };
  
  const getStatusText = (status) => {
    switch(status) {
      case 'prayed-mosque':
        return 'Prayed at mosque';
      case 'prayed-home':
        return 'Prayed at home';
      case 'upcoming':
        return 'Coming soon';
      default:
        return 'Mark as prayed';
    }
  };
  
  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Prayer Dashboard</h1>
        
        {/* Today's Prayers */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="text-green-600 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Today, {currentDate.gregorian}</h2>
              <p className="text-gray-600">{currentDate.hijri}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Fajr */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-bold text-lg">Fajr</h3>
                <p className="text-green-600 font-medium">{prayerTimes.fajr}</p>
              </div>
              
              <div className="p-4 bg-gray-50">
                {prayerStatus.fajr.prayed ? (
                  <button className={`w-full py-2 rounded text-sm ${getStatusClass(prayerStatus.fajr.status)}`}>
                    {getStatusText(prayerStatus.fajr.status)}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={() => markAsPrayed('fajr', 'home')}
                      className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
                    >
                      Mark as prayed
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Dhuhr */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-bold text-lg">Dhuhr</h3>
                <p className="text-green-600 font-medium">{prayerTimes.dhuhr}</p>
              </div>
              
              <div className="p-4 bg-gray-50">
                {prayerStatus.dhuhr.prayed ? (
                  <button className={`w-full py-2 rounded text-sm ${getStatusClass(prayerStatus.dhuhr.status)}`}>
                    {getStatusText(prayerStatus.dhuhr.status)}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={() => markAsPrayed('dhuhr', 'home')}
                      className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
                    >
                      Mark as prayed
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Asr */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-bold text-lg">Asr</h3>
                <p className="text-green-600 font-medium">{prayerTimes.asr}</p>
              </div>
              
              <div className="p-4 bg-gray-50">
                {prayerStatus.asr.prayed ? (
                  <button className={`w-full py-2 rounded text-sm ${getStatusClass(prayerStatus.asr.status)}`}>
                    {getStatusText(prayerStatus.asr.status)}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={() => markAsPrayed('asr', 'home')}
                      className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
                    >
                      Mark as prayed
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Maghrib */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-bold text-lg">Maghrib</h3>
                <p className="text-green-600 font-medium">{prayerTimes.maghrib}</p>
              </div>
              
              <div className="p-4 bg-gray-50">
                <button className="w-full py-2 rounded text-sm text-blue-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Coming soon
                </button>
              </div>
            </div>
            
            {/* Isha */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-bold text-lg">Isha</h3>
                <p className="text-green-600 font-medium">{prayerTimes.isha}</p>
              </div>
              
              <div className="p-4 bg-gray-50">
                <button className="w-full py-2 rounded text-sm text-blue-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Coming soon
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <Link to="/member/request-pickup" className="flex items-center w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Request Pickup
              </Link>
              
              <Link to="/member/wakeup" className="flex items-center w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Schedule Wake-up Call
              </Link>
              
              <Link to="/member/mosque" className="flex items-center w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                View Mosque Announcements
              </Link>
            </div>
          </div>
          
          {/* Prayer Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">My Prayer Stats</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">This Week</span>
                  <span className="text-sm font-bold">{stats.weeklyPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${stats.weeklyPercentage}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">This Month</span>
                  <span className="text-sm font-bold">{stats.monthlyPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${stats.monthlyPercentage}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Consecutive Days</span>
                  <span className="text-sm font-bold">{stats.consecutiveDays}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(stats.consecutiveDays / 40) * 100}%` }}></div>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500">Goal: 40 days</div>
              </div>
              
              <div className="pt-2">
                <Link 
                  to="/member/stats"
                  className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center justify-end"
                >
                  View detailed stats
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Mosque Announcements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Mosque Announcements</h2>
            
            {announcements.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No announcements at this time
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <h3 className="font-bold">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 my-1">{announcement.content}</p>
                    <p className="text-xs text-gray-400">{new Date(announcement.date).toLocaleDateString()}</p>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Link 
                    to="/member/mosque"
                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center justify-end"
                  >
                    View all announcements
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Dashboard;