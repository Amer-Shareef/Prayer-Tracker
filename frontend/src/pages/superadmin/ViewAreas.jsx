import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';
import { areaService } from '../../services/api';

const ViewAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newArea, setNewArea] = useState({
    area_name: '',
    address: '',
    description: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const response = await areaService.getAreas();
      if (response.data.success) {
        setAreas(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    try {
      const response = await areaService.createArea(newArea);
      if (response.data.success) {
        setAreas([...areas, response.data.data]);
        setNewArea({ area_name: '', address: '', description: '' });
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating area:', error);
      alert('Failed to create area');
    }
  };

  const filteredAreas = areas.filter(area =>
    area.area_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAreas = filteredAreas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAreas.length / itemsPerPage);

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

  return (
    <SuperAdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Area Management</h1>
            {filteredAreas.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAreas.length)} of {filteredAreas.length} areas
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Create New Area
          </button>
        </div>
        
        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Areas Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
          {loading ? (
            <div className="flex items-center justify-center p-8 flex-grow">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto flex-grow">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentAreas.map((area) => (
                    <tr 
                      key={area.area_id} 
                      className="hover:bg-purple-50 transition-colors duration-150 ease-in-out"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{area.area_name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {area.member_count || 0} {area.member_count === 1 ? 'member' : 'members'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <svg className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div className="text-sm text-gray-700">{area.address || <span className="text-gray-400 italic">No address</span>}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 line-clamp-2" title={area.description}>
                          {area.description || <span className="text-gray-400 italic">No description</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          {area.member_count || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAreas.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No areas found</p>
                </div>
              )}
            </div>

            {/* Pagination Controls - Always visible at bottom */}
            <div className="mt-auto border-t border-gray-200">
              {filteredAreas.length > 0 && (
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
                          {Math.min(indexOfLastItem, filteredAreas.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredAreas.length}</span> areas
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
                                      ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
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
          </>
          )}
        </div>

        {/* Create Area Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Area</h3>
                
                <form onSubmit={handleCreateArea}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newArea.area_name}
                      onChange={(e) => setNewArea({...newArea, area_name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={newArea.address}
                      onChange={(e) => setNewArea({...newArea, address: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newArea.description}
                      onChange={(e) => setNewArea({...newArea, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="3"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Create Area
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default ViewAreas;
