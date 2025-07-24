import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';
import { pickupService, memberAPI } from '../../services/api';

const SuperAdminTransportPage = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Data from API (across all mosques)
  const [members, setMembers] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  // Transport statistics across all mosques
  const [transportStats, setTransportStats] = useState({
    totalMembers: 0,
    needsAssistance: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });

  // Selected mosque filter
  const [selectedMosque, setSelectedMosque] = useState('all');

  useEffect(() => {
    fetchData();
  }, [selectedMosque]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Fetching transport data for Super Admin...');

      // Fetch members and pickup requests for all mosques
      const [membersResponse, pickupResponse] = await Promise.all([
        memberAPI.getMembers().catch(err => {
          console.error('❌ Failed to fetch members:', err);
          return { success: false, data: [] };
        }),
        pickupService.getAllPickupRequests({ limit: 100 }).catch(err => {
          console.error('❌ Failed to fetch pickup requests:', err);
          return { data: { success: false, data: [] } };
        })
      ]);

      console.log('📊 Super Admin API Responses:');
      console.log('Members:', membersResponse);
      console.log('Pickup Requests:', pickupResponse);

      // Process members data
      let membersData = [];
      if (membersResponse && membersResponse.success && membersResponse.data) {
        membersData = membersResponse.data;
      }

      // Process pickup requests data
      let requestsData = [];
      if (pickupResponse && pickupResponse.data && pickupResponse.data.success && pickupResponse.data.data) {
        requestsData = pickupResponse.data.data;
      } else if (pickupResponse && pickupResponse.data && Array.isArray(pickupResponse.data)) {
        requestsData = pickupResponse.data;
      }

      console.log('📋 Processed data:');
      console.log('Members count:', membersData.length);
      console.log('Requests count:', requestsData.length);

      // Transform and set members data
      const processedMembers = membersData.map(member => ({
        id: member.id,
        name: member.fullName || member.username || 'Unknown',
        mosque: member.mosque_name || 'Unknown Mosque',
        address: member.address || 'No address provided',
        phone: member.phone || 'N/A',
        email: member.email || 'N/A',
        transportMode: member.mobility || 'Not specified',
        needsAssistance: member.differently_abled || false,
        area: member.area || 'Unknown'
      }));

      // Transform and set pickup requests data
      const processedRequests = requestsData.map(request => ({
        id: request.id,
        memberId: request.user_id,
        memberName: request.member_name || request.member_username || 'Unknown Member',
        mosque: request.mosque_name || 'Unknown Mosque',
        phone: request.contact_number || request.member_phone || 'N/A',
        address: request.pickup_location || 'No address provided',
        prayer: request.prayer_type || 'Fajr',
        date: new Date(request.created_at).toISOString().split('T')[0],
        time: "4:30 AM",
        disabilityLevel: "None",
        needsAssistance: false,
        specialRequirements: request.special_instructions || 'Ring doorbell twice',
        status: request.status || 'pending',
        requestedAt: request.created_at,
        emergencyContact: request.contact_phone || request.contact_number || 'N/A',
        days: request.days ? (typeof request.days === 'string' ? JSON.parse(request.days) : request.days) : ['Daily'],
        prayers: request.prayers ? (typeof request.prayers === 'string' ? JSON.parse(request.prayers) : request.prayers) : ['Fajr'],
        assignedDriver: request.assigned_driver_name || null,
        approvedAt: request.updated_at,
        rejectionReason: request.rejected_reason || null
      }));

      // Filter data by selected mosque if not 'all'
      const filteredMembers = selectedMosque === 'all' ? processedMembers : 
        processedMembers.filter(member => member.mosque.toLowerCase().includes(selectedMosque.toLowerCase()));

      const filteredRequests = selectedMosque === 'all' ? processedRequests :
        processedRequests.filter(request => request.mosque.toLowerCase().includes(selectedMosque.toLowerCase()));

      setMembers(filteredMembers);
      setPickupRequests(filteredRequests);

      // Calculate transport statistics across all or filtered mosques
      const needsAssistanceCount = filteredMembers.filter(member => member.needsAssistance).length;
      const pendingCount = filteredRequests.filter(request => request.status === 'pending').length;
      const approvedCount = filteredRequests.filter(request => request.status === 'approved').length;
      const rejectedCount = filteredRequests.filter(request => request.status === 'rejected').length;

      setTransportStats({
        totalMembers: filteredMembers.length,
        needsAssistance: needsAssistanceCount,
        pendingRequests: pendingCount,
        approvedRequests: approvedCount,
        rejectedRequests: rejectedCount
      });

      // Get available drivers from members across all mosques (or filtered)
      const drivers = filteredMembers.filter(member => 
        member.transportMode && 
        ['Personal Vehicle', 'Motorbike', 'Van'].includes(member.transportMode)
      ).map(member => ({
        id: member.id,
        displayName: `${member.name} (${member.transportMode}) - ${member.mosque}`,
        transportMode: member.transportMode,
        mosque: member.mosque
      }));

      setAvailableDrivers(drivers);

      console.log('✅ Super Admin transport data loaded successfully');
      console.log('Stats:', {
        totalMembers: filteredMembers.length,
        needsAssistance: needsAssistanceCount,
        pendingRequests: pendingCount,
        approvedRequests: approvedCount,
        rejectedRequests: rejectedCount,
        availableDrivers: drivers.length
      });

    } catch (error) {
      console.error('❌ Error fetching transport data:', error);
      setError('Failed to load transport data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
  };

  const submitAction = async () => {
    if (actionType === 'approve' && !selectedDriver) {
      alert('Please select a member to assign');
      return;
    }
    if (actionType === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);

      if (actionType === 'approve') {
        const selectedDriverInfo = availableDrivers.find(d => d.id === parseInt(selectedDriver));
        
        console.log(`✅ Super Admin approving request ${selectedRequest.id} with driver:`, selectedDriverInfo);
        
        await pickupService.approvePickupRequest(
          selectedRequest.id,
          selectedDriverInfo.id,
          selectedDriverInfo.displayName
        );

        setPickupRequests(prev => prev.map(request => {
          if (request.id === selectedRequest.id) {
            return {
              ...request,
              status: 'approved',
              assignedDriver: selectedDriverInfo.displayName,
              approvedAt: new Date().toISOString()
            };
          }
          return request;
        }));

        // Update stats
        setTransportStats(prev => ({
          ...prev,
          pendingRequests: prev.pendingRequests - 1,
          approvedRequests: prev.approvedRequests + 1
        }));

      } else if (actionType === 'reject') {
        console.log(`❌ Super Admin rejecting request ${selectedRequest.id} with reason:`, rejectionReason);
        
        await pickupService.rejectPickupRequest(selectedRequest.id, rejectionReason);

        setPickupRequests(prev => prev.map(request => {
          if (request.id === selectedRequest.id) {
            return {
              ...request,
              status: 'rejected',
              rejectionReason: rejectionReason
            };
          }
          return request;
        }));

        // Update stats
        setTransportStats(prev => ({
          ...prev,
          pendingRequests: prev.pendingRequests - 1,
          rejectedRequests: prev.rejectedRequests + 1
        }));
      }

      // Reset form
      setShowModal(false);
      setSelectedRequest(null);
      setSelectedDriver('');
      setRejectionReason('');
      
      console.log('✅ Super Admin action completed successfully');
      
    } catch (error) {
      console.error('❌ Error processing request:', error);
      alert('Failed to process request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Transport & Mobility (All Mosques)</h1>
          <p className="text-gray-600">Manage transport services across all mosques</p>
        </div>

        {/* Mosque Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Mosque
          </label>
          <select
            value={selectedMosque}
            onChange={(e) => setSelectedMosque(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Mosques</option>
            <option value="jabbar">Masjid Ul Jabbar</option>
            <option value="noor">Al-Noor Mosque</option>
            <option value="central">Central Mosque</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
            <button 
              onClick={fetchData}
              className="mt-2 text-red-800 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{transportStats.totalMembers}</div>
            <div className="text-sm text-gray-500">Total Members</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{transportStats.needsAssistance}</div>
            <div className="text-sm text-gray-500">Need Assistance</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{transportStats.pendingRequests}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{transportStats.approvedRequests}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{transportStats.rejectedRequests}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'members', label: 'Member Transport Info' },
              { id: 'requests', label: 'Pickup Requests' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 h-10 w-10"></div>
            <p className="mt-2 text-gray-500">Loading transport data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'members' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium">Member Transport Information</h3>
                  <span className="text-sm text-gray-500">
                    {selectedMosque === 'all' ? 'All Mosques' : `Filtered: ${selectedMosque}`}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mosque</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport Mode</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Special Needs</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                            No members found
                          </td>
                        </tr>
                      ) : (
                        members.map(member => (
                          <tr key={member.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">{member.address}</div>
                                <div className="text-xs text-gray-500">{member.phone}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{member.mosque}</div>
                              <div className="text-xs text-gray-500">{member.area}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                member.transportMode === 'Personal Vehicle' ? 'bg-green-100 text-green-800' :
                                member.transportMode === 'Motorbike' ? 'bg-blue-100 text-blue-800' :
                                member.transportMode === 'Van' ? 'bg-purple-100 text-purple-800' :
                                member.transportMode === 'Public Transport' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {member.transportMode}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {member.needsAssistance ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                  Needs Assistance
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  Independent
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-medium">Pickup Requests Management</h3>
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mosque</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requirements</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pickupRequests.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No pickup requests found
                          </td>
                        </tr>
                      ) : (
                        pickupRequests.map(request => (
                          <tr key={request.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{request.memberName}</div>
                                <div className="text-sm text-gray-500">{request.address}</div>
                                <div className="text-xs text-gray-500">{request.phone}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{request.mosque}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {request.days.length > 0 ? request.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') : 'Daily'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.prayers.length > 0 ? request.prayers.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ') : 'Fajr'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Requested: {new Date(request.requestedAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{request.specialRequirements}</div>
                              {request.needsAssistance && (
                                <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full mt-1">
                                  Needs Assistance
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status}
                              </span>
                              {request.status === 'approved' && request.assignedDriver && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <strong>Driver:</strong> {request.assignedDriver}
                                </div>
                              )}
                              {request.status === 'rejected' && request.rejectionReason && (
                                <div className="text-xs text-red-600 mt-1">
                                  <strong>Reason:</strong> {request.rejectionReason}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {request.status === 'pending' && (
                                <div className="flex flex-col space-y-1">
                                  <button
                                    onClick={() => handleRequestAction(request, 'approve')}
                                    className="text-green-600 hover:text-green-900 text-xs"
                                    disabled={actionLoading}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRequestAction(request, 'reject')}
                                    className="text-red-600 hover:text-red-900 text-xs"
                                    disabled={actionLoading}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {request.status !== 'pending' && (
                                <div className="text-xs text-gray-500">
                                  {request.status === 'approved' ? 
                                    `Approved: ${request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'Recently'}` :
                                    `Rejected: ${request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'Recently'}`
                                  }
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal for approving/rejecting requests */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold mb-4">
                {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h3>
              
              {actionType === 'approve' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Driver
                  </label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 mb-4"
                  >
                    <option value="">Select a driver...</option>
                    {availableDrivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 mb-4"
                    rows="3"
                    placeholder="Please provide a reason..."
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={submitAction}
                  disabled={actionLoading || (actionType === 'approve' && !selectedDriver) || (actionType === 'reject' && !rejectionReason.trim())}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminTransportPage;
