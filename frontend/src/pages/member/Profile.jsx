import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();
      
      if (response.data.success) {
        setProfileData(response.data.data);
        setFormData({
          phone: response.data.data.phone || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      
      const response = await userService.updateProfile(formData);
      
      if (response.data.success) {
        setSuccess('Profile updated successfully');
        setEditMode(false);
        fetchProfileData(); // Refresh data
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccountAge = (joinedDate) => {
    if (!joinedDate) return 'Unknown';
    const joined = new Date(joinedDate);
    const now = new Date();
    const diffTime = Math.abs(now - joined);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months`;
    } else {
      return `${Math.floor(diffDays / 365)} years`;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'SuperAdmin': return 'bg-red-100 text-red-800';
      case 'Founder': return 'bg-purple-100 text-purple-800';
      case 'Member': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleChangePassword = () => {
    navigate('/member/change-password');
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg">Loading profile...</div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              editMode 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {editMode ? 'Cancel Edit' : 'Edit Profile'}
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profileData?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-gray-900">{profileData?.username}</h2>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(profileData?.role)}`}>
                  {profileData?.role}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profileData?.status)}`}>
                  {profileData?.status}
                </span>
              </div>
            </div>
          </div>

          {editMode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Username</label>
                  <p className="text-gray-900 font-medium">{profileData?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{profileData?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{profileData?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Area</label>
                  <p className="text-gray-900">{profileData?.mosque_name || 'Not assigned'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Member Since</label>
                  <p className="text-gray-900">{formatDate(profileData?.joined_date)}</p>
                  <p className="text-sm text-gray-500">Account age: {getAccountAge(profileData?.joined_date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Login</label>
                  <p className="text-gray-900">{formatDate(profileData?.last_login)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Account Status</label>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profileData?.status)}`}>
                      {profileData?.status}
                    </span>
                  </div>
                </div>
                <div>
                  <button
                    onClick={handleChangePassword}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  );
};

export default Profile;