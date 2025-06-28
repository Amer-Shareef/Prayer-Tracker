import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';

const MeetingsPage = () => {
  const navigate = useNavigate();const [members, setMembers] = useState([
    // Dummy data for demonstration - members with low attendance
    {
      id: 1,
      memberId: 'DE0001',
      memberName: 'Ahmed Hassan Mohamed',
      phone: '0771234567',
      email: 'ahmed.hassan@email.com',
      attendanceRate: 25,
      totalPrayers: 150,
      prayedCount: 38,
      lastAttendance: '2025-03-10',
      priority: 'high', // high, medium, low based on attendance
      counsellingStatus: 'pending', // pending, scheduled, completed
      lastContact: '2024-03-01',
      notes: '',
      scheduledDate: null,
      scheduledTime: null,
      counsellor: null
    },
    {
      id: 2,
      memberId: 'C30002',
      memberName: 'Muhammad Ali Khan',
      phone: '0769876543',
      email: 'muhammad.ali@email.com',
      attendanceRate: 45,
      totalPrayers: 200,
      prayedCount: 90,
      lastAttendance: '2024-03-12',
      priority: 'medium',
      counsellingStatus: 'scheduled',
      lastContact: '2024-03-13',
      notes: '',
      scheduledDate: '2024-03-20',
      scheduledTime: '15:00',
      counsellor: 'Imam Abdullah'
    },
    {
      id: 3,
      memberId: 'ML0003',
      memberName: 'Omar Abdullah Khan',
      phone: '0751234567',
      email: 'omar.khan@email.com',
      attendanceRate: 15,
      totalPrayers: 180,
      prayedCount: 27,
      lastAttendance: '2024-02-28',
      priority: 'high',
      counsellingStatus: 'completed',
      lastContact: '2024-03-14',
      notes: 'Personal issues resolved, showing improvement after counselling',
      scheduledDate: '2024-03-14',
      scheduledTime: '14:00',
      counsellor: 'Imam Abdullah'
    },
    {
      id: 4,
      memberId: 'NU0004',
      memberName: 'Hassan Ibrahim',
      phone: '0712345678',
      email: 'hassan.ibrahim@email.com',
      attendanceRate: 65,
      totalPrayers: 160,
      prayedCount: 104,
      lastAttendance: '2024-03-13',
      priority: 'low',
      counsellingStatus: 'pending',
      lastContact: '2024-03-10',
      notes: '',
      scheduledDate: null,
      scheduledTime: null,
      counsellor: null
    }
  ]);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAttendance, setFilterAttendance] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: ''
  });
  const [completeForm, setCompleteForm] = useState({
    notes: ''
  });

  // Statistics
  const totalMembers = members.length;
  const highPriorityMembers = members.filter(m => m.priority === 'high').length;
  const pendingCounselling = members.filter(m => m.counsellingStatus === 'pending').length;
  const scheduledMeetings = members.filter(m => m.counsellingStatus === 'scheduled').length;
  const completedCounselling = members.filter(m => m.counsellingStatus === 'completed').length;
  // Filter members - show only those with less than 70% attendance
  const filteredMembers = members.filter(member => {
    // Only show members with less than 70% attendance
    const meetsAttendanceThreshold = member.attendanceRate < 70;
    
    const matchesPriority = filterPriority === 'all' || member.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || member.counsellingStatus === filterStatus;
    const matchesAttendance = filterAttendance === 'all' || 
      (filterAttendance === 'very_low' && member.attendanceRate < 30) ||
      (filterAttendance === 'low' && member.attendanceRate >= 30 && member.attendanceRate < 50) ||
      (filterAttendance === 'medium' && member.attendanceRate >= 50 && member.attendanceRate < 70);
    const matchesSearch = member.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.memberId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return meetsAttendanceThreshold && matchesPriority && matchesStatus && matchesAttendance && matchesSearch;
  });
  const handleScheduleMeeting = (member) => {
    setSelectedMember(member);
    setShowScheduleModal(true);
  };

  const handleCompleteCall = (member) => {
    setSelectedMember(member);
    setShowCompleteModal(true);
  };
  const handleSubmitSchedule = () => {
    if (!scheduleForm.date || !scheduleForm.time) {
      alert('Please fill all fields');
      return;
    }

    setMembers(prev => prev.map(m => 
      m.id === selectedMember.id 
        ? { 
            ...m, 
            counsellingStatus: 'scheduled',
            scheduledDate: scheduleForm.date,
            scheduledTime: scheduleForm.time
          }
        : m
    ));

    setShowScheduleModal(false);
    setScheduleForm({ date: '', time: '' });
    setSelectedMember(null);
  };

  const handleSubmitComplete = () => {
    if (!completeForm.notes.trim()) {
      alert('Please add notes about the call');
      return;
    }

    setMembers(prev => prev.map(m => 
      m.id === selectedMember.id 
        ? { 
            ...m, 
            counsellingStatus: 'completed',
            notes: completeForm.notes,
            lastContact: new Date().toISOString().split('T')[0]
          }
        : m
    ));

    setShowCompleteModal(false);
    setCompleteForm({ notes: '' });
    setSelectedMember(null);
  };

  const handleUpdateStatus = (memberId, newStatus) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId 
        ? { ...m, counsellingStatus: newStatus }
        : m
    ));
  };

  const handleUpdatePriority = (memberId, newPriority) => {
    setMembers(prev => prev.map(m => 
      m.id === memberId 
        ? { ...m, priority: newPriority }
        : m
    ));
  };

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personalized Meetings & Counselling</h1>
            <p className="text-gray-600 mt-1">Track and support members with low prayer attendance</p>
          </div>          <div className="flex space-x-3">
            <button 
              onClick={() => navigate('/founder/schedule-meeting')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Schedule Meeting
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707v11a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <p className="text-2xl font-semibold text-gray-900">{totalMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">High Priority</p>
                <p className="text-2xl font-semibold text-gray-900">{highPriorityMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingCounselling}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Scheduled</p>
                <p className="text-2xl font-semibold text-gray-900">{scheduledMeetings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{completedCounselling}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Level</label>
              <select
                value={filterAttendance}
                onChange={(e) => setFilterAttendance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="very_low">Very Low (&lt;30%)</option>
                <option value="low">Low (30-50%)</option>
                <option value="medium">Medium (50%+)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterPriority('all');
                  setFilterStatus('all');
                  setFilterAttendance('all');
                }}
                className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Meeting</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    {/* Member Info */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.memberName}</div>
                        <div className="text-sm text-gray-500">ID: {member.memberId}</div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </div>
                    </td>

                    {/* Attendance */}
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
                      <div className="text-xs text-gray-500">
                        Last: {member.lastAttendance}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.priority === 'high' ? 'bg-red-100 text-red-800' :
                        member.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {member.priority.charAt(0).toUpperCase() + member.priority.slice(1)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.counsellingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        member.counsellingStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.counsellingStatus.charAt(0).toUpperCase() + member.counsellingStatus.slice(1)}
                      </span>
                    </td>

                    {/* Last Contact */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.lastContact}</div>
                    </td>                    {/* Scheduled Meeting */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {member.scheduledDate ? (
                        <div>
                          <div className="text-sm text-gray-900">{member.scheduledDate}</div>
                          <div className="text-sm text-gray-500">{member.scheduledTime}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={member.notes}>
                        {member.notes || '-'}
                      </div>
                    </td>                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">                        {member.counsellingStatus === 'pending' && (
                          <button
                            onClick={() => handleScheduleMeeting(member)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Schedule Meeting"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        
                        {member.counsellingStatus === 'scheduled' && (
                          <button
                            onClick={() => handleCompleteCall(member)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Complete Call"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          className="text-green-600 hover:text-green-900"
                          title="Call Member"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
              <p className="mt-1 text-sm text-gray-500">No members match your current filters.</p>
            </div>          )}
        </div>

        {/* Schedule Meeting Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Meeting</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Schedule counselling meeting for {selectedMember?.memberName}
                </p>
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setScheduleForm({ date: '', time: '' });
                      setSelectedMember(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitSchedule}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Call Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Call</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add notes about your call with {selectedMember?.memberName}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call Notes</label>
                    <textarea
                      value={completeForm.notes}
                      onChange={(e) => setCompleteForm({...completeForm, notes: e.target.value})}
                      placeholder="What did you discuss? What issues were identified? Any actions planned?"
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => {
                      setShowCompleteModal(false);
                      setCompleteForm({ notes: '' });
                      setSelectedMember(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitComplete}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Complete Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default MeetingsPage;
