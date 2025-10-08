import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FounderLayout from "../../components/layouts/FounderLayout";
import { memberAPI, areaService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import generateMemberReport from "./GeneratePdf";

function ManageMembers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  // Debounce ref for search inputs
  const searchTimeoutRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback((searchFn, delay = 3000) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchFn();
    }, delay);
  }, []); // Empty dependencies - this function never changes

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
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

  // Fetch members and areas from database
  useEffect(() => {
    fetchMembers();
    fetchAreas();
  }, []);

  // Refetch data when filters change
  // Debounced effect for search filters
  useEffect(() => {
    if (members.length > 0) {
      // Only refetch if we have initial data
      // Use debounced search with 3 second delay
      debouncedSearch(() => {
        console.log("🔍 Debounced search triggered");
        fetchMembers();
      });
    }
  }, [
    searchTerm,
    filterRole,
    filterStatus,
    filterMemberId,
    filterFullName,
    filterMinAge,
    filterMaxAge,
    filterUsername,
    filterEmail,
    filterMobility,
    filterArea,
    filterAdditionalInfo,
    debouncedSearch,
  ]);

  // Fetch members from API with conditional pagination
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("� Fetching all members...");
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
      } else {
        setError(response.message || "Failed to fetch members");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error("Error fetching members:", err);
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
      try {
        const response = await memberAPI.deleteMember(memberId);
        if (response.success) {
          // Refresh members after deletion
          await fetchMembers();
        } else {
          setError(response.message || "Failed to delete member");
        }
      } catch (err) {
        setError("Error deleting member");
        console.error("Error deleting member:", err);
      }
    }
  };

  const handleUpdateStatus = async (memberId, newStatus) => {
    try {
      const member = members.find((m) => m.id === memberId);
      const response = await memberAPI.updateMember(memberId, {
        username: member.username,
        email: member.email,
        phone: member.phone,
        role: member.role,
        status: newStatus,
      });

      if (response.success) {
        // Refresh members after status update
        await fetchMembers();
      } else {
        setError(response.message || "Failed to update member status");
      }
    } catch (err) {
      setError("Error updating member status");
      console.error("Error updating member status:", err);
    }
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Manage Members</h2>
            {sortedMembers.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, sortedMembers.length)} of{" "}
                {sortedMembers.length} members
              </p>
            )}
          </div>
          <button
            onClick={() => navigate("/founder/add-member")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center shadow-md hover:shadow-lg transition-all duration-200"
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
            Add New Member
          </button>
        </div>
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
            <div className="flex">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}
        {/* Enhanced Search and Filters Section */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
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
                  <th
                    onClick={() => handleSort("attendance")}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Prayer Attendance</span>
                      <SortIcon column="attendance" />
                    </div>
                  </th>
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
                          <td className="px-4 py-4 whitespace-nowrap">
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
                          </td>

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
                            <div className="flex justify-end items-center space-x-2 action-buttons">
                              {/* Download PDF Report Button */}
                              <button
                                className="text-green-600 hover:text-green-900 transition-colors duration-150"
                                onClick={() => generateMemberReport(member)}
                                title="Download PDF Report"
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
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </button>

                              {/* Activate/Deactivate Button with Tick/Cross */}
                              <button
                                className={`transition-colors duration-150 ${
                                  member.status === "active"
                                    ? "text-red-600 hover:text-red-900"
                                    : "text-green-600 hover:text-green-900"
                                }`}
                                onClick={() =>
                                  handleUpdateStatus(
                                    member.id,
                                    member.status === "active"
                                      ? "inactive"
                                      : "active"
                                  )
                                }
                                title={
                                  member.status === "active"
                                    ? "Deactivate Member"
                                    : "Activate Member"
                                }
                              >
                                {member.status === "active" ? (
                                  // Cross/X icon for deactivate
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
                                ) : (
                                  // Tick/Check icon for activate
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
                                )}
                              </button>

                              {/* Delete Button */}
                              <button
                                className="text-red-600 hover:text-red-900 transition-colors duration-150"
                                onClick={() => handleDeleteMember(member.id)}
                                title="Delete Member"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>

                              {/* Expand/Collapse Button */}
                              <button
                                onClick={() => toggleRowExpansion(member.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-150"
                                title={
                                  isExpanded
                                    ? "Collapse details"
                                    : "Expand details"
                                }
                              >
                                <svg
                                  className={`w-4 h-4 transform transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : ""
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
                              </button>
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
      </div>
    </FounderLayout>
  );
}

export default ManageMembers;
