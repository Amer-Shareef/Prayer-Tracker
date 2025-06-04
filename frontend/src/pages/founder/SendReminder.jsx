import React, { useState } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

const SendReminder = () => {
  const [selectedPrayer, setSelectedPrayer] = useState('');
  const [reminderType, setReminderType] = useState('all');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumuah'];
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // In the app, API call would go here
    console.log({ selectedPrayer, reminderType, message });
    setSubmitted(true);
    
    // Reset form after submission
    setTimeout(() => {
      setSelectedPrayer('');
      setReminderType('all');
      setMessage('');
      setSubmitted(false);
    }, 3000);
  };
  
  return (
    <FounderLayout>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Send Prayer Reminders</h1>
        
        {submitted && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p>Reminder sent successfully!</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prayer">
              Prayer
            </label>
            <select
              id="prayer"
              value={selectedPrayer}
              onChange={(e) => setSelectedPrayer(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a prayer</option>
              {prayers.map(prayer => (
                <option key={prayer} value={prayer}>{prayer}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Send to
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  className="form-radio text-green-600" 
                  name="reminderType" 
                  value="all"
                  checked={reminderType === 'all'}
                  onChange={() => setReminderType('all')} 
                />
                <span className="ml-2">All Members</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  className="form-radio text-green-600" 
                  name="reminderType" 
                  value="missed"
                  checked={reminderType === 'missed'}
                  onChange={() => setReminderType('missed')} 
                />
                <span className="ml-2">Members who missed recent prayers</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  className="form-radio text-green-600" 
                  name="reminderType" 
                  value="inactive"
                  checked={reminderType === 'inactive'}
                  onChange={() => setReminderType('inactive')} 
                />
                <span className="ml-2">Inactive Members</span>
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
              Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 h-32 focus:outline-none focus:shadow-outline"
              placeholder="Enter a personalized message..."
            ></textarea>
          </div>
            <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Send Reminder
            </button>
          </div>
        </form>
        
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Scheduled Reminders</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex flex-col space-y-4">
              <div className="border-b pb-2">
                <p className="font-semibold">Fajr Prayer - Daily</p>
                <p className="text-sm text-gray-600">Sent 30 minutes before Fajr</p>
                <p className="text-sm text-gray-600">Recipients: All Members</p>
              </div>
              <div className="border-b pb-2">
                <p className="font-semibold">Jumuah Prayer - Weekly</p>
                <p className="text-sm text-gray-600">Sent 2 hours before Jumuah</p>
                <p className="text-sm text-gray-600">Recipients: All Members</p>
              </div>
              <div>
                <p className="font-semibold">Check-in Reminder - Weekly</p>
                <p className="text-sm text-gray-600">Sent Sundays at 8:00 PM</p>
                <p className="text-sm text-gray-600">Recipients: Inactive Members</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FounderLayout>
  );
};

export default SendReminder;
