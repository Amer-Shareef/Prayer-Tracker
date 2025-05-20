import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';

const AssignFounder = () => {
  const [mosques, setMosques] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMosque, setSelectedMosque] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [searchMosque, setSearchMosque] = useState('');  const [searchUser, setSearchUser] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Mock data for mosques and users
  useEffect(() => {
    // In a real app, this would be API calls
    const mockMosques = [
      { id: 1, name: 'Masjid Dawatagaha', address: '78 Baseline Road, Colombo 09', hasFounder: false },
      { id: 2, name: 'Jami Ul-Alfar Mosque (Red Mosque)', address: '2nd Cross Street, Pettah, Colombo 11', hasFounder: true },
      { id: 3, name: 'Colombo Grand Mosque', address: '45 New Moor Street, Hulftsdorp, Colombo 12', hasFounder: false },
      { id: 4, name: 'Masjid Akbar', address: '10 Dawson Road, Slave Island, Colombo 02', hasFounder: false },
      { id: 5, name: 'Masjid Al-Noor', address: '25 Galle Road, Dehiwala, Colombo', hasFounder: true },
      { id: 6, name: 'Kolonnawa Jummah Mosque', address: '27 Kolonnawa Road, Kolonnawa', hasFounder: false },
      { id: 7, name: 'Wellampitiya Central Mosque', address: '48 Main Street, Wellampitiya', hasFounder: false }
    ];
    
    const mockUsers = [
      { id: 101, name: 'Mohamed Rizwan', email: 'rizwan@example.com', role: 'Member' },
      { id: 102, name: 'Ahmed Fazil', email: 'fazil@example.com', role: 'Member' },
      { id: 103, name: 'Mohammed Farook', email: 'farook@example.com', role: 'Member' },
      { id: 104, name: 'Hussain Ismail', email: 'hussain@example.com', role: 'Member' },
      { id: 105, name: 'Abdul Hameed', email: 'abdul@example.com', role: 'Member' },
      { id: 106, name: 'Mohamed Imthiaz', email: 'imthiaz@example.com', role: 'Member' },
      { id: 107, name: 'Ahamed Niyas', email: 'niyas@example.com', role: 'Member' },
      { id: 108, name: 'Mohideen Bawa', email: 'mohideen@example.com', role: 'Member' },
      { id: 109, name: 'Seyed Uwais', email: 'uwais@example.com', role: 'Member' },
      { id: 110, name: 'Riyaz Salley', email: 'riyaz@example.com', role: 'Member' }
    ];
    
    setTimeout(() => {
      setMosques(mockMosques);
      setUsers(mockUsers);
      setLoading(false);
    }, 800); // Simulate loading delay
  }, []);

  // Filter mosques based on search
  const filteredMosques = mosques.filter(mosque => 
    mosque.name.toLowerCase().includes(searchMosque.toLowerCase()) && 
    !mosque.hasFounder
  );
  
  // Filter users based on search
  const filteredUsers = users.filter(user => 
    (user.name.toLowerCase().includes(searchUser.toLowerCase()) || 
     user.email.toLowerCase().includes(searchUser.toLowerCase())) &&
    user.role === 'Member'
  );

  // Handle assignment submission
  const handleAssignFounder = (e) => {
    e.preventDefault();
    
    if (!selectedMosque || !selectedUser) {
      alert('Please select both a mosque and a user');
      return;
    }
    
    // In a real app, this would be an API call to assign the founder
    console.log(`Assigning user ${selectedUser} as founder of mosque ${selectedMosque}`);
    
    // Show success message
    setSuccess(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSelectedMosque('');
      setSelectedUser('');
      setSuccess(false);
    }, 3000);
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Assign Mosque Founder</h1>
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">Founder assigned successfully!</p>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 h-10 w-10 mb-4"></div>
            <p className="text-gray-500">Loading data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleAssignFounder}>
              <div className="grid grid-cols-1 gap-6">
                {/* Mosque Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Mosque (without founder)
                  </label>
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Search mosques..."
                      value={searchMosque}
                      onChange={(e) => setSearchMosque(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="border rounded-lg h-48 overflow-y-auto">
                    {filteredMosques.length === 0 ? (
                      <p className="text-gray-500 p-4 text-center">No mosques available without founders</p>
                    ) : (
                      <div className="divide-y">
                        {filteredMosques.map(mosque => (
                          <div 
                            key={mosque.id}
                            className={`p-3 cursor-pointer transition hover:bg-gray-50 ${selectedMosque === mosque.id ? 'bg-purple-50' : ''}`}
                            onClick={() => setSelectedMosque(mosque.id)}
                          >
                            <div className="font-medium">{mosque.name}</div>
                            <div className="text-sm text-gray-500">{mosque.address}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User to Promote to Founder
                  </label>
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="border rounded-lg h-48 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="text-gray-500 p-4 text-center">No eligible users found</p>
                    ) : (
                      <div className="divide-y">
                        {filteredUsers.map(user => (
                          <div 
                            key={user.id}
                            className={`p-3 cursor-pointer transition hover:bg-gray-50 ${selectedUser === user.id ? 'bg-purple-50' : ''}`}
                            onClick={() => setSelectedUser(user.id)}
                          >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!selectedMosque || !selectedUser}
                    className={`px-4 py-2 rounded-lg text-white font-medium ${
                      !selectedMosque || !selectedUser
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    Assign as Founder
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default AssignFounder;