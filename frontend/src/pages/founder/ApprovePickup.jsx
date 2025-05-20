// filepath: c:\Users\Dr_Shareef\Desktop\Prayer-Tracker\frontend\src\pages\founder\ApprovePickup.jsx
import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

const ApprovePickup = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [prayerFilter, setPrayerFilter] = useState('all');
  // All pickup requests
  const [pickupRequests, setPickupRequests] = useState([
    {
      id: 1,
      memberName: "Mohamed Rizwan",
      memberId: "M12345",
      phoneNumber: "+94 77 123 4567",
      date: "2025-05-09",
      prayer: "Fajr",
      time: "4:30 AM",
      location: "23 Baseline Road, Colombo 09",
      status: "pending",
      notes: "Please pick me up from the side entrance"
    },
    {
      id: 2,
      memberName: "Ahmed Fazil",
      memberId: "M23456",
      phoneNumber: "+94 76 234 5678",
      date: "2025-05-09",
      prayer: "Jumu'ah",
      time: "12:45 PM",
      location: "12 Galle Road, Dehiwala",
      status: "pending",
      notes: "I will be waiting at the bus stop"
    },
    {
      id: 3,
      memberName: "Mohammed Farook",
      memberId: "M34567",
      phoneNumber: "+94 71 345 6789",
      date: "2025-05-10",
      prayer: "Fajr",
      time: "4:30 AM",
      location: "45 Dawson Road, Slave Island, Colombo 02",
      status: "pending",
      notes: "Please call when you arrive"
    },
    {
      id: 4,
      memberName: "Fatima Mohammad",
      memberId: "M45678",
      phoneNumber: "+1 (555) 456-7890",
      date: "2025-05-09",
      prayer: "Maghrib",
      time: "7:15 PM",
      location: "321 Elm St, Villageton",
      status: "approved",
      notes: "Needs assistance walking",
      approvedBy: "Abdullah Rahman",
      approvedAt: "2025-05-08T10:30:00",
      driver: "Hasan Ali"
    },
    {
      id: 5,
      memberName: "Sarah Khan",
      memberId: "M56789",
      phoneNumber: "+1 (555) 567-8901",
      date: "2025-05-08",
      prayer: "Isha",
      time: "8:45 PM",
      location: "654 Maple Ave, Cityville",
      status: "rejected",
      notes: "",
      rejectedBy: "Abdullah Rahman",
      rejectedAt: "2025-05-08T09:15:00",
      rejectionReason: "No driver available for this time"
    }
  ]);

  // List of drivers
  const [drivers, setDrivers] = useState([
    { id: 1, name: "Hasan Ali", available: true },
    { id: 2, name: "Omar Farooq", available: true },
    { id: 3, name: "Khalid Ahmad", available: false }
  ]);

  useEffect(() => {
    // In a real app, you would fetch pickup requests from your API
    // For now, we'll use the static data defined above
  }, []);

  // Handler for approving pickup requests
  const handleApprove = (requestId, driverId = null) => {
    setPickupRequests(prev => prev.map(request => {
      if (request.id === requestId) {
        const selectedDriver = drivers.find(d => d.id === driverId);
        return {
          ...request,
          status: 'approved',
          approvedBy: "Abdullah Rahman", // In a real app, this would be the current user
          approvedAt: new Date().toISOString(),
          driver: selectedDriver ? selectedDriver.name : null
        };
      }
      return request;
    }));
  };

  // Handler for rejecting pickup requests
  const handleReject = (requestId, reason) => {
    setPickupRequests(prev => prev.map(request => {
      if (request.id === requestId) {
        return {
          ...request,
          status: 'rejected',
          rejectedBy: "Abdullah Rahman", // In a real app, this would be the current user
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason
        };
      }
      return request;
    }));
  };

  // Filter requests based on active tab, search term, and filters
  const filteredRequests = pickupRequests.filter(request => {
    // Filter by status (tab)
    if (activeTab !== 'all' && request.status !== activeTab) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !request.memberName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.location.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter by date
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      if (dateFilter === 'today' && request.date !== today) {
        return false;
      }
      // For 'upcoming', include today and future dates
      if (dateFilter === 'upcoming' && request.date < today) {
        return false;
      }
    }
    
    // Filter by prayer
    if (prayerFilter !== 'all' && request.prayer !== prayerFilter) {
      return false;
    }
    
    return true;
  });

  // Get unique prayer times for filter
  const uniquePrayers = [...new Set(pickupRequests.map(request => request.prayer))];

  // Modal state for approval/rejection
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const openApproveModal = (requestId) => {
    setSelectedRequestId(requestId);
    setSelectedDriverId(drivers.find(d => d.available)?.id || null);
    setShowApproveModal(true);
  };

  const openRejectModal = (requestId) => {
    setSelectedRequestId(requestId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmApproval = () => {
    handleApprove(selectedRequestId, selectedDriverId);
    setShowApproveModal(false);
  };

  const confirmRejection = () => {
    handleReject(selectedRequestId, rejectionReason);
    setShowRejectModal(false);
  };

  return (
    <FounderLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Manage Pickup Requests</h1>
        
        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search member or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-64"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="upcoming">Upcoming</option>
                </select>
                
                <select
                  value={prayerFilter}
                  onChange={(e) => setPrayerFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Prayers</option>
                  {uniquePrayers.map(prayer => (
                    <option key={prayer} value={prayer}>{prayer}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {filteredRequests.length} request(s) found
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
            <li className="mr-2">              <button
                className={`inline-flex items-center px-4 py-2 rounded-t-lg ${
                  activeTab === 'pending'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('pending')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending
                <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pickupRequests.filter(r => r.status === 'pending').length}
                </span>
              </button>
            </li>
            <li className="mr-2">              <button
                className={`inline-flex items-center px-4 py-2 rounded-t-lg ${
                  activeTab === 'approved'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('approved')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approved
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-flex items-center px-4 py-2 rounded-t-lg ${
                  activeTab === 'rejected'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('rejected')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rejected
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-flex items-center px-4 py-2 rounded-t-lg ${
                  activeTab === 'all'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('all')}
              >
                All Requests
              </button>
            </li>
          </ul>
        </div>
        
        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🚗</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No pickup requests found</h3>
            <p className="text-gray-500">
              There are no pickup requests matching your current filters.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Prayer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map(request => (
                    <tr key={request.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{request.memberName}</div>
                        <div className="text-sm text-gray-500">{request.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(request.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-500">{request.prayer} • {request.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{request.location}</div>
                        {request.notes && (
                          <div className="text-xs text-gray-500 italic max-w-xs truncate">
                            Note: {request.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        
                        {request.status === 'approved' && request.driver && (
                          <div className="text-xs text-gray-500 mt-1">
                            Driver: {request.driver}
                          </div>
                        )}
                        
                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            Reason: {request.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        {request.status === 'pending' && (
                          <div className="space-x-2">                            <button
                              onClick={() => openApproveModal(request.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(request.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        
                        {request.status !== 'pending' && (
                          <button className="text-blue-600 hover:text-blue-900">
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Approve Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Approve Pickup Request</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Assign Driver
                </label>
                <select
                  value={selectedDriverId || ''}
                  onChange={(e) => setSelectedDriverId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a driver</option>
                  {drivers.filter(d => d.available).map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>                <button
                  onClick={confirmApproval}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!selectedDriverId}
                >
                  Approve Request
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Reject Pickup Request</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"                  placeholder="Please provide a reason for rejecting this request"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejection}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={!rejectionReason.trim()}
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default ApprovePickup;