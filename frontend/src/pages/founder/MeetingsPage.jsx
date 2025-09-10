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
  
  // Tab management - simplified
  const [activeTab, setActiveTab] = useState('weekly');
  const [personalSubTab, setPersonalSubTab] = useState('scheduled');
  
  // Search and filter functionality
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [meetingSearchTerm, setMeetingSearchTerm] = useState('');
  const [memberAreaFilter, setMemberAreaFilter] = useState('all');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('all');
  
  // Areas for filtering
  const [areas, setAreas] = useState([]);
  
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
    fetchAreas();
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

  const fetchAreas = async () => {
    try {
      const response = await areaService.getAreas();
      if (response.data && response.data.success) {
        setAreas(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
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

  // Filter members based on search and filter criteria
  const getFilteredMembers = () => {
    let filtered = members;
    
    // Filter by search term (name, email, phone)
    if (memberSearchTerm) {
      filtered = filtered.filter(member =>
        (member.full_name || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        (member.phone || '').toLowerCase().includes(memberSearchTerm.toLowerCase())
      );
    }
    
    // Filter by area (SuperAdmin only)
    if (user?.role === 'SuperAdmin' && memberAreaFilter !== 'all') {
      filtered = filtered.filter(member => member.area_id === parseInt(memberAreaFilter));
    }
    
    return filtered;
  };

  // Filter meetings for different tabs with search functionality
  const getScheduledMeetings = () => {
    let filtered = meetings.filter(m => m.status === 'scheduled' || m.status === 'rescheduled');
    
    if (meetingSearchTerm) {
      filtered = filtered.filter(meeting =>
        (meeting.member_name || meeting.member_full_name || '').toLowerCase().includes(meetingSearchTerm.toLowerCase()) ||
        (meeting.counsellor_full_name || meeting.counsellor_name || '').toLowerCase().includes(meetingSearchTerm.toLowerCase())
      );
    }
    
    if (meetingStatusFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.status === meetingStatusFilter);
    }
    
    return filtered;
  };

  const getCompletedMeetings = () => {
    let filtered = meetings.filter(m => m.status === 'completed');
    
    if (meetingSearchTerm) {
      filtered = filtered.filter(meeting =>
        (meeting.member_name || meeting.member_full_name || '').toLowerCase().includes(meetingSearchTerm.toLowerCase()) ||
        (meeting.counsellor_full_name || meeting.counsellor_name || '').toLowerCase().includes(meetingSearchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
            Meetings Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {areaName} • {currentDate.gregorian} • {currentDate.hijri}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            {error}
          </div>
        )}

        {/* Main Tabs - Two Categories */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`py-3 px-4 border-b-2 font-medium text-base ${
                  activeTab === 'weekly'
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>Weekly Committee Meetings</span>
                </div>
                <p className="text-xs mt-1 text-gray-500">Working committee sessions</p>
              </button>
              
              <button
                onClick={() => setActiveTab('personal')}
                className={`py-3 px-4 border-b-2 font-medium text-base ${
                  activeTab === 'personal'
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>👥</span>
                  <span>Personal Counseling</span>
                </div>
                <p className="text-xs mt-1 text-gray-500">One-on-one member sessions</p>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          
          {/* Weekly Committee Meetings Tab */}
          {activeTab === 'weekly' && (
            <div className="p-6">
              <WeeklyMeetings />
            </div>
          )}
          
          {/* Personal Counseling Tab */}
          {activeTab === 'personal' && (
            <div>
              {/* Personal Counseling Sub-tabs */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex space-x-6">
                  <button
                    onClick={() => setPersonalSubTab('scheduled')}
                    className={`py-2 px-4 rounded-lg font-medium text-sm ${
                      personalSubTab === 'scheduled'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Scheduled ({getScheduledMeetings().length})
                  </button>
                  <button
                    onClick={() => setPersonalSubTab('members')}
                    className={`py-2 px-4 rounded-lg font-medium text-sm ${
                      personalSubTab === 'members'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Members ({getFilteredMembers().length})
                  </button>
                  <button
                    onClick={() => setPersonalSubTab('completed')}
                    className={`py-2 px-4 rounded-lg font-medium text-sm ${
                      personalSubTab === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Completed ({getCompletedMeetings().length})
                  </button>
                </div>
              </div>

              {/* Scheduled Meetings Sub-tab */}
              {personalSubTab === 'scheduled' && (
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Scheduled Sessions</h3>
                        <p className="text-sm text-gray-600">Upcoming one-on-one counseling sessions</p>
                      </div>
                    </div>
                    
                    {/* Search and Filter Controls for Meetings */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by member or counselor name..."
                            value={meetingSearchTerm}
                            onChange={(e) => setMeetingSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="sm:w-48">
                        <select
                          value={meetingStatusFilter}
                          onChange={(e) => setMeetingStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="all">All Status</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="rescheduled">Rescheduled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {getScheduledMeetings().length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8l1 7H7l1-7z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">
                        {meetingSearchTerm ? 'No scheduled sessions found matching your search' : 'No sessions scheduled'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Schedule meetings from the Members tab</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getScheduledMeetings().map((meeting) => (
                        <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {meeting.member_name || meeting.member_full_name || 'Unknown Member'}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  meeting.status === 'scheduled' ? 'bg-green-100 text-green-700' :
                                  meeting.status === 'rescheduled' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {meeting.status}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p className="flex items-center">
                                  <span className="w-4 h-4 mr-2">📅</span>
                                  {new Date(meeting.scheduled_date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                                <p className="flex items-center">
                                  <span className="w-4 h-4 mr-2">🕐</span>
                                  {meeting.scheduled_time}
                                </p>
                                <p className="flex items-center">
                                  <span className="w-4 h-4 mr-2">👨‍🏫</span>
                                  {meeting.counsellor_full_name || meeting.counsellor_name || 'Not assigned'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 ml-4">
                              <button
                                onClick={() => handleCompleteMeeting(meeting)}
                                className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleRescheduleMeeting(meeting)}
                                className="bg-yellow-600 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-700 transition-colors"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleDeleteMeeting(meeting)}
                                className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Members Sub-tab */}
              {personalSubTab === 'members' && (
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Member Directory</h3>
                        <p className="text-sm text-gray-600">Schedule new counseling sessions</p>
                      </div>
                    </div>
                    
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search members by name, email, or phone..."
                            value={memberSearchTerm}
                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      {user?.role === 'SuperAdmin' && (
                        <div className="sm:w-48">
                          <select
                            value={memberAreaFilter}
                            onChange={(e) => setMemberAreaFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="all">All Areas</option>
                            {areas.map(area => (
                              <option key={area.area_id} value={area.area_id}>
                                {area.area_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {getFilteredMembers().length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">
                        {memberSearchTerm ? 'No members found matching your search' : 'No active members found'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
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
                                Status
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
                                      {member.full_name || 'No Name'}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{member.email || '-'}</div>
                                  <div className="text-sm text-gray-500">{member.phone || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {member.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => handleScheduleMeeting(member)}
                                    className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors"
                                  >
                                    Schedule Meeting
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Completed Sessions Sub-tab */}
              {personalSubTab === 'completed' && (
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Completed Sessions</h3>
                        <p className="text-sm text-gray-600">Previous counseling sessions and notes</p>
                      </div>
                    </div>
                    
                    {/* Search Control for Completed Meetings */}
                    <div className="mb-6">
                      <div className="relative max-w-md">
                        <input
                          type="text"
                          placeholder="Search completed sessions..."
                          value={meetingSearchTerm}
                          onChange={(e) => setMeetingSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {getCompletedMeetings().length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">
                        {meetingSearchTerm ? 'No completed sessions found matching your search' : 'No completed sessions yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getCompletedMeetings().map((meeting) => (
                        <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {meeting.member_name || meeting.member_full_name || 'Unknown Member'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                📅 {new Date(meeting.scheduled_date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-sm text-gray-600">
                                👨‍🏫 {meeting.counsellor_full_name || meeting.counsellor_name || 'Unknown Counselor'}
                              </p>
                            </div>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Completed
                            </span>
                          </div>
                          {meeting.session_notes && (
                            <div className="mt-3 p-3 bg-white rounded border">
                              <p className="text-sm text-gray-600 font-medium mb-1">Session Notes:</p>
                              <p className="text-sm text-gray-700">{meeting.session_notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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