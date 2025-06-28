import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';
import { wakeUpCallService } from '../../services/api';

const WakeUpCallPage = () => {
  const [wakeCalls, setWakeCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total_calls: 0,
    accepted_calls: 0,
    declined_calls: 0,
    no_answer_calls: 0
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterPrayer, setFilterPrayer] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch wake-up calls and stats
  const fetchWakeUpCalls = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching wake-up calls...');

      // Build API parameters based on filters
      const params = {};
      if (filterDateFrom) {
        params.date_from = filterDateFrom;
        // If no end date, use same date for single day filter
        if (!filterDateTo) {
          params.date_to = filterDateFrom;
        }
      }
      if (filterDateTo) {
        params.date_to = filterDateTo;
        // If no start date, use a reasonable default (30 days ago)
        if (!filterDateFrom) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          params.date_from = thirtyDaysAgo.toISOString().split('T')[0];
        }
      }
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPrayer !== 'all') params.prayer_type = filterPrayer;

      console.log('API Parameters:', params);

      // Fetch calls and stats simultaneously
      const [callsResponse, statsResponse] = await Promise.all([
        wakeUpCallService.getWakeUpCalls(params),
        wakeUpCallService.getWakeUpCallStats(params)
      ]);

      if (callsResponse.data.success) {
        setWakeCalls(callsResponse.data.data || []);
        console.log(`✅ Loaded ${callsResponse.data.data?.length || 0} wake-up calls`);
      } else {
        console.error('API Error:', callsResponse.data.message);
        setError(callsResponse.data.message || 'Failed to fetch wake-up calls');
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
        console.log('✅ Loaded wake-up call stats:', statsResponse.data.data);
      }

      setError('');
    } catch (err) {
      console.error('❌ Failed to fetch wake-up calls:', err);
      setError('Failed to load wake-up call data. Please try again.');
      
      // Set empty data on error
      setWakeCalls([]);
      setStats({
        total_calls: 0,
        accepted_calls: 0,
        declined_calls: 0,
        no_answer_calls: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchWakeUpCalls();
  }, [filterStatus, filterDateFrom, filterDateTo, filterPrayer]);

  // Statistics from API data
  const totalCalls = stats.total_calls || 0;
  const acceptedCalls = stats.accepted_calls || 0;
  const declinedCalls = stats.declined_calls || 0;
  const noAnswerCalls = stats.no_answer_calls || 0;

  // Format display data
  const formatCallData = (call) => {
    // Format call date properly
    let formattedDate = 'N/A';
    if (call.call_date) {
      try {
        const date = new Date(call.call_date);
        formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (e) {
        formattedDate = call.call_date;
      }
    }

    // Format response time properly
    let formattedResponseTime = '-';
    if (call.response_time) {
      try {
        const responseDate = new Date(call.response_time);
        formattedResponseTime = responseDate.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (e) {
        formattedResponseTime = call.response_time;
      }
    }

    return {
      id: call.id,
      memberId: call.member_id || 'N/A',
      memberName: call.username || 'Unknown User',
      phone: call.phone || 'N/A',
      callDate: formattedDate,
      callTime: call.call_time?.substring(0, 5) || 'N/A', // Format HH:MM
      prayerType: call.prayer_type || 'Fajr',
      callStatus: call.call_response,
      responseTime: formattedResponseTime,
      createdAt: call.created_at
    };
  };

  // Client-side filtering for search term (fix the filtering logic)
  const filteredCalls = wakeCalls.filter(call => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (call.username || '').toLowerCase().includes(searchLower) ||
      (call.member_id || '').toLowerCase().includes(searchLower) ||
      (call.phone || '').toLowerCase().includes(searchLower)
    );
  });

  // Apply formatting to filtered calls
  const displayCalls = filteredCalls.map(formatCallData);

  // Client-side filtering for date range
  const filteredByDate = displayCalls.filter(call => {
    const callDate = new Date(call.callDate);
    const fromDate = new Date(filterDateFrom);
    const toDate = new Date(filterDateTo);

    // If no date filters, include all calls
    if (!filterDateFrom && !filterDateTo) return true;

    // Check if call date is within the selected range
    const isAfterFrom = !filterDateFrom || callDate >= fromDate;
    const isBeforeTo = !filterDateTo || callDate <= toDate;

    return isAfterFrom && isBeforeTo;
  });

  // Final display data after all filters
  const finalDisplayCalls = filteredByDate;

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automatic Wake Up Calls</h1>
            <p className="text-gray-600 mt-1">Track automatic wake-up call responses from members</p>
          </div>
          <button
            onClick={fetchWakeUpCalls}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}


        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  const newDateFrom = e.target.value;
                  setFilterDateFrom(newDateFrom);
                  // Auto-adjust "Date To" if it's before "Date From"
                  if (filterDateTo && newDateFrom > filterDateTo) {
                    setFilterDateTo(newDateFrom);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  const newDateTo = e.target.value;
                  setFilterDateTo(newDateTo);
                  // Auto-adjust "Date From" if it's after "Date To"
                  if (filterDateFrom && newDateTo < filterDateFrom) {
                    setFilterDateFrom(newDateTo);
                  }
                }}
                min={filterDateFrom || undefined}
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
                  setFilterDateFrom('');
                  setFilterDateTo('');
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

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading wake-up call data...</p>
          </div>
        )}

        {/* Calls Table */}
        {!loading && (
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
                  {finalDisplayCalls.map((call) => (
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

            {finalDisplayCalls.length === 0 && !loading && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No wake-up calls found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {error ? 'Unable to load data. Please try refreshing.' : 'No calls match your current filters.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default WakeUpCallPage;
