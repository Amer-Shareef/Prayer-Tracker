import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';

const PromoteUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState('');

  // Mock data for users
  useEffect(() => {
    const mockUsers = [
      {
        id: 101,
        name: 'Mohamed Rizwan',
        email: 'rizwan@example.com',
        role: 'Member',
        mosque: 'Masjid Dawatagaha',
        joinDate: '2024-01-20',
        lastLogin: '2024-03-10',
        totalPrayers: 145,
        attendanceRate: 89
      },
      {
        id: 102,
        name: 'Ahmed Fazil',
        email: 'fazil@example.com',
        role: 'Member',
        mosque: 'Jami Ul-Alfar Mosque',
        joinDate: '2024-01-25',
        lastLogin: '2024-03-09',
        totalPrayers: 132,
        attendanceRate: 85
      },
      {
        id: 103,
        name: 'Mohammed Farook',
        email: 'farook@example.com',
        role: 'Founder',
        mosque: 'Jami Ul-Alfar Mosque',
        joinDate: '2024-01-08',
        lastLogin: '2024-03-10',
        totalPrayers: 189,
        attendanceRate: 95
      },
      {
        id: 104,
        name: 'Hussain Ismail',
        email: 'hussain@example.com',
        role: 'Founder',
        mosque: 'Masjid Akbar',
        joinDate: '2024-01-22',
        lastLogin: '2024-03-08',
        totalPrayers: 167,
        attendanceRate: 92
      },
      {
        id: 105,
        name: 'Abdul Hameed',
        email: 'abdul@example.com',
        role: 'Member',
        mosque: 'Masjid Al-Noor',
        joinDate: '2024-02-01',
        lastLogin: '2024-03-07',
        totalPrayers: 98,
        attendanceRate: 78
      },
      {
        id: 106,
        name: 'Mohamed Imthiaz',
        email: 'imthiaz@example.com',
        role: 'Member',
        mosque: 'Masjid Dawatagaha',
        joinDate: '2024-02-05',
        lastLogin: '2024-03-06',
        totalPrayers: 87,
        attendanceRate: 82
      },
      {
        id: 107,
        name: 'Ahamed Niyas',
        email: 'niyas@example.com',
        role: 'Member',
        mosque: 'Colombo Grand Mosque',
        joinDate: '2024-02-10',
        lastLogin: '2024-03-05',
        totalPrayers: 76,
        attendanceRate: 75
      },
      {
        id: 108,
        name: 'Mohideen Bawa',
        email: 'mohideen@example.com',
        role: 'Member',
        mosque: 'Masjid Akbar',
        joinDate: '2024-02-12',
        lastLogin: '2024-03-04',
        totalPrayers: 71,
        attendanceRate: 79
      }
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.mosque.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const handlePromoteUser = (user) => {
    setSelectedUser(user);
    // Don't auto-set role, let user choose
    setNewRole('');
    setShowModal(true);
  };

  const confirmPromotion = () => {
    if (selectedUser && newRole) {
      // Update user role
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, role: newRole }
          : user
      ));
      
      setSuccess(`${selectedUser.name} has been ${newRole === 'Founder' ? 'promoted to' : 'demoted to'} ${newRole} successfully!`);
      setShowModal(false);
      setSelectedUser(null);
      setNewRole('');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      'Member': 'bg-blue-100 text-blue-800',
      'WCM': 'bg-indigo-100 text-indigo-800',
      'Founder': 'bg-green-100 text-green-800',
      'SuperAdmin': 'bg-purple-100 text-purple-800'
    };
    
    const labels = {
      'Member': 'Member',
      'WCM': 'Working Committee Member',
      'Founder': 'Working Committee Admin',
      'SuperAdmin': 'Super Admin'
    };
    
    return (
      <span className={`px-2 py-1 ${colors[role]} text-xs rounded-full`}>
        {labels[role] || role}
      </span>
    );
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">User Role Management</h1>
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users, emails, or mosques..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="Member">Members</option>
                <option value="Founder">Founders</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
            <p className="text-3xl font-bold text-purple-600">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Members</h3>
            <p className="text-3xl font-bold text-blue-600">
              {users.filter(u => u.role === 'Member').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700">Founders</h3>
            <p className="text-3xl font-bold text-green-600">
              {users.filter(u => u.role === 'Founder').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 h-10 w-10 mb-4"></div>
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mosque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">Joined: {user.joinDate}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.mosque}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.totalPrayers} prayers</div>
                        <div className={`text-sm font-medium ${getAttendanceColor(user.attendanceRate)}`}>
                          {user.attendanceRate}% rate
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handlePromoteUser(user)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Change Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Promotion Confirmation Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Confirm Role Change
                </h3>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    Change the role for:
                  </p>
                  <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm">Current Role:</span>
                      {getRoleBadge(selectedUser.role)}
                    </div>
                    
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select New Role:
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Choose a role...</option>
                        <option value="Member">Member</option>
                        <option value="WCM">Working Committee Member</option>
                        <option value="Founder">Working Committee Admin</option>
                        <option value="SuperAdmin">Super Admin</option>
                      </select>
                    </div>
                    
                    {newRole && (
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm">New Role:</span>
                        {getRoleBadge(newRole)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPromotion}
                    disabled={!newRole || newRole === selectedUser?.role}
                    className={`px-4 py-2 rounded-lg ${
                      !newRole || newRole === selectedUser?.role
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    Confirm Change
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

export default PromoteUser;