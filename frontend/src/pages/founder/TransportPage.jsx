import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

const TransportPage = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');

  // Mock data for members with transport info
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "Mike Tyson",
      phone: "+94 77 123 4567",
      address: "123 Main St, Dehiwala",
      transportMode: "Public Transport",
      disabilityLevel: "None",
      needsAssistance: false,
      regularPrayers: ["Fajr", "Maghrib"],
      emergencyContact: "+94 77 987 6543"
    },
    {
      id: 2,
      name: "Yusuf Ali",
      phone: "+94 71 234 5678",
      address: "456 Park Lane, Wellawate",
      transportMode: "Walking",
      disabilityLevel: "Mild Mobility Issues",
      needsAssistance: true,
      regularPrayers: ["Dhuhr", "Asr", "Jumu'ah"],
      emergencyContact: "+94 71 876 5432"
    },
    {
      id: 3,
      name: "Ibrahim Hassan",
      phone: "+94 75 345 6789",
      address: "789 Kawdana Rd, Dehiwala",
      transportMode: "Personal Vehicle",
      disabilityLevel: "None",
      needsAssistance: false,
      regularPrayers: ["All Prayers"],
      emergencyContact: "+94 75 765 4321"
    },
    {
      id: 4,
      name: "Khabib Nurmagomedov",
      phone: "+94 76 456 7890",
      address: "321 Sea View Rd, Mount Lavinia",
      transportMode: "Family Drop-off",
      disabilityLevel: "Wheelchair User",
      needsAssistance: true,
      regularPrayers: ["Fajr", "Maghrib", "Isha"],
      emergencyContact: "+94 76 654 3210"
    },
    {
      id: 5,
      name: "Muhammed Ali",
      phone: "+94 78 567 8901",
      address: "555 Galle Rd, Colombo 03",
      transportMode: "Motorcycle",
      disabilityLevel: "Visual Impairment",
      needsAssistance: true,
      regularPrayers: ["Fajr", "Dhuhr", "Maghrib"],
      emergencyContact: "+94 78 901 2345"
    }
  ]);

  // Mock data for pickup requests
  const [pickupRequests, setPickupRequests] = useState([
    {
      id: 1,
      memberId: 2,
      memberName: "Yusuf Ali",
      phone: "+94 71 234 5678",
      address: "456 Park Lane, Wellawate",
      prayer: "Fajr",
      date: "2025-01-15",
      time: "4:30 AM",
      disabilityLevel: "Mild Mobility Issues",
      needsAssistance: true,
      specialRequirements: "Needs walking assistance",
      status: "pending",
      requestedAt: "2025-01-14T18:30:00",
      emergencyContact: "+94 71 876 5432"
    },
    {
      id: 2,
      memberId: 4,
      memberName: "Muhammed Ali",
      phone: "+94 76 456 7890",
      address: "321 Sea View Rd, Mount Lavinia",
      prayer: "Jumu'ah",
      date: "2025-01-17",
      time: "12:45 PM",
      disabilityLevel: "Wheelchair User",
      needsAssistance: true,
      specialRequirements: "Wheelchair accessible vehicle required",
      status: "pending",
      requestedAt: "2025-01-14T20:15:00",
      emergencyContact: "+94 76 654 3210"
    },
    {
      id: 3,
      memberId: 1,
      memberName: "Mike Tyson",
      phone: "+94 77 123 4567",
      address: "123 Main St, Dehiwala",
      prayer: "Maghrib",
      date: "2025-01-16",
      time: "6:15 PM",
      disabilityLevel: "None",
      needsAssistance: false,
      specialRequirements: "None",
      status: "approved",
      assignedDriver: "Mini Car",
      requestedAt: "2025-01-14T16:45:00",
      approvedAt: "2025-01-14T19:00:00",
      emergencyContact: "+94 77 987 6543"
    },
    {
      id: 4,
      memberId: 5,
      memberName: "Khabib Nurmagomedov",
      phone: "+94 78 567 8901",
      address: "555 Galle Rd, Colombo 03",
      prayer: "Dhuhr",
      date: "2025-01-18",
      time: "12:15 PM",
      disabilityLevel: "Hearing Impairment",
      needsAssistance: true,
      specialRequirements: "Guide assistance required",
      status: "rejected",
      rejectionReason: "No available vehicles for guide assistance",
      requestedAt: "2025-01-14T21:00:00",
      rejectedAt: "2025-01-14T22:30:00",
      emergencyContact: "+94 78 901 2345"
    }
  ]);

  // Mock data for vehicles
  const [drivers, setDrivers] = useState([
    {
      id: 1,
      vehicleType: "Motorbike",
      isAvailable: true
    },
    {
      id: 2,
      vehicleType: "Scooter",
      isAvailable: true
    },
    {
      id: 3,
      vehicleType: "Mini Car",
      isAvailable: false
    },
    {
      id: 4,
      vehicleType: "Van",
      isAvailable: true
    }
  ]);

  // Transport statistics - simplified
  const [transportStats, setTransportStats] = useState({
    totalMembers: members.length,
    needsAssistance: members.filter(m => m.needsAssistance).length,
    pendingRequests: pickupRequests.filter(r => r.status === 'pending').length,
    approvedRequests: pickupRequests.filter(r => r.status === 'approved').length,
    rejectedRequests: pickupRequests.filter(r => r.status === 'rejected').length
  });

  // Update stats when data changes
  useEffect(() => {
    setTransportStats({
      totalMembers: members.length,
      needsAssistance: members.filter(m => m.needsAssistance).length,
      pendingRequests: pickupRequests.filter(r => r.status === 'pending').length,
      approvedRequests: pickupRequests.filter(r => r.status === 'approved').length,
      rejectedRequests: pickupRequests.filter(r => r.status === 'rejected').length
    });
  }, [members, pickupRequests]);

  const handleRequestAction = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
  };

  const submitAction = () => {
    if (actionType === 'approve' && !selectedDriver) {
      alert('Please select a vehicle');
      return;
    }
    if (actionType === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setPickupRequests(prev => prev.map(request => {
      if (request.id === selectedRequest.id) {
        return {
          ...request,
          status: actionType === 'approve' ? 'approved' : 'rejected',
          assignedDriver: actionType === 'approve' ? drivers.find(d => d.id === parseInt(selectedDriver))?.vehicleType : null,
          rejectionReason: actionType === 'reject' ? rejectionReason : null,
          [actionType === 'approve' ? 'approvedAt' : 'rejectedAt']: new Date().toISOString()
        };
      }
      return request;
    }));

    // Reset modal
    setShowModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
    setSelectedDriver('');
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`;
  };

  const getDisabilityBadge = (level) => {
    const colors = {
      'None': 'bg-gray-100 text-gray-800',
      'Mild Mobility Issues': 'bg-yellow-100 text-yellow-800',
      'Visual Impairment': 'bg-blue-100 text-blue-800',
      'Wheelchair User': 'bg-orange-100 text-orange-800',
      'Severe Disability': 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${colors[level] || 'bg-gray-100 text-gray-800'}`;
  };

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transport & Mobility Management</h1>
          <p className="text-gray-600">Manage member transportation needs and pickup requests</p>
        </div>

        {/* Statistics Cards - simplified */}
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

        {/* Tabs - only keep two tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
          {[
            {
              id: 'members',
              label: 'Member Transport Info'
            },
            {
              id: 'requests',
              label: 'Pickup Requests'
            }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disability Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assistance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map(member => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {member.transportMode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getDisabilityBadge(member.disabilityLevel)}>
                          {member.disabilityLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          member.needsAssistance ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {member.needsAssistance ? 'Required' : 'Not Required'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{member.phone}</div>
                        <div className="text-xs text-gray-500">Emergency: {member.emergencyContact}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Pickup Requests Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prayer & Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requirements</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pickupRequests.map(request => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.memberName}</div>
                          <div className="text-sm text-gray-500">{request.address}</div>
                          <div className="text-xs text-gray-500">{request.phone}</div>
                          <span className={getDisabilityBadge(request.disabilityLevel)}>
                            {request.disabilityLevel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.prayer}</div>
                        <div className="text-sm text-gray-500">{request.date}</div>
                        <div className="text-xs text-gray-500">{request.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{request.specialRequirements}</div>
                        {request.needsAssistance && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                            Assistance Required
                          </span>
                        )}
                        {request.assignedDriver && (
                          <div className="text-xs text-green-600 mt-1">
                            <strong>Vehicle:</strong> {request.assignedDriver}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1 max-w-xs">
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
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRequestAction(request, 'reject')}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <div className="text-xs text-gray-500">
                            {request.status === 'approved' ? 
                              `Approved: ${new Date(request.approvedAt).toLocaleDateString()}` :
                              `Rejected: ${new Date(request.rejectedAt).toLocaleDateString()}`
                            }
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Modal - keep existing modal code */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {actionType === 'approve' ? 'Approve Pickup Request' : 'Reject Pickup Request'}
                </h3>
                
                {selectedRequest && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm">
                      <strong>{selectedRequest.memberName}</strong> - {selectedRequest.prayer} Prayer
                    </div>
                    <div className="text-xs text-gray-600">{selectedRequest.date} at {selectedRequest.time}</div>
                    <div className="text-xs text-gray-600">{selectedRequest.specialRequirements}</div>
                  </div>
                )}
                
                {actionType === 'approve' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Vehicle*
                    </label>
                    <select
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select a vehicle</option>
                      {drivers
                        .filter(d => d.isAvailable)
                        .map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.vehicleType}
                          </option>
                        ))}
                    </select>
                    {drivers.filter(d => d.isAvailable).length === 0 && (
                      <p className="text-red-500 text-xs mt-1">No available vehicles</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Rejection*
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows="4"
                      placeholder="Please provide a detailed reason for rejection..."
                    ></textarea>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRequest(null);
                      setRejectionReason('');
                      setSelectedDriver('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAction}
                    className={`px-4 py-2 rounded-md text-white ${
                      actionType === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default TransportPage;
