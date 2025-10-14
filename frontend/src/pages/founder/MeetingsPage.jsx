// filepath: src/pages/founder/MeetingsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FounderLayout from "../../components/layouts/FounderLayout";
import { meetingsService, memberAPI, areaService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import WeeklyMeetings from "../../components/WeeklyMeetings";

const MeetingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedAreaForMembers, setSelectedAreaForMembers] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [availableMentors, setAvailableMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("weekly");
  const [personalView, setPersonalView] = useState("upcoming");

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const [createForm, setCreateForm] = useState({
    memberId: "",
    date: "",
    time: "",
    mentorId: "",
  });

  const [completeForm, setCompleteForm] = useState({
    notes: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [meetingToReschedule, setMeetingToReschedule] = useState(null);

  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    time: "",
    mentorId: "",
  });

  // Helper function to format time to 12-hour AM/PM format
  const formatTime = (timeString) => {
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
  };

  useEffect(() => {
    fetchData();
    if (user?.role === "SuperAdmin") {
      fetchAreas();
    }
  }, [user?.role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest(".dropdown-menu")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // Refetch members when area selection changes (SuperAdmin only)
  useEffect(() => {
    if (user?.role === "SuperAdmin" && areas.length > 0) {
      fetchData();
    }
  }, [selectedAreaForMembers]);

  const fetchAreas = async () => {
    try {
      const response = await areaService.getAllAreas();
      if (response?.success) {
        setAreas(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Determine which member API to use based on role and selection
      let membersPromise;
      if (user?.role === "SuperAdmin") {
        if (selectedAreaForMembers === "all" || !selectedAreaForMembers) {
          // Fetch all members across all areas
          membersPromise = memberAPI
            .getAllMembers()
            .catch(() => ({ success: false, data: [] }));
        } else {
          // Fetch members from specific area
          membersPromise = memberAPI
            .getMembers({ area_id: selectedAreaForMembers })
            .catch(() => ({ success: false, data: [] }));
        }
      } else {
        // Founder/WCM: fetch only their area members
        membersPromise = memberAPI
          .getMembers()
          .catch(() => ({ success: false, data: [] }));
      }

      const [membersResponse, meetingsResponse, mentorsResponse] =
        await Promise.all([
          membersPromise,
          meetingsService
            .getCounsellingSessions()
            .catch(() => ({ data: { success: false, data: [] } })),
          fetchAvailableMentors().catch(() => ({ success: false, data: [] })),
        ]);

      if (membersResponse && membersResponse.success) {
        const activeMembers = (membersResponse.data || []).filter(
          (member) => member.status === "active" && member.role === "Member"
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
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMentors = async () => {
    try {
      const response = await memberAPI.getFounders();
      if (response && response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, data: [] };
    } catch (error) {
      console.error("Error fetching mentors:", error);
      return { success: false, data: [] };
    }
  };

  const handleCreateSession = () => {
    setCreateForm({
      memberId: "",
      date: "",
      time: "",
      mentorId: "",
    });
    setShowCreateModal(true);
  };

  const submitCreateSession = async () => {
    if (
      !createForm.memberId ||
      !createForm.date ||
      !createForm.time ||
      !createForm.mentorId
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      const sessionData = {
        memberId: parseInt(createForm.memberId),
        counsellorId: parseInt(createForm.mentorId),
        scheduledDate: createForm.date,
        scheduledTime: createForm.time,
      };

      const response = await meetingsService.scheduleCounsellingSession(
        sessionData
      );

      if (response.data && response.data.success) {
        alert("Session scheduled successfully!");
        setShowCreateModal(false);
        await fetchData();
      } else {
        alert(`Failed: ${response.data?.message || "Unknown error"}`);
      }
    } catch (err) {
      alert(`Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCompleteSession = (meeting) => {
    setSelectedMeeting(meeting);
    setCompleteForm({ notes: meeting.session_notes || "" });
    setShowCompleteModal(true);
  };

  const submitCompleteSession = async () => {
    if (!completeForm.notes.trim()) {
      alert("Please add session notes");
      return;
    }

    try {
      const updateData = {
        status: "completed",
        sessionNotes: completeForm.notes,
      };

      const response = await meetingsService.updateCounsellingSession(
        selectedMeeting.id,
        updateData
      );

      if (response.data && response.data.success) {
        alert("Session completed!");
        setShowCompleteModal(false);
        await fetchData();
      } else {
        alert("Failed to complete session");
      }
    } catch (err) {
      alert("Failed to complete session");
    }
  };

  const handleDeleteSession = (meeting) => {
    setMeetingToDelete(meeting);
    setShowDeleteModal(true);
  };

  const handleRescheduleSession = (meeting) => {
    setMeetingToReschedule(meeting);
    setRescheduleForm({
      date: meeting.scheduled_date,
      time: meeting.scheduled_time,
      mentorId: meeting.counsellor_id ? meeting.counsellor_id.toString() : "",
    });
    setShowRescheduleModal(true);
  };

  const submitRescheduleSession = async () => {
    if (!rescheduleForm.date || !rescheduleForm.time) {
      alert("Please fill date and time");
      return;
    }

    try {
      const updateData = {
        scheduledDate: rescheduleForm.date,
        scheduledTime: rescheduleForm.time,
        status: "rescheduled", // Update status to rescheduled
      };

      // If counsellor changed, include it in the update
      if (
        rescheduleForm.mentorId &&
        rescheduleForm.mentorId !==
          meetingToReschedule.counsellor_id?.toString()
      ) {
        updateData.counsellorId = parseInt(rescheduleForm.mentorId);
      }

      const response = await meetingsService.updateCounsellingSession(
        meetingToReschedule.id,
        updateData
      );

      if (response.data && response.data.success) {
        alert("Session rescheduled successfully!");
        setShowRescheduleModal(false);
        await fetchData();
      } else {
        alert(`Failed: ${response.data?.message || "Unknown error"}`);
      }
    } catch (err) {
      alert(`Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const getUpcomingMeetings = () => {
    return meetings
      .filter((m) => m.status === "scheduled" || m.status === "rescheduled")
      .filter((m) =>
        searchTerm
          ? (m.member_name || m.member_full_name || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          : true
      )
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
  };

  const getCompletedMeetings = () => {
    return meetings
      .filter((m) => m.status === "completed")
      .filter((m) =>
        searchTerm
          ? (m.member_name || m.member_full_name || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          : true
      )
      .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
  };

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </FounderLayout>
    );
  }

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meetings</h1>
          <p className="text-sm text-gray-600">
            Manage weekly committee meetings and personal counseling sessions
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {error}
          </div>
        )}

        {/* Main Tabs */}
        <div className="bg-white rounded-xl shadow-md p-1.5 inline-flex border-2 border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "weekly"
                ? "bg-green-600 text-white shadow-lg"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            📅 Weekly Meetings
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "personal"
                ? "bg-green-600 text-white shadow-lg"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            👥 Personal Sessions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "weekly" ? (
          <WeeklyMeetings />
        ) : (
          <div className="space-y-6">
            {/* Personal Sessions Header */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
              <div className="p-6 border-b-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Personal Counseling Sessions
                    </h2>
                    <p className="text-xs text-gray-600 mt-1">
                      One-on-one member guidance and support
                    </p>
                  </div>

                  <button
                    onClick={handleCreateSession}
                    className="flex items-center px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
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
                    Schedule Session
                  </button>
                </div>

                {/* View Toggle & Search */}
                <div className="flex items-center justify-between mt-4 space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setPersonalView("upcoming")}
                        className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                          personalView === "upcoming"
                            ? "bg-white text-green-700 shadow"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Upcoming ({getUpcomingMeetings().length})
                      </button>
                      <button
                        onClick={() => setPersonalView("history")}
                        className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                          personalView === "history"
                            ? "bg-white text-green-700 shadow"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        History ({getCompletedMeetings().length})
                      </button>
                    </div>

                    {/* Area Filter for SuperAdmin */}
                    {user?.role === "SuperAdmin" && areas.length > 0 && (
                      <select
                        value={selectedAreaForMembers}
                        onChange={(e) =>
                          setSelectedAreaForMembers(e.target.value)
                        }
                        className="px-3 py-2 text-xs border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  </div>

                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {/* Upcoming Sessions */}
                {personalView === "upcoming" && (
                  <div>
                    {getUpcomingMeetings().length === 0 ? (
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
                          No upcoming sessions
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {searchTerm
                            ? "No sessions match your search"
                            : "Schedule a new session to get started"}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={handleCreateSession}
                            className="mt-4 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Schedule Session
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Member
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date & Time
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Area
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Working Committee
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
                            {getUpcomingMeetings().map((meeting) => (
                              <tr key={meeting.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {meeting.member_name ||
                                        meeting.member_full_name ||
                                        "Unknown"}
                                    </div>
                                    {meeting.member_phone && (
                                      <div className="text-sm text-gray-500">
                                        📞 {meeting.member_phone}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">
                                    {formatTime(meeting.scheduled_time)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(
                                      meeting.scheduled_date
                                    ).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">
                                    {meeting.area_name || "Area TBD"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">
                                    👨‍🏫{" "}
                                    {meeting.counsellor_full_name ||
                                      meeting.counsellor_name ||
                                      "TBD"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      meeting.status === "scheduled"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {meeting.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="relative dropdown-menu">
                                    <button
                                      onClick={() =>
                                        setOpenMenuId(
                                          openMenuId === meeting.id
                                            ? null
                                            : meeting.id
                                        )
                                      }
                                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                                    >
                                      <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                      </svg>
                                    </button>

                                    {openMenuId === meeting.id && (
                                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                                        <div className="py-1">
                                          <button
                                            onClick={() => {
                                              handleCompleteSession(meeting);
                                              setOpenMenuId(null);
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          >
                                            <svg
                                              className="w-4 h-4 mr-3 text-green-600"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                            Complete Session
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleRescheduleSession(meeting);
                                              setOpenMenuId(null);
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          >
                                            <svg
                                              className="w-4 h-4 mr-3 text-blue-600"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                              />
                                            </svg>
                                            Reschedule
                                          </button>
                                          <button
                                            onClick={() => {
                                              handleDeleteSession(meeting);
                                              setOpenMenuId(null);
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                          >
                                            <svg
                                              className="w-4 h-4 mr-3 text-red-600"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                              />
                                            </svg>
                                            Cancel Session
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* History */}
                {personalView === "history" && (
                  <div>
                    {getCompletedMeetings().length === 0 ? (
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="mt-4 text-sm font-medium text-gray-900">
                          No completed sessions
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {searchTerm
                            ? "No sessions match your search"
                            : "Completed sessions will appear here"}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Member
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date & Time
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Area
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Working Committee
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {getCompletedMeetings().map((meeting) => (
                              <tr key={meeting.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {meeting.member_name ||
                                        meeting.member_full_name ||
                                        "Unknown"}
                                    </div>
                                    {meeting.member_phone && (
                                      <div className="text-sm text-gray-500">
                                        📞 {meeting.member_phone}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">
                                    {formatTime(meeting.scheduled_time)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(
                                      meeting.scheduled_date
                                    ).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">
                                    {meeting.area_name || "Area TBD"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-medium">
                                    👨‍🏫{" "}
                                    {meeting.counsellor_full_name ||
                                      meeting.counsellor_name ||
                                      "TBD"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Completed
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {meeting.session_notes ? (
                                    <div className="text-sm text-gray-600 max-w-xs truncate">
                                      {meeting.session_notes}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400 italic">
                                      No notes
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Session Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-gray-900 opacity-75"
                onClick={() => setShowCreateModal(false)}
              ></div>
              <div className="bg-white rounded-xl p-6 max-w-lg w-full relative z-10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Schedule New Session
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Member
                    </label>
                    <select
                      value={createForm.memberId}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          memberId: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Choose a member...</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name || member.username}
                          {member.area && ` - ${member.area}`}
                        </option>
                      ))}
                    </select>
                    {user?.role === "SuperAdmin" && members.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedAreaForMembers === "all" ||
                        !selectedAreaForMembers
                          ? "Showing members from all areas"
                          : `Showing members from ${
                              areas.find(
                                (a) =>
                                  a.area_id === parseInt(selectedAreaForMembers)
                              )?.area_name || "selected area"
                            }`}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={createForm.date}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, date: e.target.value })
                        }
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={createForm.time}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, time: e.target.value })
                        }
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Working Committee
                    </label>
                    <select
                      value={createForm.mentorId}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          mentorId: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select working committee...</option>
                      {availableMentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.fullName || mentor.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCreateSession}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    Schedule Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Session Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-gray-900 opacity-75"
                onClick={() => setShowCompleteModal(false)}
              ></div>
              <div className="bg-white rounded-xl p-6 max-w-md w-full relative z-10 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Complete Session
                  </h3>
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedMeeting?.member_name ||
                      selectedMeeting?.member_full_name}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(
                      selectedMeeting?.scheduled_date
                    ).toLocaleDateString()}
                    {" at "}
                    {selectedMeeting?.scheduled_time}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Session Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={completeForm.notes}
                    onChange={(e) => setCompleteForm({ notes: e.target.value })}
                    rows="6"
                    placeholder="What was discussed? Any action items or follow-ups needed?"
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCompleteSession}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Session Modal */}
        {showRescheduleModal && meetingToReschedule && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-gray-900 opacity-75"
                onClick={() => setShowRescheduleModal(false)}
              ></div>
              <div className="bg-white rounded-xl p-6 max-w-lg w-full relative z-10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Reschedule Session
                  </h3>
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-900">
                    {meetingToReschedule.member_name ||
                      meetingToReschedule.member_full_name}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Current:{" "}
                    {new Date(
                      meetingToReschedule.scheduled_date
                    ).toLocaleDateString()}
                    {" at "}
                    {meetingToReschedule.scheduled_time}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Working Committee:{" "}
                    {meetingToReschedule.counsellor_full_name ||
                      meetingToReschedule.counsellor_name ||
                      "TBD"}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={rescheduleForm.date}
                        onChange={(e) =>
                          setRescheduleForm({
                            ...rescheduleForm,
                            date: e.target.value,
                          })
                        }
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={rescheduleForm.time}
                        onChange={(e) =>
                          setRescheduleForm({
                            ...rescheduleForm,
                            time: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Working Committee (Optional)
                    </label>
                    <select
                      value={rescheduleForm.mentorId}
                      onChange={(e) =>
                        setRescheduleForm({
                          ...rescheduleForm,
                          mentorId: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Keep current counsellor</option>
                      {availableMentors.map((mentor) => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.fullName || mentor.username}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to keep the current working committee
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitRescheduleSession}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Reschedule Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Session Confirmation Modal */}
        {showDeleteModal && meetingToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-gray-900 opacity-75"
                onClick={() => {
                  setShowDeleteModal(false);
                  setMeetingToDelete(null);
                }}
              ></div>
              <div className="bg-white rounded-xl p-6 max-w-md w-full relative z-10 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Delete Session
                  </h3>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setMeetingToDelete(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

                <div className="mb-6">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <p className="text-sm font-semibold text-red-800">
                        Are you sure you want to delete this session?
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {meetingToDelete.member_name ||
                        meetingToDelete.member_full_name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(
                        meetingToDelete.scheduled_date
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {" at "}
                      {formatTime(meetingToDelete.scheduled_time)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Working Committee:{" "}
                      {meetingToDelete.counsellor_full_name ||
                        meetingToDelete.counsellor_name ||
                        "TBD"}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    This action cannot be undone. The session will be
                    permanently deleted.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setMeetingToDelete(null);
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteSession}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Delete Session
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
