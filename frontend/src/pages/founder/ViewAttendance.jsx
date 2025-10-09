// filepath: src/pages/founder/ViewAttendance.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import FounderLayout from "../../components/layouts/FounderLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api"; // Use centralized API instance
import generateMemberReport from "./GeneratePdf";

// Safe data access helper
const safeGet = (obj, path, defaultValue = 0) => {
  try {
    const keys = path.split(".");
    let result = obj;
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined || result === null) {
        return defaultValue;
      }
    }
    return result;
  } catch {
    return defaultValue;
  }
};

// Safe percentage calculation
const safePercentage = (numerator, denominator, decimals = 0) => {
  if (!denominator || denominator === 0) return 0;
  const num = Number(numerator) || 0;
  const den = Number(denominator) || 0;
  if (den === 0) return 0;
  return Number(((num / den) * 100).toFixed(decimals));
};

// Tooltip Component
const Tooltip = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
          {text}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};

// Prayer Dots Component - Memoized
const PrayerDots = React.memo(({ prayers }) => {
  const prayerOrder = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  return (
    <div className="flex items-center space-x-1">
      {prayerOrder.map((prayer) => (
        <Tooltip
          key={prayer}
          text={prayer.charAt(0).toUpperCase() + prayer.slice(1)}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              prayers[prayer] ? "bg-green-500" : "bg-gray-300"
            }`}
          />
        </Tooltip>
      ))}
    </div>
  );
});

// Pagination Component - Memoized
const Pagination = React.memo(
  ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> members
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 2 && <span className="text-gray-500">...</span>}
            </>
          )}

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === number
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {number}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="text-gray-500">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  }
);

const ViewAttendance = () => {
  const { user } = useAuth();
  const role = user?.role || "Founder"; // Get role from authenticated user

  // State management
  const [overviewData, setOverviewData] = useState(null);
  const [prayerBreakdown, setPrayerBreakdown] = useState(null);
  const [areasData, setAreasData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("overview");
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [timePeriod, setTimePeriod] = useState("7");
  const [selectedArea, setSelectedArea] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const timePeriodOptions = [
    { value: "7", label: "Last 7 Days" },
    { value: "30", label: "Last 30 Days" },
    { value: "180", label: "Last 6 Months" },
    { value: "365", label: "Last Year" },
  ];

  // Memoized period label
  const getPeriodLabel = useMemo(() => {
    const option = timePeriodOptions.find((opt) => opt.value === timePeriod);
    return option ? option.label : "Period";
  }, [timePeriod]);

  // API calls with centralized api instance
  const fetchOverview = useCallback(async () => {
    try {
      const response = await api.get("/attendance/overview", {
        params: { role },
      });

      if (response.data?.success && response.data?.data) {
        setOverviewData(response.data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching overview:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load overview data";
      setError(errorMsg);
      throw err;
    }
  }, [role]);

  const fetchPrayerBreakdown = useCallback(async () => {
    try {
      const response = await api.get("/attendance/prayer-breakdown", {
        params: { role },
      });

      if (response.data?.success && response.data?.data) {
        setPrayerBreakdown(response.data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching prayer breakdown:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load prayer breakdown";
      setError(errorMsg);
      throw err;
    }
  }, [role]);

  const fetchAreas = useCallback(async () => {
    if (role !== "SuperAdmin") return;

    try {
      const response = await api.get("/attendance/areas");

      if (response.data?.success && response.data?.data) {
        setAreasData(
          Array.isArray(response.data.data) ? response.data.data : []
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching areas:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load areas data";
      setError(errorMsg);
      throw err;
    }
  }, [role]);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const response = await api.get("/attendance/members", {
        params: {
          role,
          area_id: selectedArea,
          period: timePeriod,
          search: searchTerm,
          page: currentPage,
          limit: 20,
        },
      });

      if (response.data?.success && response.data?.data) {
        setMembersData(
          Array.isArray(response.data.data) ? response.data.data : []
        );
        setPagination(response.data.pagination || null);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching members:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load members data";
      setError(errorMsg);
      // Don't throw error here to allow partial data display
      setMembersData([]);
      setPagination(null);
    } finally {
      setLoadingMembers(false);
    }
  }, [role, selectedArea, timePeriod, searchTerm, currentPage]);

  // Fetch overview data on mount and role change
  useEffect(() => {
    const loadOverviewData = async () => {
      setLoading(true);
      setError(null);

      try {
        const promises = [fetchOverview(), fetchPrayerBreakdown()];

        if (role === "SuperAdmin") {
          promises.push(fetchAreas());
        }

        await Promise.all(promises);
      } catch (err) {
        // Error already set in individual fetch functions
        console.error("Error loading overview data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewData();
  }, [role, fetchOverview, fetchPrayerBreakdown, fetchAreas]);

  // Fetch members data when in detailed view
  useEffect(() => {
    if (view === "detailed") {
      fetchMembers();
    }
  }, [view, fetchMembers]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, timePeriod, selectedArea]);

  // Memoized handlers to prevent recreating functions
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleDownloadReport = useCallback(async (member) => {
    try {
      console.log("Fetching full member details for report:", {
        memberId: member.id,
        memberName: member.name,
      });

      // Fetch full member details from the API
      const response = await api.get(`/members/${member.id}`);

      if (response.data?.success && response.data?.data) {
        const fullMemberData = response.data.data;
        console.log("Full member data fetched:", fullMemberData);
        await generateMemberReport(fullMemberData);
      } else {
        throw new Error("Failed to fetch member details");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      alert(
        `Failed to download report: ${error.message || "Please try again."}`
      );
    }
  }, []);

  // Helper functions
  const getColorClass = useCallback((percentage) => {
    if (percentage >= 80) return "text-green-700 bg-green-50";
    if (percentage >= 60) return "text-yellow-700 bg-yellow-50";
    return "text-red-700 bg-red-50";
  }, []);

  const getProgressColor = useCallback((percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  }, []);

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-green-600 h-12 w-12"></div>
            <p className="mt-4 text-gray-600">Loading attendance data...</p>
          </div>
        </div>
      </FounderLayout>
    );
  }

  if (error) {
    return (
      <FounderLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-900 mb-2">Error Loading Data</p>
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </FounderLayout>
    );
  }

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Attendance Dashboard
              </h1>
              <div className="mt-2 flex items-center space-x-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200">
                  {role === "SuperAdmin" ? "👑 SuperAdmin" : "📍 Area Founder"}
                </span>
                {overviewData?.areaInfo && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-800 border border-green-200">
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {overviewData.areaInfo.name}
                  </span>
                )}
              </div>
            </div>

            {/* View Switcher */}
            <div className="bg-white rounded-lg shadow-sm p-1 inline-flex border border-gray-200">
              <button
                onClick={() => setView("overview")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === "overview"
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setView("detailed")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === "detailed"
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Member Overview
              </button>
            </div>
          </div>
        </div>

        {view === "overview" ? (
          role === "SuperAdmin" ? (
            /* ==================== SUPERADMIN OVERVIEW ==================== */
            <div className="space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {overviewData?.yesterday && (
                  <Tooltip text="Total prayers logged yesterday across ALL areas">
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          Yesterday
                        </h3>
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {safePercentage(overviewData?.yesterday?.percentage)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {safeGet(overviewData, "yesterday.count", 0)}/
                        {safeGet(overviewData, "yesterday.total", 0)} prayers
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.topArea && (
                  <Tooltip text="Area with highest weighted score (last 7 days)">
                    <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-green-900">
                          Top Area (7d)
                        </h3>
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                      </div>
                      <div className="text-lg font-bold text-gray-900 mb-1 truncate">
                        {safeGet(overviewData, "topArea.name", "N/A")}
                      </div>
                      <p className="text-xs text-gray-600">
                        {safePercentage(overviewData?.topArea?.percentage)}{" "}
                        score
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.newMembers && (
                  <Tooltip text="Members who joined in the last 30 days across all areas">
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          New Members (30d)
                        </h3>
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {safeGet(overviewData, "newMembers.count", 0)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {safePercentage(
                          (safeGet(overviewData, "newMembers.count", 0) /
                            safeGet(overviewData, "newMembers.total", 1)) *
                            100
                        )}{" "}
                        growth rate
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.avgRate7d && (
                  <Tooltip text="Average attendance rate across all areas (last 7 days)">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-400 shadow-md hover:shadow-lg transition-shadow cursor-help">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-green-900">
                          Avg Rate (7d)
                        </h3>
                        <svg
                          className="w-8 h-8 text-green-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-green-900 mb-1">
                        {safePercentage(overviewData?.avgRate7d?.percentage)}
                      </div>
                      <p className="text-xs text-green-800">Across all areas</p>
                    </div>
                  </Tooltip>
                )}
              </div>

              {/* Prayer Breakdown */}
              {prayerBreakdown && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Global Prayer Breakdown
                    </h2>
                    <span className="text-xs text-gray-500">
                      Yesterday | 7d = last 7 days | 30d = last 30 days
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(prayerBreakdown).map(([prayer, data]) => (
                      <Tooltip
                        key={prayer}
                        text={`Yesterday: ${safeGet(
                          data,
                          "yesterdayPercent",
                          0
                        )}% | 7d: ${safeGet(
                          data,
                          "weekPercent",
                          0
                        )}% | 30d: ${safeGet(data, "monthPercent", 0)}%`}
                      >
                        <div
                          className={`rounded-lg p-4 cursor-help transition-all hover:scale-105 ${
                            prayer === "fajr"
                              ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div className="text-center">
                            <div
                              className={`text-sm font-medium mb-2 ${
                                prayer === "fajr"
                                  ? "text-green-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {prayer === "fajr" && "🌅 "}
                              {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                            </div>

                            <div className="mb-3">
                              <div className="text-2xl font-bold text-gray-900">
                                {safePercentage(data?.yesterdayPercent)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Yesterday ({safeGet(data, "yesterdayCount", 0)})
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>7d</span>
                                  <span>
                                    {safePercentage(data?.weekPercent)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${getProgressColor(
                                      safeGet(data, "weekPercent", 0)
                                    )}`}
                                    style={{
                                      width: `${safeGet(
                                        data,
                                        "weekPercent",
                                        0
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>30d</span>
                                  <span>
                                    {safePercentage(data?.monthPercent)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${getProgressColor(
                                      safeGet(data, "monthPercent", 0)
                                    )}`}
                                    style={{
                                      width: `${safeGet(
                                        data,
                                        "monthPercent",
                                        0
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* Area Performance Table */}
              {areasData.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Area Performance (Weighted Ranking)
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Ranked by weighted score: attendance consistency + Fajr
                      rate
                    </p>
                  </div>
                  <div className="overflow-x-auto relative z-0">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Area
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            <div className="inline-flex items-center cursor-help group relative">
                              Members
                              <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                                Number of registered members
                                <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                              </div>
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            <div className="inline-flex items-center cursor-help group relative">
                              🌅 Fajr (7d)
                              <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                                🌅 Fajr attendance rate (last 7 days)
                                <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                              </div>
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            <div className="inline-flex items-center cursor-help group relative">
                              Yesterday
                              <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                                Overall attendance rate yesterday
                                <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                              </div>
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            <div className="inline-flex items-center cursor-help group relative">
                              7 Days
                              <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                                Overall attendance rate (last 7 days)
                                <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                              </div>
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            <div className="inline-flex items-center cursor-help group relative">
                              30 Days
                              <div className="hidden group-hover:block absolute z-[9999] px-3 py-2 text-xs text-white bg-gray-900 rounded-md shadow-xl -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
                                Overall attendance rate (last 30 days)
                                <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                              </div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {areasData.map((area, index) => (
                          <tr key={area.area_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-800"
                                    : index === 1
                                    ? "bg-gray-200 text-gray-700"
                                    : index === 2
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-50 text-gray-500"
                                }`}
                              >
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {safeGet(area, "name", "N/A")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {safeGet(area, "members", 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(
                                  safeGet(area, "fajrPercent", 0)
                                )}`}
                              >
                                {safePercentage(area?.fajrPercent)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(
                                  safeGet(area, "yesterdayPercent", 0)
                                )}`}
                              >
                                {safePercentage(area?.yesterdayPercent)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(
                                  safeGet(area, "weekPercent", 0)
                                )}`}
                              >
                                {safePercentage(area?.weekPercent)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getColorClass(
                                  safeGet(area, "monthPercent", 0)
                                )}`}
                              >
                                {safePercentage(area?.monthPercent)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ==================== FOUNDER OVERVIEW ==================== */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {overviewData?.yesterday && (
                  <Tooltip text="Total prayers logged yesterday in YOUR area">
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          Yesterday
                        </h3>
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {safePercentage(overviewData?.yesterday?.percentage)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {safeGet(overviewData, "yesterday.count", 0)}/
                        {safeGet(overviewData, "yesterday.total", 0)} prayers
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.areaRank && (
                  <Tooltip text="Your area's weighted ranking (last 7 days)">
                    <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-green-900">
                          Area Rank (7d)
                        </h3>
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900">
                          #{safeGet(overviewData, "areaRank.position", "N/A")}
                        </span>
                        <span className="text-lg text-gray-600">
                          /{" "}
                          {safeGet(overviewData, "areaRank.totalAreas", "N/A")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {safePercentage(overviewData?.areaRank?.percentage)}{" "}
                        score
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.newMembers && (
                  <Tooltip text="Members who joined your area in the last 30 days">
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-help">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">
                          New Members (30d)
                        </h3>
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {safeGet(overviewData, "newMembers.count", 0)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {safePercentage(
                          (safeGet(overviewData, "newMembers.count", 0) /
                            safeGet(overviewData, "newMembers.total", 1)) *
                            100
                        )}{" "}
                        growth rate
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.weeklyAvg && (
                  <Tooltip text="Average attendance rate for your area (last 7 days)">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-400 shadow-md hover:shadow-lg transition-shadow cursor-help">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-green-900">
                          Week Avg (7d)
                        </h3>
                        <svg
                          className="w-8 h-8 text-green-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-green-900 mb-1">
                        {safePercentage(overviewData?.weeklyAvg?.percentage)}
                      </div>
                      <p className="text-xs text-green-800">
                        Last 7 days average
                      </p>
                    </div>
                  </Tooltip>
                )}
              </div>

              {/* Prayer Breakdown */}
              {prayerBreakdown && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Prayer Performance
                    </h2>
                    <span className="text-xs text-gray-500">
                      Yesterday | 7d = last 7 days | 30d = last 30 days
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(prayerBreakdown).map(([prayer, data]) => (
                      <Tooltip
                        key={prayer}
                        text={`Yesterday: ${safeGet(
                          data,
                          "yesterdayPercent",
                          0
                        )}% | 7d: ${safeGet(
                          data,
                          "weekPercent",
                          0
                        )}% | 30d: ${safeGet(data, "monthPercent", 0)}%`}
                      >
                        <div
                          className={`rounded-lg p-4 cursor-help transition-all hover:scale-105 ${
                            prayer === "fajr"
                              ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div className="text-center">
                            <div
                              className={`text-sm font-medium mb-2 ${
                                prayer === "fajr"
                                  ? "text-green-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {prayer === "fajr" && "🌅 "}
                              {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                            </div>

                            <div className="mb-3">
                              <div className="text-2xl font-bold text-gray-900">
                                {safePercentage(data?.yesterdayPercent)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Yesterday ({safeGet(data, "yesterdayCount", 0)})
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>7d</span>
                                  <span>
                                    {safePercentage(data?.weekPercent)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${getProgressColor(
                                      safeGet(data, "weekPercent", 0)
                                    )}`}
                                    style={{
                                      width: `${safeGet(
                                        data,
                                        "weekPercent",
                                        0
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>30d</span>
                                  <span>
                                    {safePercentage(data?.monthPercent)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${getProgressColor(
                                      safeGet(data, "monthPercent", 0)
                                    )}`}
                                    style={{
                                      width: `${safeGet(
                                        data,
                                        "monthPercent",
                                        0
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* ==================== DETAILED ANALYTICS ==================== */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Member Attendance
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {pagination?.totalItems || 0} members found
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex space-x-2">
                      {timePeriodOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTimePeriod(option.value)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            timePeriod === option.value
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {role === "SuperAdmin" && areasData.length > 0 && (
                      <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="all">All Areas</option>
                        {areasData.map((area) => (
                          <option key={area.area_id} value={area.area_id}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Search members by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {loadingMembers ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-green-600 h-12 w-12"></div>
                  <p className="mt-4 text-gray-600">Loading members...</p>
                </div>
              ) : membersData.length === 0 ? (
                <div className="p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="mt-4 text-sm text-gray-600">
                    No members found {searchTerm && `matching "${searchTerm}"`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto relative">
                    {loadingMembers && (
                      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                        <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-green-600 h-8 w-8"></div>
                      </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Member
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Attendance ({getPeriodLabel})
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Yesterday
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            🌅 Fajr Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {membersData.map((member) => (
                          <tr
                            key={member.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-medium text-sm">
                                  {safeGet(member, "name", "N/A")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {safeGet(member, "name", "N/A")}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {safeGet(member, "phone", "N/A")}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getColorClass(
                                  safeGet(member, "periodPercentage", 0)
                                )}`}
                              >
                                {safePercentage(member?.periodPercentage)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <PrayerDots
                                prayers={safeGet(
                                  member,
                                  "yesterdayPrayers",
                                  {}
                                )}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {safeGet(member, "fajrCount", 0)}/
                              {safeGet(member, "totalDays", 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleDownloadReport(member)}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {pagination && pagination.totalPages > 1 && (
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                      itemsPerPage={pagination.itemsPerPage}
                      totalItems={pagination.totalItems}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default ViewAttendance;
