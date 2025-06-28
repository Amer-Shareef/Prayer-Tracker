import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';
import { meetingsService } from '../../services/api';

const MeetingsPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [members, setMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab management
  const [activeTab, setActiveTab] = useState('scheduled');
  
  // Filter for members tab
  const [memberFilter, setMemberFilter] = useState('all');
  
  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: ''
  });
  
  const [completeForm, setCompleteForm] = useState({
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [membersResponse, meetingsResponse] = await Promise.all([
        meetingsService.getMembersForCounselling().catch(() => ({ data: { success: false, data: [] } })),
        meetingsService.getCounsellingSessions().catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (membersResponse.data && membersResponse.data.success) {
        setMembers(membersResponse.data.data || []);
      }

      if (meetingsResponse.data && meetingsResponse.data.success) {
        setMeetings(meetingsResponse.data.data || []);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = (member) => {
    setSelectedMember(member);
    setScheduleForm({ date: '', time: '' });
    setShowScheduleModal(true);
  };

  const handleCompleteMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setCompleteForm({ notes: '' });
    setShowCompleteModal(true);
  };

  const handleDeleteMeeting = async (meeting) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      console.log('🗑️ Attempting to delete meeting:', meeting.id);
      
      const response = await meetingsService.deleteCounsellingSession(meeting.id);
      
      console.log('📥 Delete response:', response);
      
      // Check response.data.success instead of response.success
      if (response.data && response.data.success) {
        alert('Meeting deleted successfully!');
        await fetchData(); // Refresh data
      } else {
        console.error('❌ Delete failed:', response);
        alert('Failed to delete meeting: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error deleting meeting:', err);
      
      // If it's a 404 error, it means the meeting was already deleted
      if (err.response?.status === 404) {
        alert('Meeting deleted successfully!');
        await fetchData(); // Refresh data
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert('Failed to delete meeting: ' + errorMessage);
    }
  };

  const submitSchedule = async () => {
    if (!scheduleForm.date || !scheduleForm.time) {
      alert('Please select date and time');
      return;
    }

    try {
      const sessionData = {
        memberId: selectedMember.id,
        scheduledDate: scheduleForm.date,
        scheduledTime: scheduleForm.time,
        sessionType: 'phone_call',
        priority: 'medium',
        preSessionNotes: `Meeting scheduled for ${selectedMember.memberName || selectedMember.username}`
      };

      const response = await meetingsService.scheduleCounsellingSession(sessionData);
      
      if (response.data && response.data.success) {
        alert('Meeting scheduled successfully!');
        setShowScheduleModal(false);
        setSelectedMember(null);
        await fetchData(); // Refresh data
      } else {
        alert('Failed to schedule meeting');
      }
    } catch (err) {
      console.error('Error scheduling:', err);
      alert('Failed to schedule meeting');
    }
  };

  const submitComplete = async () => {
    if (!completeForm.notes.trim()) {
      alert('Please add notes');
      return;
    }

    try {
      const updateData = {
        status: 'completed',
        sessionNotes: completeForm.notes
      };

      const response = await meetingsService.updateCounsellingSession(selectedMeeting.id, updateData);
      
      if (response.data && response.data.success) {
        alert('Meeting completed!');
        setShowCompleteModal(false);
        setSelectedMeeting(null);
        await fetchData(); // Refresh data
      } else {
        alert('Failed to complete meeting');
      }
    } catch (err) {
      console.error('Error completing:', err);
      alert('Failed to complete meeting');
    }
  };

  // Filter members based on selected filter
  const getFilteredMembers = () => {
    // For now, both filters show the same members since we only have low attendance members
    return members;
  };

  // Filter meetings for different tabs
  const getScheduledMeetings = () => meetings.filter(m => m.status === 'scheduled');
  const getCompletedMeetings = () => meetings.filter(m => m.status === 'completed');

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg">Loading...</div>
        </div>
      </FounderLayout>
    );
  }

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Personal Meetings</h1>
          <p className="text-gray-600 mt-1">Schedule and manage meetings with members</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scheduled'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Scheduled Meetings
                <span className="ml-2 bg-blue-100 text-blue-600 py-1 px-2 rounded-full text-xs">
                  {getScheduledMeetings().length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('members')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Members
                <span className="ml-2 bg-green-100 text-green-600 py-1 px-2 rounded-full text-xs">
                  {getFilteredMembers().length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed Meetings
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {getCompletedMeetings().length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          
          {/* Scheduled Meetings Tab */}
          {activeTab === 'scheduled' && (
            <div>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Scheduled Meetings</h2>
              </div>
              <div className="p-4">
                {getScheduledMeetings().length === 0 ? (
                  <p className="text-gray-500">No meetings scheduled</p>
                ) : (
                  <div className="space-y-4">
                    {getScheduledMeetings().map((meeting) => (
                      <div key={meeting.id} className="border rounded p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">
                            {meeting.member_name || meeting.member_username || 'Unknown Member'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(meeting.scheduled_date).toLocaleDateString()} at {meeting.scheduled_time}
                          </p>
                          <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                            {meeting.status}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCompleteMeeting(meeting)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            Mark Complete
                          </button>
                          <button
                            onClick={() => handleDeleteMeeting(meeting)}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Members</h2>
                <div className="flex items-center space-x-4">
                  
                </div>
              </div>
              <div className="p-4">
                {getFilteredMembers().length === 0 ? (
                  <p className="text-gray-500">No members found</p>
                ) : (
                  <div className="space-y-4">
                    {getFilteredMembers().map((member) => (
                      <div key={member.id} className="border rounded p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">
                            {member.memberName || member.full_name || member.username || 'Unknown Member'}
                          </h3>
                          <p className="text-sm text-gray-600">ID: {member.memberId}</p>
                          <p className="text-sm text-gray-600">Phone: {member.phone || 'N/A'}</p>
                          <p className={`text-sm ${member.attendanceRate < 70 ? 'text-red-600' : 'text-green-600'}`}>
                            Attendance: {member.attendanceRate || 0}%
                          </p>
                        </div>
                        <div>
                          <button
                            onClick={() => handleScheduleMeeting(member)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                          >
                            Schedule Meeting
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completed Meetings Tab */}
          {activeTab === 'completed' && (
            <div>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Completed Meetings</h2>
              </div>
              <div className="p-4">
                {getCompletedMeetings().length === 0 ? (
                  <p className="text-gray-500">No completed meetings</p>
                ) : (
                  <div className="space-y-4">
                    {getCompletedMeetings().map((meeting) => (
                      <div key={meeting.id} className="border rounded p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">
                            {meeting.member_name || meeting.member_username || 'Unknown Member'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(meeting.scheduled_date).toLocaleDateString()} at {meeting.scheduled_time}
                          </p>
                          <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            {meeting.status}
                          </span>
                          {meeting.session_notes && (
                            <p className="text-sm text-gray-600 mt-2">Notes: {meeting.session_notes}</p>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => handleDeleteMeeting(meeting)}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
              <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
                <h3 className="text-lg font-medium mb-4">
                  Schedule Meeting - {selectedMember?.memberName || selectedMember?.username}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitSchedule}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
              <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
                <h3 className="text-lg font-medium mb-4">
                  Complete Meeting - {selectedMeeting?.member_name || selectedMeeting?.member_username || 'Unknown Member'}
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting Notes</label>
                  <textarea
                    value={completeForm.notes}
                    onChange={(e) => setCompleteForm({notes: e.target.value})}
                    rows="4"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="What was discussed in the meeting?"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitComplete}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Complete Meeting
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

export default MeetingsPage;