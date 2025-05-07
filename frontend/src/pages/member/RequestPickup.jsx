import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';

const RequestPickup = () => {
  const [pickupRequests, setPickupRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({
    date: '',
    prayer: '',
    time: '',
    location: '',
    notes: ''
  });
  const [success, setSuccess] = useState(false);

  const prayerOptions = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumu\'ah'];
  
  useEffect(() => {
    // In a real app, you would fetch existing pickup requests from your API
    // For now, we'll create some mock data
    setPickupRequests([
      {
        id: 1,
        date: '2025-05-10',
        prayer: 'Fajr',
        time: '4:45 AM',
        location: '123 Main St, Cityville',
        status: 'approved',
        notes: 'Please pick me up from the side entrance'
      },
      {
        id: 2,
        date: '2025-05-09',
        prayer: 'Jumu\'ah',
        time: '12:45 PM',
        location: '456 Oak Ave, Townsburg',
        status: 'pending',
        notes: 'I will be waiting at the bus stop'
      }
    ]);
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a new request object
    const request = {
      id: Date.now(), // simple ID for demo
      ...newRequest,
      status: 'pending'
    };
    
    // Add to the requests list
    setPickupRequests(prev => [...prev, request]);
    
    // Reset the form
    setNewRequest({
      date: '',
      prayer: '',
      time: '',
      location: '',
      notes: ''
    });
    
    // Show success message
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };
  
  const cancelRequest = (id) => {
    setPickupRequests(prev => prev.filter(request => request.id !== id));
  };

  // Get dates for the next 7 days
  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const formattedDate = date.toISOString().split('T')[0];
      const readableDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
      
      days.push({ value: formattedDate, label: readableDate });
    }
    return days;
  };
  
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Request Mosque Pickup</h1>
        
        {/* Success message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <div className="flex">
              <div className="py-1">
                <svg className="h-6 w-6 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-bold">Success!</p>
                <p>Your pickup request has been submitted successfully and is awaiting approval.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Schedule a New Pickup</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="date">
                  Date
                </label>
                <select
                  id="date"
                  name="date"
                  value={newRequest.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a date</option>
                  {getNextDays().map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="prayer">
                  Prayer
                </label>
                <select
                  id="prayer"
                  name="prayer"
                  value={newRequest.prayer}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a prayer</option>
                  {prayerOptions.map(prayer => (
                    <option key={prayer} value={prayer}>{prayer}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="time">
                  Pickup Time
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={newRequest.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="location">
                  Pickup Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  placeholder="Enter your address"
                  value={newRequest.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="notes">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  placeholder="Any special instructions for the driver"
                  value={newRequest.notes}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
              >
                Request Pickup
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Your Pickup Requests</h2>
          
          {pickupRequests.length === 0 ? (
            <p className="text-gray-500">You don't have any pickup requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prayer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pickupRequests.map(request => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(request.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.prayer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.status === 'pending' && (
                          <button
                            onClick={() => cancelRequest(request.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  );
};

export default RequestPickup;