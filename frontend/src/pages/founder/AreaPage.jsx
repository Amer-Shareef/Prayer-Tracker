import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';
import { useAuth } from '../../context/AuthContext';
import { areaService } from '../../services/areaService';

const AreaPage = () => {
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [subAreas, setSubAreas] = useState({});
  const [expandedAreas, setExpandedAreas] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [subAreaLoading, setSubAreaLoading] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubAreaModal, setShowSubAreaModal] = useState(false);
  const [showEditSubAreaModal, setShowEditSubAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [editingSubArea, setEditingSubArea] = useState(null);
  const [currentAreaId, setCurrentAreaId] = useState(null);
  const [formData, setFormData] = useState({
    area_name: '',
    address: '',
    description: ''
  });
  const [subAreaFormData, setSubAreaFormData] = useState({
    address: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Add date and area state
  const [currentDate, setCurrentDate] = useState({
    gregorian: 'Loading...',
    hijri: 'Loading...'
  });
  const [areaName, setAreaName] = useState('Loading...');

  // Fetch current date
  useEffect(() => {
    const today = new Date();
    
    const gregorianDate = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    let hijriDate;
    try {
      hijriDate = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(today);
    } catch (error) {
      hijriDate = "Hijri date not supported";
    }

    setCurrentDate({
      gregorian: gregorianDate,
      hijri: hijriDate
    });
  }, []);

  // Fetch user area name
  useEffect(() => {
    const fetchUserArea = async () => {
      if (user?.areaId || user?.area_id) {
        try {
          const response = await areaService.getAreaStats(user.areaId || user.area_id);
          if (response.data.success) {
            setAreaName(response.data.data.area.name || 'Area');
          }
        } catch (error) {
          console.error('Error fetching area:', error);
          setAreaName('Area');
        }
      }
    };
    
    if (user) {
      fetchUserArea();
    }
  }, [user]);

  // Fetch areas from API
  useEffect(() => {
    // Debug: Check authentication
    const token = localStorage.getItem('token');
    console.log('🔍 Debug - Token:', token ? 'Present' : 'Missing');
    console.log('🔍 Debug - User:', user);
    
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const response = await areaService.getAllAreas();
      setAreas(response.data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubAreas = async (areaId) => {
    setSubAreaLoading(prev => ({ ...prev, [areaId]: true }));
    try {
      const response = await areaService.getSubAreas(areaId);
      setSubAreas(prev => ({
        ...prev,
        [areaId]: response.data.subAreas || []
      }));
    } catch (error) {
      console.error('Error fetching sub-areas:', error);
    } finally {
      setSubAreaLoading(prev => ({ ...prev, [areaId]: false }));
    }
  };

  const toggleAreaExpansion = async (areaId) => {
    const newExpanded = new Set(expandedAreas);
    
    if (expandedAreas.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
      // Fetch sub-areas if not already loaded
      if (!subAreas[areaId]) {
        await fetchSubAreas(areaId);
      }
    }
    
    setExpandedAreas(newExpanded);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submissionData = {
        area_name: formData.area_name,
        address: formData.address,
        description: formData.description
      };
      
      if (editingArea) {
        // Update existing area
        await areaService.updateArea(editingArea.area_id || editingArea.id, submissionData);
        // Update state without full refresh
        setAreas(prevAreas => prevAreas.map(area => 
          (area.area_id || area.id) === (editingArea.area_id || editingArea.id)
            ? { ...area, ...submissionData }
            : area
        ));
        setShowEditModal(false);
        setEditingArea(null);
      } else {
        // Add new area
        const response = await areaService.createArea(submissionData);
        // Add to state without full refresh
        setAreas(prevAreas => [...prevAreas, response.data || submissionData]);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error saving area:', error);
      alert('Failed to save area. Please try again.');
    }
    
    // Reset form
    setFormData({
      area_name: '',
      address: '',
      description: ''
    });
  };

  const handleSubAreaSubmit = async (e) => {
    e.preventDefault();
    
    // Debug: Check authentication before making request
    const token = localStorage.getItem('token');
    console.log('🔍 Debug - Creating sub-area with token:', token ? 'Present' : 'Missing');
    console.log('🔍 Debug - Current area ID:', currentAreaId);
    console.log('🔍 Debug - Address:', subAreaFormData.address);
    
    try {
      if (editingSubArea) {
        // Update existing sub-area
        await areaService.updateSubArea(currentAreaId, editingSubArea.id, subAreaFormData.address);
        // Update state without full refresh
        setSubAreas(prev => ({
          ...prev,
          [currentAreaId]: prev[currentAreaId].map(sa =>
            sa.id === editingSubArea.id
              ? { ...sa, address: subAreaFormData.address }
              : sa
          )
        }));
        setShowEditSubAreaModal(false);
        setEditingSubArea(null);
      } else {
        // Create new sub-area
        const response = await areaService.createSubArea(currentAreaId, subAreaFormData.address);
        // Add to state without full refresh
        const newSubArea = response.data?.subArea || { id: Date.now(), address: subAreaFormData.address };
        setSubAreas(prev => ({
          ...prev,
          [currentAreaId]: [...(prev[currentAreaId] || []), newSubArea]
        }));
        setShowSubAreaModal(false);
      }
      
      // Reset form
      setSubAreaFormData({ address: '' });
      setCurrentAreaId(null);
    } catch (error) {
      console.error('Error saving sub-area:', error);
      alert('Failed to save sub-area. Please try again.');
    }
  };

  const handleEdit = (area) => {
    setFormData({
      area_name: area.area_name || area.name || '',
      address: area.address || '',
      description: area.description || ''
    });
    setEditingArea(area);
    setShowEditModal(true);
  };

  const handleDelete = async (area) => {
    if (window.confirm('Are you sure you want to delete this area?')) {
      try {
        await areaService.deleteArea(area.area_id || area.id);
        // Remove from state without full refresh
        setAreas(prevAreas => prevAreas.filter(a => 
          (a.area_id || a.id) !== (area.area_id || area.id)
        ));
        // Clean up related sub-areas from state
        setSubAreas(prev => {
          const updated = { ...prev };
          delete updated[area.area_id || area.id];
          return updated;
        });
        // Remove from expanded areas if it was expanded
        setExpandedAreas(prev => {
          const updated = new Set(prev);
          updated.delete(area.area_id || area.id);
          return updated;
        });
      } catch (error) {
        console.error('Error deleting area:', error);
        alert('Failed to delete area. Please try again.');
      }
    }
  };

  const handleDeleteSubArea = async (areaId, subAreaId) => {
    if (window.confirm('Are you sure you want to delete this sub-area?')) {
      try {
        await areaService.deleteSubArea(areaId, subAreaId);
        // Remove from state without full refresh
        setSubAreas(prev => ({
          ...prev,
          [areaId]: prev[areaId].filter(sa => sa.id !== subAreaId)
        }));
      } catch (error) {
        console.error('Error deleting sub-area:', error);
        alert('Failed to delete sub-area. Please try again.');
      }
    }
  };

  const handleEditSubArea = (areaId, subArea) => {
    setCurrentAreaId(areaId);
    setEditingSubArea(subArea);
    setSubAreaFormData({ address: subArea.address });
    setShowEditSubAreaModal(true);
  };

  const openAddSubAreaModal = (areaId) => {
    setCurrentAreaId(areaId);
    setSubAreaFormData({ address: '' });
    setEditingSubArea(null);
    setShowSubAreaModal(true);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAreas = areas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(areas.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Only show to Founder, Admin, and SuperAdmin users
  if (user?.role !== 'Founder' && user?.role !== 'Admin' && user?.role !== 'SuperAdmin') {
    return (
      <FounderLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
            <p className="text-gray-500 mt-2">This page is only accessible to Working Committee Admins and Super Administrators.</p>
          </div>
        </div>
      </FounderLayout>
    );
  }

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {user?.role === "Founder" ? "Working Committee Dashboard" : "Super Admin Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {areaName} • {currentDate.gregorian} • {currentDate.hijri}
          </p>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Area Management</h2>
            <p className="text-gray-600 mt-1">Manage geographical areas and their associated founders and members</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Area
          </button>
        </div>

        {/* Areas Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
            <div className="overflow-x-auto flex-grow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expand</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentAreas.map((area) => (
                    <React.Fragment key={area.area_id || area.id}>
                      {/* Main Area Row */}
                      <tr className="hover:bg-green-50 transition-colors duration-150 ease-in-out">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {area.area_name || area.name || 'N/A'}
                              </div>
                              {area.description && (
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{area.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <svg className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="text-sm text-gray-700">
                              {area.address || <span className="text-gray-400 italic">No address</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEdit(area)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(area)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleAreaExpansion(area.area_id || area.id)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-100 transition-all duration-200"
                            style={{
                              transform: expandedAreas.has(area.area_id || area.id) ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                            title={expandedAreas.has(area.area_id || area.id) ? 'Collapse sub-areas' : 'Expand sub-areas'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* Sub-areas Section */}
                      {expandedAreas.has(area.area_id || area.id) && (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 bg-gradient-to-r from-green-50 to-gray-50">
                            <div className="ml-8">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                  Sub-areas
                                  {subAreas[area.area_id || area.id]?.length > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      {subAreas[area.area_id || area.id].length}
                                    </span>
                                  )}
                                </h4>
                                <button
                                  onClick={() => openAddSubAreaModal(area.area_id || area.id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Add Sub Area
                                </button>
                              </div>
                              
                              {subAreaLoading[area.area_id || area.id] ? (
                                <div className="flex justify-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                              ) : (
                                <>
                                  {subAreas[area.area_id || area.id]?.length > 0 ? (
                                    <div className="grid gap-3">
                                      {subAreas[area.area_id || area.id].map((subArea) => (
                                        <div
                                          key={subArea.id}
                                          className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-150"
                                        >
                                          <div className="flex items-start flex-1">
                                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                              </svg>
                                            </div>
                                            <span className="text-sm text-gray-700 mt-1">{subArea.address}</span>
                                          </div>
                                          <div className="flex items-center space-x-2 ml-4">
                                            <button
                                              onClick={() => handleEditSubArea(area.area_id || area.id, subArea)}
                                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                            >
                                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                              </svg>
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteSubArea(area.area_id || area.id, subArea.id)}
                                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                            >
                                              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                      </svg>
                                      <p className="mt-2 text-sm text-gray-500">No sub-areas found</p>
                                      <p className="text-xs text-gray-400 mt-1">Click "Add Sub Area" to create one</p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - Always visible at bottom */}
            <div className="mt-auto border-t border-gray-200">
              {areas.length > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={handlePrevious}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(indexOfLastItem, areas.length)}
                        </span>{' '}
                        of <span className="font-medium">{areas.length}</span> areas
                        {totalPages > 1 && (
                          <span className="text-gray-500"> • Page {currentPage} of {totalPages}</span>
                        )}
                      </p>
                    </div>
                    {totalPages > 1 && (
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
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
                              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => handlePageChange(pageNumber)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNumber
                                      ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                              currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
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
        )}

        {/* Add/Edit Area Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">
                {editingArea ? 'Edit Area' : 'Add New Area'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Area Name
                  </label>
                  <input
                    type="text"
                    value={formData.area_name}
                    onChange={(e) => setFormData({...formData, area_name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Enter the full address of the area"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="2"
                    placeholder="Brief description of the area"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setEditingArea(null);
                      setFormData({
                        area_name: '',
                        address: '',
                        description: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingArea ? 'Update' : 'Create'} Area
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Sub-Area Modal */}
        {showSubAreaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Add New Sub-Area</h3>
              
              <form onSubmit={handleSubAreaSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Sub-Area Address
                  </label>
                  <textarea
                    value={subAreaFormData.address}
                    onChange={(e) => setSubAreaFormData({address: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter the address of the sub-area"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubAreaModal(false);
                      setCurrentAreaId(null);
                      setSubAreaFormData({ address: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Sub-Area
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Sub-Area Modal */}
        {showEditSubAreaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Edit Sub-Area</h3>
              
              <form onSubmit={handleSubAreaSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Sub-Area Address
                  </label>
                  <textarea
                    value={subAreaFormData.address}
                    onChange={(e) => setSubAreaFormData({address: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Enter the address of the sub-area"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSubAreaModal(false);
                      setCurrentAreaId(null);
                      setEditingSubArea(null);
                      setSubAreaFormData({ address: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Update Sub-Area
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default AreaPage;
