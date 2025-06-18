import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { pickupService } from '../../services/api';

const RequestPickup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [myRequests, setMyRequests] = useState([]);
  
  const [formData, setFormData] = useState({
    request_date: new Date().toISOString().split('T')[0],
    pickup_location: ''
  });

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setRequestsLoading(true);
      setError('');
      
      console.log('🔄 Fetching my pickup requests...');
      const response = await pickupService.getPickupRequests({ limit: 10 });
      
      console.log('📋 Pickup requests response:', response.data);
      
      if (response.data.success) {
        setMyRequests(response.data.data);
        console.log(`✅ Found ${response.data.data.length} pickup requests`);
      } else {
        console.log('❌ Failed to fetch requests:', response.data.message);
        setError('Failed to load pickup requests');
      }
    } catch (err) {
      console.error('❌ Error fetching my requests:', err);
      setError('Error loading pickup requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.request_date || !formData.pickup_location) {
      setError('Date and pickup location are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📤 Submitting Fajr pickup request:', formData);
      const response = await pickupService.createPickupRequest(formData);
      
      if (response.data.success) {
        setSuccess('Fajr pickup request submitted successfully!');
        setFormData({
          request_date: new Date().toISOString().split('T')[0],
          pickup_location: ''
        });
        
        // Refresh the requests list
        console.log('🔄 Refreshing requests list...');
        await fetchMyRequests();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to submit pickup request');
      }
    } catch (err) {
      console.error('❌ Error submitting pickup request:', err);
      setError(err.response?.data?.message || 'Failed to submit pickup request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this pickup request? This will permanently delete the request.')) {
      return;
    }

    try {
      console.log(`🗑️ Cancelling and deleting request ID: ${requestId}`);
      
      await pickupService.cancelPickupRequest(requestId);
      setSuccess('Request cancelled and removed successfully');
      
      // FIXED: Immediately refresh the list after deletion
      console.log('🔄 Refreshing requests list after deletion...');
      await fetchMyRequests();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('❌ Error cancelling request:', err);
      setError(err.response?.data?.message || 'Failed to cancel request');
      setTimeout(() => setError(''), 5000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusMessage = (request) => {
    switch (request.status) {
      case 'pending':
        return 'Waiting for founder approval';
      case 'approved':
        return request.assigned_driver_name 
          ? `Driver: ${request.assigned_driver_name}${request.assigned_driver_phone ? ` (${request.assigned_driver_phone})` : ''}`
          : 'Approved - Driver will be assigned';
      case 'rejected':
        return 'Request rejected';
      case 'completed':
        return 'Pickup completed';
      case 'cancelled':
        return 'Request cancelled by you'; // UPDATED MESSAGE
      default:
        return request.status;
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Request Fajr Pickup</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">🌅 Fajr Transportation Request</h2>
              <p className="text-gray-600 mt-1">Request transportation to the mosque for Fajr prayer</p>
            </div>
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                <div className="flex">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                <div className="flex">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📅 Request Date *
                </label>
                <input
                  type="date"
                  name="request_date"
                  value={formData.request_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Select the date you need pickup for Fajr prayer</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📍 Pickup Location *
                </label>
                <textarea
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter your pickup address with landmarks (e.g., House #123, Main Street, near ABC Shop)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Please provide detailed address with landmarks</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Submitting...' : '🚗 Submit Fajr Pickup Request'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      request_date: new Date().toISOString().split('T')[0],
                      pickup_location: ''
                    });
                    setError('');
                    setSuccess('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Clear Form
                </button>
              </div>
            </form>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Information:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 🌅 Only Fajr prayer pickup requests are accepted</li>
                <li>• ⏰ Submit requests at least 12 hours in advance</li>
                <li>• ✅ You'll be notified once approved with driver details</li>
                <li>• 📞 Driver will contact you before pickup time</li>
              </ul>
            </div>
          </div>
          {/* My Requests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">🌅 My Fajr Pickup Requests</h2>
              <button
                onClick={fetchMyRequests}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                🔄 Refresh
              </button>
            </div>
            {requestsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading requests...</p>
              </div>
            ) : myRequests.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {myRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          🌅 Fajr Prayer Pickup
                        </h3>
                        <p className="text-sm text-gray-600">
                          📅 {new Date(request.request_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">📍 Location:</span> {request.pickup_location}
                    </p>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">📋 Status:</span> {getStatusMessage(request)}
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-3 pt-2 border-t">
                      <span>
                        📅 Requested: {new Date(request.created_at).toLocaleDateString()}
                      </span>
                      {/* UPDATED: Only show cancel button for pending requests */}
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          🗑️ Delete Request
                        </button>
                      )}
                      {/* UPDATED: Show status info for non-pending requests */}
                      {request.status !== 'pending' && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          request.status === 'approved' ? 'bg-green-100 text-green-600' :
                          request.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {request.status === 'approved' ? '✅ Approved' :
                           request.status === 'completed' ? '🎉 Completed' :
                           request.status === 'rejected' ? '❌ Rejected' :
                           `📋 ${request.status}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Fajr pickup requests</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't made any Fajr pickup requests yet.</p>
                <button
                  className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
                  onClick={fetchMyRequests}
                >
                  🔄 Check again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default RequestPickup;