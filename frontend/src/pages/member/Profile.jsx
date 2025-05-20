import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {  const { user } = useAuth();
  const [profile, setProfile] = useState({
    firstName: 'Mohamed',
    lastName: 'Rizwan',
    username: 'testmember',
    email: 'rizwan@example.com',
    phone: '+94 77 123 4567',
    address: '23 Baseline Road, Colombo 09',
    mosque: 'Masjid Dawatagaha',
    joinedDate: '2025-05-01',
    avatar: null
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  useEffect(() => {
    // In a real app, we would fetch the user's profile data from the API
    // For now, we'll use the static data defined above
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setChangePassword(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, you would send the updated profile to your API
    setProfile(editedProfile);
    setIsEditing(false);
    
    // Show success message
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    // Reset states
    setPasswordError(null);
    setPasswordSuccess(false);
    
    // Simple validation
    if (changePassword.newPassword !== changePassword.confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }
    
    if (changePassword.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }
    
    // In a real app, you would send the password change request to your API
    
    // Reset form and show success message
    setChangePassword({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 4000);
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        
        {/* Success message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <div className="flex">
              <div className="py-1">
                <svg className="h-6 w-6 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-bold">Success!</p>
                <p>Your profile has been updated successfully.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <div className="flex">
              <div className="py-1">
                <svg className="h-6 w-6 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Profile Information</h2>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile(profile);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  form="profile-form"
                  type="submit"
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row">
            {/* Avatar */}
            <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
              <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden mb-4">
                {(isEditing ? editedProfile.avatar : profile.avatar) ? (
                  <img
                    src={isEditing ? editedProfile.avatar : profile.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-500 text-4xl font-bold">
                    {profile.firstName && profile.lastName 
                      ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`
                      : 'U'}
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div>
                  <label className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg cursor-pointer">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
              
              <div className="text-center mt-4">
                <h3 className="font-bold text-lg">{profile.firstName} {profile.lastName}</h3>
                <p className="text-gray-600">Member since {new Date(profile.joinedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p className="mt-2 text-green-600">
                  {profile.mosque}
                </p>
              </div>
            </div>
            
            {/* Profile Details */}
            <div className="md:w-2/3 md:pl-6">
              {isEditing ? (
                <form id="profile-form" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="firstName">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={editedProfile.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="lastName">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={editedProfile.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={editedProfile.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="phone">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={editedProfile.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="address">
                        Address
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        rows="3"
                        value={editedProfile.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      ></textarea>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-600 text-sm">First Name</p>
                    <p className="font-medium">{profile.firstName}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Last Name</p>
                    <p className="font-medium">{profile.lastName}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Username</p>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Email Address</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 text-sm">Phone Number</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-gray-600 text-sm">Address</p>
                    <p className="font-medium">{profile.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Change Password */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Change Password</h2>
          
          {passwordSuccess && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
              <div className="flex">
                <div className="py-1">
                  <svg className="h-6 w-6 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Success!</p>
                  <p>Your password has been changed successfully.</p>
                </div>
              </div>
            </div>
          )}
          
          {passwordError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <div className="flex">
                <div className="py-1">
                  <svg className="h-6 w-6 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Error</p>
                  <p>{passwordError}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="currentPassword">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={changePassword.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <hr className="my-2" />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={changePassword.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  minLength="8"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={changePassword.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
        
        {/* Account Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Account Settings</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Notifications</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                  defaultChecked={true}
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-gray-700">
                  Receive email notifications
                </label>
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="smsNotifications"
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                  defaultChecked={true}
                />
                <label htmlFor="smsNotifications" className="ml-2 block text-gray-700">
                  Receive SMS notifications
                </label>
              </div>
            </div>
            
            <hr />
            
            <div>
              <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
              <button
                className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default Profile;