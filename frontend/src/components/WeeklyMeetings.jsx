import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import weeklyMeetingsService from '../services/weeklyMeetingsService';
import { areaService } from '../services/api';

const WeeklyMeetings = () => {
  const { user } = useAuth();
  
  // State management
  const [currentWeekMeeting, setCurrentWeekMeeting] = useState(null);
  const [allMeetings, setAllMeetings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  // Form state
  const [createForm, setCreateForm] = useState({
    meeting_date: '',
    meeting_time: '10:00',
    location: '',
    agenda: '',
    area_id: ''
  });

  useEffect(() => {
    fetchData();
    if (user?.role === 'SuperAdmin') {
      fetchAreas();
    }
  }, [user]);

  useEffect(() => {
    if (selectedArea || user?.area_id) {
      fetchData();
    }
  }, [selectedArea]);

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
      
      const areaId = selectedArea || user?.area_id;
      const params = areaId ? { area_id: areaId } : {};
      
      const [currentResponse, allResponse] = await Promise.all([
        weeklyMeetingsService.getCurrentWeekMeeting(params),
        weeklyMeetingsService.getWeeklyMeetings(params)
      ]);

      if (currentResponse.success) {
        setCurrentWeekMeeting(currentResponse.data);
      }

      if (allResponse.success) {
        setAllMeetings(allResponse.data || []);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load weekly meetings data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = (weeksAhead = 0) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weeksAhead * 7));
    
    // Set to next Sunday (or keep if already Sunday)
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek !== 0) { // 0 = Sunday
      targetDate.setDate(targetDate.getDate() + (7 - dayOfWeek));
    }

    setCreateForm({
      meeting_date: targetDate.toISOString().split('T')[0],
      meeting_time: '10:00',
      location: '',
      agenda: '',
      area_id: selectedArea || user?.area_id || ''
    });
    setShowCreateModal(true);
  };

  const handleCreateNextMonth = async () => {
    if (!window.confirm('Create meetings for all Sundays in next month?')) {
      return;
    }

    try {
      const baseData = {
        meeting_time: '10:00',
        location: 'Community Center',
        agenda: 'Weekly Committee Meeting',
        area_id: selectedArea || user?.area_id
      };

      const result = await weeklyMeetingsService.createNextMonthMeetings(baseData);
      
      if (result.success) {
        alert(`Successfully created ${result.data.length} meetings for next month!`);
        await fetchData();
      }
    } catch (error) {
      console.error('Error creating next month meetings:', error);
      alert('Failed to create next month meetings: ' + (error.message || 'Unknown error'));
    }
  };

  const submitCreateMeeting = async () => {
    if (!createForm.meeting_date || !createForm.meeting_time) {
      alert('Please select date and time');
      return;
    }

    try {
      const response = await weeklyMeetingsService.createWeeklyMeeting(createForm);
      
      if (response.success) {
        alert('Weekly meeting created successfully!');
        setShowCreateModal(false);
        setCreateForm({
          meeting_date: '',
          meeting_time: '10:00',
          location: '',
          agenda: '',
          area_id: selectedArea || user?.area_id || ''
        });
        await fetchData();
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
      alert('Failed to create meeting: ' + (err.message || 'Unknown error'));
    }
  };

  const handleViewMeeting = async (meeting) => {
    try {
      const response = await weeklyMeetingsService.getMeetingDetails(meeting.id);
      if (response.success) {
        setSelectedMeeting(response.data);
        setShowMeetingDetails(true);
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
      await weeklyMeetingsService.deleteWeeklyMeeting(meeting.id);
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
    if (meeting.status === 'completed') {
      return `${meeting.present_count}/${meeting.total_members}`;
    }
    return meeting.pending_count > 0 ? 'Pending' : `${meeting.present_count}/${meeting.total_members}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Area Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Weekly Meetings</h2>
        {user?.role === 'SuperAdmin' && (
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Areas</option>
            {areas.map(area => (
              <option key={area.area_id} value={area.area_id}>
                {area.area_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Current Week Banner */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {!currentWeekMeeting ? (
          <div className="text-center py-8">
            <div className="text-yellow-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.315 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ⚠️ No meeting has been created for this week.
            </h3>
            <button
              onClick={() => handleCreateMeeting(0)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              👉 Create This Week's Meeting
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              This Week's Meeting: {formatDate(currentWeekMeeting.meeting_date)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <div className="mt-1">{getStatusBadge(currentWeekMeeting.status)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Members:</span>
                <div className="mt-1 font-semibold">{currentWeekMeeting.total_members}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Area:</span>
                <div className="mt-1 font-semibold">{currentWeekMeeting.area_name || 'All Areas'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleCreateMeeting(0)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔵 Create This Week's Meeting
          </button>
          
          <div className="relative group">
            <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              ▾ More Options
            </button>
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                <button
                  onClick={() => handleCreateMeeting(1)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Create Next Week's Meeting
                </button>
                <button
                  onClick={handleCreateNextMonth}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Create Next Month's Meetings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Meetings</h3>
        </div>
        
        {allMeetings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No meetings found. Create your first meeting above.
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
                {allMeetings.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-gray-50">
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
                      {meeting.total_members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getAttendanceDisplay(meeting)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewMeeting(meeting)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View →
                      </button>
                      <button
                        onClick={() => handleDeleteMeeting(meeting)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
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
              <h3 className="text-lg font-semibold text-gray-900">Create Weekly Meeting</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={createForm.meeting_date}
                  onChange={(e) => setCreateForm({...createForm, meeting_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {user?.role === 'SuperAdmin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <select
                    value={createForm.area_id}
                    onChange={(e) => setCreateForm({...createForm, area_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      {showMeetingDetails && selectedMeeting && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Meeting Details - {formatDate(selectedMeeting.meeting.meeting_date)}
              </h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-sm text-gray-600">Time:</span>
                  <div className="font-semibold">{formatTime(selectedMeeting.meeting.meeting_time)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedMeeting.meeting.status)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Location:</span>
                  <div className="font-semibold">{selectedMeeting.meeting.location || 'Not specified'}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Area:</span>
                  <div className="font-semibold">{selectedMeeting.meeting.area_name || 'All Areas'}</div>
                </div>
              </div>

              {selectedMeeting.meeting.agenda && (
                <div className="mb-6">
                  <span className="text-sm text-gray-600">Agenda:</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedMeeting.meeting.agenda}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Committee Members Attendance</h4>
                <div className="space-y-2">
                  {selectedMeeting.attendance.map((member) => (
                    <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <div className="font-medium">{member.full_name}</div>
                        <div className="text-sm text-gray-600">{member.role}</div>
                        {member.reason && (
                          <div className="text-sm text-gray-500 italic">{member.reason}</div>
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

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowMeetingDetails(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyMeetings;
