import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';

const PromoteUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [success, setSuccess] = useState(false);

  // Mock data for users
  useEffect(() => {
    // In a real app, this would be an API call
    const mockUsers = [
      { 
        id: 1, 
        name: 'Ahmed Khan', 
        email: 'ahmed@example.com', 
        role: 'Member',
        mosque: 'Masjid Al-Noor',
        joined: '2023-05-12'
      },
      { 
        id: 2, 
        name: 'Fatima Rahman', 
        email: 'fatima@example.com', 
        role: 'Member',
        mosque: 'Masjid Al-Falah',
        joined: '2023-08-20'
      },
      { 
        id: 3, 
        name: 'Muhammed Ali', 
        email: 'muhammed@example.com', 
        role: 'Founder',
        mosque: 'Islamic Center of Rivertown',
        joined: '2022-11-05'
      },
      { 
        id: 4, 
        name: 'Ibrahim Hassan', 
        email: 'ibrahim@example.com', 
        role: 'Member',
        mosque: 'Masjid Al-Taqwa',
        joined: '2024-01-15'
      },
      { 
        id: 5, 
        name: 'Aisha Malik', 
        email: 'aisha@example.com', 
        role: 'Founder',
        mosque: 'Masjid Al-Falah',
        joined: '2023-03-28'
      }
    ];
    
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 800); // Simulate loading delay
  }, []);

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.mosque.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Handle promoting a user
  const handlePromoteUser = (e) => {
    e.preventDefault();
    
    if (!selectedUser || !newRole) {
      alert('Please select a user and a new role');
      return;
    }
    
    // In a real app, this would be an API call to change the role
    console.log(`Changing role of user ${selectedUser.id} from ${selectedUser.role} to ${newRole}`);
    
    // Show success message
    setSuccess(true);
    
    // Reset form after success
    setTimeout(() => {
      setIsPromoting(false);
      setSelectedUser(null);
      setNewRole('');
      setSuccess(false);
      
      // Update local user list to reflect the change
      setUsers(users.map(user => 
        user.id === selectedUser.id ? {...user, role: newRole} : user
      ));
    }, 2000);
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Manage Users</h1>
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">User role updated successfully!</p>
              </div>
            </div>
          </div>
        )}
        
        {isPromoting ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Change User Role</h2>
              <button
                onClick={() => setIsPromoting(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Selected User</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium">{selectedUser?.name}</div>
                  <div className="text-sm text-gray-500">
                    <span>{selectedUser?.email}</span>
                    <span className="mx-2">•</span>
                    <span>Current Role: <span className="font-medium">{selectedUser?.role}</span></span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select a role</option>
                  <option value="Member">Member</option>
                  <option value="Founder">Founder</option>
                  <option value="SuperAdmin">Super Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setIsPromoting(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 mr-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteUser}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                disabled={!newRole}
              >
                Update Role
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative md:w-64">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pl-10"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Role:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      roleFilter === 'all' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setRoleFilter('Member')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      roleFilter === 'Member' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Members
                  </button>
                  <button
                    onClick={() => setRoleFilter('Founder')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      roleFilter === 'Founder' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Founders
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 h-10 w-10 mb-4"></div>
            <p className="text-gray-500">Loading user data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mosque</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'SuperAdmin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'Founder'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.mosque}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsPromoting(true);
                            setNewRole('');
                          }}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          Change Role
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
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No users found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default PromoteUser;