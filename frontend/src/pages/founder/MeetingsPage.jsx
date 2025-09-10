import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';
import { meetingsService, memberAPI, areaService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import WeeklyMeetings from '../../components/WeeklyMeetings';

const MeetingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [members, setMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [availableMentors, setAvailableMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab management
  const [activeTab, setActiveTab] = useState('weekly');
  
  // Filter for members tab
  const [memberFilter, setMemberFilter] = useState('all');
  
  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    mentorId: ''
  });
  
  const [completeForm, setCompleteForm] = useState({
    notes: ''
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: ''
  });

  // Add date and area state
  const [currentDate, setCurrentDate] = useState({
    gregorian: 'Loading...',
    hijri: 'Loading...'
  });
  const [areaName, setAreaName] = useState('Loading...');

  // Fetch current date
  useEffect(() => {
    const today = new Date();
    
    const gregorianDate = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    let hijriDate;
    try {
      hijriDate = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(today);
    } catch (error) {
      hijriDate = "Hijri date not supported";
    }

    setCurrentDate({
      gregorian: gregorianDate,
      hijri: hijriDate
    });
  }, []);

  // Fetch user area name
  useEffect(() => {
    const fetchUserArea = async () => {
      if (user?.areaId || user?.area_id) {
        try {
          const response = await areaService.getAreaStats(user.areaId || user.area_id);
          if (response.data.success) {
            setAreaName(response.data.data.area.name || 'Area');
          }
        } catch (error) {
          console.error('Error fetching area:', error);
          setAreaName('Area');
        }
      }
    };
    
    if (user) {
      fetchUserArea();
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchAvailableMentors = async () => {
    try {
      // Fetch founders from the same mosque as the current user
      const response = await memberAPI.getFounders();
      if (response && response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error('Error fetching mentors:', error);
      return { success: false, data: [] };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [membersResponse, meetingsResponse, mentorsResponse] = await Promise.all([
        memberAPI.getMembers().catch(() => ({ success: false, data: [] })),
        meetingsService.getCounsellingSessions().catch(() => ({ data: { success: false, data: [] } })),
        fetchAvailableMentors().catch(() => ({ success: false, data: [] }))
      ]);

      if (membersResponse && membersResponse.success) {
        // Filter to show only active members with Member role
        const activeMembers = (membersResponse.data || []).filter(member => 
          member.status === 'active' && member.role === 'Member'
        );
        setMembers(activeMembers);
      }

      if (meetingsResponse.data && meetingsResponse.data.success) {
        setMeetings(meetingsResponse.data.data || []);
      }

      if (mentorsResponse && mentorsResponse.success) {
        setAvailableMentors(mentorsResponse.data || []);
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
    setScheduleForm({ date: '', time: '', mentorId: '' });
    setShowScheduleModal(true);
  };

  const handleCompleteMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setCompleteForm({ notes: '' });
    setShowCompleteModal(true);
  };

  const handleRescheduleMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setRescheduleForm({ 
      date: meeting.scheduled_date ? meeting.scheduled_date.split('T')[0] : '', 
      time: meeting.scheduled_time || '' 
    });
    setShowRescheduleModal(true);
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

    if (!scheduleForm.mentorId) {
      alert('Please select a mentor');
      return;
    }

    try {
      const sessionData = {
        memberId: selectedMember.id,
        counsellorId: parseInt(scheduleForm.mentorId), // Ensure it's a number
        scheduledDate: scheduleForm.date,
        scheduledTime: scheduleForm.time
      };

      console.log('📤 Sending session data:', sessionData);

      const response = await meetingsService.scheduleCounsellingSession(sessionData);
      
      console.log('📥 Response:', response);
      
      if (response.data && response.data.success) {
        alert('Meeting scheduled successfully!');
        setShowScheduleModal(false);
        setSelectedMember(null);
        await fetchData(); // Refresh data
      } else {
        console.error('❌ Failed response:', response);
        alert(`Failed to schedule meeting: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Error scheduling:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert(`Failed to schedule meeting: ${errorMessage}`);
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

  const submitReschedule = async () => {
    if (!rescheduleForm.date || !rescheduleForm.time) {
      alert('Please select new date and time');
      return;
    }

    try {
      const updateData = {
        status: 'rescheduled',
        scheduledDate: rescheduleForm.date,
        scheduledTime: rescheduleForm.time
      };

      console.log('📤 Sending reschedule data:', updateData);

      const response = await meetingsService.updateCounsellingSession(selectedMeeting.id, updateData);
      
      if (response.data && response.data.success) {
        alert('Meeting rescheduled successfully!');
        setShowRescheduleModal(false);
        setSelectedMeeting(null);
        await fetchData(); // Refresh data
      } else {
        console.error('❌ Failed response:', response);
        alert(`Failed to reschedule meeting: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Error rescheduling:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert(`Failed to reschedule meeting: ${errorMessage}`);
    }
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '-';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  // Filter members based on selected filter
  const getFilteredMembers = () => {
    return members;
  };

  // Filter meetings for different tabs
  const getScheduledMeetings = () => meetings.filter(m => m.status === 'scheduled' || m.status === 'rescheduled');
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {user?.role === "Founder" ? "Working Committee Dashboard" : "Super Admin Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {areaName} • {currentDate.gregorian} • {currentDate.hijri}
          </p>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Personal Meetings</h2>
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
                onClick={() => setActiveTab('weekly')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'weekly'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Weekly Committee Meetings
                <span className="ml-2 bg-purple-100 text-purple-600 py-1 px-2 rounded-full text-xs">
                  Committee
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scheduled'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Personal Counseling
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
                Completed Sessions
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {getCompletedMeetings().length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          
          {/* Weekly Committee Meetings Tab */}
          {activeTab === 'weekly' && (
            <WeeklyMeetings />
          )}
          
          {/* Personal Counseling Tab */}
          {activeTab === 'scheduled' && (
            <div>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Personal Counseling Sessions</h2>
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
                          <p className="text-sm text-gray-500">
                            Mentor: {meeting.counsellor_full_name || meeting.counsellor_username || 'Not assigned'}
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
                            onClick={() => handleRescheduleMeeting(meeting)}
                            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                          >
                            Reschedule
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
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Members</h2>
                <p className="text-sm text-gray-600 mt-1">Active members available for meetings</p>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading members...</p>
                  </div>
                ) : getFilteredMembers().length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No active members found</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prayer Attendance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredMembers().map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {member.full_name || member.username || 'Unknown'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.email || '-'}</div>
                            <div className="text-sm text-gray-500">{member.phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.address || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {member.attendanceRate ? `${member.attendanceRate}%` : 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.totalPrayers ? `${member.totalPrayers} prayers` : 'No data'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleScheduleMeeting(member)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 mr-2"
                            >
                              Schedule Meeting
                            </button>
                            <button
                              onClick={() => navigate(`/founder/manage-members`)}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                          <p className="text-sm text-gray-500">
                            Mentor: {meeting.counsellor_full_name || meeting.counsellor_username || 'Not assigned'}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assign Mentor</label>
                    <select
                      value={scheduleForm.mentorId}
                      onChange={(e) => setScheduleForm({...scheduleForm, mentorId: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select a mentor from your mosque</option>
                      {availableMentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.fullName || mentor.username} ({mentor.email})
                        </option>
                      ))}
                    </select>
                    {availableMentors.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">No mentors available from your mosque</p>
                    )}
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

        

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-gray-500 opacity-75"></div>
              <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
                <h3 className="text-lg font-medium mb-4">
                  Reschedule Meeting - {selectedMeeting?.member_name || selectedMeeting?.member_username || 'Unknown Member'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Date & Time</label>
                    <div className="mt-1 p-2 bg-gray-100 rounded-md text-sm text-gray-600">
                      {selectedMeeting && (
                        <>
                          {new Date(selectedMeeting.scheduled_date).toLocaleDateString()} at {selectedMeeting.scheduled_time}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Date</label>
                    <input
                      type="date"
                      value={rescheduleForm.date}
                      onChange={(e) => setRescheduleForm({...rescheduleForm, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Time</label>
                    <input
                      type="time"
                      value={rescheduleForm.time}
                      onChange={(e) => setRescheduleForm({...rescheduleForm, time: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReschedule}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Reschedule Meeting
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