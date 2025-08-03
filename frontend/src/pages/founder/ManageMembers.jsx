import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';
import { memberAPI, areaService } from '../../services/api';
import jsPDF from 'jspdf';

function ManageMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMemberId, setFilterMemberId] = useState('');
  const [filterFullName, setFilterFullName] = useState('');
  const [filterMinAge, setFilterMinAge] = useState('');
  const [filterMaxAge, setFilterMaxAge] = useState('');
  const [filterUsername, setFilterUsername] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterMobility, setFilterMobility] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [filterAdditionalInfo, setFilterAdditionalInfo] = useState('all');

  // Fetch members and areas from database
  useEffect(() => {
    fetchMembers();
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const response = await areaService.getAreas();
      if (response.data && response.data.success) {
        setAreas(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching areas:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await memberAPI.getMembers();
      if (response.success) {
        setMembers(response.data);
      } else {
        setError(response.message || 'Failed to fetch members');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        const response = await memberAPI.deleteMember(memberId);
        if (response.success) {
          setMembers(members.filter(member => member.id !== memberId));
        } else {
          setError(response.message || 'Failed to delete member');
        }
      } catch (err) {
        setError('Error deleting member');
        console.error('Error deleting member:', err);
      }
    }
  };

  const handleUpdateStatus = async (memberId, newStatus) => {
    try {
      const member = members.find(m => m.id === memberId);
      const response = await memberAPI.updateMember(memberId, {
        username: member.username,
        email: member.email,
        phone: member.phone,
        role: member.role,
        status: newStatus
      });
      
      if (response.success) {
        setMembers(members.map(m => 
          m.id === memberId ? { ...m, status: newStatus } : m
        ));
      } else {
        setError(response.message || 'Failed to update member status');
      }
    } catch (err) {
      setError('Error updating member status');
      console.error('Error updating member status:', err);
    }
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '-';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // PDF Generation Function
  const generateMemberPDF = (member) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Member Information Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Member ID and Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Member ID: ${member.memberId || 'N/A'}`, margin, yPosition);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, yPosition);
    yPosition += 20;

    // Add a line separator
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Personal Information Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Personal Information', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const personalInfo = [
      ['Member Name:', member.fullName || 'N/A'],
      ['Username:', member.username || 'N/A'],
      ['Age:', calculateAge(member.dateOfBirth).toString()],
      ['Date of Birth:', member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : 'N/A'],
      ['Email:', member.email || 'N/A'],
      ['Phone Number:', member.phone || 'N/A'],
      ['Address:', member.address || 'N/A'],
      ['Area:', member.area || 'N/A'],
      ['Mobility:', member.mobility || 'N/A']
    ];

    personalInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      // Handle long text wrapping
      const textLines = doc.splitTextToSize(value, pageWidth - margin - 80);
      doc.text(textLines, margin + 70, yPosition);
      yPosition += Math.max(10, textLines.length * 5);
    });

    yPosition += 10;

    // Account Information Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Information', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const accountInfo = [
      ['Role:', member.role === 'Member' ? 'Member' :
               member.role === 'WCM' ? 'Working Committee Member' :
               member.role === 'Founder' ? 'Working Committee Admin' :
               member.role === 'SuperAdmin' ? 'Super Admin' :
               (member.role || 'N/A')],
      ['Status:', member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : 'N/A'],
      ['Joined Date:', member.joined_date ? new Date(member.joined_date).toLocaleDateString() : 'N/A']
    ];

    accountInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 70, yPosition);
      yPosition += 10;
    });

    yPosition += 10;

    // Additional Information Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Information', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const additionalInfo = [
      ['Living on Rent:', member.onRent ? 'Yes' : 'No'],
      ['Zakath Eligible:', member.zakathEligible ? 'Yes' : 'No'],
      ['Differently Abled:', member.differentlyAbled ? 'Yes' : 'No'],
      ['Muallafathil Quloob (New Convert):', member.MuallafathilQuloob ? 'Yes' : 'No']
    ];

    additionalInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 70, yPosition);
      yPosition += 10;
    });

    yPosition += 10;

    // Prayer Statistics Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Prayer Statistics (Last 30 Days)', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // const prayerStats = [
    //   ['Prayer Attendance Rate:', `${member.attendance_rate || 0}%`],
    //   ['Prayers Completed:', `${member.prayed_count || 0} out of ${member.total_prayers || 0}`],
    // ];

    prayerStats.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 70, yPosition);
      yPosition += 10;
    });


    // Save the PDF
    const fileName = `Member_Report_${member.username || member.memberId || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Helper function to format checked attributes as badges
  const formatCheckedAttributesBadges = (member) => {
    const attributes = [];
    if (member.onRent) attributes.push({ label: 'Rent', key: 'rent' });
    if (member.zakathEligible) attributes.push({ label: 'Zakath', key: 'zakath' });
    if (member.differentlyAbled) attributes.push({ label: 'Disabled', key: 'disabled' });
    if (member.MuallafathilQuloob) attributes.push({ label: 'Convert', key: 'convert' });
    
    if (attributes.length === 0) return <span className="text-gray-500">-</span>;
    
    return (
      <div className="flex flex-col gap-1">
        {attributes.map((attr) => (
          <span
            key={attr.key}
            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
          >
            {attr.label}
          </span>
        ))}
      </div>
    );
  };

  // Filter members based on search and filters
  const filteredMembers = members.filter(member => {
    const matchesSearch = (member.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    const matchesMemberId = !filterMemberId || (member.memberId || '').toLowerCase().includes(filterMemberId.toLowerCase());
    const matchesFullName = !filterFullName || (member.fullName || '').toLowerCase().includes(filterFullName.toLowerCase());
    const matchesUsername = !filterUsername || (member.username || '').toLowerCase().includes(filterUsername.toLowerCase());
    const matchesEmail = !filterEmail || (member.email || '').toLowerCase().includes(filterEmail.toLowerCase());
    const matchesMobility = filterMobility === 'all' || member.mobility === filterMobility;
    const matchesArea = filterArea === 'all' || member.area === filterArea;
    
    // Additional Info filtering
    const matchesAdditionalInfo = filterAdditionalInfo === 'all' || 
      (filterAdditionalInfo === 'zakath' && member.zakathEligible) ||
      (filterAdditionalInfo === 'rent' && member.onRent) ||
      (filterAdditionalInfo === 'disabled' && member.differentlyAbled) ||
      (filterAdditionalInfo === 'convert' && member.MuallafathilQuloob);
    
    // Age filtering
    const memberAge = calculateAge(member.dateOfBirth);
    const matchesMinAge = !filterMinAge || memberAge >= parseInt(filterMinAge);
    const matchesMaxAge = !filterMaxAge || memberAge <= parseInt(filterMaxAge);
    
    return matchesSearch && matchesRole && matchesStatus && matchesMemberId && 
           matchesFullName && matchesUsername && matchesEmail && matchesMobility && 
           matchesArea && matchesAdditionalInfo && matchesMinAge && matchesMaxAge;
  });

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

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Members</h1>
          <button 
            onClick={() => navigate('/founder/add-member')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Member
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* General Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">General Search</label>
              <input
                type="text"
                placeholder="Search by name, username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Age Range Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min Age"
                  value={filterMinAge}
                  onChange={(e) => setFilterMinAge(e.target.value)}
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="120"
                />
                <input
                  type="number"
                  placeholder="Max Age"
                  value={filterMaxAge}
                  onChange={(e) => setFilterMaxAge(e.target.value)}
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="120"
                />
              </div>
            </div>
            
            {/* Mobility Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobility</label>
              <select
                value={filterMobility}
                onChange={(e) => setFilterMobility(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Mobility</option>
                <option value="Walking">Walking</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Motorbike">Motorbike</option>
                <option value="Car">Car</option>
                <option value="Public Transport">Public Transport</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            {/* Area Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Areas</option>
                {areas.map((area) => (
                  <option key={area.area_id} value={area.area_name}>
                    {area.area_name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Additional Info Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Info</label>
              <select
                value={filterAdditionalInfo}
                onChange={(e) => setFilterAdditionalInfo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Additional Info</option>
                <option value="zakath">Zakath Eligible</option>
                <option value="rent">On Rent</option>
                <option value="disabled">Differently Abled</option>
                <option value="convert">Muallafathil Quloob</option>
              </select>
            </div>
            
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="Member">Member</option>
                <option value="WCM">Working Committee Member</option>
                <option value="Founder">Working Committee Admin</option>
                <option value="SuperAdmin">Super Admin</option>
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterMemberId('');
                  setFilterFullName('');
                  setFilterMinAge('');
                  setFilterMaxAge('');
                  setFilterUsername('');
                  setFilterEmail('');
                  setFilterMobility('all');
                  setFilterArea('all');
                  setFilterAdditionalInfo('all');
                  setFilterRole('all');
                  setFilterStatus('all');
                }}
                className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear All Filters
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobility</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prayer Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    {/* Member ID */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.memberId || '-'}
                    </td>
                    
                    {/* Full Name */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.fullName || '-'}
                    </td>
                    
                    {/* Age */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateAge(member.dateOfBirth)}
                    </td>
                    
                    {/* Area */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.area || '-'}
                    </td>
                    
                    {/* Contact No */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.phone || '-'}
                    </td>
                    
                    {/* Email */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.email || '-'}
                    </td>
                    
                    {/* Address */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                      {member.address || '-'}
                    </td>
                    
                    {/* Mobility */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.mobility || '-'}
                    </td>
                    
                    {/* Additional Info (Checkboxes) */}
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="flex flex-col gap-1">
                        {formatCheckedAttributesBadges(member)}
                      </div>
                    </td>
                    
                    {/* Prayer Attendance */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${member.attendance_rate || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{member.attendance_rate || 0}%</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.prayed_count || 0}/{member.total_prayers || 0}
                      </div>
                    </td>
                    
                    {/* Role */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.role === 'Member' ? 'bg-blue-100 text-blue-800' :
                        member.role === 'WCM' ? 'bg-indigo-100 text-indigo-800' :
                        member.role === 'Founder' ? 'bg-green-100 text-green-800' : 
                        member.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'Member' ? 'Member' :
                         member.role === 'WCM' ? 'Working Committee Member' :
                         member.role === 'Founder' ? 'Working Committee Admin' :
                         member.role === 'SuperAdmin' ? 'Super Admin' :
                         (member.role || '-')}
                      </span>
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' : 
                        member.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : '-'}
                      </span>
                    </td>
                    
                    {/* Joined */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.joined_date ? new Date(member.joined_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : '-'}
                    </td>
                    
                    {/* Username */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.username || '-'}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* Download PDF Report Button */}
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => generateMemberPDF(member)}
                          title="Download PDF Report"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        
                        {/* Activate/Deactivate Button with Tick/Cross */}
                        <button 
                          className={`${member.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          onClick={() => handleUpdateStatus(member.id, member.status === 'active' ? 'inactive' : 'active')}
                          title={member.status === 'active' ? 'Deactivate Member' : 'Activate Member'}
                        >
                          {member.status === 'active' ? (
                            // Cross/X icon for deactivate
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            // Tick/Check icon for activate
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Delete Button */}
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteMember(member.id)}
                          title="Delete Member"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredMembers.length === 0 && !loading && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search criteria.' 
                  : 'Get started by adding your first member.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </FounderLayout>
  );
}

export default ManageMembers;
