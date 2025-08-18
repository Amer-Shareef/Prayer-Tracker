import React, { useState } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';

const SuperAdminMeetingsPage = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      title: 'Weekly Imam Meeting',
      mosque: 'All Mosques',
      date: '2025-07-05',
      time: '14:00',
      type: 'recurring',
      attendees: 15,
      status: 'scheduled'
    },
    {
      id: 2,
      title: 'Youth Program Planning',
      mosque: 'Central Mosque',
      date: '2025-07-07',
      time: '16:00',
      type: 'one-time',
      attendees: 8,
      status: 'scheduled'
    }
  ]);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    mosque: 'all',
    date: '',
    time: '',
    type: 'one-time',
    description: '',
    maxAttendees: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // API call would go here
      console.log('Creating meeting:', newMeeting);
      
      const meetingToAdd = {
        id: meetings.length + 1,
        ...newMeeting,
        attendees: 0,
        status: 'scheduled'
      };
      
      setMeetings([...meetings, meetingToAdd]);
      
      // Reset form
      setNewMeeting({
        title: '',
        mosque: 'all',
        date: '',
        time: '',
        type: 'one-time',
        description: '',
        maxAttendees: ''
      });
      
      alert('Meeting scheduled successfully!');
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to schedule meeting');
    }
  };

  const handleDeleteMeeting = (id) => {
    if (window.confirm('Are you sure you want to cancel this meeting?')) {
      setMeetings(meetings.filter(meeting => meeting.id !== id));
    }
  };

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Personal Meetings (All Mosques)</h1>
          <p className="text-gray-600">Schedule and manage meetings across all mosques</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Schedule Meeting
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'meetings'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Meetings
            </button>
            <button
              onClick={() => setActiveTab('counselling')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'counselling'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Counselling Sessions
            </button>
          </nav>
        </div>

        {activeTab === 'schedule' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Schedule New Meeting</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Mosque
                    </label>
                    <select
                      value={newMeeting.mosque}
                      onChange={(e) => setNewMeeting({...newMeeting, mosque: e.target.value})}
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
                      Date
                    </label>
                    <input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newMeeting.time}
                      onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Type
                    </label>
                    <select
                      value={newMeeting.type}
                      onChange={(e) => setNewMeeting({...newMeeting, type: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="one-time">One-time Meeting</option>
                      <option value="recurring">Recurring Meeting</option>
                      <option value="counselling">Counselling Session</option>
                      <option value="emergency">Emergency Meeting</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Attendees
                    </label>
                    <input
                      type="number"
                      value={newMeeting.maxAttendees}
                      onChange={(e) => setNewMeeting({...newMeeting, maxAttendees: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newMeeting.description}
                      onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                      rows="4"
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Meeting agenda or description..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Schedule Meeting
              </button>
            </form>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Scheduled Meetings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Meeting
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mosque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Attendees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {meetings.map((meeting) => (
                    <tr key={meeting.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{meeting.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{meeting.mosque}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{meeting.date}</div>
                        <div className="text-sm text-gray-500">{meeting.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          meeting.type === 'recurring' ? 'bg-blue-100 text-blue-800' :
                          meeting.type === 'counselling' ? 'bg-green-100 text-green-800' :
                          meeting.type === 'emergency' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {meeting.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {meeting.attendees}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'counselling' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Counselling Sessions</h3>
            <p className="text-gray-600 mb-4">
              Manage private counselling sessions across all mosques
            </p>
            
            {/* Counselling Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-gray-500">Total Sessions</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">18</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">4</div>
                <div className="text-sm text-gray-500">Scheduled</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">2</div>
                <div className="text-sm text-gray-500">Cancelled</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">
                Counselling sessions are private and confidential. Only general statistics are shown here.
                Individual session details are available only to the assigned counselor and the participant.
              </p>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminMeetingsPage;
