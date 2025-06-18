import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';

const ViewMosques = () => {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [selectedMosque, setSelectedMosque] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Mock data for mosques
  useEffect(() => {
    const mockMosques = [
      {
        id: 1,
        name: 'Masjid Dawatagaha',
        address: '78 Baseline Road, Colombo 09',
        founder: 'Ahmed Rizwan',
        founderEmail: 'ahmed.rizwan@email.com',
        members: 245,
        status: 'active',
        registeredDate: '2024-01-15',
        lastActivity: '2024-03-10',
        prayerTimes: {
          fajr: '05:30',
          dhuhr: '12:30',
          asr: '15:45',
          maghrib: '18:15',
          isha: '19:30'
        }
      },
      {
        id: 2,
        name: 'Jami Ul-Alfar Mosque (Red Mosque)',
        address: '2nd Cross Street, Pettah, Colombo 11',
        founder: 'Mohamed Farook',
        founderEmail: 'mohamed.farook@email.com',
        members: 356,
        status: 'active',
        registeredDate: '2024-01-08',
        lastActivity: '2024-03-09',
        prayerTimes: {
          fajr: '05:30',
          dhuhr: '12:30',
          asr: '15:45',
          maghrib: '18:15',
          isha: '19:30'
        }
      },
      {
        id: 3,
        name: 'Colombo Grand Mosque',
        address: '45 New Moor Street, Hulftsdorp, Colombo 12',
        founder: null,
        founderEmail: null,
        members: 0,
        status: 'inactive',
        registeredDate: '2024-02-20',
        lastActivity: null,
        prayerTimes: null
      },
      {
        id: 4,
        name: 'Masjid Akbar',
        address: '10 Dawson Road, Slave Island, Colombo 02',
        founder: 'Hussain Ismail',
        founderEmail: 'hussain.ismail@email.com',
        members: 178,
        status: 'active',
        registeredDate: '2024-01-22',
        lastActivity: '2024-03-08',
        prayerTimes: {
          fajr: '05:30',
          dhuhr: '12:30',
          asr: '15:45',
          maghrib: '18:15',
          isha: '19:30'
        }
      },
      {
        id: 5,
        name: 'Masjid Al-Noor',
        address: '25 Galle Road, Dehiwala, Colombo',
        founder: 'Abdul Hameed',
        founderEmail: 'abdul.hameed@email.com',
        members: 289,
        status: 'active',
        registeredDate: '2024-01-30',
        lastActivity: '2024-03-07',
        prayerTimes: {
          fajr: '05:30',
          dhuhr: '12:30',
          asr: '15:45',
          maghrib: '18:15',
          isha: '19:30'
        }
      }
    ];

    setTimeout(() => {
      setMosques(mockMosques);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter mosques based on search term and status
  const filteredMosques = mosques.filter(mosque => {
    const matchesSearch = mosque.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mosque.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mosque.founder && mosque.founder.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || mosque.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (mosque) => {
    setSelectedMosque(mosque);
    setShowModal(true);
  };

  const handleDeactivate = (mosqueId) => {
    setMosques(mosques.map(mosque => 
      mosque.id === mosqueId 
        ? { ...mosque, status: mosque.status === 'active' ? 'inactive' : 'active' }
        : mosque
    ));
  };

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
      : <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Inactive</span>;
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Mosque Management</h1>
        
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search mosques, addresses, or founders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Mosques</h3>
            <p className="text-3xl font-bold text-purple-600">{mosques.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Active Mosques</h3>
            <p className="text-3xl font-bold text-green-600">
              {mosques.filter(m => m.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Members</h3>
            <p className="text-3xl font-bold text-blue-600">
              {mosques.reduce((sum, m) => sum + m.members, 0)}
            </p>
          </div>
        </div>

        {/* Mosques Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 h-10 w-10 mb-4"></div>
              <p className="text-gray-500">Loading mosques...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mosque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Founder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMosques.map((mosque) => (
                    <tr key={mosque.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{mosque.name}</div>
                          <div className="text-sm text-gray-500">{mosque.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {mosque.founder ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{mosque.founder}</div>
                            <div className="text-sm text-gray-500">{mosque.founderEmail}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No founder assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mosque.members}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(mosque.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleViewDetails(mosque)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeactivate(mosque.id)}
                          className={`${
                            mosque.status === 'active' 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {mosque.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mosque Details Modal */}
        {showModal && selectedMosque && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Mosque Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Mosque Information</h4>
                    <p className="text-2xl font-bold text-gray-900">{selectedMosque.name}</p>
                    <p className="text-gray-600">{selectedMosque.address}</p>
                    <p className="text-sm text-gray-500">Registered: {selectedMosque.registeredDate}</p>
                  </div>
                  
                  {selectedMosque.founder && (
                    <div>
                      <h4 className="font-medium text-gray-700">Founder</h4>
                      <p className="text-gray-900">{selectedMosque.founder}</p>
                      <p className="text-gray-600">{selectedMosque.founderEmail}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Members</h4>
                      <p className="text-xl font-bold text-blue-600">{selectedMosque.members}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Status</h4>
                      {getStatusBadge(selectedMosque.status)}
                    </div>
                  </div>
                  
                  {selectedMosque.prayerTimes && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Prayer Times</h4>
                      <div className="grid grid-cols-5 gap-2 text-sm">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">Fajr</div>
                          <div>{selectedMosque.prayerTimes.fajr}</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">Dhuhr</div>
                          <div>{selectedMosque.prayerTimes.dhuhr}</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">Asr</div>
                          <div>{selectedMosque.prayerTimes.asr}</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">Maghrib</div>
                          <div>{selectedMosque.prayerTimes.maghrib}</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-medium">Isha</div>
                          <div>{selectedMosque.prayerTimes.isha}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedMosque.lastActivity && (
                    <div>
                      <h4 className="font-medium text-gray-700">Last Activity</h4>
                      <p className="text-gray-600">{selectedMosque.lastActivity}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default ViewMosques;