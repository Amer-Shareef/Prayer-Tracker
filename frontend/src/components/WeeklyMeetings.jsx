import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import weeklyMeetingsService from '../services/weeklyMeetingsService';
import { areaService } from '../services/api';

const WeeklyMeetings = () => {
  const { user } = useAuth();

  // Role-based access control - only Founders and SuperAdmins can access
  const allowedRoles = ['Founder', 'SuperAdmin'];
  const hasAccess = allowedRoles.includes(user?.role);

  // If user doesn't have access, show error message
  if (!hasAccess) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
          <p className="text-red-600 mt-2">
            You don't have permission to access weekly meetings management.
            This feature is only available to Founders and Super Administrators.
          </p>
        </div>
      </div>
    );
  }
  
  // State management
  const [allMeetings, setAllMeetings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(user?.role === 'SuperAdmin' ? 'all' : '');
  const [loading, setLoading] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [error, setError] = useState('');
  
  // Search and filter functionality
  const [weeklyMeetingSearchTerm, setWeeklyMeetingSearchTerm] = useState('');
  const [weeklyMeetingStatusFilter, setWeeklyMeetingStatusFilter] = useState('all');
  const [expandedMeetings, setExpandedMeetings] = useState(new Set());
  const [meetingDetails, setMeetingDetails] = useState({});
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [createForm, setCreateForm] = useState({
    meeting_date: '',
    meeting_time: '10:00',
    location: '',
    agenda: '',
    area_id: ''
  });

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchAreas();
    }
  }, [user]);

  useEffect(() => {
    // For SuperAdmins, only fetch data if an area is selected (including "all")
    // For Founders, always fetch data (they have their assigned area)
    if (user?.role === 'SuperAdmin') {
      if (selectedArea) {
        fetchData();
      }
    } else {
      if (user?.area_id) {
        fetchData();
      }
    }
  }, [selectedArea, user]);

  const fetchAreas = async () => {
    try {
      setLoadingAreas(true);
      const response = await areaService.getAreas();
      if (response.data && response.data.success) {
        setAreas(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('WeeklyMeetings: fetchData called', { selectedArea, userRole: user?.role, userAreaId: user?.area_id });

      const areaId = selectedArea || user?.area_id;

      if (!areaId) {
        if (user?.role === 'SuperAdmin') {
          setError('Please select an area to view meetings');
        } else {
          setError('No area selected or assigned');
        }
        setAllMeetings([]);
        return;
      }

      // Skip the no areaId check for SuperAdmins with 'all' selected
      if (user?.role === 'SuperAdmin' && selectedArea === 'all') {
        // Proceed with all areas dashboard
      } else if (!areaId) {
        setError('No area selected or assigned');
        setAllMeetings([]);
        return;
      }

      let response;
      if (selectedArea === 'all' && user?.role === 'SuperAdmin') {
        console.log('WeeklyMeetings: Fetching all areas dashboard');
        response = await weeklyMeetingsService.getAllAreasDashboard();
      } else {
        console.log('WeeklyMeetings: Fetching area dashboard for areaId:', areaId);
        response = await weeklyMeetingsService.getAreaDashboard(areaId);
      }

      console.log('WeeklyMeetings: API response received', response);

      if (response.success) {
        if (selectedArea === 'all') {
          // For all areas, combine meetings from all areas
          const allMeetings = [];
          if (response.data && Array.isArray(response.data)) {
            // If backend returns array of area data
            response.data.forEach(areaData => {
              if (areaData.recent_meetings) allMeetings.push(...areaData.recent_meetings);
              if (areaData.upcoming_meetings) allMeetings.push(...areaData.upcoming_meetings);
            });
          }
          console.log('WeeklyMeetings: Combined meetings from all areas:', allMeetings.length);
          setAllMeetings(allMeetings);
        } else {
          // The dashboard response contains recent_meetings and upcoming_meetings
          const recentMeetings = response.data?.recent_meetings || [];
          const upcomingMeetings = response.data?.upcoming_meetings || [];
          console.log('WeeklyMeetings: Recent meetings:', recentMeetings.length, 'Upcoming meetings:', upcomingMeetings.length);
          setAllMeetings([...recentMeetings, ...upcomingMeetings]);
        }
      }

    } catch (err) {
      console.error('WeeklyMeetings: Error fetching data:', err);
      setError('Failed to load weekly meetings data');
    } finally {
      setLoading(false);
    }
  };

  const submitCreateMeeting = async () => {
    if (!createForm.meeting_date || !createForm.meeting_time) {
      alert('Please select meeting date and time');
      return;
    }

    try {
      const meetingData = {
        meeting_date: createForm.meeting_date,
        meeting_time: createForm.meeting_time,
        location: createForm.location || 'Community Center',
        agenda: createForm.agenda || 'Weekly Committee Meeting',
        area_id: createForm.area_id || user?.area_id
      };

      const response = await weeklyMeetingsService.createWeeklyMeeting(meetingData);

      if (response.success) {
        alert('Weekly meeting series created successfully!');
        setShowCreateModal(false);
        setCreateForm({
          meeting_date: '',
          meeting_time: '10:00',
          location: '',
          agenda: '',
          area_id: ''
        });
        await fetchData();
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      alert('Failed to create meeting: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  };

  const handleViewMeeting = async (meeting) => {
    try {
      const newExpanded = new Set(expandedMeetings);

      if (newExpanded.has(meeting.id)) {
        // Collapse if already expanded
        newExpanded.delete(meeting.id);
        setExpandedMeetings(newExpanded);
      } else {
        // Expand and fetch attendance report if not already loaded
        if (!meetingDetails[meeting.id]) {
          const response = await weeklyMeetingsService.getAttendanceReport(meeting.id);
          if (response.success) {
            setMeetingDetails(prev => ({
              ...prev,
              [meeting.id]: response.data
            }));
          }
        }
        newExpanded.add(meeting.id);
        setExpandedMeetings(newExpanded);
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error);
      alert('Failed to load meeting details');
    }
  };

  const handleDeleteMeeting = async (meeting) => {
    if (!window.confirm(`Are you sure you want to delete the meeting on ${formatDate(meeting.meeting_date)}?`)) {
      return;
    }

    try {
      await weeklyMeetingsService.deleteMeeting(meeting.id);
      alert('Meeting deleted successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('Failed to delete meeting: ' + (error.message || 'Unknown error'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  // Filter meetings based on search and filter criteria
  const getFilteredMeetings = () => {
    let filtered = allMeetings;
    
    // Filter by search term
    if (weeklyMeetingSearchTerm) {
      filtered = filtered.filter(meeting =>
        (meeting.area_name || '').toLowerCase().includes(weeklyMeetingSearchTerm.toLowerCase()) ||
        (meeting.location || '').toLowerCase().includes(weeklyMeetingSearchTerm.toLowerCase()) ||
        formatDate(meeting.meeting_date).toLowerCase().includes(weeklyMeetingSearchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (weeklyMeetingStatusFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.status === weeklyMeetingStatusFilter);
    }
    
    return filtered;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getAttendanceDisplay = (meeting) => {
    const totalMembers = meeting.total_area_users || meeting.total_members || 0;
    const presentCount = meeting.present_count || 0;

    if (meeting.status === 'completed') {
      return `${presentCount}/${totalMembers}`;
    }
    return meeting.total_marked > 0 ? `${presentCount}/${totalMembers}` : 'Not started';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Area Context */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Meetings</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedArea === 'all' ? 'Viewing all areas' : `Viewing area: ${areas.find(a => a.area_id == selectedArea)?.area_name || 'Unknown'}`}
          </p>
        </div>
        {user?.role === 'SuperAdmin' && (
          <div className="bg-white border border-gray-300 rounded-lg p-3 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Area
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              disabled={loadingAreas}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="all">🌍 All Areas</option>
              {areas.map(area => (
                <option key={area.area_id} value={area.area_id}>
                  📍 {area.area_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Meetings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">All Meetings</h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search meetings by area, location, or date..."
                    value={weeklyMeetingSearchTerm}
                    onChange={(e) => setWeeklyMeetingSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  value={weeklyMeetingStatusFilter}
                  onChange={(e) => setWeeklyMeetingStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {/* Create Meeting Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
              >
                + Create Meeting
              </button>
            </div>
          </div>
        </div>
        
        {getFilteredMeetings().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {weeklyMeetingSearchTerm ? 
              'No meetings found matching your search criteria.' : 
              'No meetings found. Create your first meeting above.'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredMeetings().map((meeting) => (
                  <React.Fragment key={meeting.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(meeting.meeting_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(meeting.meeting_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(meeting.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {meeting.area_name || 'All Areas'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {meeting.total_area_users || meeting.total_members}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getAttendanceDisplay(meeting)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewMeeting(meeting)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          {expandedMeetings.has(meeting.id) ? '▼' : '▶'} Details
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(meeting)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expandable row for meeting details */}
                    {expandedMeetings.has(meeting.id) && meetingDetails[meeting.id] && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Meeting Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <span className="text-sm font-medium text-gray-600">Location:</span>
                                <div className="text-sm text-gray-900">
                                  {meetingDetails[meeting.id].meeting.location || 'Not specified'}
                                </div>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Area:</span>
                                <div className="text-sm text-gray-900">
                                  {meetingDetails[meeting.id].meeting.area_name || 'All Areas'}
                                </div>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Status:</span>
                                <div className="mt-1">
                                  {getStatusBadge(meetingDetails[meeting.id].meeting.status)}
                                </div>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Time:</span>
                                <div className="text-sm text-gray-900">
                                  {formatTime(meetingDetails[meeting.id].meeting.meeting_time)}
                                </div>
                              </div>
                            </div>

                            {/* Agenda */}
                            {meetingDetails[meeting.id].meeting.agenda && (
                              <div>
                                <span className="text-sm font-medium text-gray-600">Agenda:</span>
                                <div className="mt-1 p-3 bg-white rounded-md border text-sm text-gray-700">
                                  {meetingDetails[meeting.id].meeting.agenda}
                                </div>
                              </div>
                            )}

                            {/* Committee Members Attendance */}
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 mb-3">Committee Members Attendance</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {meetingDetails[meeting.id].attendance.map((member) => (
                                  <div key={member.id} className="flex justify-between items-center p-3 bg-white rounded-md border">
                                    <div>
                                      <div className="font-medium text-sm">{member.full_name}</div>
                                      <div className="text-xs text-gray-600">{member.role}</div>
                                      {member.reason && (
                                        <div className="text-xs text-gray-500 italic">{member.reason}</div>
                                      )}
                                    </div>
                                    <div>
                                      {getStatusBadge(member.status)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Create Weekly Meeting</h3>
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {user?.role === 'SuperAdmin' 
                    ? createForm.area_id 
                      ? `For: ${areas.find(a => a.area_id == createForm.area_id)?.area_name || 'Selected Area'}`
                      : 'Select an area below'
                    : `Area: ${areas.find(a => a.area_id == user?.area_id)?.area_name || 'Your Area'}`
                  }
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm text-green-700">
                  📅 Select the date for the first meeting in the series
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={createForm.meeting_date}
                  onChange={(e) => setCreateForm({...createForm, meeting_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Time
                </label>
                <input
                  type="time"
                  value={createForm.meeting_time}
                  onChange={(e) => setCreateForm({...createForm, meeting_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({...createForm, location: e.target.value})}
                  placeholder="Meeting location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agenda (Optional)
                </label>
                <textarea
                  value={createForm.agenda}
                  onChange={(e) => setCreateForm({...createForm, agenda: e.target.value})}
                  placeholder="Meeting agenda"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {user?.role === 'SuperAdmin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      📍 Area <span className="text-red-500 ml-1">*</span>
                    </span>
                  </label>
                  <select
                    value={createForm.area_id}
                    onChange={(e) => setCreateForm({...createForm, area_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Area</option>
                    {areas.map(area => (
                      <option key={area.area_id} value={area.area_id}>
                        {area.area_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose which area this meeting is for</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitCreateMeeting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Create Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyMeetings;
