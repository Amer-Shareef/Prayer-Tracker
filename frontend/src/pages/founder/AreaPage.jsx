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
        setShowEditModal(false);
        setEditingArea(null);
      } else {
        // Add new area
        await areaService.createArea(submissionData);
        setShowAddModal(false);
      }
      
      await fetchAreas(); // Refresh the list
    } catch (error) {
      console.error('Error saving area:', error);
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
        setShowEditSubAreaModal(false);
        setEditingSubArea(null);
      } else {
        // Create new sub-area
        await areaService.createSubArea(currentAreaId, subAreaFormData.address);
        setShowSubAreaModal(false);
      }
      
      // Refresh sub-areas for this area
      await fetchSubAreas(currentAreaId);
      
      // Reset form
      setSubAreaFormData({ address: '' });
      setCurrentAreaId(null);
    } catch (error) {
      console.error('Error saving sub-area:', error);
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
        await fetchAreas(); // Refresh the list
      } catch (error) {
        console.error('Error deleting area:', error);
      }
    }
  };

  const handleDeleteSubArea = async (areaId, subAreaId) => {
    if (window.confirm('Are you sure you want to delete this sub-area?')) {
      try {
        await areaService.deleteSubArea(areaId, subAreaId);
        await fetchSubAreas(areaId); // Refresh sub-areas
      } catch (error) {
        console.error('Error deleting sub-area:', error);
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

  // Only show to SuperAdmin users
  if (user?.role !== 'SuperAdmin') {
    return (
      <FounderLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
            <p className="text-gray-500 mt-2">This page is only accessible to Super Administrators.</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{areas.length}</div>
            <div className="text-sm text-gray-500">Total Areas</div>
          </div>
        </div>

        {/* Areas Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
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
                  {areas.map((area) => (
                    <React.Fragment key={area.area_id || area.id}>
                      {/* Main Area Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {area.area_name || area.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">{area.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {area.address || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(area)}
                            className="text-purple-600 hover:text-purple-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(area)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => toggleAreaExpansion(area.area_id || area.id)}
                            className="text-gray-400 hover:text-gray-600 transition-transform duration-200"
                            style={{
                              transform: expandedAreas.has(area.area_id || area.id) ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
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
                          <td colSpan="4" className="px-6 py-4 bg-gray-50">
                            <div className="ml-8">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Sub-areas</h4>
                              
                              {subAreaLoading[area.area_id || area.id] ? (
                                <div className="flex justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                </div>
                              ) : (
                                <>
                                  {subAreas[area.area_id || area.id]?.length > 0 ? (
                                    <div className="space-y-2 mb-3">
                                      {subAreas[area.area_id || area.id].map((subArea) => (
                                        <div
                                          key={subArea.id}
                                          className="flex justify-between items-center bg-white p-3 rounded border"
                                        >
                                          <span className="text-sm text-gray-700">{subArea.address}</span>
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => handleEditSubArea(area.area_id || area.id, subArea)}
                                              className="text-purple-600 hover:text-purple-900 text-xs"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              onClick={() => handleDeleteSubArea(area.area_id || area.id, subArea.id)}
                                              className="text-red-600 hover:text-red-900 text-xs"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-500 mb-3">No sub-areas found</p>
                                  )}
                                  
                                  <button
                                    onClick={() => openAddSubAreaModal(area.area_id || area.id)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                  >
                                    + Add Sub Area
                                  </button>
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
