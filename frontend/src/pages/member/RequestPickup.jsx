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
    pickup_location: '',
    contact_number: '',
    special_instructions: '',
    days: [],
    prayers: []
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
    
    if (!formData.pickup_location || formData.days.length === 0 || formData.prayers.length === 0) {
      setError('Pickup location, days, and prayers are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📤 Submitting pickup request:', formData);
      const response = await pickupService.createPickupRequest(formData);
      
      if (response.data.success) {
        setSuccess('Pickup request submitted successfully!');
        setFormData({
          pickup_location: '',
          contact_number: '',
          special_instructions: '',
          days: [],
          prayers: []
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

  const handleDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handlePrayerChange = (prayer) => {
    setFormData(prev => ({
      ...prev,
      prayers: prev.prayers.includes(prayer) 
        ? prev.prayers.filter(p => p !== prayer)
        : [...prev.prayers, prayer]
    }));
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
          {/* Enhanced Request Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800">🌅 Enhanced Fajr Transportation Request</h2>
              <p className="text-gray-600 mt-1">Request transportation to the mosque for Fajr prayer with detailed information</p>
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
              {/* Pickup location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📍 Pickup Location *
                </label>
                <input
                  type="text"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleInputChange}
                  placeholder="Enter your pickup location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Days selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Select Days *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.days.includes(day)}
                        onChange={() => handleDayChange(day)}
                        className="mr-2"
                      />
                      <span className="capitalize">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prayers selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🕌 Select Prayers *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(prayer => (
                    <label key={prayer} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.prayers.includes(prayer)}
                        onChange={() => handlePrayerChange(prayer)}
                        className="mr-2"
                      />
                      <span className="capitalize">{prayer}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contact number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📞 Contact Number
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  placeholder="Your phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Special instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📝 Special Instructions
                </label>
                <textarea
                  name="special_instructions"
                  value={formData.special_instructions}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Any special instructions for pickup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Submitting...' : '🚗 Submit Pickup Request'}
              </button>
            </form>

            {/* Enhanced info section */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Enhanced Features:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 🌅 Fajr prayer pickup requests only</li>
                <li>• 📍 GPS location tracking (if enabled)</li>
                <li>• 🏠 Detailed address with landmarks</li>
                <li>• 📝 Special instructions for drivers</li>
                <li>• 📞 Alternative contact options</li>
                <li>• ⏰ Submit at least 12 hours in advance</li>
                <li>• 📱 Mobile-optimized workflow</li>
              </ul>
            </div>
          </div>
          
          {/* My Requests section remains the same */}
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