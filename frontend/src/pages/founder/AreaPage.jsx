import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';
import { useAuth } from '../../context/AuthContext';

const AreaPage = () => {
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coordinates: ''
  });

  // Mock data for areas
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAreas([
        {
          id: 1,
          name: 'Colombo Central',
          description: 'Central Colombo area including Fort and Pettah',
          coordinates: '6.9271° N, 79.8612° E',
          founderCount: 5,
          memberCount: 450,
          status: 'active',
          createdAt: '2024-01-15'
        },
        {
          id: 2,
          name: 'Dehiwala-Mount Lavinia',
          description: 'Southern coastal area of Colombo',
          coordinates: '6.8344° N, 79.8643° E',
          founderCount: 8,
          memberCount: 280,
          status: 'active',
          createdAt: '2024-02-10'
        },
        {
          id: 3,
          name: 'Kelaniya',
          description: 'Northern suburban area',
          coordinates: '6.9553° N, 79.9217° E',
          founderCount: 12,
          memberCount: 320,
          status: 'active',
          createdAt: '2024-01-28'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingArea) {
      // Update existing area
      setAreas(areas.map(area => 
        area.id === editingArea.id 
          ? { ...area, ...formData }
          : area
      ));
      setShowEditModal(false);
      setEditingArea(null);
    } else {
      // Add new area
      const newArea = {
        id: areas.length + 1,
        ...formData,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setAreas([...areas, newArea]);
      setShowAddModal(false);
    }
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      coordinates: ''
    });
  };

  const handleEdit = (area) => {
    setFormData({
      name: area.name,
      description: area.description,
      coordinates: area.coordinates
    });
    setEditingArea(area);
    setShowEditModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this area?')) {
      setAreas(areas.filter(area => area.id !== id));
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 ${colors[status]} text-xs rounded-full`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Area Management</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{areas.length}</div>
            <div className="text-sm text-gray-500">Total Areas</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {areas.reduce((sum, area) => sum + area.founderCount, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Founders</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {areas.reduce((sum, area) => sum + area.memberCount, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Members</div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coordinates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Founders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {areas.map((area) => (
                    <tr key={area.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{area.name}</div>
                          <div className="text-sm text-gray-500">{area.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {area.coordinates}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {area.founderCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {area.memberCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(area.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(area)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(area.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
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
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Coordinates
                  </label>
                  <input
                    type="text"
                    value={formData.coordinates}
                    onChange={(e) => setFormData({...formData, coordinates: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 6.9271° N, 79.8612° E"
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
                        name: '',
                        description: '',
                        coordinates: ''
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
      </div>
    </FounderLayout>
  );
};

export default AreaPage;
