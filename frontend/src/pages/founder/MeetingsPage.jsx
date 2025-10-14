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

  useEffect(() => {
    fetchData();
    if (user?.role === "SuperAdmin") {
      fetchAreas();
    }
  }, [user?.role]);

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

  const handleDeleteSession = async (meetingId) => {
    if (!window.confirm("Delete this session?")) return;

    try {
      const response = await meetingsService.deleteCounsellingSession(
        meetingId
      );
      if (response.data?.success || response.status === 404) {
        alert("Session deleted!");
        await fetchData();
      }
    } catch (err) {
      if (err.response?.status === 404) {
        await fetchData();
      } else {
        alert("Failed to delete session");
      }
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getUpcomingMeetings().map((meeting) => (
                          <div
                            key={meeting.id}
                            className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all hover:border-green-300"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm">
                                  {meeting.member_name ||
                                    meeting.member_full_name ||
                                    "Unknown"}
                                </h3>
                                <span
                                  className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                                    meeting.status === "scheduled"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {meeting.status}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 text-xs text-gray-600 mb-4">
                              <div className="flex items-center">
                                <span className="w-5">📅</span>
                                <span>
                                  {new Date(
                                    meeting.scheduled_date
                                  ).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="w-5">🕐</span>
                                <span>{meeting.scheduled_time}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="w-5">👨‍🏫</span>
                                <span>
                                  {meeting.counsellor_full_name ||
                                    meeting.counsellor_name ||
                                    "TBD"}
                                </span>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleCompleteSession(meeting)}
                                className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleDeleteSession(meeting.id)}
                                className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}
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
                      <div className="space-y-3">
                        {getCompletedMeetings().map((meeting) => (
                          <div
                            key={meeting.id}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900">
                                  {meeting.member_name ||
                                    meeting.member_full_name ||
                                    "Unknown"}
                                </h4>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                                  <span>
                                    📅{" "}
                                    {new Date(
                                      meeting.scheduled_date
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <span>
                                    👨‍🏫{" "}
                                    {meeting.counsellor_full_name ||
                                      meeting.counsellor_name}
                                  </span>
                                </div>
                              </div>
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                                Completed
                              </span>
                            </div>
                            {meeting.session_notes && (
                              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-1">
                                  Notes:
                                </p>
                                <p className="text-xs text-gray-600">
                                  {meeting.session_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
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
                      Counselor
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
                      <option value="">Select counselor...</option>
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
      </div>
    </FounderLayout>
  );
};

export default MeetingsPage;
