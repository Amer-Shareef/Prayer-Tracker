import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';
import { memberAPI } from '../../services/api';
import { areaService } from '../../services/areaService';
import { useAuth } from '../../context/AuthContext';

const AddMember = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user to check role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [areas, setAreas] = useState([]);
  const [subAreas, setSubAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingSubAreas, setLoadingSubAreas] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Member',
    dateOfBirth: '',
    address: '',
    area_id: '',
    subarea_id: '',
    onRent: false,
    zakathEligible: false,
    differentlyAbled: false,
    mobility: '',
    otherSpecify: '',
    MuallafathilQuloob: false,
    placeOfBirth: '',
    nicNo: '',
    occupation: '',
    workplaceAddress: '',
    familyStatus: '',
    widowAssistance: false
  });

  // Fetch areas from database
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setLoadingAreas(true);
        const response = await areaService.getAllAreas();
        console.log('🏞️ Areas API Response:', response);
        if (response.success) {
          setAreas(response.data);
          console.log('✅ Areas loaded:', response.data);
        } else {
          console.error('Failed to fetch areas:', response.message);
        }
      } catch (err) {
        console.error('Error fetching areas:', err);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchAreas();
  }, []);

  // Fetch sub-areas when area is selected
  const fetchSubAreas = async (areaId) => {
    if (!areaId) {
      setSubAreas([]);
      return;
    }

    try {
      setLoadingSubAreas(true);
      const response = await areaService.getSubAreas(areaId);
      console.log('🏘️ Sub-areas API Response:', response);
      if (response.success) {
        setSubAreas(response.data.subAreas || []);
        console.log('✅ Sub-areas loaded:', response.data.subAreas);
      } else {
        console.error('Failed to fetch sub-areas:', response.message);
        setSubAreas([]);
      }
    } catch (err) {
      console.error('Error fetching sub-areas:', err);
      setSubAreas([]);
    } finally {
      setLoadingSubAreas(false);
    }
  };

  // Get allowed roles based on current user's role
  const getAllowedRoles = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'SuperAdmin':
        // SuperAdmin can create all roles
        return [
          { value: 'Member', label: 'Member' },
          { value: 'WCM', label: 'Working Committee Member' },
          { value: 'Founder', label: 'Working Committee Admin' },
          { value: 'SuperAdmin', label: 'Super Admin' }
        ];
      case 'Founder':
        // Founder can create: Member, WCM, and other Founders
        return [
          { value: 'Member', label: 'Member' },
          { value: 'WCM', label: 'Working Committee Member' },
          { value: 'Founder', label: 'Working Committee Admin' }
        ];
      case 'WCM':
        // WCM can create: Member, WCM, and Founders (same as Founder backend permissions)
        return [
          { value: 'Member', label: 'Member' },
          { value: 'WCM', label: 'Working Committee Member' },
          { value: 'Founder', label: 'Working Committee Admin' }
        ];
      default:
        // Default case: only Member
        return [
          { value: 'Member', label: 'Member' }
        ];
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If area is changed, reset sub-area and fetch new sub-areas
    if (name === 'area_id') {
      setFormData({
        ...formData,
        [name]: value,
        subarea_id: '' // Reset sub-area when area changes
      });
      
      // Fetch sub-areas for the selected area
      if (value) {
        fetchSubAreas(value);
      } else {
        setSubAreas([]);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Handle phone number input with +94 prefix and 9-digit validation
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
    
    // Limit to 9 digits
    if (value.length > 9) {
      value = value.substring(0, 9);
    }
    
    // Format with +94 prefix
    const formattedPhone = value ? `+94${value}` : '';
    
    setFormData({
      ...formData,
      phone: formattedPhone
    });
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Validate form
  const validateForm = () => {
    if (!formData.fullName || !formData.username || !formData.email || !formData.password || !formData.phone) {
      setError('Full name, username, email, phone number, and password are required');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Phone number validation - must be exactly +94 followed by 9 digits (REQUIRED)
    const phoneRegex = /^\+94\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Phone number is required and must be exactly 9 digits after +94');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('📤 Submitting form data:', formData);
      
      const response = await memberAPI.addMember(formData);
      
      console.log('📥 Response from server:', response);
      
      if (response.success) {
        setSuccess('Member added successfully!');
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/founder/manage-members');
        }, 1500);
      } else {
        setError(response.message || 'Failed to add member');
      }
    } catch (err) {
      console.error('❌ Error adding member:', err);
      
      // Handle different error formats
      if (err.message) {
        setError(err.message);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Failed to add member. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/founder/manage-members');
  };

  return (
    <FounderLayout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add New Member</h1>
          <p className="text-gray-600 mt-1">Create a new member account for your mosque</p>
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

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
              {success}
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
                    Username *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter username"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-700 text-sm">+94</span>
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone.replace('+94', '')} // Display only the digits after +94
                      onChange={handlePhoneChange}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="7XXXXXXXX"
                      maxLength="9"
                      pattern="[0-9]{9}"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dateOfBirth">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Place of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="placeOfBirth">
                    Place of Birth
                  </label>
                  <input
                    type="text"
                    id="placeOfBirth"
                    name="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter place of birth"
                  />
                </div>

                {/* NIC No */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nicNo">
                    NIC No
                  </label>
                  <input
                    type="text"
                    id="nicNo"
                    name="nicNo"
                    value={formData.nicNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter NIC number"
                  />
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="occupation">
                    Occupation
                  </label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter occupation"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter address"
                  />
                </div>

                {/* Workplace/Business Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="workplaceAddress">
                    Workplace/Business Address
                  </label>
                  <textarea
                    id="workplaceAddress"
                    name="workplaceAddress"
                    value={formData.workplaceAddress}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter workplace or business address"
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="area">
                    Area
                  </label>
                  <select
                    id="area_id"
                    name="area_id"
                    value={formData.area_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select area</option>
                    {loadingAreas ? (
                      <option value="">Loading areas...</option>
                    ) : (
                      areas.map((area) => (
                        <option key={area.area_id} value={area.area_id}>
                          {area.area_name || area.name || `Area ${area.area_id}`}
                          {area.description && ` - ${area.description}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Sub-area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="subarea_id">
                    Sub-area <span className="text-gray-500">(Optional)</span>
                  </label>
                  <select
                    id="subarea_id"
                    name="subarea_id"
                    value={formData.subarea_id}
                    onChange={handleInputChange}
                    disabled={!formData.area_id || loadingSubAreas}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.area_id 
                        ? 'Select area first' 
                        : loadingSubAreas 
                        ? 'Loading sub-areas...' 
                        : 'Select sub-area (optional)'}
                    </option>
                    {!loadingSubAreas && subAreas.map((subArea) => (
                      <option key={subArea.id} value={subArea.id}>
                        {subArea.address}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="mobility">
                    Mobility (How they travel to mosque)
                  </label>
                  <select
                    id="mobility"
                    name="mobility"
                    value={formData.mobility}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select mobility option</option>
                    <option value="Walking">Walking</option>
                    <option value="Bicycle">Bicycle</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="Car">Car</option>
                    <option value="Public Transport">Public Transport</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* If "Other", please specify */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="otherSpecify">
    If Other, please specify
  </label>
  <input
    type="text"
    id="otherSpecify"
    name="otherSpecify"
    value={formData.otherSpecify}
    onChange={handleInputChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="Please specify"
    required={formData.selectedOption === 'Other'} // Optional logic
  />
</div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getAllowedRoles().map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Family Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="familyStatus">
                    Family Status
                  </label>
                  <select
                    id="familyStatus"
                    name="familyStatus"
                    value={formData.familyStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select family status</option>
                    <option value="Joint Living">Joint Living</option>
                    <option value="Widow">Widow</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Separated">Separated</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter password (min 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* If Widowed, are you receiving assistance? */}
                {formData.familyStatus === 'Widow' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="widowAssistance"
                      name="widowAssistance"
                      checked={formData.widowAssistance}
                      onChange={(e) => setFormData({ ...formData, widowAssistance: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="widowAssistance" className="ml-2 block text-sm text-gray-900">
                      Receiving Assistance <span className="text-gray-500">[additional info]</span>
                    </label>
                  </div>
                )}

                {/* On Rent */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="onRent"
                    name="onRent"
                    checked={formData.onRent}
                    onChange={(e) => setFormData({ ...formData, onRent: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="onRent" className="ml-2 block text-sm text-gray-900">
                    Living on Rent
                  </label>
                </div>

                {/* Zakath Eligible */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="zakathEligible"
                    name="zakathEligible"
                    checked={formData.zakathEligible}
                    onChange={(e) => setFormData({ ...formData, zakathEligible: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="zakathEligible" className="ml-2 block text-sm text-gray-900">
                    Zakath Eligible
                  </label>
                </div>

                {/* Differently Abled */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="differentlyAbled"
                    name="differentlyAbled"
                    checked={formData.differentlyAbled}
                    onChange={(e) => setFormData({ ...formData, differentlyAbled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="differentlyAbled" className="ml-2 block text-sm text-gray-900">
                    Differently Abled
                  </label>
                </div>

                {/* Mulaffathil Quloob */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="MuallafathilQuloob"
                    name="MuallafathilQuloob"
                    checked={formData.MuallafathilQuloob}
                    onChange={(e) => setFormData({ ...formData, MuallafathilQuloob: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="MuallafathilQuloob" className="ml-2 block text-sm text-gray-900">
                    Muallafathil Quloob (Convert)
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </div>
                ) : (
                  'Add Member'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </FounderLayout>
  );
};

export default AddMember;
