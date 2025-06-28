import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';

const ScheduleMeeting = () => {
  const navigate = useNavigate();
  
  const [members, setMembers] = useState([
    // Members with low attendance requiring counselling
    {
      id: 1,
      memberId: 'DE0001',
      memberName: 'Ahmed Hassan Mohamed',
      phone: '0771234567',
      email: 'ahmed.hassan@email.com',
      attendanceRate: 25,
      totalPrayers: 150,
      prayedCount: 38,
      lastAttendance: '2024-03-10',
      priority: 'high',
      counsellingStatus: 'pending',
      lastContact: '2024-03-01',
      notes: '',
      scheduledDate: null,
      scheduledTime: null,
      counsellor: null,
      selected: false
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
      counsellingStatus: 'pending',
      lastContact: '2024-03-13',
      notes: '',
      scheduledDate: null,
      scheduledTime: null,
      counsellor: null,
      selected: false
    },
    {
      id: 3,
      memberId: 'NU0004',
      memberName: 'Hassan Ibrahim',
      phone: '0712345678',
      email: 'hassan.ibrahim@email.com',
      attendanceRate: 35,
      totalPrayers: 160,
      prayedCount: 56,
      lastAttendance: '2024-03-13',
      priority: 'medium',
      counsellingStatus: 'pending',
      lastContact: '2024-03-10',
      notes: '',
      scheduledDate: null,
      scheduledTime: null,
      counsellor: null,
      selected: false
    },
    {
      id: 4,
      memberId: 'ML0005',
      memberName: 'Yusuf Abdullah',
      phone: '0701234567',
      email: 'yusuf.abdullah@email.com',
      attendanceRate: 20,
      totalPrayers: 140,
      prayedCount: 28,
      lastAttendance: '2024-03-08',
      priority: 'high',
      counsellingStatus: 'pending',
      lastContact: '2024-02-28',
      notes: '',
      scheduledDate: null,
      scheduledTime: null,
      counsellor: null,
      selected: false
    }
  ]);
  const [bulkScheduleForm, setBulkScheduleForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    sessionDuration: '30' // minutes
  });

  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // Filter members - only show pending counselling status with <70% attendance
  const filteredMembers = members.filter(member => {
    const meetsAttendanceThreshold = member.attendanceRate < 70;
    const isPending = member.counsellingStatus === 'pending';
    const matchesPriority = filterPriority === 'all' || member.priority === filterPriority;
    const matchesSearch = member.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.memberId.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const generateTimeSlots = () => {
    if (!bulkScheduleForm.startTime || !bulkScheduleForm.endTime || !bulkScheduleForm.sessionDuration) {
      return [];
    }

    const slots = [];
    const start = new Date(`1970-01-01T${bulkScheduleForm.startTime}:00`);
    const end = new Date(`1970-01-01T${bulkScheduleForm.endTime}:00`);
    const duration = parseInt(bulkScheduleForm.sessionDuration);

    let current = new Date(start);
    while (current < end) {
      const timeString = current.toTimeString().slice(0, 5);
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + duration);
    }

    return slots;
  };
  const handleBulkSchedule = () => {
    if (!bulkScheduleForm.date || selectedMembers.length === 0) {
      alert('Please fill date and select at least one member');
      return;
    }

    const timeSlots = generateTimeSlots();
    
    if (timeSlots.length < selectedMembers.length) {
      alert(`Not enough time slots. You can schedule ${timeSlots.length} members with current time range.`);
      return;
    }

    const updatedMembers = [...members];
    selectedMembers.forEach((member, index) => {
      const memberIndex = updatedMembers.findIndex(m => m.id === member.id);
      if (memberIndex !== -1 && index < timeSlots.length) {
        updatedMembers[memberIndex] = {
          ...updatedMembers[memberIndex],
          counsellingStatus: 'scheduled',
          scheduledDate: bulkScheduleForm.date,
          scheduledTime: timeSlots[index],
          selected: false
        };
      }
    });

    setMembers(updatedMembers);
    setBulkScheduleForm({
      date: '',
      startTime: '',
      endTime: '',
      sessionDuration: '30'
    });
    setSelectAll(false);
    
    alert(`Successfully scheduled ${selectedMembers.length} members for counselling sessions.`);
  };
  const handleIndividualSchedule = (member) => {
    const date = prompt('Enter date (YYYY-MM-DD):');
    const time = prompt('Enter time (HH:MM):');

    if (date && time) {
      setMembers(prev => prev.map(m => 
        m.id === member.id 
          ? { 
              ...m, 
              counsellingStatus: 'scheduled',
              scheduledDate: date,
              scheduledTime: time
            }
          : m
      ));
    }
  };

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule Counselling Meetings</h1>
            <p className="text-gray-600 mt-1">Schedule individual or bulk counselling sessions for members with low attendance</p>
          </div>
          <button 
            onClick={() => navigate('/founder/meetings')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Meetings
          </button>
        </div>

        {/* Bulk Scheduling Form */}        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Schedule Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={bulkScheduleForm.date}
                onChange={(e) => setBulkScheduleForm({...bulkScheduleForm, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={bulkScheduleForm.startTime}
                onChange={(e) => setBulkScheduleForm({...bulkScheduleForm, startTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={bulkScheduleForm.endTime}
                onChange={(e) => setBulkScheduleForm({...bulkScheduleForm, endTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration</label>
              <select
                value={bulkScheduleForm.sessionDuration}
                onChange={(e) => setBulkScheduleForm({...bulkScheduleForm, sessionDuration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>

          {/* Time Slots Preview */}
          {bulkScheduleForm.startTime && bulkScheduleForm.endTime && bulkScheduleForm.sessionDuration && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Available Time Slots ({generateTimeSlots().length} slots)
              </h3>
              <div className="flex flex-wrap gap-2">
                {generateTimeSlots().map((slot, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              {selectedMembers.length} member(s) selected for scheduling
            </div>
            <button
              onClick={handleBulkSchedule}
              disabled={selectedMembers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Schedule Selected Members
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterPriority('all');
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className={`hover:bg-gray-50 ${member.selected ? 'bg-blue-50' : ''}`}>
                    {/* Checkbox */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={member.selected || false}
                        onChange={() => handleSelectMember(member.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>

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

                    {/* Last Contact */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.lastContact}</div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleIndividualSchedule(member)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Schedule Individual Meeting"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No members available for scheduling</h3>
              <p className="mt-1 text-sm text-gray-500">All members have been scheduled or don't require counselling.</p>
            </div>
          )}
        </div>
      </div>
    </FounderLayout>
  );
};

export default ScheduleMeeting;