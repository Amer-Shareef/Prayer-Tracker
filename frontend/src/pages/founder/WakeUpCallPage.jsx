import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

const WakeUpCallPage = () => {
  const [wakeCalls, setWakeCalls] = useState([
    // Dummy data for demonstration - automatic calls made to members
    {
      id: 1,
      memberId: 'DE0001',
      memberName: 'Ahmed Hassan Mohamed',
      phone: '0771234567',
      callDate: '2024-03-15',
      callTime: '04:30',
      prayerType: 'Fajr',
      callStatus: 'accepted', // accepted, declined, no_answer
      responseTime: '04:31',
      createdAt: '2024-03-15T04:30:00Z'
    },
    {
      id: 2,
      memberId: 'C30002',
      memberName: 'Muhammed Ali',
      phone: '0769876543',
      callDate: '2024-03-15',
      callTime: '04:45',
      prayerType: 'Fajr',
      callStatus: 'declined',
      responseTime: '04:46',
      createdAt: '2024-03-15T04:45:00Z'
    },
    {
      id: 3,
      memberId: 'ML0003',
      memberName: 'Omar Abdullah Khan',
      phone: '0751234567',
      callDate: '2024-03-15',
      callTime: '04:15',
      prayerType: 'Fajr',
      callStatus: 'no_answer',
      responseTime: null,
      createdAt: '2024-03-15T04:15:00Z'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterPrayer, setFilterPrayer] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Statistics
  const totalCalls = wakeCalls.length;
  const acceptedCalls = wakeCalls.filter(call => call.callStatus === 'accepted').length;
  const declinedCalls = wakeCalls.filter(call => call.callStatus === 'declined').length;
  const noAnswerCalls = wakeCalls.filter(call => call.callStatus === 'no_answer').length;

  // Filter calls
  const filteredCalls = wakeCalls.filter(call => {
    const matchesStatus = filterStatus === 'all' || call.callStatus === filterStatus;
    const matchesDate = !filterDate || call.callDate === filterDate;
    const matchesPrayer = filterPrayer === 'all' || call.prayerType === filterPrayer;
    const matchesSearch = call.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.memberId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesDate && matchesPrayer && matchesSearch;
  });

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automatic Wake Up Calls</h1>
            <p className="text-gray-600 mt-1">Track automatic wake-up call responses from members</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Calls</p>
                <p className="text-2xl font-semibold text-gray-900">{totalCalls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Accepted</p>
                <p className="text-2xl font-semibold text-gray-900">{acceptedCalls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Declined</p>
                <p className="text-2xl font-semibold text-gray-900">{declinedCalls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">No Answer</p>
                <p className="text-2xl font-semibold text-gray-900">{noAnswerCalls}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="no_answer">No Answer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prayer</label>
              <select
                value={filterPrayer}
                onChange={(e) => setFilterPrayer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Prayers</option>
                <option value="Fajr">Fajr</option>
                <option value="Dhuhr">Dhuhr</option>
                <option value="Asr">Asr</option>
                <option value="Maghrib">Maghrib</option>
                <option value="Isha">Isha</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDate('');
                  setFilterStatus('all');
                  setFilterPrayer('all');
                }}
                className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Calls Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    {/* Member Info */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{call.memberName}</div>
                        <div className="text-sm text-gray-500">ID: {call.memberId}</div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{call.phone}</div>
                    </td>

                    {/* Call Details */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{call.callDate}</div>
                        <div className="text-sm text-gray-500">{call.callTime} - {call.prayerType}</div>
                      </div>
                    </td>

                    {/* Response Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        call.callStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                        call.callStatus === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {call.callStatus === 'no_answer' ? 'No Answer' : 
                         call.callStatus.charAt(0).toUpperCase() + call.callStatus.slice(1)}
                      </span>
                    </td>

                    {/* Response Time */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {call.responseTime || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCalls.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No wake-up calls found</h3>
              <p className="mt-1 text-sm text-gray-500">No calls match your current filters.</p>
            </div>
          )}
        </div>
      </div>
    </FounderLayout>
  );
};

export default WakeUpCallPage;
