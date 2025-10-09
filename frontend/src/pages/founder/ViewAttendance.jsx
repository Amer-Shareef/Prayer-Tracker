// filepath: c:\Users\Dr_Shareef\Desktop\Prayer-Tracker\frontend\src\pages\founder\ViewAttendance.jsx
import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

// Simple Tooltip Component
const Tooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 px-3 py-2 text-xs text-white bg-gray-800 rounded-md shadow-lg -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {text}
          <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
  const pageNumbers = [];
  const maxPagesToShow = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> members
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}
        
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === number
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {number}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const ViewAttendance = () => {
  const [role, setRole] = useState('founder');
  const [overviewData, setOverviewData] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detailed analytics filters
  const [timePeriod, setTimePeriod] = useState('7'); // '7', '30', '180', '365'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const founderAreaInfo = {
    name: "Downtown Masjid",
    id: 1,
    totalMembers: 50
  };

  const timePeriodOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '180', label: 'Last 6 Months' },
    { value: '365', label: 'Last Year' }
  ];

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (role === 'superadmin') {
        const globalOverview = {
          prayerAttendanceRate: {
            percentage: 80,
            count: 800,
            total: 1000,
            tooltip: "Total prayers logged today ÷ (members × 5 prayers)"
          },
          topPerformingArea: {
            name: "Downtown Masjid",
            percentage: 85,
            tooltip: "Area with highest attendance in last 7 days"
          },
          consistencyScore: {
            percentage: 75,
            count: 150,
            total: 200,
            tooltip: "Members who prayed at least once on 4+ days (last 7 days)"
          },
          fajrChallengeRate: {
            percentage: 65,
            count: 130,
            total: 200,
            tooltip: "Members who prayed Fajr today"
          },
          prayerBreakdown: {
            fajr: { todayCount: 130, todayPercent: 65, weekPercent: 62, monthPercent: 60 },
            dhuhr: { todayCount: 165, todayPercent: 82, weekPercent: 80, monthPercent: 78 },
            asr: { todayCount: 170, todayPercent: 85, weekPercent: 83, monthPercent: 81 },
            maghrib: { todayCount: 180, todayPercent: 90, weekPercent: 88, monthPercent: 86 },
            isha: { todayCount: 175, todayPercent: 87, weekPercent: 85, monthPercent: 83 }
          },
          areas: generateAreaData(8)
        };
        setOverviewData(globalOverview);
      } else {
        const founderOverview = {
          areaInfo: founderAreaInfo,
          todayAttendance: {
            percentage: 78,
            count: 156,
            total: 200,
            tooltip: "Total prayers logged today ÷ (50 members × 5 prayers)"
          },
          areaRank: {
            position: 2,
            totalAreas: 8,
            percentage: 78,
            tooltip: "Ranking based on last 7 days attendance"
          },
          consistencyScore: {
            count: 12,
            members: ['Ahmad', 'Fatima', 'Yusuf', 'Aisha', 'Omar', 'Zainab'],
            tooltip: "Members with at least one prayer on 4+ days (last 7 days)"
          },
          needsOutreach: {
            count: 5,
            members: [
              { id: 15, name: 'Abdullah', daysActive: 1 },
              { id: 23, name: 'Ibrahim', daysActive: 0 },
              { id: 31, name: 'Ismail', daysActive: 1 }
            ],
            tooltip: "Members with prayer activity on fewer than 2 days (last 7 days)"
          },
          prayerBreakdown: {
            fajr: { todayCount: 30, todayPercent: 60, weekPercent: 58, monthPercent: 55 },
            dhuhr: { todayCount: 41, todayPercent: 82, weekPercent: 80, monthPercent: 78 },
            asr: { todayCount: 42, todayPercent: 84, weekPercent: 82, monthPercent: 80 },
            maghrib: { todayCount: 45, todayPercent: 90, weekPercent: 88, monthPercent: 86 },
            isha: { todayCount: 43, todayPercent: 86, weekPercent: 84, monthPercent: 82 }
          }
        };
        setOverviewData(founderOverview);
      }
      
      setDetailedData({
        members: generateMemberData(150, parseInt(timePeriod)),
        dailyBreakdown: generateDailyBreakdown(parseInt(timePeriod)),
        monthComparison: {
          lastMonth: { overallAttendance: 72, fajrAttendance: 55, consistentMembers: 25 },
          thisMonth: { overallAttendance: 78, fajrAttendance: 62, consistentMembers: 30 },
          change: { overallAttendance: 6, fajrAttendance: 7, consistentMembers: 5 }
        }
      });
      
      setLoading(false);
    };
    
    fetchAttendanceData();
  }, [role, timePeriod]);

  // Reset to page 1 when search term or time period changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, timePeriod]);

  const generateAreaData = (count) => {
    const areaNames = [
      'Downtown Masjid', 'Westside Center', 'Eastside Mosque', 'North Point',
      'South Valley', 'Central Community', 'Riverside Masjid', 'Hilltop Center'
    ];
    
    return Array.from({ length: count }, (_, i) => {
      const todayPercent = Math.floor(Math.random() * 30) + 65;
      const weekPercent = Math.floor(Math.random() * 30) + 60;
      const monthPercent = Math.floor(Math.random() * 30) + 55;
      const lastWeekPercent = weekPercent + (Math.floor(Math.random() * 21) - 10);
      
      return {
        id: i + 1,
        name: areaNames[i],
        members: Math.floor(Math.random() * 50) + 20,
        todayPercent,
        weekPercent,
        monthPercent,
        trend: weekPercent > lastWeekPercent ? 'up' : weekPercent < lastWeekPercent ? 'down' : 'stable',
        fajrPercent: Math.floor(Math.random() * 30) + 50
      };
    }).sort((a, b) => b.weekPercent - a.weekPercent);
  };

  const generateMemberData = (count, days) => {
    const names = [
      'Ahmad Hassan', 'Fatima Ali', 'Yusuf Ahmed', 'Aisha Khan', 'Omar Farooq',
      'Zainab Rahman', 'Ibrahim Malik', 'Khadija Siddique', 'Abdullah Rizwan',
      'Maryam Hussain', 'Bilal Imran', 'Hafsa Tariq', 'Usman Khalil', 'Ruqayyah Shareef',
      'Hamza Ismail', 'Sumayya Jamil', 'Zayd Rashid', 'Asma Fazil', 'Talha Niyas',
      'Safiya Hameed', 'Khalid Faisal', 'Layla Aziz', 'Saeed Iqbal', 'Noor Abbas',
      'Tariq Yousuf', 'Haleema Mustafa', 'Fahad Karim', 'Ayesha Naz', 'Rashid Akram',
      'Umm Kulthum', 'Qasim Zahir', 'Rabia Ghani', 'Idris Majid', 'Amina Latif',
      'Dawud Anwar', 'Zahra Bashir', 'Yahya Saleem', 'Huda Nasir', 'Muadh Aslam',
      'Safia Hashim', 'Anas Farhan', 'Mariam Yusuf', 'Hassan Mahmood', 'Salma Akhtar',
      'Umar Siddiqui', 'Halima Begum', 'Bilal Raza', 'Nadia Hussain', 'Ismail Kazmi',
      'Nusrat Jahan', 'Farid Ahmed', 'Samira Begum', 'Rashid Ali', 'Amira Khan',
      'Junaid Hassan', 'Saima Malik', 'Tariq Mahmood', 'Hina Fatima', 'Asad Iqbal',
      'Lubna Yasmin', 'Imran Rashid', 'Naila Hussain', 'Rizwan Farooq', 'Shazia Akhtar',
      'Kamran Siddiqui', 'Aysha Begum', 'Faisal Karim', 'Nida Khan', 'Arif Mahmood',
      'Sumaira Ali', 'Naveed Ahmed', 'Raheela Hussain', 'Shahid Iqbal', 'Saba Malik',
      'Adil Hassan', 'Memoona Fatima', 'Jawad Rashid', 'Uzma Yasmin', 'Nasir Ali',
      'Farzana Khan', 'Salman Farooq', 'Shagufta Begum', 'Waqas Ahmed', 'Nighat Hussain',
      'Pervez Iqbal', 'Shabana Malik', 'Tanvir Hassan', 'Bushra Fatima', 'Aamir Rashid',
      'Fozia Yasmin', 'Majid Ali', 'Razia Khan', 'Javed Farooq', 'Sultana Begum',
      'Nadeem Ahmed', 'Tasneem Hussain', 'Irfan Iqbal', 'Shahnaz Malik', 'Zahid Hassan',
      'Nasreen Fatima', 'Shakeel Rashid', 'Parveen Yasmin', 'Iftikhar Ali', 'Sabiha Khan',
      'Azhar Farooq', 'Yasmin Begum', 'Mohsin Ahmed', 'Rubina Hussain', 'Khalil Iqbal',
      'Rahila Malik', 'Farhan Hassan', 'Naseem Fatima', 'Ashraf Rashid', 'Shamim Yasmin',
      'Hanif Ali', 'Mumtaz Khan', 'Jameel Farooq', 'Kausar Begum', 'Anwar Ahmed',
      'Shaheen Hussain', 'Rafiq Iqbal', 'Farida Malik', 'Mushtaq Hassan', 'Zarqa Fatima',
      'Rasheed Ali', 'Sajida Khan', 'Munir Farooq', 'Tahira Begum', 'Liaqat Ahmed',
      'Shazia Hussain', 'Ghulam Iqbal', 'Nargis Malik', 'Bashir Hassan', 'Saeeda Fatima',
      'Mazhar Rashid', 'Rafia Yasmin', 'Sabir Ali', 'Shameem Khan', 'Akhtar Farooq',
      'Zubaida Begum', 'Hameed Ahmed', 'Ruksana Hussain', 'Afzal Iqbal', 'Shahida Malik',
      'Zaheer Hassan', 'Shakeela Fatima', 'Akram Rashid', 'Fauzia Yasmin', 'Liaquat Ali'
    ];
    
    const maxDaysActive = Math.min(days, 365);
    
    return Array.from({ length: count }, (_, i) => {
      const daysActive = Math.floor(Math.random() * (maxDaysActive + 1));
      const totalPossiblePrayers = days * 5;
      const attendedPrayers = Math.floor(Math.random() * (daysActive * 5 + 1));
      const weekPercentage = Math.floor((attendedPrayers / totalPossiblePrayers) * 100);
      
      const todayPrayers = Math.floor(Math.random() * 6);
      const fajrCount = Math.floor(Math.random() * (Math.min(days, 7) + 1));
      
      return {
        id: i + 1,
        name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''),
        weekPercentage,
        todayPrayers,
        fajrThisWeek: fajrCount,
        daysActive,
        totalDays: days,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        phone: `+94 ${70 + Math.floor(Math.random() * 9)} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`
      };
    }).sort((a, b) => b.weekPercentage - a.weekPercentage);
  };

  const generateDailyBreakdown = (days) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    
    // For large time periods, show weekly aggregates instead of daily
    if (days > 30) {
      const weeks = Math.ceil(days / 7);
      return Array.from({ length: weeks }, (_, i) => {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - ((weeks - i) * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const fajr = Math.floor(Math.random() * 25) + 55;
        const dhuhr = Math.floor(Math.random() * 20) + 75;
        const asr = Math.floor(Math.random() * 20) + 75;
        const maghrib = Math.floor(Math.random() * 15) + 80;
        const isha = Math.floor(Math.random() * 20) + 75;
        
        return {
          day: `Week ${weeks - i}`,
          date: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          totalPercentage: Math.floor((fajr + dhuhr + asr + maghrib + isha) / 5),
          fajr, dhuhr, asr, maghrib, isha
        };
      });
    }
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - 1 - i));
      
      const fajr = Math.floor(Math.random() * 25) + 55;
      const dhuhr = Math.floor(Math.random() * 20) + 75;
      const asr = Math.floor(Math.random() * 20) + 75;
      const maghrib = Math.floor(Math.random() * 15) + 80;
      const isha = Math.floor(Math.random() * 20) + 75;
      
      return {
        day: dayNames[date.getDay()],
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalPercentage: Math.floor((fajr + dhuhr + asr + maghrib + isha) / 5),
        fajr, dhuhr, asr, maghrib, isha
      };
    });
  };

  const getColorClass = (percentage) => {
    if (percentage >= 80) return 'text-green-700 bg-green-50';
    if (percentage >= 60) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Filter and paginate members
  const filteredMembers = detailedData?.members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-green-600 h-12 w-12"></div>
            <p className="mt-4 text-gray-600">Loading attendance data...</p>
          </div>
        </div>
      </FounderLayout>
    );
  }

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
              <div className="mt-2 flex items-center space-x-3">
                {role === 'founder' && overviewData?.areaInfo && (
                  <>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-800 border border-green-200">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {overviewData.areaInfo.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {overviewData.areaInfo.totalMembers} members
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-1 inline-flex">
              <button
                onClick={() => setRole('founder')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  role === 'founder'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Founder View
              </button>
              <button
                onClick={() => setRole('superadmin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  role === 'superadmin'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                SuperAdmin View
              </button>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-1 inline-flex border border-gray-200">
          <button
            onClick={() => setView('overview')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'overview'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('detailed')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'detailed'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Detailed Analytics
          </button>
        </div>

        {view === 'overview' ? (
          role === 'superadmin' ? (
            /* ==================== SUPERADMIN OVERVIEW ==================== */
            <div className="space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Tooltip text={overviewData.prayerAttendanceRate.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Prayer Attendance</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {overviewData.prayerAttendanceRate.percentage}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {overviewData.prayerAttendanceRate.count}/{overviewData.prayerAttendanceRate.total} prayers today
                    </p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.topPerformingArea.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-green-900">Top Area (7 days)</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {overviewData.topPerformingArea.name}
                    </div>
                    <p className="text-xs text-gray-600">
                      {overviewData.topPerformingArea.percentage}% attendance
                    </p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.consistencyScore.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Consistency (7 days)</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {overviewData.consistencyScore.percentage}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {overviewData.consistencyScore.count}/{overviewData.consistencyScore.total} prayed 4+ days
                    </p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.fajrChallengeRate.tooltip}>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-400 shadow-md hover:shadow-lg transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-green-900">🌅 Fajr Today</h3>
                      <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-1">
                      {overviewData.fajrChallengeRate.percentage}%
                    </div>
                    <p className="text-xs text-green-800">
                      {overviewData.fajrChallengeRate.count}/{overviewData.fajrChallengeRate.total} members
                    </p>
                  </div>
                </Tooltip>
              </div>

              {/* Prayer Breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Prayer Time Breakdown</h2>
                  <span className="text-xs text-gray-500">7d = last 7 days | 30d = last 30 days</span>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(overviewData.prayerBreakdown).map(([prayer, data]) => (
                    <Tooltip key={prayer} text={`Today: ${data.todayPercent}% | 7d: ${data.weekPercent}% | 30d: ${data.monthPercent}%`}>
                      <div
                        className={`rounded-lg p-4 cursor-help transition-all hover:scale-105 ${
                          prayer === 'fajr'
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-sm font-medium mb-2 ${
                            prayer === 'fajr' ? 'text-green-900' : 'text-gray-700'
                          }`}>
                            {prayer === 'fajr' && '🌅 '}
                            {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-2xl font-bold text-gray-900">{data.todayPercent}%</div>
                            <div className="text-xs text-gray-500">Today ({data.todayCount})</div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>7d</span>
                                <span>{data.weekPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${getProgressColor(data.weekPercent)}`}
                                  style={{ width: `${data.weekPercent}%` }}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>30d</span>
                                <span>{data.monthPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${getProgressColor(data.monthPercent)}`}
                                  style={{ width: `${data.monthPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Area Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Area Performance (Last 7 Days)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Area</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Members</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Today</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">7 Days</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">30 Days</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">🌅 Fajr</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {overviewData.areas.map((area, index) => (
                        <tr key={area.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-200 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-50 text-gray-500'
                            }`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{area.members}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(area.todayPercent)}`}>
                              {area.todayPercent}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(area.weekPercent)}`}>
                              {area.weekPercent}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(area.monthPercent)}`}>
                              {area.monthPercent}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(area.fajrPercent)}`}>
                              {area.fajrPercent}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {area.trend === 'up' && <span className="text-green-600 text-xl">↑</span>}
                            {area.trend === 'down' && <span className="text-red-600 text-xl">↓</span>}
                            {area.trend === 'stable' && <span className="text-gray-400 text-xl">→</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== FOUNDER OVERVIEW ==================== */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Tooltip text={overviewData.todayAttendance.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Today's Attendance</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {overviewData.todayAttendance.percentage}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {overviewData.todayAttendance.count}/{overviewData.todayAttendance.total} prayers
                    </p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.areaRank.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-green-900">Rank (7 days)</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-900">#{overviewData.areaRank.position}</span>
                      <span className="text-lg text-gray-600">/ {overviewData.areaRank.totalAreas}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{overviewData.areaRank.percentage}%</p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.consistencyScore.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Consistent (7d)</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {overviewData.consistencyScore.count}
                    </div>
                    <div className="flex -space-x-2">
                      {overviewData.consistencyScore.members.slice(0, 5).map((name, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs font-medium text-green-800">
                          {name[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.needsOutreach.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-red-900">Needs Outreach</h3>
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {overviewData.needsOutreach.count}
                    </div>
                    <button className="w-full px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors">
                      View Members
                    </button>
                  </div>
                </Tooltip>
              </div>

              {/* Prayer Breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Prayer Performance</h2>
                  <span className="text-xs text-gray-500">7d = last 7 days | 30d = last 30 days</span>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(overviewData.prayerBreakdown).map(([prayer, data]) => (
                    <Tooltip key={prayer} text={`Today: ${data.todayPercent}% | 7d: ${data.weekPercent}% | 30d: ${data.monthPercent}%`}>
                      <div
                        className={`rounded-lg p-4 cursor-help transition-all hover:scale-105 ${
                          prayer === 'fajr'
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`text-sm font-medium mb-2 ${
                            prayer === 'fajr' ? 'text-green-900' : 'text-gray-700'
                          }`}>
                            {prayer === 'fajr' && '🌅 '}
                            {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                          </div>
                          
                          <div className="mb-3">
                            <div className="text-2xl font-bold text-gray-900">{data.todayPercent}%</div>
                            <div className="text-xs text-gray-500">Today ({data.todayCount})</div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>7d</span>
                                <span>{data.weekPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${getProgressColor(data.weekPercent)}`} style={{ width: `${data.weekPercent}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>30d</span>
                                <span>{data.monthPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${getProgressColor(data.monthPercent)}`} style={{ width: `${data.monthPercent}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          /* ==================== DETAILED ANALYTICS WITH FILTERS & PAGINATION ==================== */
          <div className="space-y-6">
            {/* Time Period Filter */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Time Period</h3>
                <div className="flex space-x-2">
                  {timePeriodOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimePeriod(option.value)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        timePeriod === option.value
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Member List with Pagination */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Member Attendance ({timePeriodOptions.find(o => o.value === timePeriod)?.label})
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Showing {filteredMembers.length} members
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {filteredMembers.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-600">No members found matching "{searchTerm}"</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Member</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            {timePeriod}d %
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Today</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            🌅 Fajr ({Math.min(parseInt(timePeriod), 7)}d)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Days Active
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-medium text-sm">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                  <div className="text-xs text-gray-500">{member.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getColorClass(member.weekPercentage)}`}>
                                {member.weekPercentage}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.todayPrayers}/5
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.fajrThisWeek}/{Math.min(parseInt(timePeriod), 7)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.daysActive}/{member.totalDays}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {member.trend === 'up' && <span className="text-green-600 text-xl">↑</span>}
                              {member.trend === 'down' && <span className="text-red-600 text-xl">↓</span>}
                              {member.trend === 'stable' && <span className="text-gray-400 text-xl">→</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={filteredMembers.length}
                    />
                  )}
                </>
              )}
            </div>

            {/* Daily/Weekly Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {parseInt(timePeriod) > 30 ? 'Weekly' : 'Daily'} Prayer Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                        {parseInt(timePeriod) > 30 ? 'Week' : 'Day'}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total %</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">🌅 Fajr</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Dhuhr</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Asr</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Maghrib</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Isha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedData.dailyBreakdown.slice(0, 10).map((day, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{day.day}</div>
                            <div className="text-xs text-gray-500">{day.date}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getColorClass(day.totalPercentage)}`}>
                            {day.totalPercentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{day.fajr}%</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{day.dhuhr}%</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{day.asr}%</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{day.maghrib}%</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{day.isha}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {detailedData.dailyBreakdown.length > 10 && (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Showing first 10 of {detailedData.dailyBreakdown.length} {parseInt(timePeriod) > 30 ? 'weeks' : 'days'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default ViewAttendance;
