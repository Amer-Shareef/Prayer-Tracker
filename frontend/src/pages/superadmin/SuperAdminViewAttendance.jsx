import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';
import { prayerService } from '../../services/api';

const SuperAdminViewAttendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMosque, setSelectedMosque] = useState('all');
  const [selectedPrayer, setSelectedPrayer] = useState('all');
  const [dateRange, setDateRange] = useState('week');

  const [summary, setSummary] = useState({
    totalAttendance: 0,
    averagePercentage: 0,
    topPerformingMosque: '',
    lowestPerformingMosque: ''
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMosque, selectedPrayer, dateRange]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockData = [
        {
          mosque: 'Masjid Ul Jabbar',
          fajr: { attended: 45, total: 60, percentage: 75 },
          dhuhr: { attended: 52, total: 60, percentage: 87 },
          asr: { attended: 48, total: 60, percentage: 80 },
          maghrib: { attended: 55, total: 60, percentage: 92 },
          isha: { attended: 42, total: 60, percentage: 70 },
          totalMembers: 60
        },
        {
          mosque: 'Al-Noor Mosque',
          fajr: { attended: 38, total: 50, percentage: 76 },
          dhuhr: { attended: 43, total: 50, percentage: 86 },
          asr: { attended: 40, total: 50, percentage: 80 },
          maghrib: { attended: 46, total: 50, percentage: 92 },
          isha: { attended: 35, total: 50, percentage: 70 },
          totalMembers: 50
        },
        {
          mosque: 'Central Mosque',
          fajr: { attended: 67, total: 85, percentage: 79 },
          dhuhr: { attended: 75, total: 85, percentage: 88 },
          asr: { attended: 70, total: 85, percentage: 82 },
          maghrib: { attended: 80, total: 85, percentage: 94 },
          isha: { attended: 62, total: 85, percentage: 73 },
          totalMembers: 85
        }
      ];

      setAttendanceData(mockData);
      
      // Calculate summary
      const totalAttendance = mockData.reduce((sum, mosque) => 
        sum + mosque.fajr.attended + mosque.dhuhr.attended + mosque.asr.attended + mosque.maghrib.attended + mosque.isha.attended, 0
      );
      
      const averagePercentage = mockData.reduce((sum, mosque) => 
        sum + (mosque.fajr.percentage + mosque.dhuhr.percentage + mosque.asr.percentage + mosque.maghrib.percentage + mosque.isha.percentage) / 5, 0
      ) / mockData.length;

      setSummary({
        totalAttendance,
        averagePercentage: Math.round(averagePercentage),
        topPerformingMosque: 'Central Mosque',
        lowestPerformingMosque: 'Al-Noor Mosque'
      });

    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Attendance Overview (All Mosques)</h1>
          <p className="text-gray-600">View and analyze prayer attendance across all mosques</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mosque
            </label>
            <select
              value={selectedMosque}
              onChange={(e) => setSelectedMosque(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Mosques</option>
              <option value="1">Masjid Ul Jabbar</option>
              <option value="2">Al-Noor Mosque</option>
              <option value="3">Central Mosque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prayer
            </label>
            <select
              value={selectedPrayer}
              onChange={(e) => setSelectedPrayer(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Prayers</option>
              <option value="fajr">Fajr</option>
              <option value="dhuhr">Dhuhr</option>
              <option value="asr">Asr</option>
              <option value="maghrib">Maghrib</option>
              <option value="isha">Isha</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{summary.totalAttendance}</div>
            <div className="text-sm text-gray-500">Total Attendance</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{summary.averagePercentage}%</div>
            <div className="text-sm text-gray-500">Average Percentage</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-bold text-green-600">{summary.topPerformingMosque}</div>
            <div className="text-sm text-gray-500">Top Performing</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-bold text-red-600">{summary.lowestPerformingMosque}</div>
            <div className="text-sm text-gray-500">Needs Improvement</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 h-10 w-10"></div>
            <p className="mt-2 text-gray-500">Loading attendance data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mosque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Members
                    </th>
                    {prayers.map(prayer => (
                      <th key={prayer} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.map((mosque, index) => {
                    const overallPercentage = Math.round(
                      (mosque.fajr.percentage + mosque.dhuhr.percentage + mosque.asr.percentage + mosque.maghrib.percentage + mosque.isha.percentage) / 5
                    );
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{mosque.mosque}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{mosque.totalMembers}</div>
                        </td>
                        {prayers.map(prayer => (
                          <td key={prayer} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {mosque[prayer].attended}/{mosque[prayer].total}
                            </div>
                            <div className={`text-xs ${
                              mosque[prayer].percentage >= 80 ? 'text-green-600' :
                              mosque[prayer].percentage >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {mosque[prayer].percentage}%
                            </div>
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            overallPercentage >= 80 ? 'bg-green-100 text-green-800' :
                            overallPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {overallPercentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminViewAttendance;
