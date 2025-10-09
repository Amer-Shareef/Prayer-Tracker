import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FounderLayout from "../../components/layouts/FounderLayout";
import { memberAPI, areaService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import generateMemberReport from "./GeneratePdf";
import AddMemberModal from "../../components/shared/AddMemberModal";

function ManageMembers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMemberId, setFilterMemberId] = useState("");
  const [filterFullName, setFilterFullName] = useState("");
  const [filterMinAge, setFilterMinAge] = useState("");
  const [filterMaxAge, setFilterMaxAge] = useState("");
  const [filterUsername, setFilterUsername] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterMobility, setFilterMobility] = useState("all");
  const [filterArea, setFilterArea] = useState("all");
  const [filterAdditionalInfo, setFilterAdditionalInfo] = useState("all");
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [operatingMembers, setOperatingMembers] = useState(new Set()); // Track members being operated on
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

  // Sorting state
  const [sortColumn, setSortColumn] = useState("fullName");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Add date and area state
  const [currentDate, setCurrentDate] = useState({
    gregorian: "Loading...",
    hijri: "Loading...",
  });
  const [areaName, setAreaName] = useState("Loading...");

  // Ref for dropdown click outside handling
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      searchTerm ||
      filterRole !== "all" ||
      filterStatus !== "all" ||
      filterMemberId ||
      filterFullName ||
      filterMinAge ||
      filterMaxAge ||
      filterUsername ||
      filterEmail ||
      filterMobility !== "all" ||
      filterArea !== "all" ||
      filterAdditionalInfo !== "all"
    );
  };

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

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch members and areas from database - only on initial load
  useEffect(() => {
    fetchMembers();
    fetchAreas();
  }, []);

  // Note: Filtering is done client-side using filteredMembers
  // No need to refetch from server when filters change

  // Fetch members from API with conditional pagination
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔄 Fetching all members...");
      let response;
      if (user?.role === "SuperAdmin") {
        // SuperAdmin gets all members across all areas
        response = await memberAPI.getAllMembers();
      } else {
        // Founder/WCM get their area members
        response = await memberAPI.getMembers();
      }

      if (response.success) {
        setMembers(response.data);
        setCurrentPage(1); // Reset to first page
        console.log("✅ Members fetched successfully:", response.data.length);
      } else {
        setError(response.message || "Failed to fetch members");
        console.error("❌ Failed to fetch members:", response.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Error connecting to server";
      setError(errorMessage);
      console.error("❌ Error fetching members:", err);

      // If it's a network error, show a more helpful message
      if (!err.response) {
        setError("Network error. Please check your internet connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await areaService.getAreas();
      if (response.data && response.data.success) {
        setAreas(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching areas:", err);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      // Add to operating members
      setOperatingMembers((prev) => new Set([...prev, memberId]));

      try {
        // Optimistic UI update - remove member immediately
        const memberToDelete = members.find((m) => m.id === memberId);
        const previousMembers = [...members];
        setMembers(members.filter((m) => m.id !== memberId));
        setError(""); // Clear any existing errors

        // Make API call
        const response = await memberAPI.deleteMember(memberId);

        if (!response.success) {
          // Revert on failure
          setMembers(previousMembers);
          setError(response.message || "Failed to delete member");
        } else {
          setSuccessMessage("Member deleted successfully");
        }
      } catch (err) {
        // Revert on error
        setError("Error deleting member. Please try again.");
        console.error("Error deleting member:", err);
        // Refetch to ensure data consistency
        await fetchMembers();
      } finally {
        // Remove from operating members
        setOperatingMembers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(memberId);
          return newSet;
        });
      }
    }
  };

  const handleUpdateStatus = async (memberId, newStatus) => {
    // Add to operating members
    setOperatingMembers((prev) => new Set([...prev, memberId]));

    try {
      // Optimistic UI update - update status immediately
      const previousMembers = [...members];
      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, status: newStatus } : m
        )
      );
      setError(""); // Clear any existing errors

      // Make API call
      const member = previousMembers.find((m) => m.id === memberId);
      const response = await memberAPI.updateMember(memberId, {
        username: member.username,
        email: member.email,
        phone: member.phone,
        role: member.role,
        status: newStatus,
      });

      if (!response.success) {
        // Revert on failure
        setMembers(previousMembers);
        setError(response.message || "Failed to update member status");
      } else {
        setSuccessMessage(
          `Member ${
            newStatus === "active" ? "activated" : "deactivated"
          } successfully`
        );
      }
    } catch (err) {
      // Revert on error
      setError("Error updating member status. Please try again.");
      console.error("Error updating member status:", err);
      // Refetch to ensure data consistency
      await fetchMembers();
    } finally {
      // Remove from operating members
      setOperatingMembers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const handleEditMember = (member) => {
    setMemberToEdit(member);
    setIsEditMode(true);
    setIsAddModalOpen(true);
  };

  // Toggle row expansion
  const toggleRowExpansion = (memberId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(memberId)) {
      newExpandedRows.delete(memberId);
    } else {
      newExpandedRows.add(memberId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "-";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Helper function to format checked attributes as badges
  const formatCheckedAttributesBadges = (member) => {
    const attributes = [];

    // Add family status with widow assistance if applicable
    if (member.familyStatus) {
      if (member.familyStatus === "Widow" && member.widowAssistance) {
        attributes.push({
          label: "Family Status: Widowed (Receiving Assistance)",
          key: "widow-assistance",
        });
      } else if (member.familyStatus === "Widow") {
        attributes.push({ label: "Family Status: Widowed", key: "widow" });
      } else {
        attributes.push({
          label: `Family Status: ${member.familyStatus}`,
          key: "family-status",
        });
      }
    }

    if (member.onRent) attributes.push({ label: "Rent", key: "rent" });
    if (member.zakathEligible)
      attributes.push({ label: "Zakath", key: "zakath" });
    if (member.differentlyAbled)
      attributes.push({ label: "Disabled", key: "disabled" });
    if (member.MuallafathilQuloob)
      attributes.push({ label: "Convert", key: "convert" });

    if (attributes.length === 0)
      return <span className="text-gray-500">-</span>;

    return (
      <div className="flex flex-col gap-1">
        {attributes.map((attr) => (
          <span
            key={attr.key}
            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
          >
            {attr.label}
          </span>
        ))}
      </div>
    );
  };

  // Pagination functions
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Sorting function
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort icon component
  const SortIcon = ({ column }) => {
    if (sortColumn !== column) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
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
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
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
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  // Filter members based on search and filters
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      (member.username || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (member.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || member.role === filterRole;
    const matchesStatus =
      filterStatus === "all" || member.status === filterStatus;
    const matchesMemberId =
      !filterMemberId ||
      (member.memberId || "")
        .toLowerCase()
        .includes(filterMemberId.toLowerCase());
    const matchesFullName =
      !filterFullName ||
      (member.fullName || "")
        .toLowerCase()
        .includes(filterFullName.toLowerCase());
    const matchesUsername =
      !filterUsername ||
      (member.username || "")
        .toLowerCase()
        .includes(filterUsername.toLowerCase());
    const matchesEmail =
      !filterEmail ||
      (member.email || "").toLowerCase().includes(filterEmail.toLowerCase());
    const matchesMobility =
      filterMobility === "all" || member.mobility === filterMobility;
    const matchesArea = filterArea === "all" || member.area === filterArea;

    // Additional Info filtering
    const matchesAdditionalInfo =
      filterAdditionalInfo === "all" ||
      (filterAdditionalInfo === "zakath" && member.zakathEligible) ||
      (filterAdditionalInfo === "rent" && member.onRent) ||
      (filterAdditionalInfo === "disabled" && member.differentlyAbled) ||
      (filterAdditionalInfo === "convert" && member.MuallafathilQuloob);

    // Age filtering
    const memberAge = calculateAge(member.dateOfBirth);
    const matchesMinAge = !filterMinAge || memberAge >= parseInt(filterMinAge);
    const matchesMaxAge = !filterMaxAge || memberAge <= parseInt(filterMaxAge);

    return (
      matchesSearch &&
      matchesRole &&
      matchesStatus &&
      matchesMemberId &&
      matchesFullName &&
      matchesUsername &&
      matchesEmail &&
      matchesMobility &&
      matchesArea &&
      matchesAdditionalInfo &&
      matchesMinAge &&
      matchesMaxAge
    );
  });

  // Sort filtered members
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let aValue, bValue;

    switch (sortColumn) {
      case "memberId":
        aValue = a.memberId || "";
        bValue = b.memberId || "";
        break;
      case "fullName":
        aValue = a.fullName || "";
        bValue = b.fullName || "";
        break;
      case "attendance":
        aValue = a.attendance_rate || 0;
        bValue = b.attendance_rate || 0;
        break;
      case "role":
        aValue = a.role || "";
        bValue = b.role || "";
        break;
      case "status":
        aValue = a.status || "";
        bValue = b.status || "";
        break;
      case "joined":
        aValue = new Date(a.joined_date || 0).getTime();
        bValue = new Date(b.joined_date || 0).getTime();
        break;
      default:
        aValue = "";
        bValue = "";
    }

    // Handle numeric sorting
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    // Handle string sorting
    const comparison = aValue.toString().localeCompare(bValue.toString());
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Client-side pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = sortedMembers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg">Loading members...</div>
        </div>
      </FounderLayout>
    );
  }

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 mt-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manage Members</h2>
            {/* {sortedMembers.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, sortedMembers.length)} of{" "}
                {sortedMembers.length} members
              </p>
            )} */}
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center shadow-md hover:shadow-lg transition-all duration-200"
          >
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Member
          </button>
        </div>
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg relative animate-fade-in">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex-1">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage("")}
                className="ml-4 text-green-700 hover:text-green-900 transition-colors"
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
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg relative">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-4 text-red-700 hover:text-red-900 transition-colors"
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
        {/* Enhanced Search and Filters Section */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-md">
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
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
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
          </div>

          {/* Simplified Filters */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Role Filter */}
              <div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                >
                  <option value="all">All Roles</option>
                  <option value="Member">Member</option>
                  <option value="WCM">WC</option>
                  <option value="Founder">WC Admin</option>
                  <option value="SuperAdmin">Super Admin</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Area Filter */}
              <div>
                <select
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                >
                  <option value="all">All Areas</option>
                  {areas.map((area) => (
                    <option key={area.area_id} value={area.area_name}>
                      {area.area_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobility Filter */}
              <div>
                <select
                  value={filterMobility}
                  onChange={(e) => setFilterMobility(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                >
                  <option value="all">All Mobility</option>
                  <option value="Walking">Walking</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Motorbike">Motorbike</option>
                  <option value="Car">Car</option>
                  <option value="Public Transport">Public Transport</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Additional Info Filter */}
              <div>
                <select
                  value={filterAdditionalInfo}
                  onChange={(e) => setFilterAdditionalInfo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
                >
                  <option value="all">Additional Info</option>
                  <option value="zakath">Zakath Eligible</option>
                  <option value="rent">On Rent</option>
                  <option value="disabled">Differently Abled</option>
                  <option value="convert">Convert</option>
                </select>
              </div>

              {/* Age Range - Combined */}
              <div className="flex space-x-1">
                <input
                  type="number"
                  placeholder="Min Age"
                  value={filterMinAge}
                  onChange={(e) => setFilterMinAge(e.target.value)}
                  className="w-1/2 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  min="0"
                  max="120"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filterMaxAge}
                  onChange={(e) => setFilterMaxAge(e.target.value)}
                  className="w-1/2 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                  min="0"
                  max="120"
                />
              </div>
            </div>

            {/* Clear Filters - Only show when filters are active */}
            {hasActiveFilters() && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterMemberId("");
                    setFilterFullName("");
                    setFilterMinAge("");
                    setFilterMaxAge("");
                    setFilterUsername("");
                    setFilterEmail("");
                    setFilterMobility("all");
                    setFilterArea("all");
                    setFilterAdditionalInfo("all");
                    setFilterRole("all");
                    setFilterStatus("all");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors duration-200"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>{" "}
        {/* Members Table */}
        <div
          className="bg-white rounded-lg shadow overflow-hidden flex flex-col"
          style={{ minHeight: "600px" }}
        >
          <div className="overflow-x-auto flex-grow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th
                    onClick={() => handleSort("memberId")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Member ID</span>
                      <SortIcon column="memberId" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("fullName")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Full Name</span>
                      <SortIcon column="fullName" />
                    </div>
                  </th>
                  {/* <th
                    onClick={() => handleSort("attendance")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Prayer Attendance</span>
                      <SortIcon column="attendance" />
                    </div>
                  </th> */}
                  <th
                    onClick={() => handleSort("role")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Role</span>
                      <SortIcon column="role" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <SortIcon column="status" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("joined")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Joined</span>
                      <SortIcon column="joined" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && !members.length ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-3 text-gray-600">Loading members...</p>
                    </td>
                  </tr>
                ) : (
                  currentMembers.map((member) => {
                    const isExpanded = expandedRows.has(member.id);
                    return (
                      <React.Fragment key={member.id}>
                        {/* Main Row - Clickable */}
                        <tr
                          className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                          onClick={(e) => {
                            // Don't expand if clicking on action buttons
                            if (!e.target.closest(".action-buttons")) {
                              toggleRowExpansion(member.id);
                            }
                          }}
                        >
                          {/* Member ID */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.memberId || "-"}
                          </td>

                          {/* Full Name */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.fullName || "-"}
                          </td>

                          {/* Prayer Attendance */}
                          {/* <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${member.attendance_rate || 0}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">
                                {member.attendance_rate || 0}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.prayed_count || 0}/
                              {member.total_prayers || 0}
                            </div>
                          </td> */}

                          {/* Role */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                member.role === "Member"
                                  ? "bg-blue-100 text-blue-800"
                                  : member.role === "WCM"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : member.role === "Founder"
                                  ? "bg-green-100 text-green-800"
                                  : member.role === "SuperAdmin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {member.role === "Member"
                                ? "Member"
                                : member.role === "WCM"
                                ? "Working Committee Member"
                                : member.role === "Founder"
                                ? "Working Committee Admin"
                                : member.role === "SuperAdmin"
                                ? "Super Admin"
                                : member.role || "-"}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                member.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : member.status === "inactive"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {member.status
                                ? member.status.charAt(0).toUpperCase() +
                                  member.status.slice(1)
                                : "-"}
                            </span>
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.joined_date
                              ? new Date(member.joined_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : "-"}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="relative inline-block text-left action-buttons">
                              {/* Three-dot menu button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(
                                    openDropdown === member.id
                                      ? null
                                      : member.id
                                  );
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-full hover:bg-gray-100 transition-colors duration-150"
                                title="Actions"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>

                              {/* Dropdown menu */}
                              {openDropdown === member.id && (
                                <div
                                  ref={dropdownRef}
                                  className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-1">
                                    {/* Download PDF Report */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        generateMemberReport(member);
                                        setOpenDropdown(null);
                                      }}
                                      disabled={operatingMembers.has(member.id)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                      <svg
                                        className="w-5 h-5 mr-3 text-green-600"
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
                                      Download PDF Report
                                    </button>

                                    {/* Activate/Deactivate */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateStatus(
                                          member.id,
                                          member.status === "active"
                                            ? "inactive"
                                            : "active"
                                        );
                                        setOpenDropdown(null);
                                      }}
                                      disabled={operatingMembers.has(member.id)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                      {operatingMembers.has(member.id) ? (
                                        <>
                                          <svg
                                            className="w-5 h-5 mr-3 animate-spin text-gray-400"
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
                                      ) : member.status === "active" ? (
                                        <>
                                          <svg
                                            className="w-5 h-5 mr-3 text-red-600"
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
                                          Deactivate Member
                                        </>
                                      ) : (
                                        <>
                                          <svg
                                            className="w-5 h-5 mr-3 text-green-600"
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
                                          Activate Member
                                        </>
                                      )}
                                    </button>

                                    {/* Edit Member */}
                                    {/* <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditMember(member);
                                        setOpenDropdown(null);
                                      }}
                                      disabled={operatingMembers.has(member.id)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                      <svg
                                        className="w-5 h-5 mr-3 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                      Edit Member
                                    </button> */}

                                    {/* Divider */}
                                    <div className="border-t border-gray-100"></div>

                                    {/* Delete */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMember(member.id);
                                        setOpenDropdown(null);
                                      }}
                                      disabled={operatingMembers.has(member.id)}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                      {operatingMembers.has(member.id) ? (
                                        <>
                                          <svg
                                            className="w-5 h-5 mr-3 animate-spin"
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
                                          <svg
                                            className="w-5 h-5 mr-3"
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
                                          Delete Member
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan="7" className="px-6 py-6">
                              {/* Main Info Grid - 4 rows x 3 columns */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-6">
                                {/* Row 1 */}
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Age
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {calculateAge(member.dateOfBirth)}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Contact No
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.phone || "-"}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Email
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.email || "-"}
                                  </span>
                                </div>

                                {/* Row 2 */}
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Address
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.address || "-"}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Workplace Address
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.workplaceAddress || "-"}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Mobility
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.mobility || "-"}
                                  </span>
                                </div>

                                {/* Row 3 */}
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Place of Birth
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.placeOfBirth || "-"}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Occupation
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.occupation || "-"}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Area
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.area || "-"}
                                  </span>
                                </div>

                                {/* Row 4 */}
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Sub-area
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.subarea || "-"}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    NIC Number
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.nicNo || "-"}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                    Username
                                  </span>
                                  <span className="text-gray-900 font-medium mt-1">
                                    {member.username || "-"}
                                  </span>
                                </div>
                              </div>

                              {/* Additional Info Section */}
                              <div className="border-t border-gray-200 pt-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-600 text-xs uppercase tracking-wide mb-3">
                                    Additional Information
                                  </span>
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    {formatCheckedAttributesBadges(member)}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls - Always visible at bottom */}
            <div className="mt-auto border-t border-gray-200">
              {sortedMembers.length > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {indexOfFirstItem + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, sortedMembers.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {sortedMembers.length}
                        </span>{" "}
                        members
                        {totalPages > 1 && (
                          <span className="text-gray-500">
                            {" "}
                            • Page {currentPage} of {totalPages}
                          </span>
                        )}
                      </p>
                    </div>
                    {totalPages > 1 && (
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                              currentPage === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            Previous
                          </button>
                          {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            // Show first page, last page, current page, and pages around current
                            if (
                              pageNumber === 1 ||
                              pageNumber === totalPages ||
                              (pageNumber >= currentPage - 1 &&
                                pageNumber <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => handlePageChange(pageNumber)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNumber
                                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            } else if (
                              pageNumber === currentPage - 2 ||
                              pageNumber === currentPage + 2
                            ) {
                              return (
                                <span
                                  key={pageNumber}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                >
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                          <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                              currentPage === totalPages
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {sortedMembers.length === 0 && !loading && (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No members found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or get started by adding your
                first member.
              </p>
            </div>
          )}
        </div>
        {/* Add Member Modal */}
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsEditMode(false);
            setMemberToEdit(null);
          }}
          onMemberAdded={() => {
            setSuccessMessage(
              isEditMode
                ? "Member updated successfully!"
                : "Member added successfully!"
            );
            fetchMembers(); // Refresh the member list
            setIsEditMode(false);
            setMemberToEdit(null);
          }}
          isEdit={isEditMode}
          memberToEdit={memberToEdit}
        />
      </div>
    </FounderLayout>
  );
}

export default ManageMembers;
