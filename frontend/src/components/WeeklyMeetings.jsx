import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import weeklyMeetingsService from '../services/weeklyMeetingsService';
import { areaService } from '../services/api';

const WeeklyMeetings = () => {
  const { user } = useAuth();

  // Access control
  const allowedRoles = ['Founder', 'SuperAdmin'];
  const hasAccess = allowedRoles.includes(user?.role);

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
  const [parentMeetings, setParentMeetings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(user?.role === 'SuperAdmin' ? 'all' : '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Optimized expansion states
  const [expandedSeries, setExpandedSeries] = useState(new Set());
  const [expandedAttendance, setExpandedAttendance] = useState(new Set());
  
  // Data caches to prevent re-fetching
  const [recurringMeetings, setRecurringMeetings] = useState({});
  const [attendanceDetails, setAttendanceDetails] = useState({});
  
  // Modal and form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createForm, setCreateForm] = useState({
    meeting_date: '',
    meeting_time: '10:00',
    location: '',
    agenda: '',
    area_id: ''
  });

  // Memoized helper functions to prevent re-renders
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  const formatTime = useCallback((timeString) => {
    if (!timeString) return 'No time';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  }, []);

  const getDayOfWeek = useCallback((dateString) => {
    if (!dateString) return 'Weekly';
    try {
      const date = new Date(dateString);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    } catch (error) {
      return 'Weekly';
    }
  }, []);

  const getStatusBadge = useCallback((status) => {
    const statusStyles = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      excused: 'bg-yellow-100 text-yellow-800',
      not_marked: 'bg-gray-100 text-gray-800'
    };

    const displayStatus = status || 'not_marked';
    const displayText = displayStatus === 'not_marked' ? 'Not Marked' : 
                       displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[displayStatus] || statusStyles['not_marked']}`}>
        {displayText}
      </span>
    );
  }, []);

  // Optimized filtered meetings with useMemo
  const filteredMeetings = useMemo(() => {
    if (!searchTerm) return parentMeetings;
    
    const searchLower = searchTerm.toLowerCase();
    return parentMeetings.filter(meeting => 
      meeting.agenda?.toLowerCase().includes(searchLower) ||
      meeting.location?.toLowerCase().includes(searchLower) ||
      meeting.area_name?.toLowerCase().includes(searchLower)
    );
  }, [parentMeetings, searchTerm]);

  // Fetch functions
  const fetchAreas = useCallback(async () => {
    try {
      const response = await areaService.getAreas();
      if (response.data && response.data.success) {
        setAreas(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  }, []);

  const fetchParentMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const areaId = selectedArea === 'all' ? null : (selectedArea || user?.area_id);
      
      if (!areaId && selectedArea !== 'all') {
        setError('No area selected or assigned');
        setParentMeetings([]);
        return;
      }

      let response;
      if (selectedArea === 'all' && user?.role === 'SuperAdmin') {
        response = await weeklyMeetingsService.getAllAreasDashboard();
      } else {
        response = await weeklyMeetingsService.getAreaDashboard(areaId);
      }

      if (response.success) {
        setParentMeetings(response.data || []);
      } else {
        setError('Failed to load meetings');
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [selectedArea, user?.role, user?.area_id]);

  // Optimized toggle functions
  const toggleSeriesExpansion = useCallback(async (meetingId) => {
    const newExpanded = new Set(expandedSeries);
    
    if (expandedSeries.has(meetingId)) {
      newExpanded.delete(meetingId);
      setExpandedSeries(newExpanded);
    } else {
      newExpanded.add(meetingId);
      setExpandedSeries(newExpanded);
      
      // Only fetch if not already cached
      if (!recurringMeetings[meetingId]) {
        try {
          const response = await weeklyMeetingsService.getRecurringMeetings(meetingId);
          if (response.success) {
            setRecurringMeetings(prev => ({
              ...prev,
              [meetingId]: response.data || []
            }));
          }
        } catch (error) {
          console.error('Error fetching recurring meetings:', error);
          setError('Failed to load meeting series');
        }
      }
    }
  }, [expandedSeries, recurringMeetings]);

  const toggleAttendanceDetails = useCallback(async (meetingId) => {
    const newExpanded = new Set(expandedAttendance);
    
    if (expandedAttendance.has(meetingId)) {
      newExpanded.delete(meetingId);
      setExpandedAttendance(newExpanded);
    } else {
      newExpanded.add(meetingId);
      setExpandedAttendance(newExpanded);
      
      // Only fetch if not already cached
      if (!attendanceDetails[meetingId]) {
        try {
          const response = await weeklyMeetingsService.getAttendanceDetails(meetingId);
          if (response.success) {
            setAttendanceDetails(prev => ({
              ...prev,
              [meetingId]: response.data
            }));
          }
        } catch (error) {
          console.error('Error fetching attendance details:', error);
          setError('Failed to load attendance details');
        }
      }
    }
  }, [expandedAttendance, attendanceDetails]);

  const handleCreateMeeting = useCallback(async () => {
    try {
      const areaId = selectedArea === 'all' ? user?.area_id : (selectedArea || user?.area_id);
      
      if (!areaId) {
        setError('Please select an area');
        return;
      }

      const meetingData = { ...createForm, area_id: areaId };
      const response = await weeklyMeetingsService.createWeeklyMeeting(meetingData);
      
      if (response.success) {
        setShowCreateModal(false);
        setCreateForm({
          meeting_date: '',
          meeting_time: '10:00',
          location: '',
          agenda: '',
          area_id: ''
        });
        fetchParentMeetings();
      } else {
        setError('Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError('Failed to create meeting');
    }
  }, [createForm, selectedArea, user?.area_id, fetchParentMeetings]);

  // Effects
  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchAreas();
    }
  }, [user?.role, fetchAreas]);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      if (selectedArea) fetchParentMeetings();
    } else {
      if (user?.area_id) fetchParentMeetings();
    }
  }, [selectedArea, user, fetchParentMeetings]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Weekly Meetings</h1>
              <p className="text-gray-600 mt-2">
                Manage committee meetings and track attendance
              </p>
            </div>
            
            {user?.role === 'SuperAdmin' && (
              <div className="bg-gray-50 p-4 rounded-lg min-w-[250px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Area
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select Area</option>
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg flex justify-between items-start">
            <p className="text-red-700 flex-1">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Meeting Series</h2>
              <p className="text-sm text-gray-600 mt-1">{filteredMeetings.length} series found</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 min-w-[250px]"
              />
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap font-medium"
              >
                + Create Meeting
              </button>
            </div>
          </div>
        </div>

        {/* Meeting Table */}
        <div className="bg-white rounded-lg overflow-hidden">
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No meetings match your search criteria.' : 'Create your first meeting to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meeting Schedule
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMeetings.map((meeting) => {
                    const dayOfWeek = getDayOfWeek(meeting.meeting_date);
                    const isSeriesExpanded = expandedSeries.has(meeting.id);
                    const seriesMeetings = recurringMeetings[meeting.id] || [];
                    
                    return (
                      <React.Fragment key={meeting.id}>
                        {/* Main Meeting Row */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              Every {dayOfWeek}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTime(meeting.meeting_time)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">{meeting.location || 'Community Center'}</div>
                              {meeting.agenda && (
                                <div className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={meeting.agenda}>
                                  {meeting.agenda}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {meeting.area_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {meeting.present_count || 0}/{meeting.total_area_users || 0} attendance
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(meeting.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => toggleSeriesExpansion(meeting.id)}
                              className="text-green-600 hover:text-green-900 inline-flex items-center"
                            >
                              <svg className={`w-4 h-4 mr-1 transform transition-transform ${isSeriesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {isSeriesExpanded ? 'Hide' : 'Show'} History
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Series Rows */}
                        {isSeriesExpanded && (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 bg-gray-50">
                              <div className="space-y-1">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Meeting History
                                </h4>
                                
                                {seriesMeetings.length === 0 ? (
                                  <p className="text-sm text-gray-500 py-4">No meetings in this series yet.</p>
                                ) : (
                                  <div className="bg-white rounded-lg overflow-hidden">
                                    <table className="min-w-full">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {[...seriesMeetings, meeting].map((seriesMeeting) => {
                                          const isAttendanceExpanded = expandedAttendance.has(seriesMeeting.id);
                                          const attendanceData = attendanceDetails[seriesMeeting.id];

                                          return (
                                            <React.Fragment key={seriesMeeting.id}>
                                              <tr className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm">
                                                  <div className="flex items-center">
                                                    {formatDate(seriesMeeting.meeting_date)}
                                                    {seriesMeeting.id === meeting.id && (
                                                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                                        Original
                                                      </span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                  {formatTime(seriesMeeting.meeting_time)}
                                                </td>
                                                <td className="px-4 py-3">
                                                  {getStatusBadge(seriesMeeting.status)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                  <span className="font-medium">
                                                    {seriesMeeting.present_count || 0}/{seriesMeeting.total_area_users || 0}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                  <button
                                                    onClick={() => toggleAttendanceDetails(seriesMeeting.id)}
                                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                                  >
                                                    <svg className={`w-3 h-3 mr-1 transform transition-transform ${isAttendanceExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                    {isAttendanceExpanded ? 'Hide' : 'View'}
                                                  </button>
                                                </td>
                                              </tr>
                                              
                                              {/* Attendance Details Row */}
                                              {isAttendanceExpanded && attendanceData && (
                                                <tr>
                                                  <td colSpan="5" className="px-4 py-3 bg-blue-50">
                                                    {/* Summary Stats */}
                                                    {attendanceData.summary && (
                                                      <div className="grid grid-cols-4 gap-3 mb-4">
                                                        <div className="bg-white rounded p-2 text-center">
                                                          <div className="text-lg font-bold text-green-600">{attendanceData.summary.present}</div>
                                                          <div className="text-xs text-gray-600">Present</div>
                                                        </div>
                                                        <div className="bg-white rounded p-2 text-center">
                                                          <div className="text-lg font-bold text-red-600">{attendanceData.summary.absent}</div>
                                                          <div className="text-xs text-gray-600">Absent</div>
                                                        </div>
                                                        <div className="bg-white rounded p-2 text-center">
                                                          <div className="text-lg font-bold text-yellow-600">{attendanceData.summary.excused}</div>
                                                          <div className="text-xs text-gray-600">Excused</div>
                                                        </div>
                                                        <div className="bg-white rounded p-2 text-center">
                                                          <div className="text-lg font-bold text-gray-600">{attendanceData.summary.not_marked}</div>
                                                          <div className="text-xs text-gray-600">Not Marked</div>
                                                        </div>
                                                      </div>
                                                    )}

                                                    {/* Member List Table */}
                                                    {attendanceData.member_attendance && (
                                                      <div className="bg-white rounded overflow-hidden">
                                                        <table className="min-w-full text-sm">
                                                          <thead className="bg-gray-50">
                                                            <tr>
                                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Member</th>
                                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                                                            </tr>
                                                          </thead>
                                                          <tbody className="divide-y divide-gray-200">
                                                            {attendanceData.member_attendance.map((member) => (
                                                              <tr key={member.user_id} className="hover:bg-gray-50">
                                                                <td className="px-3 py-2 font-medium text-gray-900">{member.full_name}</td>
                                                                <td className="px-3 py-2">{getStatusBadge(member.status)}</td>
                                                                <td className="px-3 py-2 text-gray-500 text-xs">
                                                                  {member.reason || '-'}
                                                                </td>
                                                              </tr>
                                                            ))}
                                                          </tbody>
                                                        </table>
                                                      </div>
                                                    )}
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Meeting Modal - Same as before */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Create New Meeting Series</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Date</label>
                    <input
                      type="date"
                      value={createForm.meeting_date}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, meeting_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be the first meeting date</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Time</label>
                    <input
                      type="time"
                      value={createForm.meeting_time}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, meeting_time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Community Center"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agenda</label>
                    <textarea
                      value={createForm.agenda}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, agenda: e.target.value }))}
                      placeholder="Meeting agenda and topics to discuss..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMeeting}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    Create Meeting
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyMeetings;
