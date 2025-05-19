import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';

const ViewMosques = () => {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive

  // Mock data for mosques
  useEffect(() => {
    // In a real app, this would be an API call
    const mockMosques = [
      {
        id: 1,
        name: 'Masjid Al-Noor',
        address: '123 Faith Street, Cityville, CA 90210',
        founder: 'Ahmed Khan',
        members: 156,
        status: 'active',
        established: '2023-04-15'
      },
      {
        id: 2,
        name: 'Islamic Center of Rivertown',
        address: '456 Prayer Avenue, Rivertown, NY 10001',
        founder: 'Muhammed Ali',
        members: 210,
        status: 'active',
        established: '2022-08-22'
      },
      {
        id: 3,
        name: 'Masjid Al-Falah',
        address: '789 Blessing Road, Hometown, TX 75001',
        founder: 'Ibrahim Hassan',
        members: 89,
        status: 'active',
        established: '2023-12-05'
      },
      {
        id: 4,
        name: 'Central Mosque',
        address: '321 Worship Lane, Metropolis, IL 60007',
        founder: 'Pending Assignment',
        members: 42,
        status: 'inactive',
        established: '2024-02-10'
      },
      {
        id: 5,
        name: 'Masjid Al-Taqwa',
        address: '555 Faith Circle, Lakeside, WA 98001',
        founder: 'Omar Farooq',
        members: 123,
        status: 'active',
        established: '2023-06-30'
      }
    ];
    
    setTimeout(() => {
      setMosques(mockMosques);
      setLoading(false);
    }, 800); // Simulate loading delay
  }, []);

  // Filter mosques based on search term and status filter
  const filteredMosques = mosques.filter(mosque => {
    const matchesSearch = mosque.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         mosque.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mosque.founder.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || mosque.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <SuperAdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Manage Mosques</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative md:w-64">
              <input
                type="text"
                placeholder="Search mosques..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Status:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'all' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'active' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter('inactive')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'inactive' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
            
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium md:ml-auto">
              Add New Mosque
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 h-10 w-10 mb-4"></div>
            <p className="text-gray-500">Loading mosque data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mosque</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Founder</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMosques.map((mosque) => (
                    <tr key={mosque.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{mosque.name}</div>
                        <div className="text-sm text-gray-500">{mosque.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${mosque.founder === 'Pending Assignment' ? 'text-yellow-600 font-medium' : 'text-gray-900'}`}>
                          {mosque.founder}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mosque.members}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          mosque.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {mosque.status.charAt(0).toUpperCase() + mosque.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-purple-600 hover:text-purple-900 mr-3">
                          View
                        </button>
                        <button className="text-purple-600 hover:text-purple-900 mr-3">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredMosques.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No mosques found matching your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default ViewMosques;