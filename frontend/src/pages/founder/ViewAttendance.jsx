// filepath: c:\Users\Dr_Shareef\Desktop\Prayer-Tracker\frontend\src\pages\founder\ViewAttendance.jsx
import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

const ViewAttendance = () => {
  const [attendanceData, setAttendanceData] = useState({
    prayers: [],
    stats: {},
    members: []
  });
  const [dateRange, setDateRange] = useState('week');
  const [prayerType, setPrayerType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [expandedMember, setExpandedMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('overview'); // 'overview', 'members', 'heatmap'

  // Generate mock data for this demo
  useEffect(() => {
    setLoading(true);    // Generate member data
    const mockMembers = [
      { id: 1, name: 'Mohamed Rizwan', joinedDate: '2024-03-15', phone: '+94 77 123 4567', attendance: 90 },
      { id: 2, name: 'Ahmed Fazil', joinedDate: '2024-01-20', phone: '+94 76 234 5678', attendance: 85 },
      { id: 3, name: 'Mohammed Farook', joinedDate: '2024-04-05', phone: '+94 71 345 6789', attendance: 70 },
      { id: 4, name: 'Hussain Ismail', joinedDate: '2023-11-28', phone: '+94 75 456 7890', attendance: 95 },
      { id: 5, name: 'Abdul Hameed', joinedDate: '2024-02-10', phone: '+94 70 567 8901', attendance: 65 },
      { id: 6, name: 'Mohamed Imthiaz', joinedDate: '2023-09-15', phone: '+94 72 678 9012', attendance: 88 },
      { id: 7, name: 'Ahamed Niyas', joinedDate: '2024-05-01', phone: '+94 78 789 0123', attendance: 75 }
    ];
    
    // Generate prayer attendance data
    const prayerTypes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', "Jumu'ah"];
    const mockPrayers = [];
    const today = new Date();
    
    // Generate prayer data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const formattedDate = date.toISOString().split('T')[0];
      
      // For each prayer type
      for (const prayerType of prayerTypes) {
        // Only include Jumu'ah for Fridays
        if (prayerType === "Jumu'ah" && date.getDay() !== 5) {
          continue;
        }
        
        // Calculate attendance between 60%-95% with some random variation
        const totalMembers = mockMembers.length;
        const attendanceRate = Math.floor(Math.random() * 36) + 60; // Between 60% and 95%
        const attendanceCount = Math.floor((totalMembers * attendanceRate) / 100);
        
        // Generate random list of member IDs who attended
        const attendees = [];
        const shuffled = [...Array(totalMembers).keys()].map(i => i + 1).sort(() => 0.5 - Math.random());
        for (let j = 0; j < attendanceCount; j++) {
          attendees.push(shuffled[j]);
        }
        
        mockPrayers.push({
          date: formattedDate,
          type: prayerType,
          totalCount: totalMembers,
          attendanceCount: attendanceCount,
          attendanceRate: attendanceRate,
          attendees: attendees
        });
      }
    }
    
    // Generate overall attendance statistics
    const mockStats = {
      dailyAverage: 82,
      weeklyTrend: [78, 80, 85, 79, 83, 88, 82],
      topPrayer: 'Jumu\'ah',
      lowestPrayer: 'Fajr',
      topMembers: mockMembers.sort((a, b) => b.attendance - a.attendance).slice(0, 3),
      totalPrayers: mockPrayers.length
    };
    
    // Filter prayers based on date range
    let filteredPrayers = [...mockPrayers];
    const startDate = new Date(today);
    
    if (dateRange === 'day') {
      startDate.setDate(today.getDate() - 1);
      filteredPrayers = mockPrayers.filter(prayer => 
        new Date(prayer.date) >= startDate
      );
    } else if (dateRange === 'week') {
      startDate.setDate(today.getDate() - 7);
      filteredPrayers = mockPrayers.filter(prayer => 
        new Date(prayer.date) >= startDate
      );
    } else if (dateRange === 'month') {
      startDate.setDate(today.getDate() - 30);
      filteredPrayers = mockPrayers.filter(prayer => 
        new Date(prayer.date) >= startDate
      );
    }
    
    // Filter by prayer type if specified
    if (prayerType !== 'all') {
      filteredPrayers = filteredPrayers.filter(prayer => prayer.type === prayerType);
    }
    
    // Sort by date (newest first)
    filteredPrayers.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add detailed attendance info to members
    const membersWithDetails = mockMembers.map(member => {
      // Calculate attendance rate for this member
      const memberAttendance = filteredPrayers.filter(prayer => 
        prayer.attendees.includes(member.id)
      );
      
      const totalPossiblePrayers = filteredPrayers.length;
      const attendanceRate = totalPossiblePrayers 
        ? Math.round((memberAttendance.length / totalPossiblePrayers) * 100) 
        : 0;
      
      const prayerBreakdown = {};
      prayerTypes.forEach(type => {
        const typePrayers = filteredPrayers.filter(p => p.type === type);
        const attended = typePrayers.filter(p => p.attendees.includes(member.id));
        const rate = typePrayers.length ? Math.round((attended.length / typePrayers.length) * 100) : 0;
        prayerBreakdown[type] = {
          total: typePrayers.length,
          attended: attended.length,
          rate
        };
      });
      
      return {
        ...member,
        attendance: attendanceRate,
        prayers: memberAttendance.length,
        totalPrayers: totalPossiblePrayers,
        prayerBreakdown
      };
    });
    
    setAttendanceData({
      prayers: filteredPrayers,
      stats: mockStats,
      members: membersWithDetails
    });
    
    setMembers(membersWithDetails);
    setLoading(false);
  }, [dateRange, prayerType]);

  // Filter members by search term
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group prayers by date for display
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
  
  const groupedPrayers = groupPrayersByDate(attendanceData.prayers);
  
  // Format date for display
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
  
  // Get attendance rate color class
  const getAttendanceRateColorClass = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Toggle member expansion
  const toggleMemberExpansion = (id) => {
    if (expandedMember === id) {
      setExpandedMember(null);
    } else {
      setExpandedMember(id);
    }
  };
  
  return (
    <FounderLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mosque Attendance</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
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
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="prayerType" className="block text-sm font-medium text-gray-700 mb-1">
                  Prayer
                </label>
                <select
                  id="prayerType"
                  className="border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  value={prayerType}
                  onChange={(e) => setPrayerType(e.target.value)}
                >
                  <option value="all">All Prayers</option>
                  <option value="Fajr">Fajr</option>
                  <option value="Dhuhr">Dhuhr</option>
                  <option value="Asr">Asr</option>
                  <option value="Maghrib">Maghrib</option>
                  <option value="Isha">Isha</option>
                  <option value="Jumu'ah">Jumu'ah</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setView('overview')}
                className={`px-4 py-2 rounded ${
                  view === 'overview' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setView('members')}
                className={`px-4 py-2 rounded ${
                  view === 'members' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Members
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-green-600 h-10 w-10 mb-4"></div>
            <p className="text-gray-500">Loading attendance data...</p>
          </div>
        ) : view === 'overview' ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">Attendance Summary</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Average Attendance</span>
                      <span className={`text-sm font-bold ${getAttendanceRateColorClass(attendanceData.stats.dailyAverage)}`}>
                        {attendanceData.stats.dailyAverage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${attendanceData.stats.dailyAverage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Most Attended</p>
                      <p className="font-bold">{attendanceData.stats.topPrayer}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Least Attended</p>
                      <p className="font-bold">{attendanceData.stats.lowestPrayer}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Total Prayers This Period</p>
                    <p className="text-2xl font-bold text-green-600">{attendanceData.prayers.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">Weekly Trend</h3>
                <div className="flex h-40 items-end justify-between">
                  {attendanceData.stats.weeklyTrend.map((value, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-green-500 w-8 rounded-t"
                        style={{ height: `${value}%` }}
                      ></div>
                      <div className="mt-2 text-xs">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">Top Members</h3>
                <div className="space-y-4">
                  {attendanceData.stats.topMembers.map((member, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.attendance}% attendance</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Attendance By Prayer */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-bold">Daily Attendance</h3>
              </div>
              
              {Object.keys(groupedPrayers).length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No prayer data available for the selected filters.</p>
                </div>
              ) : (
                <div>
                  {Object.keys(groupedPrayers).map(date => (
                    <div key={date} className="border-b last:border-0">
                      <div className="px-6 py-3 bg-gray-50">
                        <h4 className="font-medium text-gray-800">{formatDate(date)}</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Prayer
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Attendance
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rate
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {groupedPrayers[date].map((prayer, idx) => (
                              <tr key={`${date}-${prayer.type}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">{prayer.type}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-gray-500">
                                    {prayer.attendanceCount} / {prayer.totalCount} members
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`font-medium ${getAttendanceRateColorClass(prayer.attendanceRate)}`}>
                                    {prayer.attendanceRate}%
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button className="text-blue-600 hover:text-blue-900">
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Members View */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold mb-4">Member Attendance</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pl-10"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {filteredMembers.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No members found matching your search.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance Rate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prayers Attended
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map((member) => (
                        <React.Fragment key={member.id}>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">Member since {new Date(member.joinedDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`font-medium ${getAttendanceRateColorClass(member.attendance)}`}>
                                {member.attendance}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-500">
                                {member.prayers} / {member.totalPrayers} prayers
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => toggleMemberExpansion(member.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                {expandedMember === member.id ? 'Hide Details' : 'View Details'}
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded Member Details */}
                          {expandedMember === member.id && (
                            <tr>
                              <td colSpan="4" className="px-6 py-4 bg-gray-50">
                                <div className="mb-3">
                                  <h4 className="font-medium mb-2">Contact Information</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-500">Phone</p>
                                      <p>{member.phone}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Prayer Breakdown</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(member.prayerBreakdown).map(([prayer, data]) => (
                                      <div key={prayer} className="bg-white p-2 rounded border">
                                        <div className="font-medium">{prayer}</div>
                                        <div className="flex justify-between text-sm">
                                          <span>{data.attended}/{data.total}</span>
                                          <span className={getAttendanceRateColorClass(data.rate)}>
                                            {data.rate}%
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                          <div 
                                            className="bg-green-600 h-1.5 rounded-full" 
                                            style={{ width: `${data.rate}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </FounderLayout>
  );
};

export default ViewAttendance;