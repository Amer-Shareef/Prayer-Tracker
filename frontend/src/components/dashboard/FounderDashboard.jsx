import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FounderLayout from "../layouts/FounderLayout";
import feedsService from "../../services/feedsService"; // Import feeds service
import { areaService, userService } from "../../services/api"; // Import area and user services
import ViewAttendance from "../../pages/founder/ViewAttendance"; // Import ViewAttendance component

const FounderDashboard = () => {
  // Loading states
  const [loadingAreaData, setLoadingAreaData] = useState(true);

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

    // Note: Attendance data is now handled by ViewAttendance component
  }, []);

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

  return <ViewAttendance />;
};

export default FounderDashboard;
