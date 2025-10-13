// filepath: src/pages/founder/ViewAttendance.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import FounderLayout from "../../components/layouts/FounderLayout";
import { useAuth } from "../../context/AuthContext";
import api, { attendanceService } from "../../services/api";
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

// Fixed percentage display - always shows % symbol and handles edge cases
const formatPercentage = (value) => {
  const num = Number(value) || 0;
  return `${Math.round(num)}%`;
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
        <div className="absolute z-[9999] px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
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
    <div className="flex items-center space-x-1.5">
      {prayerOrder.map((prayer) => (
        <Tooltip
          key={prayer}
          text={prayer.charAt(0).toUpperCase() + prayer.slice(1)}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              prayers[prayer]
                ? "bg-green-500 ring-2 ring-green-200"
                : "bg-gray-300"
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
            Showing <span className="font-semibold">{startItem}</span> to{" "}
            <span className="font-semibold">{endItem}</span> of{" "}
            <span className="font-semibold">{totalItems}</span> members
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            }`}
          >
            Previous
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 2 && <span className="text-gray-500 px-2">...</span>}
            </>
          )}

          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === number
                  ? "bg-green-600 text-white shadow-lg scale-105"
                  : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {number}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="text-gray-500 px-2">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
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
  const role = user?.role || "Founder";

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
    { value: "7", label: "7 Days" },
    { value: "30", label: "30 Days" },
    { value: "180", label: "6 Months" },
    { value: "365", label: "1 Year" },
  ];

  // Memoized period label
  const getPeriodLabel = useMemo(() => {
    const option = timePeriodOptions.find((opt) => opt.value === timePeriod);
    return option ? option.label : "Period";
  }, [timePeriod]);

  // API calls
  const fetchOverview = useCallback(async () => {
    try {
      const response = await attendanceService.getOverview(role);
      if (response?.success && response?.data) {
        setOverviewData(response.data);
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
      const response = await attendanceService.getPrayerBreakdown(role);
      if (response?.success && response?.data) {
        setPrayerBreakdown(response.data);
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
      const response = await attendanceService.getAreasPerformance();
      if (response?.success && response?.data) {
        setAreasData(Array.isArray(response.data) ? response.data : []);
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
      const response = await attendanceService.getMembersAttendance({
        role,
        area_id: selectedArea,
        period: timePeriod,
        search: searchTerm,
        page: currentPage,
        limit: 20,
      });

      if (response?.success && response?.data) {
        setMembersData(Array.isArray(response.data) ? response.data : []);
        setPagination(response.pagination || null);
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
      setMembersData([]);
      setPagination(null);
    } finally {
      setLoadingMembers(false);
    }
  }, [role, selectedArea, timePeriod, searchTerm, currentPage]);

  // Fetch overview data on mount
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

  // Handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleDownloadReport = useCallback(async (member) => {
    try {
      console.log("Fetching full member details for report:", {
        memberId: member.id,
        memberName: member.name,
      });

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
    const pct = Number(percentage) || 0;
    if (pct >= 80) return "text-green-700 bg-green-100 border border-green-300";
    if (pct >= 60)
      return "text-yellow-700 bg-yellow-100 border border-yellow-300";
    return "text-red-700 bg-red-100 border border-red-300";
  }, []);

  const getProgressColor = useCallback((percentage) => {
    const pct = Number(percentage) || 0;
    if (pct >= 80) return "bg-green-500";
    if (pct >= 60) return "bg-yellow-500";
    return "bg-red-500";
  }, []);

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-green-600 h-16 w-16"></div>
            <p className="mt-6 text-lg font-medium text-gray-700">
              Loading attendance data...
            </p>
          </div>
        </div>
      </FounderLayout>
    );
  }

  if (error) {
    return (
      <FounderLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-600 mb-4">
              <svg
                className="mx-auto h-16 w-16"
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
            <p className="text-xl font-semibold text-gray-900 mb-3">
              Error Loading Data
            </p>
            <p className="text-base text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-green-600 text-white text-base font-medium rounded-lg hover:bg-green-700 transition-colors"
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
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Attendance Dashboard
              </h1>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-4 py-2 rounded-lg text-base font-semibold bg-blue-100 text-blue-900 border-2 border-blue-300">
                  {role === "SuperAdmin"
                    ? "SuperAdmin"
                    : role === "WCM"
                    ? "WC Member"
                    : "WC Admin"}
                </span>
                {overviewData?.areaInfo && (
                  <span className="inline-flex items-center px-4 py-2 rounded-lg text-base font-semibold bg-green-100 text-green-900 border-2 border-green-300">
                    <svg
                      className="w-5 h-5 mr-2"
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
            <div className="bg-white rounded-xl shadow-md p-1.5 inline-flex border-2 border-gray-200">
              <button
                onClick={() => setView("overview")}
                className={`px-8 py-3 rounded-lg text-base font-semibold transition-all ${
                  view === "overview"
                    ? "bg-green-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setView("detailed")}
                className={`px-8 py-3 rounded-lg text-base font-semibold transition-all ${
                  view === "detailed"
                    ? "bg-green-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Member List
              </button>
            </div>
          </div>
        </div>

        {view === "overview" ? (
          role === "SuperAdmin" ? (
            /* ==================== SUPERADMIN OVERVIEW ==================== */
            <div className="space-y-8">
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewData?.yesterday && (
                  <Tooltip text="Total prayers completed yesterday across all areas">
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md hover:shadow-xl transition-all cursor-help">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide">
                          Yesterday
                        </h3>
                        <svg
                          className="w-10 h-10 text-green-600"
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
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {formatPercentage(
                          safeGet(overviewData, "yesterday.percentage", 0)
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        {safeGet(overviewData, "yesterday.count", 0)} of{" "}
                        {safeGet(overviewData, "yesterday.total", 0)} prayers
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.topArea && (
                  <Tooltip text="Best performing area in the last 7 days">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-400 shadow-md hover:shadow-xl transition-all cursor-help">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-green-900 uppercase tracking-wide">
                          Top Area
                        </h3>
                        <svg
                          className="w-10 h-10 text-green-700"
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
                      <div className="text-2xl font-bold text-gray-900 mb-2 truncate">
                        {safeGet(overviewData, "topArea.name", "N/A")}
                      </div>
                      <p className="text-sm font-medium text-green-800">
                        {formatPercentage(
                          safeGet(overviewData, "topArea.percentage", 0)
                        )}{" "}
                        score
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.newMembers && (
                  <Tooltip text="New members who joined in the last 30 days">
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md hover:shadow-xl transition-all cursor-help">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide">
                          New Members
                        </h3>
                        <svg
                          className="w-10 h-10 text-green-600"
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
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {safeGet(overviewData, "newMembers.count", 0)}
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        of {safeGet(overviewData, "newMembers.total", 0)} total
                        members
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.avgRate7d && (
                  <Tooltip text="Average attendance rate across all areas (last 7 days)">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border-2 border-blue-400 shadow-md hover:shadow-xl transition-all cursor-help">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-blue-900 uppercase tracking-wide">
                          Weekly Avg
                        </h3>
                        <svg
                          className="w-10 h-10 text-blue-700"
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
                      <div className="text-4xl font-bold text-blue-900 mb-2">
                        {formatPercentage(
                          safeGet(overviewData, "avgRate7d.percentage", 0)
                        )}
                      </div>
                      <p className="text-sm font-medium text-blue-800">
                        Last 7 days
                      </p>
                    </div>
                  </Tooltip>
                )}
              </div>

              {/* Prayer Breakdown */}
              {prayerBreakdown && (
                <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Prayer Breakdown
                    </h2>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                      All Areas Combined
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-6">
                    {Object.entries(prayerBreakdown).map(([prayer, data]) => {
                      const isFajr = prayer === "fajr";
                      return (
                        <div
                          key={prayer}
                          className={`rounded-xl p-6 transition-all hover:scale-105 ${
                            isFajr
                              ? "bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-400 shadow-md"
                              : "bg-gray-50 border-2 border-gray-200"
                          }`}
                        >
                          <div className="text-center">
                            <div
                              className={`text-base font-bold mb-3 uppercase tracking-wide ${
                                isFajr ? "text-green-900" : "text-gray-700"
                              }`}
                            >
                              {isFajr && "🌅 "}
                              {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                            </div>

                            <div className="mb-4">
                              <div className="text-3xl font-bold text-gray-900">
                                {formatPercentage(
                                  safeGet(data, "yesterdayPercent", 0)
                                )}
                              </div>
                              <div className="text-sm font-medium text-gray-600 mt-1">
                                Yesterday
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {safeGet(data, "yesterdayCount", 0)} prayers
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                                  <span>7 Days</span>
                                  <span>
                                    {formatPercentage(
                                      safeGet(data, "weekPercent", 0)
                                    )}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full transition-all ${getProgressColor(
                                      safeGet(data, "weekPercent", 0)
                                    )}`}
                                    style={{
                                      width: `${Math.min(
                                        safeGet(data, "weekPercent", 0),
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                                  <span>30 Days</span>
                                  <span>
                                    {formatPercentage(
                                      safeGet(data, "monthPercent", 0)
                                    )}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full transition-all ${getProgressColor(
                                      safeGet(data, "monthPercent", 0)
                                    )}`}
                                    style={{
                                      width: `${Math.min(
                                        safeGet(data, "monthPercent", 0),
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Area Performance Table */}
              {/* Area Performance Table */}
              {areasData.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
                  <div className="p-8 border-b-2 border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Area Performance
                    </h2>
                    <p className="text-sm font-medium text-gray-600">
                      Ranked by overall performance across all metrics
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-2 divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Area
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Members
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            🌅 Fajr
                            <br />
                            <span className="text-xs font-normal text-gray-500">
                              (Last 7d)
                            </span>
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Yesterday
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Attendance
                            <br />
                            <span className="text-xs font-normal text-gray-500">
                              (Last 7d)
                            </span>
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            30 Days
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {areasData.map((area, index) => (
                          <tr
                            key={area.area_id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold mx-auto ${
                                  index === 0
                                    ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-400"
                                    : index === 1
                                    ? "bg-gray-200 text-gray-700 border-2 border-gray-400"
                                    : index === 2
                                    ? "bg-orange-100 text-orange-700 border-2 border-orange-400"
                                    : "bg-gray-50 text-gray-500 border border-gray-300"
                                }`}
                              >
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-base font-semibold text-gray-900">
                              {safeGet(area, "name", "N/A")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-base font-medium text-gray-700">
                              {safeGet(area, "members", 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex px-3 py-1.5 rounded-lg text-base font-bold ${getColorClass(
                                  safeGet(area, "fajrPercent", 0)
                                )}`}
                              >
                                {formatPercentage(
                                  safeGet(area, "fajrPercent", 0)
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex px-3 py-1.5 rounded-lg text-base font-bold ${getColorClass(
                                  safeGet(area, "yesterdayPercent", 0)
                                )}`}
                              >
                                {formatPercentage(
                                  safeGet(area, "yesterdayPercent", 0)
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex px-3 py-1.5 rounded-lg text-base font-bold ${getColorClass(
                                  safeGet(area, "weekPercent", 0)
                                )}`}
                              >
                                {formatPercentage(
                                  safeGet(area, "weekPercent", 0)
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex px-3 py-1.5 rounded-lg text-base font-bold ${getColorClass(
                                  safeGet(area, "monthPercent", 0)
                                )}`}
                              >
                                {formatPercentage(
                                  safeGet(area, "monthPercent", 0)
                                )}
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
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewData?.yesterday && (
                  <Tooltip text="Total prayers completed yesterday in your area">
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md hover:shadow-xl transition-all cursor-help">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide">
                          Yesterday
                        </h3>
                        <svg
                          className="w-10 h-10 text-green-600"
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
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {formatPercentage(
                          safeGet(overviewData, "yesterday.percentage", 0)
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        {safeGet(overviewData, "yesterday.count", 0)} of{" "}
                        {safeGet(overviewData, "yesterday.total", 0)} prayers
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.areaRank && (
                  <Tooltip text="Your area's ranking compared to other areas (last 7 days)">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-400 shadow-md hover:shadow-xl transition-all cursor-help">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-green-900 uppercase tracking-wide">
                          Area Rank
                        </h3>
                        <svg
                          className="w-10 h-10 text-green-700"
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
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-4xl font-bold text-gray-900">
                          #{safeGet(overviewData, "areaRank.position", "N/A")}
                        </span>
                        <span className="text-2xl font-medium text-gray-600">
                          /{" "}
                          {safeGet(overviewData, "areaRank.totalAreas", "N/A")}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-green-800">
                        {formatPercentage(
                          safeGet(overviewData, "areaRank.percentage", 0)
                        )}{" "}
                        score
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.newMembers && (
                  <Tooltip text="New members who joined your area in the last 30 days">
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md hover:shadow-xl transition-all cursor-help">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide">
                          New Members
                        </h3>
                        <svg
                          className="w-10 h-10 text-green-600"
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
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {safeGet(overviewData, "newMembers.count", 0)}
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        of {safeGet(overviewData, "newMembers.total", 0)} total
                        members
                      </p>
                    </div>
                  </Tooltip>
                )}

                {overviewData?.weeklyAvg && (
                  <Tooltip text="Average attendance rate for your area (last 7 days)">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border-2 border-blue-400 shadow-md hover:shadow-xl transition-all cursor-help">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-blue-900 uppercase tracking-wide">
                          Weekly Avg
                        </h3>
                        <svg
                          className="w-10 h-10 text-blue-700"
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
                      <div className="text-4xl font-bold text-blue-900 mb-2">
                        {formatPercentage(
                          safeGet(overviewData, "weeklyAvg.percentage", 0)
                        )}
                      </div>
                      <p className="text-sm font-medium text-blue-800">
                        Last 7 days
                      </p>
                    </div>
                  </Tooltip>
                )}
              </div>

              {/* Prayer Breakdown */}
              {prayerBreakdown && (
                <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Prayer Breakdown
                    </h2>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                      Your Area
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-6">
                    {Object.entries(prayerBreakdown).map(([prayer, data]) => {
                      const isFajr = prayer === "fajr";
                      return (
                        <div
                          key={prayer}
                          className={`rounded-xl p-6 transition-all hover:scale-105 ${
                            isFajr
                              ? "bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-400 shadow-md"
                              : "bg-gray-50 border-2 border-gray-200"
                          }`}
                        >
                          <div className="text-center">
                            <div
                              className={`text-base font-bold mb-3 uppercase tracking-wide ${
                                isFajr ? "text-green-900" : "text-gray-700"
                              }`}
                            >
                              {isFajr && "🌅 "}
                              {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                            </div>

                            <div className="mb-4">
                              <div className="text-3xl font-bold text-gray-900">
                                {formatPercentage(
                                  safeGet(data, "yesterdayPercent", 0)
                                )}
                              </div>
                              <div className="text-sm font-medium text-gray-600 mt-1">
                                Yesterday
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {safeGet(data, "yesterdayCount", 0)} prayers
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                                  <span>7 Days</span>
                                  <span>
                                    {formatPercentage(
                                      safeGet(data, "weekPercent", 0)
                                    )}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full transition-all ${getProgressColor(
                                      safeGet(data, "weekPercent", 0)
                                    )}`}
                                    style={{
                                      width: `${Math.min(
                                        safeGet(data, "weekPercent", 0),
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1.5">
                                  <span>30 Days</span>
                                  <span>
                                    {formatPercentage(
                                      safeGet(data, "monthPercent", 0)
                                    )}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full transition-all ${getProgressColor(
                                      safeGet(data, "monthPercent", 0)
                                    )}`}
                                    style={{
                                      width: `${Math.min(
                                        safeGet(data, "monthPercent", 0),
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* ==================== MEMBER LIST VIEW ==================== */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
              <div className="p-8 border-b-2 border-gray-200">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Member Attendance
                    </h2>
                    <p className="text-base font-medium text-gray-600">
                      {pagination?.totalItems || 0} members found
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    <div className="flex space-x-2">
                      {timePeriodOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTimePeriod(option.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            timePeriod === option.value
                              ? "bg-green-600 text-white shadow-lg scale-105"
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
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-5 py-3 border-2 border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {loadingMembers ? (
                <div className="p-16 text-center">
                  <div className="inline-block animate-spin rounded-full border-4 border-gray-200 border-t-green-600 h-16 w-16"></div>
                  <p className="mt-6 text-lg font-medium text-gray-700">
                    Loading members...
                  </p>
                </div>
              ) : membersData.length === 0 ? (
                <div className="p-16 text-center">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
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
                  <p className="mt-6 text-base font-medium text-gray-600">
                    No members found {searchTerm && `matching "${searchTerm}"`}
                  </p>
                </div>
              ) : (
                <>
                  {/* Replace the table section in the Member List View */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-2 divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Member
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Area
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Attendance ({getPeriodLabel})
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Yesterday
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            🌅 Fajr Streak
                          </th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {membersData.map((member) => {
                          const areaName =
                            areasData.find((a) => a.area_id === member.area_id)
                              ?.name || `Area ${member.area_id}`;
                          const fajrPercentage =
                            member.totalDays > 0
                              ? Math.round(
                                  (member.fajrCount / member.totalDays) * 100
                                )
                              : 0;

                          return (
                            <tr
                              key={member.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-green-800 font-bold text-base border-2 border-green-300">
                                    {safeGet(member, "name", "N/A")
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-base font-semibold text-gray-900">
                                      {safeGet(member, "name", "N/A")}
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">
                                      {safeGet(member, "phone", "N/A")}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-900 border border-blue-300">
                                  {areaName}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span
                                  className={`inline-flex px-4 py-2 rounded-lg text-base font-bold ${getColorClass(
                                    safeGet(member, "periodPercentage", 0)
                                  )}`}
                                >
                                  {formatPercentage(
                                    safeGet(member, "periodPercentage", 0)
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex justify-center">
                                  <PrayerDots
                                    prayers={safeGet(
                                      member,
                                      "yesterdayPrayers",
                                      {}
                                    )}
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col items-center space-y-1.5">
                                  <div className="flex items-baseline space-x-1">
                                    <span className="text-2xl font-bold text-gray-900">
                                      {safeGet(member, "fajrCount", 0)}
                                    </span>
                                    <span className="text-base font-medium text-gray-500">
                                      / {safeGet(member, "totalDays", 0)}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        fajrPercentage >= 80
                                          ? "bg-green-500"
                                          : fajrPercentage >= 60
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          fajrPercentage,
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span
                                    className={`text-xs font-semibold ${
                                      fajrPercentage >= 80
                                        ? "text-green-700"
                                        : fajrPercentage >= 60
                                        ? "text-yellow-700"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {fajrPercentage}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleDownloadReport(member)}
                                  className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all hover:shadow-lg"
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
                          );
                        })}
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
