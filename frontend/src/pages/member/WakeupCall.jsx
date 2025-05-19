import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';

const WakeupCall = () => {
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    time: '',
    days: [],
    method: 'phone',
    active: true,
    phone: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const weekdays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];
  
  const contactMethods = [
    { value: 'phone', label: 'Phone Call' },
    { value: 'sms', label: 'SMS Message' },
    { value: 'whatsapp', label: 'WhatsApp' }
  ];
  
  useEffect(() => {
    // In a real app, we would fetch the user's existing wake-up schedules from the API
    // For now, we'll create some mock data
    setSchedules([
      {
        id: 1,
        time: '04:15',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        method: 'phone',
        active: true,
        phone: '077 123 4567'
      },
      {
        id: 2,
        time: '04:30',
        days: ['saturday', 'sunday'],
        method: 'sms',
        active: false,
        phone: '077 123 4567'
      }
    ]);
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDayToggle = (day) => {
    setNewSchedule(prev => {
      if (prev.days.includes(day)) {
        return { ...prev, days: prev.days.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...prev.days, day] };
      }
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a new schedule object
    const schedule = {
      id: Date.now(), // simple ID for demo
      ...newSchedule
    };
    
    // Add to the schedules list
    setSchedules(prev => [...prev, schedule]);
    
    // Reset the form and hide it
    setNewSchedule({
      time: '',
      days: [],
      method: 'phone',
      active: true,
      phone: ''
    });
    setShowForm(false);
    
    // Show success message
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };
  
  const toggleScheduleActive = (id) => {
    setSchedules(prev => prev.map(schedule => {
      if (schedule.id === id) {
        return { ...schedule, active: !schedule.active };
      }
      return schedule;
    }));
  };
  
  const deleteSchedule = (id) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  };
  
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    return `${parseInt(hours)}:${minutes} ${parseInt(hours) >= 12 ? 'PM' : 'AM'}`;
  };
  
  const formatDays = (days) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && 
        days.includes('monday') && 
        days.includes('tuesday') && 
        days.includes('wednesday') && 
        days.includes('thursday') && 
        days.includes('friday')) return 'Weekdays';
    if (days.length === 2 && 
        days.includes('saturday') && 
        days.includes('sunday')) return 'Weekends';
        
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
  };
  
  const getMethodIcon = (method) => {
    switch(method) {
      case 'phone': return '📞';
      case 'sms': return '📱';
      case 'whatsapp': return '💬';
      default: return '📞';
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Wake-up Call</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Your Wake-up Schedule</h2>
            
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
              >
                + Add New Schedule
              </button>
            )}
          </div>
          
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
                  <p>Your wake-up call schedule has been added successfully.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Add/Edit Schedule Form */}
          {showForm && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Add New Wake-up Schedule</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="time">
                      Wake-up Time
                    </label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={newSchedule.time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Select a time before Fajr prayer for your wake-up call
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Contact Method
                    </label>
                    <div className="space-y-2">
                      {contactMethods.map(method => (
                        <label key={method.value} className="flex items-center">
                          <input
                            type="radio"
                            name="method"
                            value={method.value}
                            checked={newSchedule.method === method.value}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-2">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="phone">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="e.g. +1 (555) 123-4567"
                      value={newSchedule.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          newSchedule.days.includes(day.value)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
                  >
                    Save Schedule
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Schedules List */}
          {schedules.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-gray-500 mb-2">⏰</div>
              <h3 className="text-lg font-medium text-gray-900">No wake-up schedules</h3>
              <p className="text-gray-500">
                Add a new schedule to get wake-up calls for Fajr prayer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map(schedule => (
                <div 
                  key={schedule.id}
                  className={`border rounded-lg p-4 ${
                    schedule.active ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between mb-2">
                    <h3 className="font-bold text-lg">
                      {formatTime(schedule.time)}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleScheduleActive(schedule.id)}
                        className={`px-2 py-1 rounded text-xs ${
                          schedule.active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {schedule.active ? 'Active' : 'Inactive'}
                      </button>
                      
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-gray-600 mb-1">
                    <span className="inline-block mr-1">{getMethodIcon(schedule.method)}</span>
                    {schedule.phone}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {formatDays(schedule.days)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">About Wake-up Service</h2>
          
          <div className="prose max-w-none">
            <p>
              Our wake-up call service is designed to help you wake up for Fajr prayer. 
              You can schedule automated calls to your phone before the Fajr prayer time.
            </p>
            
            <h3 className="mt-4 text-lg font-medium">How it works:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Set up your preferred wake-up time and days of the week</li>
              <li>Choose your preferred contact method (phone call, SMS, or WhatsApp)</li>
              <li>Receive your wake-up call at the scheduled time</li>
              <li>You can have multiple wake-up schedules to fit your needs</li>
              <li>Easily activate or deactivate schedules without deleting them</li>
            </ul>
            
            <p className="mt-4 text-sm text-gray-500">
              Note: Standard message and data rates may apply for SMS and WhatsApp notifications.
            </p>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default WakeupCall;