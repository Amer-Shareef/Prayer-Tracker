import React, { useState, useEffect } from "react";
import FounderLayout from "../../components/layouts/FounderLayout";
import { pickupService, memberAPI, areaService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const TransportPage = () => {
  const { user } = useAuth();

  // Add this with your other state declarations
  const [driverSearchTerm, setDriverSearchTerm] = useState("");

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionType, setActionType] = useState(""); // 'approve' or 'reject'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Data states
  const [pickupRequests, setPickupRequests] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [areaMembers, setAreaMembers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [subAreas, setSubAreas] = useState([]);

  // Create request form states
  const [createFormData, setCreateFormData] = useState({
    user_id: "",
    area_id: "",
    sub_areas_id: "",
    pickup_location: "",
    emergency_contact: "",
    special_instructions: "",
    assigned_driver_id: "",
    auto_approve: false,
  });

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Date and area states
  const [currentDate, setCurrentDate] = useState({
    gregorian: "Loading...",
    hijri: "Loading...",
  });
  const [areaName, setAreaName] = useState("Loading...");

  // Add this computed value after your state declarations
  const filteredDrivers = availableDrivers.filter((driver) => {
    const driverName = driver.fullName || driver.full_name || driver.name || "";
    const mobility = driver.mobility || "";

    return (
      driverName.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
      mobility.toLowerCase().includes(driverSearchTerm.toLowerCase())
    );
  });

  // Fetch current date
  useEffect(() => {
    const today = new Date();

    const gregorianDate = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let hijriDate;
    try {
      hijriDate = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(today);
    } catch (error) {
      hijriDate = "Hijri date not supported";
    }

    setCurrentDate({
      gregorian: gregorianDate,
      hijri: hijriDate,
    });
  }, []);

  // Fetch user area name
  useEffect(() => {
    const fetchUserArea = async () => {
      if (user?.areaId || user?.area_id) {
        try {
          const response = await areaService.getAreaStats(
            user.areaId || user.area_id
          );
          if (response.data.success) {
            setAreaName(response.data.data.area.name || "Area");
          }
        } catch (error) {
          console.error("Error fetching area:", error);
          setAreaName("Area");
        }
      }
    };

    if (user) {
      fetchUserArea();
    }
  }, [user]);

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch pickup requests
      console.log("🔄 Fetching pickup requests...");
      const requestsResponse = await pickupService.getAllPickupRequests();
      console.log("📥 Pickup requests response:", requestsResponse);
      console.log("📦 Response data:", requestsResponse.data);

      if (requestsResponse.data.success) {
        console.log("✅ Setting pickup requests:", requestsResponse.data.data);
        setPickupRequests(requestsResponse.data.data);
      } else {
        console.warn("⚠️ Response not successful:", requestsResponse.data);
        setPickupRequests([]);
      }

      // Fetch areas for SuperAdmin
      if (user.role === "SuperAdmin" || user.role === "superadmin") {
        try {
          console.log("🔄 Fetching areas for SuperAdmin...");
          const areasResponse = await areaService.getAllAreas();
          console.log("📥 Areas response:", areasResponse);
          // Response structure: { success: true, data: [...] }
          if (areasResponse.success && areasResponse.data) {
            console.log("✅ Setting areas:", areasResponse.data);
            setAreas(areasResponse.data);
          } else {
            console.warn("⚠️ Areas response not successful:", areasResponse);
            setAreas([]);
          }
        } catch (err) {
          console.error("❌ Error fetching areas:", err);
          setAreas([]);
        }
        // Don't fetch members for SuperAdmin on initial load
      } else {
        // Fetch area members for Founder/WCM
        try {
          console.log("🔄 Fetching members for Founder/WCM...");
          const membersResponse = await memberAPI.getMembers();
          console.log("📥 Members response:", membersResponse);
          setAreaMembers(membersResponse.data || membersResponse.members || []);
        } catch (err) {
          console.error("❌ Error fetching members:", err);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching transport data:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        stack: error.stack,
      });
      setError("Failed to load transport data. Please try again.");
      setLoading(false);
    }
  };

  // Fetch available drivers for a specific area
  const fetchAvailableDriversForArea = async (areaId) => {
    try {
      const response = await memberAPI.getAllMembers();
      if (response.success) {
        const drivers = response.data.filter(
          (member) =>
            member.area_id === areaId &&
            member.mobility &&
            member.mobility.toLowerCase() !== "walking" &&
            member.mobility.toLowerCase() !== "other" &&
            member.status === "active"
        );
        setAvailableDrivers(drivers);

        if (drivers.length === 0) {
          setError(
            "No available drivers found in this area with suitable mobility"
          );
        }
      }
    } catch (error) {
      console.error("Error fetching available drivers:", error);
      setError("Failed to load available drivers for this area");
    }
  };

  const handleRequestAction = async (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setRejectionReason("");
    setSelectedDriver("");
    setDriverSearchTerm(""); // Add this line

    // If approving, fetch drivers from the same area
    if (action === "approve" && request.area_id) {
      await fetchAvailableDriversForArea(request.area_id);
    }

    setShowModal(true);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleDeleteRequest = async (request) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete this pickup request from ${request.member_name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/pickup-requests/${request.id}/admin`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Pickup request deleted successfully");
        // Refresh the data
        await fetchData();
      } else {
        setError(data.message || "Failed to delete pickup request");
      }
    } catch (error) {
      console.error("Error deleting pickup request:", error);
      setError("Failed to delete pickup request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCreateModal = async () => {
    // For Founder/WCM, set their area automatically and fetch drivers
    if (
      user.role !== "SuperAdmin" &&
      user.role !== "superadmin" &&
      user.area_id
    ) {
      try {
        // Fetch drivers for Founder/WCM area
        await fetchAvailableDriversForArea(user.area_id);

        // Fetch sub-areas for this area
        try {
          const subAreasResponse = await areaService.getSubAreas(user.area_id);
          // Response structure: { success: true, data: { area: {...}, subAreas: [...] } }
          if (subAreasResponse.success && subAreasResponse.data?.subAreas) {
            setSubAreas(subAreasResponse.data.subAreas);
          } else {
            setSubAreas([]);
          }
        } catch (err) {
          console.error("Error fetching sub-areas:", err);
          setSubAreas([]);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    } else {
      // For SuperAdmin, clear members until area is selected
      setAreaMembers([]);
      setSubAreas([]);
      setAvailableDrivers([]);
    }

    // Reset form
    setCreateFormData({
      user_id: "",
      area_id:
        user.role === "SuperAdmin" || user.role === "superadmin"
          ? ""
          : user.area_id || "",
      sub_areas_id: "",
      emergency_contact: "",
      special_instructions: "",
      assigned_driver_id: "",
      auto_approve: false,
    });
    setShowCreateModal(true);
  };

  // Handle area selection for SuperAdmin
  const handleAreaChange = async (areaId) => {
    setCreateFormData((prev) => ({
      ...prev,
      area_id: areaId,
      sub_areas_id: "", // Reset sub-area
      user_id: "", // Reset member selection
      assigned_driver_id: "", // Reset driver
    }));

    if (areaId) {
      try {
        // Fetch members for the selected area
        const membersResponse = await memberAPI.getAllMembers();
        if (membersResponse.success && membersResponse.data) {
          // Filter members by selected area
          const areaFilteredMembers = membersResponse.data.filter(
            (member) => member.area_id === parseInt(areaId)
          );
          setAreaMembers(areaFilteredMembers);
        } else {
          setAreaMembers([]);
        }

        // Fetch sub-areas for selected area
        const subAreasResponse = await areaService.getSubAreas(areaId);
        // Response structure: { success: true, data: { area: {...}, subAreas: [...] } }
        if (subAreasResponse.success && subAreasResponse.data?.subAreas) {
          setSubAreas(subAreasResponse.data.subAreas);
        } else {
          setSubAreas([]);
        }

        // Fetch drivers for selected area
        await fetchAvailableDriversForArea(parseInt(areaId));
      } catch (error) {
        console.error("Error fetching area data:", error);
        setAreaMembers([]);
        setSubAreas([]);
      }
    } else {
      setAreaMembers([]);
      setSubAreas([]);
      setAvailableDrivers([]);
    }
  };

  const handleCreateFormChange = (field, value) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitCreateRequest = async () => {
    // Validation
    if (!createFormData.user_id) {
      setError("Please select a member");
      return;
    }
    if (!createFormData.area_id) {
      setError("Please select an area");
      return;
    }

    setActionLoading(true);
    try {
      // Get driver name if driver is selected
      let assigned_driver_name = null;
      if (createFormData.assigned_driver_id) {
        const selectedDriver = availableDrivers.find(
          (d) => d.id === parseInt(createFormData.assigned_driver_id)
        );
        assigned_driver_name =
          selectedDriver?.full_name || selectedDriver?.fullName;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/pickup-requests/admin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: parseInt(createFormData.user_id),
            area_id: parseInt(createFormData.area_id),
            sub_areas_id: createFormData.sub_areas_id
              ? parseInt(createFormData.sub_areas_id)
              : null,
            contact_number: createFormData.emergency_contact || null,
            special_instructions: createFormData.special_instructions,
            assigned_driver_id: createFormData.assigned_driver_id
              ? parseInt(createFormData.assigned_driver_id)
              : null,
            assigned_driver_name: assigned_driver_name,
            auto_approve:
              createFormData.auto_approve && createFormData.assigned_driver_id
                ? true
                : false,
            days: ["daily"],
            prayers: ["fajr"],
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          data.message || "Pickup request created successfully"
        );
        setShowCreateModal(false);
        await fetchData();
      } else {
        setError(data.message || "Failed to create pickup request");
      }
    } catch (error) {
      console.error("Error creating pickup request:", error);
      setError("Failed to create pickup request");
    } finally {
      setActionLoading(false);
    }
  };

  const submitAction = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);

      if (actionType === "approve") {
        if (!selectedDriver) {
          setError("Please select a driver");
          setActionLoading(false);
          return;
        }

        const driver = availableDrivers.find(
          (d) => d.id.toString() === selectedDriver
        );
        if (!driver) {
          setError("Selected driver not found");
          setActionLoading(false);
          return;
        }

        await pickupService.approvePickupRequest(
          selectedRequest.id,
          driver.id,
          driver.fullName || driver.full_name || driver.name || driver.username
        );

        setSuccessMessage(
          `Pickup request approved and assigned to ${
            driver.fullName ||
            driver.full_name ||
            driver.name ||
            driver.username
          }`
        );
      } else if (actionType === "reject") {
        if (!rejectionReason.trim()) {
          setError("Please provide a reason for rejection");
          setActionLoading(false);
          return;
        }

        await pickupService.rejectPickupRequest(
          selectedRequest.id,
          rejectionReason.trim()
        );

        setSuccessMessage("Pickup request rejected successfully");
      }

      // Refresh data
      await fetchData();

      // Reset modal
      setShowModal(false);
      setSelectedRequest(null);
      setActionType("");
      setRejectionReason("");
      setSelectedDriver("");
    } catch (error) {
      console.error("Error processing request:", error);
      setError(
        error.response?.data?.message ||
          "Failed to process request. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-700",
        dot: "bg-yellow-400",
        label: "Pending",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      approved: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        dot: "bg-green-400",
        label: "Approved",
        icon: (
          <svg
            className="w-4 h-4"
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
        ),
      },
      rejected: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        dot: "bg-red-400",
        label: "Rejected",
        icon: (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      completed: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        dot: "bg-blue-400",
        label: "Completed",
        icon: (
          <svg
            className="w-4 h-4"
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
        ),
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.text}`}
      >
        {config.icon}
        <span>{config.label}</span>
      </span>
    );
  };

  // Sort requests: pending first, then approved, then rejected/completed
  const sortedAndFilteredRequests = pickupRequests
    .filter((request) => {
      const matchesSearch =
        !searchTerm ||
        request.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.area_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.pickup_location
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.driver_name?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      // Priority order: pending > approved > rejected/completed
      const statusPriority = {
        pending: 1,
        approved: 2,
        rejected: 3,
        completed: 4,
      };

      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      if (priorityDiff !== 0) return priorityDiff;

      // Within same status, sort by date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // Calculate status statistics
  const statusStats = {
    total: pickupRequests.length,
    pending: pickupRequests.filter((r) => r.status === "pending").length,
    approved: pickupRequests.filter((r) => r.status === "approved").length,
    rejected: pickupRequests.filter((r) => r.status === "rejected").length,
    completed: pickupRequests.filter((r) => r.status === "completed").length,
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAndFilteredRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(sortedAndFilteredRequests.length / itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <FounderLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="ml-4 text-lg text-gray-600">
              Loading transport data...
            </div>
          </div>
        </div>
      </FounderLayout>
    );
  }

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 mt-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Transport Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage pickup requests and assign drivers
            </p>
          </div>
          {/* <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Pickup Request
          </button> */}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg shadow-sm animate-fade-in">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex-1 text-sm font-medium text-green-800">
                {successMessage}
              </span>
              <button
                onClick={() => setSuccessMessage("")}
                className="ml-4 text-green-600 hover:text-green-800 transition-colors"
                title="Dismiss"
              >
                <svg
                  className="w-5 h-5"
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
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex-1 text-sm font-medium text-red-800">
                {error}
              </span>
              <button
                onClick={() => setError("")}
                className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                title="Dismiss"
              >
                <svg
                  className="w-5 h-5"
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
          </div>
        )}

        {/* Search Bar with Compact Stats */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by member, area, location, or driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5"
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
              )}
            </div>

            {/* Compact Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-yellow-700 font-medium">
                  {statusStats.pending} Pending
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-green-700 font-medium">
                  {statusStats.approved} Approved
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-gray-700 font-medium">
                  {statusStats.total} Total
                </span>
              </div>
            </div>
          </div>

          {/* <p className="text-xs text-gray-500 mt-3">
            Showing {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, sortedAndFilteredRequests.length)} of{" "}
            {sortedAndFilteredRequests.length} requests • Sorted by priority
          </p> */}
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Pickup Requests
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Review pending requests and track assigned drivers
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Member Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Pickup Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Assigned Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
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
                      <p className="mt-2 text-sm text-gray-500">
                        No pickup requests found
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((request) => (
                    <tr
                      key={request.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        request.status === "pending" ? "bg-yellow-50/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg
                              className="h-6 w-6 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {request.member_name || "Unknown"}
                            </div>
                            {request.member_phone && (
                              <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                {request.member_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-start">
                            <svg
                              className="w-4 h-4 mr-1.5 mt-0.5 text-gray-400 flex-shrink-0"
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
                            <div>
                              {request.pickup_location ? (
                                <>
                                  <div className="font-medium">
                                    {request.pickup_location}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {request.area_name || "N/A"}
                                  </div>
                                </>
                              ) : (
                                <div className="font-medium">
                                  {request.area_name || "N/A"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4">
                        {request.driver_name ? (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                              <svg
                                className="h-4 w-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                              </svg>
                            </div>
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">
                                {request.driver_name}
                              </div>
                              {request.driver_phone && (
                                <div className="text-xs text-gray-500">
                                  {request.driver_phone}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400 text-sm">
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
                                d="M20 12H4"
                              />
                            </svg>
                            Not assigned
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1.5 text-gray-400"
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
                          {new Date(request.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {request.status === "pending" ? (
                            <>
                              <button
                                onClick={() =>
                                  handleRequestAction(request, "approve")
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                                title="Approve and assign driver"
                                disabled={actionLoading}
                              >
                                <svg
                                  className="w-4 h-4"
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
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleRequestAction(request, "reject")
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                                title="Reject request"
                                disabled={actionLoading}
                              >
                                <svg
                                  className="w-4 h-4"
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
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors"
                              title="View details"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRequest(request)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                            title="Delete request permanently"
                            disabled={actionLoading}
                          >
                            <svg
                              className="w-4 h-4"
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
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{" "}
                  <span className="font-medium">{totalPages}</span>
                </div>

                <nav className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      currentPage === 1
                        ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                        : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {getPageNumbers().map((pageNum, index) => {
                      if (pageNum === "...") {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-3 py-2 text-gray-500"
                          >
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                        : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    }`}
                  >
                    Next
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>

        {/* Keep the existing modals unchanged */}
        {/* Action Modal (Approve/Reject) */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={() => !actionLoading && setShowModal(false)}
              ></div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div
                    className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                      actionType === "approve" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {actionType === "approve" ? (
                      <svg
                        className="h-6 w-6 text-green-600"
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
                    ) : (
                      <svg
                        className="h-6 w-6 text-red-600"
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
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3
                      className="text-lg leading-6 font-semibold text-gray-900"
                      id="modal-title"
                    >
                      {actionType === "approve"
                        ? "Approve Pickup Request"
                        : "Reject Pickup Request"}
                    </h3>

                    <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">
                            Member:
                          </span>
                          <span className="text-gray-900">
                            {selectedRequest?.member_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">
                            Location:
                          </span>
                          <span className="text-gray-900">
                            {selectedRequest?.pickup_location ||
                              selectedRequest?.area_name}
                          </span>
                        </div>
                        {selectedRequest?.pickup_location && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">
                              Area:
                            </span>
                            <span className="text-gray-900">
                              {selectedRequest?.area_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {actionType === "approve" && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign Driver *
                        </label>
                        <select
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                          <option value="">Select a driver...</option>
                          {availableDrivers.length === 0 ? (
                            <option value="" disabled>
                              No drivers available in this area
                            </option>
                          ) : (
                            availableDrivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.fullName ||
                                  driver.full_name ||
                                  driver.name}{" "}
                                • {driver.mobility || "Vehicle"}
                              </option>
                            ))
                          )}
                        </select>
                        {availableDrivers.length === 0 && (
                          <p className="text-xs text-gray-500 mt-2 flex items-start">
                            <svg
                              className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            No members with suitable transport found in this
                            area
                          </p>
                        )}
                      </div>
                    )}

                    {actionType === "reject" && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Rejection *
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                          placeholder="Please explain why this request is being rejected..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This will be shared with the member
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center items-center gap-2 rounded-lg border border-transparent shadow-sm px-4 py-2.5 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm transition-colors ${
                      actionType === "approve"
                        ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                        : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    } ${actionLoading ? "opacity-75 cursor-not-allowed" : ""}`}
                    onClick={submitAction}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                        Processing...
                      </>
                    ) : (
                      <>
                        {actionType === "approve" ? (
                          <svg
                            className="w-5 h-5"
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
                        ) : (
                          <svg
                            className="w-5 h-5"
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
                        )}
                        {actionType === "approve"
                          ? "Approve & Assign"
                          : "Reject Request"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                    onClick={() => setShowModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {/* Action Modal (Approve/Reject) - IMPROVED VERSION */}
        {/* Action Modal (Approve/Reject) - OPTIMIZED FOR 100+ DRIVERS */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={() => !actionLoading && setShowModal(false)}
              ></div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div
                    className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                      actionType === "approve" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {actionType === "approve" ? (
                      <svg
                        className="h-6 w-6 text-green-600"
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
                    ) : (
                      <svg
                        className="h-6 w-6 text-red-600"
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
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3
                      className="text-lg leading-6 font-semibold text-gray-900"
                      id="modal-title"
                    >
                      {actionType === "approve"
                        ? "Approve Pickup Request"
                        : "Reject Pickup Request"}
                    </h3>

                    <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-gray-600 flex items-center gap-1.5">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Member:
                          </span>
                          <span className="text-gray-900 font-medium">
                            {selectedRequest?.member_name}
                          </span>
                        </div>
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-gray-600 flex items-center gap-1.5">
                            <svg
                              className="w-4 h-4 text-blue-600"
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
                            Location:
                          </span>
                          <span className="text-gray-900 font-medium text-right">
                            {selectedRequest?.pickup_location ||
                              selectedRequest?.area_name}
                          </span>
                        </div>
                        {selectedRequest?.pickup_location && (
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-gray-600 flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                              Area:
                            </span>
                            <span className="text-gray-900 font-medium">
                              {selectedRequest?.area_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {actionType === "approve" && (
                      <div className="mt-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Select Driver to Assign *
                        </label>

                        {availableDrivers.length === 0 ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <svg
                                className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-yellow-800">
                                  No drivers available
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                  No members with suitable transport found in
                                  this area.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Driver Search */}
                            <div className="relative mb-3">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  className="h-5 w-5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  />
                                </svg>
                              </div>
                              <input
                                type="text"
                                placeholder="Search drivers by name..."
                                value={driverSearchTerm}
                                onChange={(e) =>
                                  setDriverSearchTerm(e.target.value)
                                }
                                className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors"
                              />
                              {driverSearchTerm && (
                                <button
                                  onClick={() => setDriverSearchTerm("")}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                  <svg
                                    className="h-5 w-5"
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
                              )}
                            </div>

                            {/* Results count */}
                            <div className="text-xs text-gray-500 mb-2">
                              Showing {filteredDrivers.length} of{" "}
                              {availableDrivers.length} drivers
                            </div>

                            {/* Scrollable Driver List - Optimized */}
                            <div className="border-2 border-gray-200 rounded-lg max-h-96 overflow-y-auto custom-scrollbar">
                              {filteredDrivers.length === 0 ? (
                                <div className="p-8 text-center">
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
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                  </svg>
                                  <p className="mt-2 text-sm text-gray-500">
                                    No drivers found matching "
                                    {driverSearchTerm}"
                                  </p>
                                </div>
                              ) : (
                                filteredDrivers.map((driver) => {
                                  const driverId = driver.id.toString();
                                  const isSelected =
                                    selectedDriver === driverId;
                                  const driverName =
                                    driver.fullName ||
                                    driver.full_name ||
                                    driver.name;
                                  const mobility = driver.mobility || "Vehicle";

                                  // Get mobility icon
                                  const getMobilityIcon = () => {
                                    const mobilityLower =
                                      mobility.toLowerCase();
                                    if (mobilityLower.includes("car")) {
                                      return (
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1-1V4a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h4a1 1 0 001-1m-6 0h6"
                                          />
                                        </svg>
                                      );
                                    } else if (
                                      mobilityLower.includes("bike") ||
                                      mobilityLower.includes("motorcycle")
                                    ) {
                                      return (
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                          />
                                        </svg>
                                      );
                                    } else if (
                                      mobilityLower.includes("van") ||
                                      mobilityLower.includes("truck")
                                    ) {
                                      return (
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                          />
                                        </svg>
                                      );
                                    } else {
                                      return (
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                          />
                                        </svg>
                                      );
                                    }
                                  };

                                  return (
                                    <label
                                      key={driver.id}
                                      htmlFor={`driver-${driver.id}`}
                                      className={`flex items-center p-3 border-b border-gray-200 cursor-pointer transition-all hover:bg-gray-50 ${
                                        isSelected
                                          ? "bg-green-50 border-l-4 border-l-green-500"
                                          : ""
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        id={`driver-${driver.id}`}
                                        name="driver-selection"
                                        value={driverId}
                                        checked={isSelected}
                                        onChange={(e) =>
                                          setSelectedDriver(e.target.value)
                                        }
                                        className="sr-only"
                                      />

                                      {/* Radio Circle */}
                                      <div className="flex-shrink-0 mr-3">
                                        <div
                                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                            isSelected
                                              ? "border-green-500 bg-green-500"
                                              : "border-gray-300 bg-white"
                                          }`}
                                        >
                                          {isSelected && (
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Driver Avatar */}
                                      <div
                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                          isSelected
                                            ? "bg-green-200"
                                            : "bg-blue-100"
                                        }`}
                                      >
                                        <svg
                                          className={`w-6 h-6 ${
                                            isSelected
                                              ? "text-green-700"
                                              : "text-blue-600"
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                          />
                                        </svg>
                                      </div>

                                      {/* Driver Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <h4
                                            className={`text-sm font-semibold truncate ${
                                              isSelected
                                                ? "text-green-900"
                                                : "text-gray-900"
                                            }`}
                                          >
                                            {driverName}
                                          </h4>
                                        </div>

                                        {/* Mobility Type Badge - Inline */}
                                        <div className="flex items-center gap-2 mt-1">
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                              isSelected
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-600"
                                            }`}
                                          >
                                            {getMobilityIcon()}
                                            {mobility}
                                          </span>

                                          {/* Phone (if available) */}
                                          {driver.phone && (
                                            <span
                                              className={`text-xs ${
                                                isSelected
                                                  ? "text-green-600"
                                                  : "text-gray-500"
                                              }`}
                                            >
                                              • {driver.phone}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Checkmark for selected */}
                                      {isSelected && (
                                        <svg
                                          className="w-5 h-5 text-green-600 ml-2 flex-shrink-0"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </label>
                                  );
                                })
                              )}
                            </div>

                            <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                              <svg
                                className="w-4 h-4 flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Click on a driver to select them
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {actionType === "reject" && (
                      <div className="mt-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Reason for Rejection *
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none transition-colors"
                          placeholder="Please explain why this request is being rejected..."
                        />
                        <div className="flex items-start gap-2 mt-2">
                          <svg
                            className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-xs text-gray-500">
                            This reason will be shared with the member who
                            requested the pickup
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 sm:mt-5 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center items-center gap-2 rounded-lg border border-transparent shadow-sm px-5 py-2.5 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm transition-all ${
                      actionType === "approve"
                        ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                        : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    } ${
                      actionLoading ||
                      (actionType === "approve" && !selectedDriver)
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:scale-105"
                    }`}
                    onClick={submitAction}
                    disabled={
                      actionLoading ||
                      (actionType === "approve" && !selectedDriver)
                    }
                  >
                    {actionLoading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
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
                        Processing...
                      </>
                    ) : (
                      <>
                        {actionType === "approve" ? (
                          <svg
                            className="w-5 h-5"
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
                        ) : (
                          <svg
                            className="w-5 h-5"
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
                        )}
                        {actionType === "approve"
                          ? "Approve & Assign"
                          : "Reject Request"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-lg border-2 border-gray-300 shadow-sm px-5 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                    onClick={() => setShowModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="details-modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={() => setShowDetailsModal(false)}
              ></div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3
                      className="text-lg leading-6 font-semibold text-gray-900"
                      id="details-modal-title"
                    >
                      Pickup Request Details
                    </h3>

                    <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-gray-600 flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              Member:
                            </span>
                            <span className="text-gray-900 font-medium text-right">
                              {selectedRequest.member_name || "Unknown"}
                            </span>
                          </div>

                          <div className="flex items-start justify-between">
                            <span className="font-medium text-gray-600 flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              Phone:
                            </span>
                            <span className="text-gray-900 font-medium">
                              {selectedRequest.member_phone || "Not provided"}
                            </span>
                          </div>

                          <div className="flex items-start justify-between">
                            <span className="font-medium text-gray-600 flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4 text-blue-600"
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
                              Location:
                            </span>
                            <span className="text-gray-900 font-medium text-right">
                              {selectedRequest.pickup_location ||
                                "Not specified"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-gray-600 flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                              Area:
                            </span>
                            <span className="text-gray-900 font-medium">
                              {selectedRequest.area_name || "N/A"}
                            </span>
                          </div>

                          <div className="flex items-start justify-between">
                            <span className="font-medium text-gray-600 flex items-center gap-1.5">
                              <svg
                                className="w-4 h-4 text-blue-600"
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
                              Requested:
                            </span>
                            <span className="text-gray-900 font-medium">
                              {new Date(
                                selectedRequest.created_at
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-start justify-between">
                            <span className="font-medium text-gray-600">
                              Status:
                            </span>
                            <span className="font-medium">
                              {getStatusBadge(selectedRequest.status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="mt-4 pt-4 border-t border-blue-300">
                        <div className="space-y-2">
                          {selectedRequest.days && (
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-gray-600">
                                Days:
                              </span>
                              <span className="text-gray-900 font-medium text-right">
                                {Array.isArray(selectedRequest.days)
                                  ? selectedRequest.days.join(", ")
                                  : selectedRequest.days}
                              </span>
                            </div>
                          )}

                          {selectedRequest.prayers && (
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-gray-600">
                                Prayers:
                              </span>
                              <span className="text-gray-900 font-medium text-right">
                                {Array.isArray(selectedRequest.prayers)
                                  ? selectedRequest.prayers.join(", ")
                                  : selectedRequest.prayers}
                              </span>
                            </div>
                          )}

                          {selectedRequest.special_instructions && (
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-600 mb-1">
                                Special Instructions:
                              </span>
                              <span className="text-gray-900 bg-white bg-opacity-50 rounded px-2 py-1 text-sm">
                                {selectedRequest.special_instructions}
                              </span>
                            </div>
                          )}

                          {selectedRequest.contact_number && (
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-gray-600">
                                Contact:
                              </span>
                              <span className="text-gray-900 font-medium">
                                {selectedRequest.contact_number}
                              </span>
                            </div>
                          )}

                          {selectedRequest.status === "approved" &&
                            selectedRequest.driver_name && (
                              <div className="flex items-start justify-between">
                                <span className="font-medium text-gray-600 flex items-center gap-1.5">
                                  <svg
                                    className="w-4 h-4 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                    />
                                  </svg>
                                  Assigned Driver:
                                </span>
                                <div className="text-right">
                                  <div className="text-gray-900 font-medium">
                                    {selectedRequest.driver_name}
                                  </div>
                                  {selectedRequest.driver_phone && (
                                    <div className="text-xs text-gray-600">
                                      {selectedRequest.driver_phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                          {selectedRequest.status === "rejected" &&
                            selectedRequest.rejected_reason && (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-600 mb-1">
                                  Rejection Reason:
                                </span>
                                <span className="text-red-700 bg-red-50 rounded px-2 py-1 text-sm">
                                  {selectedRequest.rejected_reason}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Pickup Request Modal */}
        {showCreateModal && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => !actionLoading && setShowCreateModal(false)}
              ></div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:h-10 sm:w-10">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Create Pickup Request
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Assign a pickup request to a member and optionally
                        assign a driver
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {/* Area Selection (SuperAdmin only) */}
                    {(user.role === "SuperAdmin" ||
                      user.role === "superadmin") && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Area <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={createFormData.area_id}
                          onChange={(e) => handleAreaChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={actionLoading}
                        >
                          <option value="">Choose an area...</option>
                          {areas.map((area) => (
                            <option key={area.area_id} value={area.area_id}>
                              {area.area_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Sub-Area Selection (if area is selected) */}
                    {createFormData.area_id && subAreas.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sub-Area (Optional)
                        </label>
                        <select
                          value={createFormData.sub_areas_id}
                          onChange={(e) =>
                            handleCreateFormChange(
                              "sub_areas_id",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={actionLoading}
                        >
                          <option value="">Select a sub-area...</option>
                          {subAreas.map((subArea) => (
                            <option key={subArea.id} value={subArea.id}>
                              {subArea.address}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Member Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Member <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={createFormData.user_id}
                        onChange={(e) =>
                          handleCreateFormChange("user_id", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={
                          actionLoading ||
                          (user.role === "SuperAdmin" &&
                            !createFormData.area_id)
                        }
                      >
                        <option value="">
                          {(user.role === "SuperAdmin" ||
                            user.role === "superadmin") &&
                          !createFormData.area_id
                            ? "Please select an area first..."
                            : "Choose a member..."}
                        </option>
                        {areaMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.full_name || member.fullName} -{" "}
                            {member.phone}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Emergency Contact */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        value={createFormData.emergency_contact}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "emergency_contact",
                            e.target.value
                          )
                        }
                        placeholder="Optional emergency contact number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={actionLoading}
                      />
                    </div>

                    {/* Assign Driver */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign Driver (Optional)
                      </label>
                      <select
                        value={createFormData.assigned_driver_id}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "assigned_driver_id",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={actionLoading}
                      >
                        <option value="">No driver assigned</option>
                        {availableDrivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.full_name || driver.fullName} -{" "}
                            {driver.mobility}
                          </option>
                        ))}
                      </select>
                      {createFormData.assigned_driver_id && (
                        <p className="mt-2 text-xs text-gray-500">
                          💡 Check "Auto-approve" below to automatically approve
                          this request
                        </p>
                      )}
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions
                      </label>
                      <textarea
                        value={createFormData.special_instructions}
                        onChange={(e) =>
                          handleCreateFormChange(
                            "special_instructions",
                            e.target.value
                          )
                        }
                        placeholder="Any special notes or instructions..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={actionLoading}
                      />
                    </div>

                    {/* Auto-approve checkbox */}
                    {createFormData.assigned_driver_id && (
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={createFormData.auto_approve}
                            onChange={(e) =>
                              handleCreateFormChange(
                                "auto_approve",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            disabled={actionLoading}
                          />
                        </div>
                        <div className="ml-3">
                          <label className="text-sm font-medium text-gray-700">
                            Auto-approve this request
                          </label>
                          <p className="text-xs text-gray-500">
                            Request will be automatically approved with the
                            assigned driver
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmitCreateRequest}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        Creating...
                      </>
                    ) : (
                      "Create Request"
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setShowCreateModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
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

export default TransportPage;
