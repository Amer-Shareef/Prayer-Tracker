import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';
import feedsService from '../../services/feedsService';

const PostFeeds = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get editId from URL params if available
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get('edit') ? parseInt(queryParams.get('edit')) : null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    sendNotification: false,
    priority: 'normal'
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch feeds from API
  const fetchFeeds = async () => {
    try {
      setLoading(true);
      setApiError('');
      
      const response = await feedsService.getAllFeeds();
      if (response.success) {
        setFeeds(response.data);
      } else {
        setApiError(response.message || 'Failed to fetch feeds');
      }
    } catch (error) {
      console.error('Error fetching feeds:', error);
      setApiError(error.message || 'Failed to fetch feeds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch feeds from API
    fetchFeeds();
    
    // Check if we're in edit mode
    if (editId) {
      const loadFeed = async () => {
        try {
          const response = await feedsService.getFeedById(editId);
          if (response.success) {
            setFormData({
              title: response.data.title,
              content: response.data.content,
              image_url: response.data.image_url || '',
              video_url: response.data.video_url || '',
              sendNotification: response.data.send_notification === 1,
              priority: response.data.priority || 'normal'
            });
            setIsEditing(true);
          }
        } catch (error) {
          console.error('Error loading feed:', error);
        }
      };
      
      loadFeed();
    }
  }, [editId]);
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Feed title is required";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "Feed content is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setApiError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setApiError('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setApiError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to S3
  const uploadImage = async () => {
    if (!selectedFile) return null;
    
    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', selectedFile);
      
      const response = await feedsService.uploadImage(formDataUpload);
      
      if (response.success) {
        return response.data.image_url;
      } else {
        throw new Error(response.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setApiError(error.message || 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Clear image selection
  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
    // Clear file input
    const fileInput = document.getElementById('image-file');
    if (fileInput) fileInput.value = '';
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError('');
    
    try {
      let imageUrl = formData.image_url;
      
      // Upload image if a file is selected
      if (selectedFile) {
        const uploadedImageUrl = await uploadImage();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        } else {
          setLoading(false);
          return; // Stop if image upload failed
        }
      }
      
      const dataToSend = {
        title: formData.title,
        content: formData.content,
        image_url: imageUrl,
        video_url: formData.video_url,
        send_notification: formData.sendNotification,
        priority: formData.priority || 'normal'
      };
      
      let response;
      
      if (isEditing) {
        // Update feed
        response = await feedsService.updateFeed(editId, dataToSend);
        setSuccessMessage("Feed updated successfully!");
      } else {
        // Create new feed
        response = await feedsService.createFeed(dataToSend);
        setSuccessMessage("Feed created successfully!");
      }
      
      if (response.success) {
        // Reset form
        setFormData({
          title: '',
          content: '',
          image_url: '',
          video_url: '',
          sendNotification: false,
          priority: 'normal'
        });
        
        // Clear image selection
        clearImage();
        
        setIsEditing(false);
        setSuccess(true);
        setActiveTab('list');
        
        // Refresh feeds list
        fetchFeeds();
        
        // Reset URL parameter if we were editing
        if (editId) {
          navigate('/founder/post-feeds');
        }
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setApiError(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving feed:', error);
      setApiError(error.message || 'Failed to save feed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle feed deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this feed?")) {
      try {
        setLoading(true);
        
        const response = await feedsService.deleteFeed(id);
        
        if (response.success) {
          // Refresh feeds list
          fetchFeeds();
          
          if (editId === id) {
            // Reset form and navigate back if we were editing the deleted feed
            setFormData({
              title: '',
              content: '',
              sendNotification: false,
              priority: 'normal'
            });
            setIsEditing(false);
            navigate('/founder/post-feeds');
          }
          
          setSuccessMessage("Feed deleted successfully!");
          setSuccess(true);
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            setSuccess(false);
          }, 3000);
        } else {
          setApiError(response.message || 'Failed to delete feed');
        }
      } catch (error) {
        console.error('Error deleting feed:', error);
        setApiError(error.message || 'Failed to delete feed');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <FounderLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEditing ? 'Edit Feed' : 'Create New Feed'}
        </h1>
        
        {/* Success message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* API Error message */}
        {apiError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{apiError}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center ${
                  activeTab === 'editor'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('editor')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'Edit Feed' : 'Create New'}
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center ${
                  activeTab === 'list'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                All Feeds
                <span className="ml-1 bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {feeds.length}
                </span>
              </button>
            </li>
          </ul>
        </div>
        
        {activeTab === 'editor' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              {/* Feed Title */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
                  Feed Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter feed title"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              
              {/* Priority Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="priority">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              {/* Feed Content */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="content">
                  Feed Content*
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows="6"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.content ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter feed content"
                ></textarea>
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1">{errors.content}</p>
                )}
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Image (Optional)
                </label>
                
                {/* Image upload options */}
                <div className="space-y-4">
                  {/* File upload */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Upload from computer:</label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        id="image-file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={clearImage}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                  </div>

                  {/* Image preview */}
                  {imagePreview && (
                    <div className="mt-3">
                      <label className="block text-sm text-gray-600 mb-2">Preview:</label>
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OR divider */}
                  <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>

                  {/* Image URL input */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Image URL:</label>
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://example.com/image.jpg"
                      disabled={selectedFile}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add an image URL to display with your feed
                    </p>
                  </div>

                  {/* Display existing image URL */}
                  {formData.image_url && !selectedFile && (
                    <div className="mt-3">
                      <label className="block text-sm text-gray-600 mb-2">Current image:</label>
                      <img
                        src={formData.image_url}
                        alt="Current"
                        className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Video URL */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="video_url">
                  Video URL (Optional)
                </label>
                <input
                  type="url"
                  id="video_url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Add a YouTube or video URL to embed with your feed
                </p>
              </div>
              
              {/* Send Notification */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendNotification"
                    name="sendNotification"
                    checked={formData.sendNotification}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="ml-2 text-gray-700" htmlFor="sendNotification">
                    Send notification to all mosque members
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1 ml-6">
                  Members will receive a push notification about this feed
                </p>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      title: '',
                      content: '',
                      image_url: '',
                      video_url: '',
                      sendNotification: false,
                      priority: 'normal'
                    });
                    clearImage();
                    setIsEditing(false);
                    if (editId) {
                      navigate('/founder/post-feeds');
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mr-2"
                  disabled={loading}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                  disabled={loading || uploadingImage}
                >
                  {loading || uploadingImage ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {uploadingImage ? 'Uploading Image...' : (isEditing ? 'Updating...' : 'Publishing...')}
                    </span>
                  ) : (
                    isEditing ? 'Update Feed' : 'Publish Feed'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {/* Feed List */}
            {loading && !feeds.length ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading feeds...</p>
              </div>
            ) : feeds.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No feeds yet</p>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create New Feed
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Feed
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th> */}
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feeds.map(feed => (
                      <tr key={feed.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{feed.title}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {feed.content}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(feed.priority)}`}>
                            {feed.priority?.charAt(0).toUpperCase() + feed.priority?.slice(1) || 'Normal'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Created: {formatDate(feed.created_at || feed.createdAt)}
                          </div>
                          {/* <div className="text-sm text-gray-500">
                            {feed.expires_at || feed.expiresAt ? 
                              `Expires: ${formatDate(feed.expires_at || feed.expiresAt)}` : 
                              'No expiration'}
                          </div> */}
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {feed.views || 0} views
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setFormData({
                                title: feed.title,
                                content: feed.content,
                                image_url: feed.image_url || '',
                                video_url: feed.video_url || '',
                                sendNotification: feed.send_notification === 1,
                                priority: feed.priority || 'normal'
                              });
                              navigate(`/founder/post-feeds?edit=${feed.id}`);
                              setActiveTab('editor');
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(feed.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </FounderLayout>
  );
};

export default PostFeeds;