import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';
import { memberAPI } from '../../services/api';

const AddMember = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    area: '',
    onRent: false,
    zakathEligible: false,
    differentlyAbled: false,
    mobility: '',
    MuallafathilQuloob: false
  });
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Validate form
  const validateForm = () => {
    if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
      setError('Full name, username, email, and password are required');
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

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const memberData = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        area: formData.area,
        onRent: formData.onRent,
        zakathEligible: formData.zakathEligible,
        differentlyAbled: formData.differentlyAbled,
        mobility: formData.mobility,
        MuallafathilQuloob: formData.MuallafathilQuloob
      };

      const response = await memberAPI.addMember(memberData);
      
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
      console.error('Error adding member:', err);
      setError(err.response?.data?.message || 'Failed to add member. Please try again.');
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
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Age */}
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

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter address"
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="area">
                    Area
                  </label>
                  <select
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select area</option>
                    <option value="ANGODA [AN]">ANGODA [AN]</option>
                    <option value="ATHURUGIRIYA [AT]">ATHURUGIRIYA [AT]</option>
                    <option value="AVISSAWELLA [AV]">AVISSAWELLA [AV]</option>
                    <option value="BATTARAMULLA [BA]">BATTARAMULLA [BA]</option>
                    <option value="BORALESGAMUWA [BO]">BORALESGAMUWA [BO]</option>
                    <option value="COLOMBO 01 [C1]">COLOMBO 01 [C1]</option>
                    <option value="COLOMBO 02 [C2]">COLOMBO 02 [C2]</option>
                    <option value="COLOMBO 03 [C3]">COLOMBO 03 [C3]</option>
                    <option value="COLOMBO 04 [C4]">COLOMBO 04 [C4]</option>
                    <option value="COLOMBO 05 [C5]">COLOMBO 05 [C5]</option>
                    <option value="COLOMBO 06 [C6]">COLOMBO 06 [C6]</option>
                    <option value="COLOMBO 07 [C7]">COLOMBO 07 [C7]</option>
                    <option value="COLOMBO 08 [C8]">COLOMBO 08 [C8]</option>
                    <option value="COLOMBO 09 [C9]">COLOMBO 09 [C9]</option>
                    <option value="COLOMBO 10 [C10]">COLOMBO 10 [C10]</option>
                    <option value="COLOMBO 11 [C11]">COLOMBO 11 [C11]</option>
                    <option value="COLOMBO 12 [C12]">COLOMBO 12 [C12]</option>
                    <option value="COLOMBO 13 [C13]">COLOMBO 13 [C13]</option>
                    <option value="COLOMBO 14 [C14]">COLOMBO 14 [C14]</option>
                    <option value="COLOMBO 15 [C15]">COLOMBO 15 [C15]</option>
                    <option value="DEHIWALA [DE]">DEHIWALA [DE]</option>
                    <option value="HOMAGAMA [HO]">HOMAGAMA [HO]</option>
                    <option value="KADUWELA [KA]">KADUWELA [KA]</option>
                    <option value="KESBEWA [KE]">KESBEWA [KE]</option>
                    <option value="KOTTAWA [KO]">KOTTAWA [KO]</option>
                    <option value="MAHARAGAMA [MA]">MAHARAGAMA [MA]</option>
                    <option value="MORATUWA [MO]">MORATUWA [MO]</option>
                    <option value="MOUNT LAVINIA [ML]">MOUNT LAVINIA [ML]</option>
                    <option value="NUGEGODA [NU]">NUGEGODA [NU]</option>
                    <option value="PADUKKA [PA]">PADUKKA [PA]</option>
                    <option value="PANNIPITIYA [PN]">PANNIPITIYA [PN]</option>
                    <option value="PILIYANDALA [PI]">PILIYANDALA [PI]</option>
                    <option value="RAJAGIRIYA [RA]">RAJAGIRIYA [RA]</option>
                    <option value="RATMALANA [RT]">RATMALANA [RT]</option>
                    <option value="SRI JAYAWARDENEPURA KOTTE [SJ]">SRI JAYAWARDENEPURA KOTTE [SJ]</option>
                    <option value="TALAWATUGODA [TA]">TALAWATUGODA [TA]</option>
                    <option value="WELLAMPITIYA [WE]">WELLAMPITIYA [WE]</option>
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
                    <option value="Member">Member</option>
                    <option value="Founder">Working Commitee Member</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password (min 6 characters)"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
