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
  const [recurringMeetings, setRecurringMeetings] = useState({});
  const [attendanceDetails, setAttendanceDetails] = useState({});
  const [editingAttendance, setEditingAttendance] = useState({ meetingId: null, userId: null });
  const [editForm, setEditForm] = useState({ status: '', reason: '' });
  
  // Loading states
  const [loadingSeries, setLoadingSeries] = useState(new Set());
  const [loadingAttendance, setLoadingAttendance] = useState(new Set());
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  
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
        setLoadingSeries(prev => new Set([...prev, meetingId]));
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
        } finally {
          setLoadingSeries(prev => {
            const newSet = new Set(prev);
            newSet.delete(meetingId);
            return newSet;
          });
        }
      }
    }
  }, [expandedSeries, recurringMeetings]);

  const toggleAttendanceDetails = useCallback(async (meetingId) => {
    const newExpanded = new Set(expandedAttendance);
    
    if (expandedAttendance.has(meetingId)) {
      newExpanded.delete(meetingId);
      setExpandedAttendance(newExpanded);
      // Clear editing state when closing
      setEditingAttendance({ meetingId: null, userId: null });
    } else {
      newExpanded.add(meetingId);
      setExpandedAttendance(newExpanded);
      
      // Only fetch if not already cached
      if (!attendanceDetails[meetingId]) {
        setLoadingAttendance(prev => new Set([...prev, meetingId]));
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
        } finally {
          setLoadingAttendance(prev => {
            const newSet = new Set(prev);
            newSet.delete(meetingId);
            return newSet;
          });
        }
      }
    }
  }, [expandedAttendance, attendanceDetails]);

  // Attendance editing functions
  const startEditingAttendance = useCallback((meetingId, member) => {
    setEditingAttendance({ meetingId, userId: member.user_id });
    setEditForm({ 
      status: member.status || 'pending', 
      reason: member.reason || '' 
    });
  }, []);

  const cancelEditingAttendance = useCallback(() => {
    setEditingAttendance({ meetingId: null, userId: null });
    setEditForm({ status: '', reason: '' });
  }, []);

  const saveAttendanceEdit = useCallback(async () => {
    setSavingAttendance(true);
    try {
      const { meetingId, userId } = editingAttendance;
      
      const response = await weeklyMeetingsService.updateAttendance(meetingId, {
        user_id: userId,
        status: editForm.status,
        reason: editForm.reason
      });

      if (response.success) {
        // Refresh attendance details
        const updatedResponse = await weeklyMeetingsService.getAttendanceDetails(meetingId);
        if (updatedResponse.success) {
          setAttendanceDetails(prev => ({
            ...prev,
            [meetingId]: updatedResponse.data
          }));
        }
        cancelEditingAttendance();
      } else {
        setError('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setError('Failed to update attendance');
    } finally {
      setSavingAttendance(false);
    }
  }, [editingAttendance, editForm, cancelEditingAttendance]);

  const handleCreateMeeting = useCallback(async () => {
    setCreatingMeeting(true);
    try {
      // For SuperAdmins, use the selected area from the form if provided
      // Otherwise, use the existing logic
      let areaId;
      if (user?.role === 'SuperAdmin' && createForm.area_id) {
        areaId = createForm.area_id;
      } else {
        areaId = selectedArea === 'all' ? user?.area_id : (selectedArea || user?.area_id);
      }
      
      if (!areaId) {
        setError('Please select an area');
        return;
      }

      const meetingData = { 
        meeting_date: createForm.meeting_date,
        meeting_time: createForm.meeting_time,
        location: createForm.location,
        agenda: createForm.agenda,
        area_id: areaId
      };
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
    } finally {
      setCreatingMeeting(false);
    }
  }, [createForm, selectedArea, user?.role, user?.area_id, fetchParentMeetings]);

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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => toggleSeriesExpansion(meeting.id)}
                              disabled={loadingSeries.has(meeting.id)}
                              className="text-green-600 hover:text-green-900 disabled:text-green-400 disabled:cursor-not-allowed inline-flex items-center transition-colors"
                            >
                              <svg className={`w-4 h-4 mr-1 transform transition-transform ${isSeriesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {loadingSeries.has(meeting.id) ? 'Loading...' : (isSeriesExpanded ? 'Hide' : 'Show') + ' History'}
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
                                                    disabled={loadingAttendance.has(seriesMeeting.id)}
                                                    className="text-blue-600 hover:text-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed inline-flex items-center transition-colors"
                                                  >
                                                    <svg className={`w-3 h-3 mr-1 transform transition-transform ${isAttendanceExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                    {loadingAttendance.has(seriesMeeting.id) ? 'Loading...' : (isAttendanceExpanded ? 'Hide' : 'View')}
                                                  </button>
                                                </td>
                                              </tr>
                                              
                                              {/* Attendance Details Row */}
                                              {isAttendanceExpanded && attendanceData && (
                                                <tr>
                                                  <td colSpan="5" className="px-6 py-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                                                    <div className="space-y-6">
                                                      {/* Header */}
                                                      <div className="flex items-center justify-between">
                                                        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                                          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                          </svg>
                                                          Attendance Details
                                                        </h4>
                                                        <div className="text-sm text-gray-600">
                                                          Meeting ID: {seriesMeeting.id}
                                                        </div>
                                                      </div>

                                                      {/* Summary Stats - Improved Design */}
                                                      {attendanceData.summary && (
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                          <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                                                            <div className="flex items-center justify-between">
                                                              <div>
                                                                <div className="text-2xl font-bold text-green-600">{attendanceData.summary.present}</div>
                                                                <div className="text-sm text-gray-600 font-medium">Present</div>
                                                              </div>
                                                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                              </div>
                                                            </div>
                                                          </div>
                                                          <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                                                            <div className="flex items-center justify-between">
                                                              <div>
                                                                <div className="text-2xl font-bold text-red-600">{attendanceData.summary.absent}</div>
                                                                <div className="text-sm text-gray-600 font-medium">Absent</div>
                                                              </div>
                                                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                              </div>
                                                            </div>
                                                          </div>
                                                          <div className="bg-white rounded-lg p-4 shadow-sm border border-yellow-100">
                                                            <div className="flex items-center justify-between">
                                                              <div>
                                                                <div className="text-2xl font-bold text-yellow-600">{attendanceData.summary.excused}</div>
                                                                <div className="text-sm text-gray-600 font-medium">Excused</div>
                                                              </div>
                                                              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                                </svg>
                                                              </div>
                                                            </div>
                                                          </div>
                                                          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                                            <div className="flex items-center justify-between">
                                                              <div>
                                                                <div className="text-2xl font-bold text-gray-600">{attendanceData.summary.not_marked}</div>
                                                                <div className="text-sm text-gray-600 font-medium">Not Marked</div>
                                                              </div>
                                                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )}

                                                      {/* Member Attendance List */}
                                                      {attendanceData.member_attendance && (
                                                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                                          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                                            <h5 className="text-md font-semibold text-gray-900">Member Attendance</h5>
                                                            <p className="text-sm text-gray-600 mt-1">Click edit to update attendance status and reasons</p>
                                                          </div>
                                                          <div className="divide-y divide-gray-200">
                                                            {attendanceData.member_attendance.map((member) => {
                                                              const isEditing = editingAttendance.meetingId === seriesMeeting.id && editingAttendance.userId === member.user_id;
                                                              const canEdit = ['SuperAdmin', 'Founder'].includes(user?.role);

                                                              return (
                                                                <div key={member.user_id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                                                  {isEditing ? (
                                                                    // Edit Mode
                                                                    <div className="space-y-4">
                                                                      <div className="flex items-center justify-between">
                                                                        <div className="flex items-center space-x-3">
                                                                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                                            <span className="text-sm font-medium text-gray-600">
                                                                              {member.full_name ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                                                                            </span>
                                                                          </div>
                                                                          <div>
                                                                            <h6 className="text-sm font-medium text-gray-900">{member.full_name || 'Unknown User'}</h6>
                                                                            <div className="flex items-center space-x-2 text-xs">
                                                                              {getStatusBadge(member.status)}
                                                                              <span className="text-gray-500">→</span>
                                                                              <span className="text-blue-600 font-medium">Editing</span>
                                                                            </div>
                                                                          </div>
                                                                        </div>
                                                                        <div className="flex space-x-2">
                                                                          <button
                                                                            onClick={saveAttendanceEdit}
                                                                            disabled={savingAttendance}
                                                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                                                                          >
                                                                            {savingAttendance ? (
                                                                              <>
                                                                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                </svg>
                                                                                <span>Saving...</span>
                                                                              </>
                                                                            ) : (
                                                                              <>
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                                <span>Save</span>
                                                                              </>
                                                                            )}
                                                                          </button>
                                                                          <button
                                                                            onClick={cancelEditingAttendance}
                                                                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-1"
                                                                          >
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                            <span>Cancel</span>
                                                                          </button>
                                                                        </div>
                                                                      </div>
                                                                      <div className="space-y-4">
                                                                        <div>
                                                                          <label className="block text-xs font-medium text-gray-700 mb-2">Attendance Status</label>
                                                                          <div className="grid grid-cols-2 gap-2">
                                                                            <button
                                                                              onClick={() => setEditForm(prev => ({ ...prev, status: 'present' }))}
                                                                              className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                                                                                editForm.status === 'present'
                                                                                  ? 'border-green-500 bg-green-50 text-green-700'
                                                                                  : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                                                                              }`}
                                                                            >
                                                                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                              </svg>
                                                                              <span className="font-medium">Present</span>
                                                                            </button>
                                                                            <button
                                                                              onClick={() => setEditForm(prev => ({ ...prev, status: 'absent' }))}
                                                                              className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                                                                                editForm.status === 'absent'
                                                                                  ? 'border-red-500 bg-red-50 text-red-700'
                                                                                  : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
                                                                              }`}
                                                                            >
                                                                              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                              </svg>
                                                                              <span className="font-medium">Absent</span>
                                                                            </button>
                                                                            <button
                                                                              onClick={() => setEditForm(prev => ({ ...prev, status: 'excused' }))}
                                                                              className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                                                                                editForm.status === 'excused'
                                                                                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                                                                  : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-300'
                                                                              }`}
                                                                            >
                                                                              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                                              </svg>
                                                                              <span className="font-medium">Excused</span>
                                                                            </button>
                                                                            <button
                                                                              onClick={() => setEditForm(prev => ({ ...prev, status: 'pending' }))}
                                                                              className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                                                                                editForm.status === 'pending'
                                                                                  ? 'border-gray-500 bg-gray-50 text-gray-700'
                                                                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                                              }`}
                                                                            >
                                                                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                              </svg>
                                                                              <span className="font-medium">Pending</span>
                                                                            </button>
                                                                          </div>
                                                                        </div>
                                                                        <div>
                                                                          <label className="block text-xs font-medium text-gray-700 mb-2">Reason (Optional)</label>
                                                                          <input
                                                                            type="text"
                                                                            value={editForm.reason}
                                                                            onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                                                                            placeholder="e.g., Sick leave, family emergency, etc."
                                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                            maxLength={500}
                                                                          />
                                                                          {editForm.reason && (
                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                              Current reason: "{editForm.reason}"
                                                                            </p>
                                                                          )}
                                                                        </div>
                                                                      </div>
                                                                    </div>
                                                                  ) : (
                                                                    // View Mode
                                                                    <div className="flex items-center justify-between">
                                                                      <div className="flex-1">
                                                                        <div className="flex items-center space-x-3">
                                                                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                                            <span className="text-sm font-medium text-gray-600">
                                                                              {member.full_name ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                                                                            </span>
                                                                          </div>
                                                                          <div>
                                                                            <div className="text-sm font-medium text-gray-900">{member.full_name || 'Unknown User'}</div>
                                                                            <div className="text-xs text-gray-500">
                                                                              {member.reason || 'No reason provided'}
                                                                            </div>
                                                                          </div>
                                                                        </div>
                                                                      </div>
                                                                      <div className="flex items-center space-x-3">
                                                                        {getStatusBadge(member.status)}
                                                                        {canEdit && (
                                                                          <button
                                                                            onClick={() => startEditingAttendance(seriesMeeting.id, member)}
                                                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                            title="Edit attendance"
                                                                          >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                            </svg>
                                                                          </button>
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
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
                  
                  {user?.role === 'SuperAdmin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                      <select
                        value={createForm.area_id}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, area_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select Area</option>
                        {areas.map(area => (
                          <option key={area.area_id} value={area.area_id}>
                            {area.area_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
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
                    disabled={creatingMeeting}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {creatingMeeting ? 'Creating...' : 'Create Meeting'}
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
