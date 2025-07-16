import React, { useState } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';

const SuperAdminWakeUpCallPage = () => {
  const [activeTab, setActiveTab] = useState('manage');
  const [callRequests, setCallRequests] = useState([
    {
      id: 1,
      memberName: 'Ahmed Hassan',
      mosque: 'Masjid Ul Jabbar',
      phone: '+94771234567',
      preferredTime: '04:15',
      prayer: 'Fajr',
      status: 'active',
      lastCalled: '2025-06-30',
      success: true
    },
    {
      id: 2,
      memberName: 'Fatima Ali',
      mosque: 'Al-Noor Mosque',
      phone: '+94779876543',
      preferredTime: '04:20',
      prayer: 'Fajr',
      status: 'active',
      lastCalled: '2025-06-30',
      success: false
    }
  ]);

  const [newRequest, setNewRequest] = useState({
    mosque: 'all',
    prayer: 'fajr',
    maxCalls: '50',
    startTime: '04:00',
    endTime: '05:00',
    message: 'Assalamu Alaikum! This is your wake-up call for Fajr prayer. May Allah bless your day.'
  });

  const [callStats, setCallStats] = useState({
    totalRequests: 156,
    successfulCalls: 142,
    failedCalls: 14,
    activeMembers: 134
  });

  const handleBulkCall = async () => {
    try {
      console.log('Initiating bulk wake-up calls:', newRequest);
      alert('Bulk wake-up calls initiated successfully!');
    } catch (error) {
      console.error('Error initiating bulk calls:', error);
      alert('Failed to initiate bulk calls');
    }
  };

  const handleToggleStatus = (id) => {
    setCallRequests(callRequests.map(request => 
      request.id === id 
        ? { ...request, status: request.status === 'active' ? 'inactive' : 'active' }
        : request
    ));
  };

  const handleDeleteRequest = (id) => {
    if (window.confirm('Are you sure you want to delete this call request?')) {
      setCallRequests(callRequests.filter(request => request.id !== id));
    }
  };

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Wake-up Call Centre (All Mosques)</h1>
          <p className="text-gray-600">Manage automated wake-up calls for prayers across all mosques</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{callStats.totalRequests}</div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{callStats.successfulCalls}</div>
            <div className="text-sm text-gray-500">Successful Calls</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">{callStats.failedCalls}</div>
            <div className="text-sm text-gray-500">Failed Calls</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{callStats.activeMembers}</div>
            <div className="text-sm text-gray-500">Active Members</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Calls
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bulk'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bulk Operations
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Call Reports
            </button>
          </nav>
        </div>

        {activeTab === 'manage' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Call Requests</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mosque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Time & Prayer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Last Call
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {callRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.memberName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.mosque}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.preferredTime}</div>
                        <div className="text-sm text-gray-500">{request.prayer}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.lastCalled}</div>
                        <div className={`text-xs ${
                          request.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {request.success ? 'Success' : 'Failed'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleToggleStatus(request.id)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          {request.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Bulk Wake-up Call Operations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Mosques
                  </label>
                  <select
                    value={newRequest.mosque}
                    onChange={(e) => setNewRequest({...newRequest, mosque: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="all">All Mosques</option>
                    <option value="1">Masjid Ul Jabbar</option>
                    <option value="2">Al-Noor Mosque</option>
                    <option value="3">Central Mosque</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prayer Time
                  </label>
                  <select
                    value={newRequest.prayer}
                    onChange={(e) => setNewRequest({...newRequest, prayer: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="fajr">Fajr</option>
                    <option value="dhuhr">Dhuhr</option>
                    <option value="asr">Asr</option>
                    <option value="maghrib">Maghrib</option>
                    <option value="isha">Isha</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Calls
                  </label>
                  <input
                    type="number"
                    value={newRequest.maxCalls}
                    onChange={(e) => setNewRequest({...newRequest, maxCalls: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newRequest.startTime}
                      onChange={(e) => setNewRequest({...newRequest, startTime: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newRequest.endTime}
                      onChange={(e) => setNewRequest({...newRequest, endTime: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call Message
                  </label>
                  <textarea
                    value={newRequest.message}
                    onChange={(e) => setNewRequest({...newRequest, message: e.target.value})}
                    rows="6"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Enter the message to be played during the call..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">Call Preview</h4>
                  <p className="text-sm text-blue-700">
                    {newRequest.message || 'Your call message will appear here...'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleBulkCall}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Initiate Bulk Calls
            </button>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Call Reports & Analytics</h3>
            
            {/* Success Rate Chart */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Success Rate by Mosque</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-32 text-sm">Masjid Ul Jabbar</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-right">92%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm">Al-Noor Mosque</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '88%'}}></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-right">88%</div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm">Central Mosque</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-right">95%</div>
                </div>
              </div>
            </div>

            {/* Recent Call Log */}
            <div>
              <h4 className="font-medium mb-3">Recent Call Activity</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Today - Fajr Calls</span>
                    <span className="text-green-600">134/142 successful</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yesterday - Fajr Calls</span>
                    <span className="text-green-600">128/140 successful</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Response Time</span>
                    <span>3.2 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Call Time</span>
                    <span>04:15 - 04:30 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminWakeUpCallPage;
