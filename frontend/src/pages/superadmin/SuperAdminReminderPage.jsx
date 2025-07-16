import React, { useState } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';

const SuperAdminReminderPage = () => {
  const [reminderData, setReminderData] = useState({
    title: '',
    content: '',
    targetMosques: 'all',
    targetAudience: 'all',
    sendTime: '',
    recurring: false,
    frequency: 'daily'
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // API call would go here
      console.log('Sending reminder:', reminderData);
      alert('Reminder sent successfully to all targeted mosques!');
      
      // Reset form
      setReminderData({
        title: '',
        content: '',
        targetMosques: 'all',
        targetAudience: 'all',
        sendTime: '',
        recurring: false,
        frequency: 'daily'
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Send Daily Reminders (All Mosques)</h1>
          <p className="text-gray-600">Send prayer reminders and announcements to all or specific mosques</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Mosques
                  </label>
                  <select
                    value={reminderData.targetMosques}
                    onChange={(e) => setReminderData({...reminderData, targetMosques: e.target.value})}
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
                    Target Audience
                  </label>
                  <select
                    value={reminderData.targetAudience}
                    onChange={(e) => setReminderData({...reminderData, targetAudience: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="all">All Members</option>
                    <option value="active">Active Members Only</option>
                    <option value="inactive">Inactive Members</option>
                    <option value="founders">Founders Only</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send Time
                  </label>
                  <input
                    type="datetime-local"
                    value={reminderData.sendTime}
                    onChange={(e) => setReminderData({...reminderData, sendTime: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reminderData.recurring}
                      onChange={(e) => setReminderData({...reminderData, recurring: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Recurring Reminder</span>
                  </label>
                </div>

                {reminderData.recurring && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      value={reminderData.frequency}
                      onChange={(e) => setReminderData({...reminderData, frequency: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminder Title
                  </label>
                  <input
                    type="text"
                    value={reminderData.title}
                    onChange={(e) => setReminderData({...reminderData, title: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., Fajr Prayer Reminder"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content
                  </label>
                  <textarea
                    value={reminderData.content}
                    onChange={(e) => setReminderData({...reminderData, content: e.target.value})}
                    rows="8"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Enter your reminder message here..."
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reminder'}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Templates */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Quick Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setReminderData({
                ...reminderData,
                title: 'Fajr Prayer Reminder',
                content: 'Assalamu Alaikum! This is a gentle reminder for Fajr prayer. The prayer time is approaching. Please prepare for congregational prayer.'
              })}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <h4 className="font-medium">Fajr Reminder</h4>
              <p className="text-sm text-gray-600">Standard morning prayer reminder</p>
            </button>

            <button
              onClick={() => setReminderData({
                ...reminderData,
                title: 'Friday Prayer Announcement',
                content: 'Assalamu Alaikum! Reminder for Jummah prayer today. Please arrive early for the best spots and listen to the Khutbah.'
              })}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <h4 className="font-medium">Friday Prayer</h4>
              <p className="text-sm text-gray-600">Weekly Friday prayer reminder</p>
            </button>

            <button
              onClick={() => setReminderData({
                ...reminderData,
                title: 'Evening Dhikr Session',
                content: 'Join us for our evening Dhikr session after Maghrib prayer. Let us remember Allah together and strengthen our Iman.'
              })}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <h4 className="font-medium">Dhikr Session</h4>
              <p className="text-sm text-gray-600">Evening spiritual gathering</p>
            </button>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminReminderPage;
