// filepath: c:\Users\Dr_Shareef\Desktop\Prayer-Tracker\frontend\src\pages\founder\ViewAttendance.jsx
import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

// Simple Tooltip Component with higher z-index
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
        <div className="absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
          {text}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};

// Prayer Dots Component
const PrayerDots = ({ prayers }) => {
  const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  
  return (
    <div className="flex items-center space-x-1">
      {prayerOrder.map((prayer) => (
        <Tooltip key={prayer} text={prayer.charAt(0).toUpperCase() + prayer.slice(1)}>
          <div
            className={`w-2 h-2 rounded-full ${
              prayers[prayer] ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        </Tooltip>
      ))}
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
  const [timePeriod, setTimePeriod] = useState('7');
  const [selectedArea, setSelectedArea] = useState('all');
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

  // Get period label for column header
  const getPeriodLabel = () => {
    const option = timePeriodOptions.find(opt => opt.value === timePeriod);
    return option ? option.label : 'Period';
  };

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (role === 'superadmin') {
        const globalOverview = {
          areaInfo: founderAreaInfo,
          yesterdayAttendanceRate: {
            percentage: 82,
            count: 820,
            total: 1000,
            tooltip: "Total prayers logged yesterday across ALL areas ÷ (total members × 5)"
          },
          topPerformingArea: {
            name: "Downtown Masjid",
            percentage: 85,
            tooltip: "Area with highest weighted score (last 7 days)"
          },
          newMembers: {
            count: 23,
            total: 200,
            tooltip: "Members who joined in the last 30 days across all areas"
          },
          avgAttendanceRate: {
            percentage: 78,
            tooltip: "Average attendance rate across all areas (last 7 days)"
          },
          prayerBreakdown: {
            fajr: { yesterdayCount: 135, yesterdayPercent: 67, weekPercent: 62, monthPercent: 60 },
            dhuhr: { yesterdayCount: 168, yesterdayPercent: 84, weekPercent: 80, monthPercent: 78 },
            asr: { yesterdayCount: 172, yesterdayPercent: 86, weekPercent: 83, monthPercent: 81 },
            maghrib: { yesterdayCount: 182, yesterdayPercent: 91, weekPercent: 88, monthPercent: 86 },
            isha: { yesterdayCount: 178, yesterdayPercent: 89, weekPercent: 85, monthPercent: 83 }
          },
          areas: generateAreaData(8)
        };
        setOverviewData(globalOverview);
      } else {
        const founderOverview = {
          areaInfo: founderAreaInfo,
          yesterdayAttendance: {
            percentage: 80,
            count: 160,
            total: 200,
            tooltip: "Total prayers logged yesterday in YOUR area ÷ (50 members × 5)"
          },
          areaRank: {
            position: 2,
            totalAreas: 8,
            percentage: 78,
            tooltip: "Your area's weighted ranking (last 7 days)"
          },
          newMembers: {
            count: 5,
            total: 50,
            tooltip: "Members who joined your area in the last 30 days"
          },
          weeklyAttendance: {
            percentage: 76,
            tooltip: "Average attendance rate for your area (last 7 days)"
          },
          prayerBreakdown: {
            fajr: { yesterdayCount: 32, yesterdayPercent: 64, weekPercent: 58, monthPercent: 55 },
            dhuhr: { yesterdayCount: 42, yesterdayPercent: 84, weekPercent: 80, monthPercent: 78 },
            asr: { yesterdayCount: 43, yesterdayPercent: 86, weekPercent: 82, monthPercent: 80 },
            maghrib: { yesterdayCount: 46, yesterdayPercent: 92, weekPercent: 88, monthPercent: 86 },
            isha: { yesterdayCount: 44, yesterdayPercent: 88, weekPercent: 84, monthPercent: 82 }
          }
        };
        setOverviewData(founderOverview);
      }
      
      const membersData = role === 'superadmin' && selectedArea !== 'all'
        ? generateMemberData(25, parseInt(timePeriod), selectedArea)
        : generateMemberData(150, parseInt(timePeriod));
      
      setDetailedData({
        members: membersData,
        areas: role === 'superadmin' ? generateAreaData(8) : []
      });
      
      setLoading(false);
    };
    
    fetchAttendanceData();
  }, [role, timePeriod, selectedArea]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, timePeriod, selectedArea]);

  useEffect(() => {
    if (role === 'founder') {
      setSelectedArea('all');
    }
  }, [role]);

  const generateAreaData = (count) => {
    const areaNames = [
      'Downtown Masjid', 'Westside Center', 'Eastside Mosque', 'North Point',
      'South Valley', 'Central Community', 'Riverside Masjid', 'Hilltop Center'
    ];
    
    const areas = Array.from({ length: count }, (_, i) => {
      const members = Math.floor(Math.random() * 50) + 20;
      const yesterdayPercent = Math.floor(Math.random() * 30) + 65;
      const weekPercent = Math.floor(Math.random() * 30) + 60;
      const monthPercent = Math.floor(Math.random() * 30) + 55;
      const fajrPercent = Math.floor(Math.random() * 30) + 50;
      
      const consistencyBonus = (yesterdayPercent + fajrPercent) / 2;
      const weightedScore = (weekPercent * 0.7) + (consistencyBonus * 0.3);
      
      return {
        id: i + 1,
        name: areaNames[i],
        members,
        yesterdayPercent,
        weekPercent,
        monthPercent,
        fajrPercent,
        weightedScore: Math.round(weightedScore)
      };
    });
    
    return areas.sort((a, b) => b.weightedScore - a.weightedScore);
  };

  const generateMemberData = (count, days, areaFilter = null) => {
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
      const periodPercentage = Math.floor((attendedPrayers / totalPossiblePrayers) * 100);
      
      const yesterdayPrayers = {
        fajr: Math.random() > 0.4,
        dhuhr: Math.random() > 0.2,
        asr: Math.random() > 0.2,
        maghrib: Math.random() > 0.1,
        isha: Math.random() > 0.2
      };
      
      const fajrCount = Math.floor(Math.random() * (days + 1));
      
      return {
        id: i + 1,
        name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''),
        periodPercentage,
        yesterdayPrayers,
        fajrCount,
        totalDays: days,
        areaId: areaFilter ? parseInt(areaFilter) : Math.floor(Math.random() * 8) + 1,
        phone: `+94 ${70 + Math.floor(Math.random() * 9)} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`
      };
    }).sort((a, b) => b.periodPercentage - a.periodPercentage);
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

  // Download report handler
  const handleDownloadReport = (member) => {
    console.log('Downloading report for:', {
      memberId: member.id,
      memberName: member.name,
      attendance: member.periodPercentage,
      period: getPeriodLabel(),
      yesterdayPrayers: member.yesterdayPrayers,
      fajrCount: member.fajrCount,
      totalDays: member.totalDays,
      phone: member.phone
    });
  };

  let filteredMembers = detailedData?.members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (role === 'superadmin' && selectedArea !== 'all') {
    filteredMembers = filteredMembers.filter(member => 
      member.areaId === parseInt(selectedArea)
    );
  }

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
        {/* Header with Role and Area Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
              <div className="mt-2 flex items-center space-x-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200">
                  {role === 'superadmin' ? '👑 SuperAdmin' : '📍 Area Founder'}
                </span>
                {overviewData?.areaInfo && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-800 border border-green-200">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {overviewData.areaInfo.name}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-lg shadow-sm p-1 inline-flex border border-gray-200">
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

              <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                <button
                  onClick={() => setRole('founder')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    role === 'founder'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Founder
                </button>
                <button
                  onClick={() => setRole('superadmin')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    role === 'superadmin'
                      ? 'bg-white text-gray-900 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  SuperAdmin
                </button>
              </div>
            </div>
          </div>
        </div>

        {view === 'overview' ? (
          role === 'superadmin' ? (
            /* ==================== SUPERADMIN OVERVIEW ==================== */
            <div className="space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Tooltip text={overviewData.yesterdayAttendanceRate.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Yesterday</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {overviewData.yesterdayAttendanceRate.percentage}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {overviewData.yesterdayAttendanceRate.count}/{overviewData.yesterdayAttendanceRate.total} prayers
                    </p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.topPerformingArea.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-green-900">Top Area (7d)</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {overviewData.topPerformingArea.name}
                    </div>
                    <p className="text-xs text-gray-600">
                      {overviewData.topPerformingArea.percentage}% score
                    </p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.newMembers.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">New Members (30d)</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {overviewData.newMembers.count}
                    </div>
                    <p className="text-xs text-gray-500">
                      {Math.round((overviewData.newMembers.count / overviewData.newMembers.total) * 100)}% growth rate
                    </p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.avgAttendanceRate.tooltip}>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-400 shadow-md hover:shadow-lg transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-green-900">Avg Rate (7d)</h3>
                      <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-1">
                      {overviewData.avgAttendanceRate.percentage}%
                    </div>
                    <p className="text-xs text-green-800">
                      Across all areas
                    </p>
                  </div>
                </Tooltip>
              </div>

              {/* Prayer Breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Global Prayer Breakdown</h2>
                  <span className="text-xs text-gray-500">Yesterday | 7d = last 7 days | 30d = last 30 days</span>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(overviewData.prayerBreakdown).map(([prayer, data]) => (
                    <Tooltip key={prayer} text={`Yesterday: ${data.yesterdayPercent}% | 7d: ${data.weekPercent}% | 30d: ${data.monthPercent}%`}>
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
                            <div className="text-2xl font-bold text-gray-900">{data.yesterdayPercent}%</div>
                            <div className="text-xs text-gray-500">Yesterday ({data.yesterdayCount})</div>
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

              {/* Area Performance Table with Fixed Tooltips */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Area Performance (Weighted Ranking)</h2>
                  <p className="text-xs text-gray-500 mt-1">Ranked by weighted score: attendance consistency + Fajr rate</p>
                </div>
                <div className="overflow-x-auto relative z-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Area</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          <div className="inline-flex items-center cursor-help group relative">
                            Members
                            <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                              Number of registered members
                              <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                            </div>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          <div className="inline-flex items-center cursor-help group relative">
                            🌅 Fajr (7d)
                            <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                              🌅 Fajr attendance rate (last 7 days)
                              <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                            </div>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          <div className="inline-flex items-center cursor-help group relative">
                            Yesterday
                            <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                              Overall attendance rate yesterday
                              <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                            </div>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          <div className="inline-flex items-center cursor-help group relative">
                            7 Days
                            <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                              Overall attendance rate (last 7 days)
                              <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                            </div>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          <div className="inline-flex items-center cursor-help group relative">
                            30 Days
                            <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                              Overall attendance rate (last 30 days)
                              <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                            </div>
                          </div>
                        </th>
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
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(area.fajrPercent)}`}>
                              {area.fajrPercent}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(area.yesterdayPercent)}`}>
                              {area.yesterdayPercent}%
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
                <Tooltip text={overviewData.yesterdayAttendance.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Yesterday</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {overviewData.yesterdayAttendance.percentage}%
                    </div>
                    <p className="text-xs text-gray-500">
                      {overviewData.yesterdayAttendance.count}/{overviewData.yesterdayAttendance.total} prayers
                    </p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.areaRank.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-green-900">Area Rank (7d)</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-900">#{overviewData.areaRank.position}</span>
                      <span className="text-lg text-gray-600">/ {overviewData.areaRank.totalAreas}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{overviewData.areaRank.percentage}% score</p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.newMembers.tooltip}>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">New Members (30d)</h3>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {overviewData.newMembers.count}
                    </div>
                    <p className="text-xs text-gray-500">
                      {Math.round((overviewData.newMembers.count / overviewData.newMembers.total) * 100)}% growth rate
                    </p>
                  </div>
                </Tooltip>

                <Tooltip text={overviewData.weeklyAttendance.tooltip}>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-400 shadow-md hover:shadow-lg transition-shadow cursor-help">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-green-900">Week Avg (7d)</h3>
                      <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-1">
                      {overviewData.weeklyAttendance.percentage}%
                    </div>
                    <p className="text-xs text-green-800">
                      Last 7 days average
                    </p>
                  </div>
                </Tooltip>
              </div>

              {/* Prayer Breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Prayer Performance</h2>
                  <span className="text-xs text-gray-500">Yesterday | 7d = last 7 days | 30d = last 30 days</span>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(overviewData.prayerBreakdown).map(([prayer, data]) => (
                    <Tooltip key={prayer} text={`Yesterday: ${data.yesterdayPercent}% | 7d: ${data.weekPercent}% | 30d: ${data.monthPercent}%`}>
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
                            <div className="text-2xl font-bold text-gray-900">{data.yesterdayPercent}%</div>
                            <div className="text-xs text-gray-500">Yesterday ({data.yesterdayCount})</div>
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
          /* ==================== DETAILED ANALYTICS WITH DOWNLOAD ACTION ==================== */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Member Attendance</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {filteredMembers.length} members found
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex space-x-2">
                      {timePeriodOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTimePeriod(option.value)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            timePeriod === option.value
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    
                    {role === 'superadmin' && detailedData?.areas && (
                      <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="all">All Areas</option>
                        {detailedData.areas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                
                <input
                  type="text"
                  placeholder="Search members by name..."
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
                  <p className="mt-4 text-sm text-gray-600">
                    No members found {searchTerm && `matching "${searchTerm}"`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Member</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Attendance ({getPeriodLabel()})
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Yesterday
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            🌅 Fajr Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Action
                          </th>
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
                              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getColorClass(member.periodPercentage)}`}>
                                {member.periodPercentage}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <PrayerDots prayers={member.yesterdayPrayers} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.fajrCount}/{member.totalDays}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleDownloadReport(member)}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

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
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default ViewAttendance;
