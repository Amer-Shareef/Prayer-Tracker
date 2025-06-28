import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';
import { meetingsService } from '../../services/api';

const ScheduleMeeting = () => {
  const navigate = useNavigate();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // Fetch real members from API
  useEffect(() => {
    fetchMembersForCounselling();
  }, []);

  const fetchMembersForCounselling = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await meetingsService.getMembersForCounselling();
      
      if (response.data.success) {
        setMembers(response.data.data);
        console.log('✅ Loaded members for counselling:', response.data.data);
      } else {
        setError('Failed to load members');
      }
    } catch (err) {
      console.error('❌ Error fetching members:', err);
      setError('Error loading members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter members - only show pending counselling status with <70% attendance
  const filteredMembers = members.filter(member => {
    const meetsAttendanceThreshold = member.attendanceRate < 70;
    const isPending = !member.counsellingStatus || member.counsellingStatus === 'pending';
    const matchesPriority = filterPriority === 'all' || member.priority === filterPriority;
    const matchesSearch = (member.memberName || member.username).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.memberId || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return meetsAttendanceThreshold && isPending && matchesPriority && matchesSearch;
  });

  const selectedMembers = filteredMembers.filter(member => member.selected);

  const handleSelectMember = (memberId) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId ? { ...m, selected: !m.selected } : m
    ));
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    setMembers(prev => prev.map(m => 
      filteredMembers.find(fm => fm.id === m.id) 
        ? { ...m, selected: newSelectAll }
        : m
    ));
  };

  const handleIndividualSchedule = async (member) => {
    const date = prompt('Enter date (YYYY-MM-DD):');
    const time = prompt('Enter time (HH:MM):');
    
    if (!date || !time) return;
    
    try {
      const sessionData = {
        memberId: member.id,
        scheduledDate: date,
        scheduledTime: time,
        sessionType: 'phone_call',
        priority: member.attendanceRate < 30 ? 'high' : 
                  member.attendanceRate < 50 ? 'medium' : 'low',
        preSessionNotes: `Member has ${member.attendanceRate}% attendance rate. Requires counselling to improve prayer consistency.`
      };
      
      const response = await meetingsService.scheduleCounsellingSession(sessionData);
      
      if (response.data && response.data.success) {
        alert('Counselling session scheduled successfully!');
        await fetchMembersForCounselling();
      } else {
        alert('Failed to schedule session. Please try again.');
      }
      
    } catch (error) {
      console.error('❌ Error scheduling session:', error);
      alert('Failed to schedule session. Please try again.');
    }
  };

  if (loading) {
    return (
      <FounderLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg">Loading members...</div>
        </div>
      </FounderLayout>
    );
  }

  if (error) {
    return (
      <FounderLayout>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
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
            <h1 className="text-2xl font-bold text-gray-900">Schedule Counselling Meetings</h1>
            <p className="text-gray-600 mt-1">Schedule counselling sessions for members with low attendance</p>
          </div>
          <button 
            onClick={() => navigate('/founder/meetings')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
          >
            ← Back to Meetings
          </button>
        </div>

        {/* Members Table - Remove bulk scheduling section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.memberName || member.username}
                        </div>
                        <div className="text-sm text-gray-500">ID: {member.memberId}</div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              member.attendanceRate < 30 ? 'bg-red-600' :
                              member.attendanceRate < 50 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}
                            style={{ width: `${member.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{member.attendanceRate}%</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.prayedCount}/{member.totalPrayers} prayers
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.attendanceRate < 30 ? 'bg-red-100 text-red-800' :
                        member.attendanceRate < 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {member.attendanceRate < 30 ? 'High' : 
                         member.attendanceRate < 50 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.lastContact ? new Date(member.lastContact).toLocaleDateString() : 'Never'}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleIndividualSchedule(member)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Schedule Individual Meeting"
                      >
                        📅 Schedule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Show message when no members found */}
          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                All members have good prayer attendance (≥70%) or are already scheduled for counselling.
              </p>
            </div>
          )}
        </div>
      </div>
    </FounderLayout>
  );
};

export default ScheduleMeeting;