import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import userService from '../../services/userService';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    area: '',
    mobility: '',
    onRent: false,
    zakathEligible: false,
    differentlyAbled: false,
    MuallafathilQuloob: false
  });

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await userService.getProfile();
        
        if (response.success) {
          setProfile(response.data);
          
          // Initialize form data with profile values
          setFormData({
            fullName: response.data.fullName || response.data.full_name || '',
            phone: response.data.phone || '',
            dateOfBirth: response.data.dateOfBirth || response.data.date_of_birth ? 
              (response.data.dateOfBirth || response.data.date_of_birth).split('T')[0] : '',
            address: response.data.address || '',
            area: response.data.area || '',
            mobility: response.data.mobility || '',
            onRent: response.data.onRent || response.data.living_on_rent || false,
            zakathEligible: response.data.zakathEligible || response.data.zakath_eligible || false,
            differentlyAbled: response.data.differentlyAbled || response.data.differently_abled || false,
            MuallafathilQuloob: response.data.MuallafathilQuloob || response.data.muallafathil_quloob || false
          });
        } else {
          setError(response.message || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.message || 'An error occurred while loading your profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle input change in edit mode
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle profile update submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('📤 Submitting updated profile:', formData);
      
      const response = await userService.updateProfile(formData);
      
      if (response.success) {
        setProfile(response.data);
        setSuccess('Profile updated successfully');
        setEditMode(false);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit mode
  const handleCancel = () => {
    // Reset form data to current profile values
    if (profile) {
      setFormData({
        fullName: profile.fullName || profile.full_name || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || profile.date_of_birth ? 
          (profile.dateOfBirth || profile.date_of_birth).split('T')[0] : '',
        address: profile.address || '',
        area: profile.area || '',
        mobility: profile.mobility || '',
        onRent: profile.onRent || profile.living_on_rent || false,
        zakathEligible: profile.zakathEligible || profile.zakath_eligible || false,
        differentlyAbled: profile.differentlyAbled || profile.differently_abled || false,
        MuallafathilQuloob: profile.MuallafathilQuloob || profile.muallafathil_quloob || false
      });
    }
    setEditMode(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate age from date of birth
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

  if (loading && !profile) {
    return (
      <MemberLayout>
        <div className="max-w-4xl mx-auto p-6 flex justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          
          <div className="flex gap-3">
            {!editMode ? (
              <button 
                onClick={() => setEditMode(true)} 
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={handleCancel} 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  form="profile-form"
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : 'Save Changes'}
                </button>
              </>
            )}
            
            <button 
              onClick={() => navigate('/member/change-password')} 
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </button>
          </div>
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

        {profile && !editMode ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full h-16 w-16 flex items-center justify-center text-xl font-bold text-gray-600">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : profile.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-800">{profile.fullName || profile.full_name || profile.username}</h2>
                  <div className="text-sm text-gray-600">{profile.email}</div>
                  <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                    {profile.role}
                  </div>
                  {profile.memberId && (
                    <div className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-purple-100 text-purple-800">
                      ID: {profile.memberId}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Full Name</span>
                    <span className="text-gray-800">{profile.fullName || profile.full_name || '-'}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Username</span>
                    <span className="text-gray-800">{profile.username}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Email Address</span>
                    <span className="text-gray-800">{profile.email}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Phone Number</span>
                    <span className="text-gray-800">{profile.phone || '-'}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                    <span className="text-gray-800">
                      {(profile.dateOfBirth || profile.date_of_birth) ? 
                        formatDate(profile.dateOfBirth || profile.date_of_birth) : '-'}
                      {(profile.dateOfBirth || profile.date_of_birth) && 
                        ` (${calculateAge(profile.dateOfBirth || profile.date_of_birth)} years)`}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Location & Mobility</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Address</span>
                    <span className="text-gray-800">{profile.address || '-'}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Area</span>
                    <span className="text-gray-800">{profile.area || '-'}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Mobility (How you travel to mosque)</span>
                    <span className="text-gray-800">{profile.mobility || '-'}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Mosque</span>
                    <span className="text-gray-800">{profile.mosque_name || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Additional Information</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${(profile.onRent || profile.living_on_rent) ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-gray-800">Living on Rent</span>
                </div>
                
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${(profile.zakathEligible || profile.zakath_eligible) ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-gray-800">Zakath Eligible</span>
                </div>
                
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${(profile.differentlyAbled || profile.differently_abled) ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-gray-800">Differently Abled</span>
                </div>
                
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${(profile.MuallafathilQuloob || profile.muallafathil_quloob) ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-gray-800">Muallafathil Quloob (Convert)</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <div>Member since: {formatDate(profile.joined_date)}</div>
                {profile.last_login && <div>Last login: {new Date(profile.last_login).toLocaleString()}</div>}
              </div>
            </div>
          </div>
        ) : (
          editMode && profile && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <form id="profile-form" onSubmit={handleSubmit}>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Profile</h2>
                  <p className="text-sm text-gray-600">Update your personal information and preferences</p>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                          Username <span className="text-xs text-gray-500">(Cannot be changed)</span>
                        </label>
                        <input
                          type="text"
                          id="username"
                          value={profile.username}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address <span className="text-xs text-gray-500">(Cannot be changed)</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={profile.email}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
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
                      
                      <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
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
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Location & Mobility</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
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
                      
                      <div>
                        <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
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
                      
                      <div>
                        <label htmlFor="mobility" className="block text-sm font-medium text-gray-700 mb-1">
                          Mobility (How you travel to mosque)
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
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Additional Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="onRent"
                        name="onRent"
                        checked={formData.onRent}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="onRent" className="ml-2 block text-sm text-gray-900">
                        Living on Rent
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="zakathEligible"
                        name="zakathEligible"
                        checked={formData.zakathEligible}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="zakathEligible" className="ml-2 block text-sm text-gray-900">
                        Zakath Eligible
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="differentlyAbled"
                        name="differentlyAbled"
                        checked={formData.differentlyAbled}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="differentlyAbled" className="ml-2 block text-sm text-gray-900">
                        Differently Abled
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="MuallafathilQuloob"
                        name="MuallafathilQuloob"
                        checked={formData.MuallafathilQuloob}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="MuallafathilQuloob" className="ml-2 block text-sm text-gray-900">
                        Muallafathil Quloob (Convert)
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )
        )}
      </div>
    </MemberLayout>
  );
};

export default Profile;