// filepath: src/components/WeeklyMeetings.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import weeklyMeetingsService from "../services/weeklyMeetingsService";
import { areaService } from "../services/api";

const WeeklyMeetings = () => {
  const { user } = useAuth();

  const allowedRoles = ["Founder", "WCM", "SuperAdmin"];
  const hasAccess = allowedRoles.includes(user?.role);

  if (!hasAccess) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Access Denied
        </h3>
        <p className="text-sm text-red-600">
          You don't have permission to access weekly meetings management.
        </p>
      </div>
    );
  }

  const [parentMeetings, setParentMeetings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(
    user?.role === "SuperAdmin" ? "all" : ""
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedSeries, setExpandedSeries] = useState(new Set());
  const [expandedAttendance, setExpandedAttendance] = useState(new Set());
  const [recurringMeetings, setRecurringMeetings] = useState({});
  const [attendanceDetails, setAttendanceDetails] = useState({});
  const [editingAttendance, setEditingAttendance] = useState({
    meetingId: null,
    userId: null,
  });
  const [editForm, setEditForm] = useState({ status: "", reason: "" });

  const [loadingSeries, setLoadingSeries] = useState(new Set());
  const [loadingAttendance, setLoadingAttendance] = useState(new Set());
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [createForm, setCreateForm] = useState({
    meeting_date: "",
    meeting_time: "10:00",
    location: "",
    agenda: "",
    area_id: user?.role === "SuperAdmin" ? "" : user?.area_id || "",
  });

  // [Keep all the helper functions: formatDate, formatTime, getDayOfWeek, getStatusBadge, etc.]
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "No date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  }, []);

  const formatTime = useCallback((timeString) => {
    if (!timeString) return "No time";
    try {
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return timeString;
    }
  }, []);

  const getDayOfWeek = useCallback((dateString) => {
    if (!dateString) return "Weekly";
    try {
      const date = new Date(dateString);
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return days[date.getDay()];
    } catch (error) {
      return "Weekly";
    }
  }, []);

  const getStatusBadge = useCallback((status) => {
    const statusStyles = {
      scheduled: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      excused: "bg-yellow-100 text-yellow-800",
      not_marked: "bg-gray-100 text-gray-800",
    };

    const displayStatus = status || "not_marked";
    const displayText =
      displayStatus === "not_marked"
        ? "Not Marked"
        : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusStyles[displayStatus] || statusStyles["not_marked"]
        }`}
      >
        {displayText}
      </span>
    );
  }, []);

  const filteredMeetings = useMemo(() => {
    if (!searchTerm) return parentMeetings;

    const searchLower = searchTerm.toLowerCase();
    return parentMeetings.filter(
      (meeting) =>
        meeting.agenda?.toLowerCase().includes(searchLower) ||
        meeting.location?.toLowerCase().includes(searchLower) ||
        meeting.area_name?.toLowerCase().includes(searchLower)
    );
  }, [parentMeetings, searchTerm]);

  // [Keep all fetch functions and handlers - unchanged]
  const fetchAreas = useCallback(async () => {
    try {
      const response = await areaService.getAreas();
      if (response.data && response.data.success) {
        setAreas(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
    }
  }, []);

  const fetchParentMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const areaId =
        selectedArea === "all" ? null : selectedArea || user?.area_id;

      if (!areaId && selectedArea !== "all") {
        setError("No area selected or assigned");
        setParentMeetings([]);
        return;
      }

      let response;
      if (selectedArea === "all" && user?.role === "SuperAdmin") {
        response = await weeklyMeetingsService.getAllAreasDashboard();
      } else {
        response = await weeklyMeetingsService.getAreaDashboard(areaId);
      }

      if (response.success) {
        setParentMeetings(response.data || []);
      } else {
        setError("Failed to load meetings");
      }
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setError("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [selectedArea, user?.role, user?.area_id]);

  const toggleSeriesExpansion = useCallback(
    async (meetingId) => {
      const newExpanded = new Set(expandedSeries);

      if (expandedSeries.has(meetingId)) {
        newExpanded.delete(meetingId);
        setExpandedSeries(newExpanded);
      } else {
        newExpanded.add(meetingId);
        setExpandedSeries(newExpanded);

        if (!recurringMeetings[meetingId]) {
          setLoadingSeries((prev) => new Set([...prev, meetingId]));
          try {
            const response = await weeklyMeetingsService.getRecurringMeetings(
              meetingId
            );
            if (response.success) {
              setRecurringMeetings((prev) => ({
                ...prev,
                [meetingId]: response.data || [],
              }));
            }
          } catch (error) {
            console.error("Error fetching recurring meetings:", error);
          } finally {
            setLoadingSeries((prev) => {
              const newSet = new Set(prev);
              newSet.delete(meetingId);
              return newSet;
            });
          }
        }
      }
    },
    [expandedSeries, recurringMeetings]
  );

  const toggleAttendanceDetails = useCallback(
    async (meetingId) => {
      const newExpanded = new Set(expandedAttendance);

      if (expandedAttendance.has(meetingId)) {
        newExpanded.delete(meetingId);
        setExpandedAttendance(newExpanded);
        setEditingAttendance({ meetingId: null, userId: null });
      } else {
        newExpanded.add(meetingId);
        setExpandedAttendance(newExpanded);

        if (!attendanceDetails[meetingId]) {
          setLoadingAttendance((prev) => new Set([...prev, meetingId]));
          try {
            const response = await weeklyMeetingsService.getAttendanceDetails(
              meetingId
            );
            if (response.success) {
              setAttendanceDetails((prev) => ({
                ...prev,
                [meetingId]: response.data,
              }));
            }
          } catch (error) {
            console.error("Error fetching attendance details:", error);
          } finally {
            setLoadingAttendance((prev) => {
              const newSet = new Set(prev);
              newSet.delete(meetingId);
              return newSet;
            });
          }
        }
      }
    },
    [expandedAttendance, attendanceDetails]
  );

  const startEditingAttendance = useCallback((meetingId, member) => {
    setEditingAttendance({ meetingId, userId: member.user_id });
    setEditForm({
      status: member.status || "pending",
      reason: member.reason || "",
    });
  }, []);

  const cancelEditingAttendance = useCallback(() => {
    setEditingAttendance({ meetingId: null, userId: null });
    setEditForm({ status: "", reason: "" });
  }, []);

  const saveAttendanceEdit = useCallback(async () => {
    setSavingAttendance(true);
    try {
      const { meetingId, userId } = editingAttendance;

      const response = await weeklyMeetingsService.updateAttendance(meetingId, {
        user_id: userId,
        status: editForm.status,
        reason: editForm.reason,
      });

      if (response.success) {
        const updatedResponse =
          await weeklyMeetingsService.getAttendanceDetails(meetingId);
        if (updatedResponse.success) {
          setAttendanceDetails((prev) => ({
            ...prev,
            [meetingId]: updatedResponse.data,
          }));
        }
        cancelEditingAttendance();
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
    } finally {
      setSavingAttendance(false);
    }
  }, [editingAttendance, editForm, cancelEditingAttendance]);

  const handleCreateMeeting = useCallback(async () => {
    setCreatingMeeting(true);
    try {
      // Validate required fields
      if (!createForm.meeting_date) {
        setError("Meeting date is required");
        return;
      }

      if (!createForm.meeting_time) {
        setError("Meeting time is required");
        return;
      }

      if (!createForm.location || createForm.location.trim() === "") {
        setError("Location is required");
        return;
      }

      // Determine area_id based on user role
      let areaId;
      if (user?.role === "SuperAdmin") {
        // SuperAdmin must explicitly select an area
        if (!createForm.area_id) {
          setError("Please select an area for the meeting");
          return;
        }
        areaId = createForm.area_id;
      } else {
        // Founder uses their own area_id
        areaId = user?.area_id;
      }

      if (!areaId) {
        setError("Area ID is required");
        return;
      }

      const meetingData = {
        meeting_date: createForm.meeting_date,
        meeting_time: createForm.meeting_time,
        location: createForm.location.trim(),
        agenda: createForm.agenda || "Weekly Committee Meeting",
        area_id: parseInt(areaId),
      };

      console.log("Creating meeting with data:", meetingData);
      const response = await weeklyMeetingsService.createWeeklyMeeting(
        meetingData
      );

      if (response.success) {
        setShowCreateModal(false);
        setCreateForm({
          meeting_date: "",
          meeting_time: "10:00",
          location: "",
          agenda: "",
          area_id: user?.role === "SuperAdmin" ? "" : user?.area_id || "",
        });
        setError("");
        fetchParentMeetings();
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      setError(error.response?.data?.message || "Failed to create meeting");
    } finally {
      setCreatingMeeting(false);
    }
  }, [createForm, user?.role, user?.area_id, fetchParentMeetings]);

  useEffect(() => {
    if (user?.role === "SuperAdmin") {
      fetchAreas();
    }
  }, [user?.role, fetchAreas]);

  useEffect(() => {
    if (user?.role === "SuperAdmin") {
      if (selectedArea) fetchParentMeetings();
    } else {
      if (user?.area_id) fetchParentMeetings();
    }
  }, [selectedArea, user, fetchParentMeetings]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            {user?.role === "SuperAdmin" && (
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="px-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select Area</option>
                <option value="all">All Areas</option>
                {areas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.area_name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center space-x-3 ml-auto">
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Meeting
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-sm font-medium text-gray-900">
              No meetings found
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {searchTerm
                ? "Try a different search"
                : "Create your first meeting"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Schedule
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Area
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
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
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-gray-900">
                            Every {dayOfWeek}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(meeting.meeting_time)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {meeting.location || "TBD"}
                          </div>
                          {meeting.agenda && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {meeting.agenda}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {meeting.area_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleSeriesExpansion(meeting.id)}
                            disabled={loadingSeries.has(meeting.id)}
                            className="text-green-600 hover:text-green-900 text-xs font-semibold transition-colors inline-flex items-center"
                          >
                            <svg
                              className={`w-4 h-4 mr-1 transform transition-transform ${
                                isSeriesExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                            {loadingSeries.has(meeting.id)
                              ? "Loading..."
                              : (isSeriesExpanded ? "Hide" : "Show") +
                                " All Meetings"}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded series rows */}
                      {isSeriesExpanded && seriesMeetings.length > 0 && (
                        <>
                          {seriesMeetings.map((meeting) => (
                            <tr
                              key={`series-${meeting.id}`}
                              className={`${
                                meeting.meeting_type === "parent"
                                  ? "bg-blue-50 border-l-4 border-blue-300"
                                  : "bg-gray-50 border-l-4 border-green-200"
                              }`}
                            >
                              <td className="px-6 py-3">
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatDate(meeting.meeting_date)}
                                  </div>
                                  {meeting.meeting_type === "parent" && (
                                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                      Original
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatTime(meeting.meeting_time)}
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <div className="text-sm text-gray-900">
                                  {meeting.location || "TBD"}
                                </div>
                                {meeting.agenda && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {meeting.agenda}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-3">
                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  {meeting.area_name}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <span className="text-xs text-gray-600">
                                    {meeting.present_count || 0}/
                                    {meeting.total_area_users || 0} present
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      (meeting.attendance_rate || 0) >= 80
                                        ? "bg-green-100 text-green-800"
                                        : (meeting.attendance_rate || 0) >= 60
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {meeting.attendance_rate || 0}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}

                      {isSeriesExpanded && seriesMeetings.length === 0 && (
                        <tr className="bg-gray-50">
                          <td
                            colSpan="4"
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No meetings found in this series.
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

      {/* Create Meeting Modal - Horizontal Layout */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Create Meeting Series
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meeting Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={createForm.meeting_date}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          meeting_date: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      First meeting date
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Meeting Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={createForm.meeting_time}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          meeting_time: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {user?.role === "SuperAdmin" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Area <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={createForm.area_id}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            area_id: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select Area</option>
                        {areas.map((area) => (
                          <option key={area.area_id} value={area.area_id}>
                            {area.area_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      required
                      placeholder="e.g., Community Center, Main Mosque"
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Agenda
                    </label>
                    <textarea
                      value={createForm.agenda}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          agenda: e.target.value,
                        }))
                      }
                      placeholder="Meeting agenda and topics..."
                      rows={user?.role === "SuperAdmin" ? 4 : 7}
                      className="w-full px-3 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border-2 border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMeeting}
                  disabled={creatingMeeting}
                  className="px-6 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                >
                  {creatingMeeting ? "Creating..." : "Create Meeting"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyMeetings;
