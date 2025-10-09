import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FounderLayout from "../layouts/FounderLayout";
import feedsService from "../../services/feedsService"; // Import feeds service
import { areaService, userService } from "../../services/api"; // Import area and user services

const FounderDashboard = () => {
  const { user } = useAuth();

  // Area information state
  const [area, setArea] = useState({
    name: "Loading...",
    address: "Loading area information...",
    prayerTimes: {
      fajr: "4:43 AM",
      dhuhr: "12:15 PM",
      asr: "3:45 PM",
      maghrib: "6:23 PM",
      isha: "7:43 PM",
      jumuah: "1:30 PM",
    },
  });

  // Attendance stats - will be populated from API
  const [attendanceStats, setAttendanceStats] = useState({
    today: {
      total: 0,
      percentage: 0,
      prayerBreakdown: {
        fajr: { count: 0, percentage: 0 },
        dhuhr: { count: 0, percentage: 0 },
        asr: { count: 0, percentage: 0 },
        maghrib: { count: 0, percentage: 0 },
        isha: { count: 0, percentage: 0 },
      },
    },
    weekly: {
      total: 0,
      percentage: 0,
      trend: "stable",
    },
    monthly: {
      total: 0,
      percentage: 0,
      trend: "stable",
    },
  });

  // Loading states
  const [loadingAreaData, setLoadingAreaData] = useState(true);
  const [attendanceError, setAttendanceError] = useState(null);

  // Feeds state with loading and error handling
  const [feeds, setFeeds] = useState([]);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [feedsError, setFeedsError] = useState(null);

  const [currentDate, setCurrentDate] = useState({
    gregorian: "Loading Todays Date...",
    hijri: "Loading Hijiri Date...",
  });

  // Fetch area data and attendance statistics
  useEffect(() => {
    const today = new Date();

    // Gregorian date
    const gregorianDate = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Hijri date (using built-in Intl API)
    let hijriDate;
    try {
      hijriDate = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(today);
    } catch (error) {
      console.warn("Hijri date not supported in this browser.");
      hijriDate = "Hijri date not supported";
    }

    setCurrentDate({
      gregorian: gregorianDate,
      hijri: hijriDate,
    });

    const fetchAreaData = async () => {
      setLoadingAreaData(true);
      setAttendanceError(null);

      try {
        // First, get fresh user profile to ensure we have latest area info
        console.log("🔍 Fetching fresh user profile and area data");

        try {
          const profileResponse = await userService.getProfile();
          if (profileResponse.data.success) {
            const freshUser = profileResponse.data.data;
            console.log("📋 Fresh user profile:", freshUser);

            const userAreaId = freshUser.areaId || freshUser.area_id;
            if (userAreaId) {
              console.log(
                "📊 Found area_id:",
                userAreaId,
                "fetching area stats"
              );

              // Fetch attendance statistics for founder's specific area
              const attendanceResponse = await areaService.getAreaStats(
                userAreaId
              );

              if (attendanceResponse.data.success) {
                const stats = attendanceResponse.data.data;

                // Update area info from stats response
                setArea({
                  name: stats.area.name || "Area",
                  address: "Area information", // Can be enhanced later
                  prayerTimes: {
                    fajr: "4:43 AM",
                    dhuhr: "12:15 PM",
                    asr: "3:45 PM",
                    maghrib: "6:23 PM",
                    isha: "7:43 PM",
                    jumuah: "1:30 PM",
                  },
                });

                // Update attendance stats
                setAttendanceStats({
                  today: {
                    total: stats.today.total,
                    percentage: stats.today.percentage,
                    prayerBreakdown: {
                      fajr: {
                        count: stats.today.prayerBreakdown.fajr.count,
                        percentage: stats.today.prayerBreakdown.fajr.percentage,
                      },
                      dhuhr: {
                        count: stats.today.prayerBreakdown.dhuhr.count,
                        percentage:
                          stats.today.prayerBreakdown.dhuhr.percentage,
                      },
                      asr: {
                        count: stats.today.prayerBreakdown.asr.count,
                        percentage: stats.today.prayerBreakdown.asr.percentage,
                      },
                      maghrib: {
                        count: stats.today.prayerBreakdown.maghrib.count,
                        percentage:
                          stats.today.prayerBreakdown.maghrib.percentage,
                      },
                      isha: {
                        count: stats.today.prayerBreakdown.isha.count,
                        percentage: stats.today.prayerBreakdown.isha.percentage,
                      },
                    },
                  },
                  weekly: {
                    total: stats.weekly.total,
                    percentage: stats.weekly.percentage,
                    trend:
                      stats.weekly.percentage >= 70
                        ? "up"
                        : stats.weekly.percentage >= 50
                        ? "stable"
                        : "down",
                  },
                  monthly: {
                    total: stats.monthly.total,
                    percentage: stats.monthly.percentage,
                    trend:
                      stats.monthly.percentage >= 70
                        ? "up"
                        : stats.monthly.percentage >= 50
                        ? "stable"
                        : "down",
                  },
                });

                console.log(
                  "✅ Attendance data loaded successfully for area:",
                  stats.area.name
                );
              } else {
                console.error(
                  "❌ Failed to fetch area stats:",
                  attendanceResponse.data.message
                );
                setAttendanceError("Failed to load attendance statistics");
              }
            } else {
              console.warn(
                "⚠️ Fresh user profile shows no area_id assigned. User profile:",
                freshUser
              );
              setAttendanceError(
                "No area associated with this user. Please contact admin to assign an area."
              );
            }
          }
        } catch (profileError) {
          console.error("❌ Failed to fetch fresh user profile:", profileError);

          // Fallback: try with cached user data
          console.log("🔄 Falling back to cached user data:", user);
          const userAreaId = user?.areaId || user?.area_id;
          if (userAreaId) {
            console.log("📊 Using cached area_id:", userAreaId);

            try {
              const attendanceResponse = await areaService.getAreaStats(
                userAreaId
              );
              if (attendanceResponse.data.success) {
                const stats = attendanceResponse.data.data;

                setArea({
                  name: stats.area.name || "Area",
                  address: "Area information",
                  prayerTimes: {
                    fajr: "4:43 AM",
                    dhuhr: "12:15 PM",
                    asr: "3:45 PM",
                    maghrib: "6:23 PM",
                    isha: "7:43 PM",
                    jumuah: "1:30 PM",
                  },
                });

                setAttendanceStats({
                  today: {
                    total: stats.today.total,
                    percentage: stats.today.percentage,
                    prayerBreakdown: {
                      fajr: {
                        count: stats.today.prayerBreakdown.fajr.count,
                        percentage: stats.today.prayerBreakdown.fajr.percentage,
                      },
                      dhuhr: {
                        count: stats.today.prayerBreakdown.dhuhr.count,
                        percentage:
                          stats.today.prayerBreakdown.dhuhr.percentage,
                      },
                      asr: {
                        count: stats.today.prayerBreakdown.asr.count,
                        percentage: stats.today.prayerBreakdown.asr.percentage,
                      },
                      maghrib: {
                        count: stats.today.prayerBreakdown.maghrib.count,
                        percentage:
                          stats.today.prayerBreakdown.maghrib.percentage,
                      },
                      isha: {
                        count: stats.today.prayerBreakdown.isha.count,
                        percentage: stats.today.prayerBreakdown.isha.percentage,
                      },
                    },
                  },
                  weekly: {
                    total: stats.weekly.total,
                    percentage: stats.weekly.percentage,
                    trend:
                      stats.weekly.percentage >= 70
                        ? "up"
                        : stats.weekly.percentage >= 50
                        ? "stable"
                        : "down",
                  },
                  monthly: {
                    total: stats.monthly.total,
                    percentage: stats.monthly.percentage,
                    trend:
                      stats.monthly.percentage >= 70
                        ? "up"
                        : stats.monthly.percentage >= 50
                        ? "stable"
                        : "down",
                  },
                });

                console.log(
                  "✅ Fallback: Attendance data loaded with cached user data"
                );
              } else {
                setAttendanceError("Failed to load attendance statistics");
              }
            } catch (statsError) {
              console.error(
                "❌ Failed to fetch area stats with cached data:",
                statsError
              );
              setAttendanceError("Failed to load attendance statistics");
            }
          } else {
            console.warn("⚠️ No area_id found in cached user data either");
            setAttendanceError(
              "No area associated with this user. Please contact admin."
            );
          }
        }
      } catch (error) {
        console.error("❌ Error fetching area data:", error);
        setAttendanceError("Failed to load area information");
      } finally {
        setLoadingAreaData(false);
      }
    };

    if (user) {
      fetchAreaData();
    }
  }, [user]);

  // Fetch latest feeds from the API
  useEffect(() => {
    const fetchFeeds = async () => {
      setFeedsLoading(true);
      setFeedsError(null);
      try {
        // Fetch feeds with pagination - limit to 10 for dashboard
        const response = await feedsService.getFeeds({
          page: 1,
          limit: 10,
        });

        if (response && response.success && response.data) {
          setFeeds(response.data);
          console.log(
            "✅ Latest 10 feeds loaded successfully:",
            response.data.length
          );
        } else {
          console.error("❌ Invalid feeds data structure:", response);
          setFeedsError("Failed to load feeds data");
        }
      } catch (error) {
        console.error("❌ Error fetching feeds:", error);
        setFeedsError(error.message || "Failed to load feeds");
      } finally {
        setFeedsLoading(false);
      }
    };

    fetchFeeds();
  }, []);

  // Handler for deleting a feed
  const handleDeleteFeed = async (id) => {
    try {
      await feedsService.deleteFeed(id);
      // Update feeds state to remove the deleted feed
      setFeeds((prevFeeds) => prevFeeds.filter((feed) => feed.id !== id));
      console.log(`✅ Feed ${id} deleted successfully`);
    } catch (error) {
      console.error(`❌ Failed to delete feed ${id}:`, error);
    }
  };

  return (
    <FounderLayout>
      <div>
        {attendanceError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4">
            <p className="text-sm">⚠️ {attendanceError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Attendance Overview Card - Now full width */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Attendance Overview</h2>
              <Link
                to="/founder/view-attendance"
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                View Full Report
              </Link>
            </div>

            {loadingAreaData ? (
              <div className="flex items-center justify-center p-8">
                <svg
                  className="animate-spin h-8 w-8 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="ml-3 text-gray-500">Loading attendance data...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">Today</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {attendanceStats.today.total}
                    </h3>
                    <p className="text-sm font-medium text-green-600">
                      {attendanceStats.today.percentage}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">This Week</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {attendanceStats.weekly.total}
                    </h3>
                    <p className="text-sm font-medium text-green-600">
                      {attendanceStats.weekly.percentage}%
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-1">This Month</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {attendanceStats.monthly.total}
                    </h3>
                    <p className="text-sm font-medium text-green-600">
                      {attendanceStats.monthly.percentage}%
                    </p>
                  </div>
                </div>

                <h3 className="font-bold text-gray-700 mb-2">
                  Today's Prayer Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(attendanceStats.today.prayerBreakdown).map(
                    ([prayer, stats]) => (
                      <div key={prayer} className="flex items-center">
                        <div className="w-20 capitalize">{prayer}</div>
                        <div className="w-full mx-4">
                          <div className="bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-green-600 h-2.5 rounded-full"
                              style={{ width: `${stats.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 w-24 text-right">
                          {stats.count} ({stats.percentage}%)
                        </div>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Feeds Card - Updated with real data */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Feeds</h2>
              <Link
                to="/founder/reminder"
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Manage All
              </Link>
            </div>

            {feedsLoading ? (
              <div className="flex items-center justify-center p-6">
                <svg
                  className="animate-spin h-8 w-8 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : feedsError ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-md">
                <p>Error loading feeds: {feedsError}</p>
                <button
                  className="text-red-700 font-medium underline mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : feeds.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">No recent feeds</p>
                <Link
                  to="/founder/post-feeds"
                  className="mt-2 inline-block text-green-600 hover:text-green-800 font-medium"
                >
                  Create a feed
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feeds.map((feed) => {
                  // Helper function to extract YouTube thumbnail
                  const getYouTubeThumbnail = (url) => {
                    const regex =
                      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                    const match = url.match(regex);
                    if (match) {
                      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
                    }
                    return "";
                  };

                  return (
                    <div
                      key={feed.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex gap-4">
                        {/* Media Preview */}
                        {feed.video_url ? (
                          <a
                            href={feed.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 group"
                            title="Watch video"
                          >
                            <img
                              src={getYouTubeThumbnail(feed.video_url)}
                              alt="Video thumbnail"
                              className="w-32 h-20 object-cover rounded-lg border-[3px] border-red-500 group-hover:border-red-600 transition-all shadow-sm"
                            />
                          </a>
                        ) : feed.image_url ? (
                          <div className="flex-shrink-0">
                            <img
                              src={feed.image_url}
                              alt="Feed image"
                              className="w-32 h-20 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                            {feed.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {feed.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {new Date(feed.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                            {feed.video_url && (
                              <span className="flex items-center gap-1 text-red-600">
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                                Video
                              </span>
                            )}
                            {feed.image_url && !feed.video_url && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Image
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </FounderLayout>
  );
};

export default FounderDashboard;
