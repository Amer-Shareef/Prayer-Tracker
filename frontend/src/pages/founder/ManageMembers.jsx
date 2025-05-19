import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

const ManageMembers = () => {
  const [members, setMembers] = useState([
    {
      id: 1,
      name: 'Ahmed Khan',
      email: 'ahmed.khan@example.com',
      phone: '+1 (555) 123-4567',
      joinDate: '2024-12-15',
      status: 'active',
      prayerAttendance: 85,
      lastPrayer: 'Asr - May 18, 2025'
    },
    {
      id: 2,
      name: 'Fatima Ali',
      email: 'fatima.ali@example.com',
      phone: '+1 (555) 234-5678',
      joinDate: '2025-01-10',
      status: 'active',
      prayerAttendance: 92,
      lastPrayer: 'Maghrib - May 19, 2025'
    },
    {
      id: 3,
      name: 'Muhammad Rahman',
      email: 'muhammad.r@example.com',
      phone: '+1 (555) 345-6789',
      joinDate: '2025-02-05',
      status: 'active',
      prayerAttendance: 78,
      lastPrayer: 'Dhuhr - May 19, 2025'
    },
    {
      id: 4,
      name: 'Aisha Begum',
      email: 'aisha.b@example.com',
      phone: '+1 (555) 456-7890',
      joinDate: '2025-03-20',
      status: 'inactive',
      prayerAttendance: 32,
      lastPrayer: 'Isha - May 10, 2025'
    },
    {
      id: 5,
      name: 'Omar Farooq',
      email: 'omar.f@example.com',
      phone: '+1 (555) 567-8901',
      joinDate: '2025-01-25',
      status: 'active',
      prayerAttendance: 89,
      lastPrayer: 'Fajr - May 19, 2025'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  });
  
  // Filter members based on search term and status filter
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Sort members based on sort config
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });
  
  // Request sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Handle adding a new member
  const handleAddMember = (e) => {
    e.preventDefault();
    const newId = Math.max(...members.map(m => m.id)) + 1;
    
    const memberToAdd = {
      ...newMember,
      id: newId,
      joinDate: new Date().toISOString().split('T')[0],
      prayerAttendance: 0,
      lastPrayer: 'N/A'
    };
    
    setMembers([...members, memberToAdd]);
    setNewMember({
      name: '',
      email: '',
      phone: '',
      status: 'active'
    });
    setShowAddMemberForm(false);
  };
  
  // Handle member deletion
  const handleDeleteMember = (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      setMembers(members.filter(member => member.id !== id));
    }
  };
  
  // Handle status change
  const handleStatusChange = (id, newStatus) => {
    setMembers(members.map(member => 
      member.id === id ? { ...member, status: newStatus } : member
    ));
  };
  
  return (
    <FounderLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">          <h1 className="text-2xl font-bold text-gray-800">Manage Mosque Members</h1>
          <button 
            onClick={() => setShowAddMemberForm(!showAddMemberForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Member
          </button>
        </div>
        
        {/* Add Member Form */}
        {showAddMemberForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={newMember.status}
                    onChange={(e) => setNewMember({ ...newMember, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search members..."
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="p-2 border border-gray-300 rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
                <div className="text-sm text-gray-600">{filteredMembers.length} of {members.length} members</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Members Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortConfig.key === 'name' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          {sortConfig.direction === 'ascending' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('joinDate')}
                  >
                    <div className="flex items-center">
                      Join Date
                      {sortConfig.key === 'joinDate' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          {sortConfig.direction === 'ascending' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('prayerAttendance')}
                  >
                    <div className="flex items-center">
                      Prayer Attendance
                      {sortConfig.key === 'prayerAttendance' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          {sortConfig.direction === 'ascending' ? (
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Prayer
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-700 font-medium">{member.name.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${member.prayerAttendance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{member.prayerAttendance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.lastPrayer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="text-green-600 hover:text-green-900">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleStatusChange(member.id, member.status === 'active' ? 'inactive' : 'active')}
                        >
                          {member.status === 'active' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FounderLayout>
  );
};

export default ManageMembers;
