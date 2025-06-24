import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';
import feedsService from '../../services/feedsService';

const ReminderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get editId from URL params if available
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get('edit') ? parseInt(queryParams.get('edit')) : null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    image: null,
    content: '',
    sendNotification: false
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [feeds, setFeeds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch feeds from API
    const fetchFeeds = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await feedsService.getAllFeeds();
        setFeeds(response.data || []);
      } catch (err) {
        console.error("Error fetching feeds:", err);
        setError("Failed to load feeds. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeeds();
    
    // Check if we're in edit mode
    if (editId) {
      const fetchFeed = async () => {
        try {
          const response = await feedsService.getFeedById(editId);
          if (response.data) {
            setFormData({
              title: response.data.title,
              image: response.data.image_url,
              content: response.data.content,
              sendNotification: response.data.send_notification
            });
            setIsEditing(true);
          }
        } catch (err) {
          console.error("Error fetching feed for editing:", err);
          setError("Failed to load feed for editing.");
        }
      };
      
      fetchFeed();
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
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const feedData = {
        title: formData.title,
        content: formData.content,
        send_notification: formData.sendNotification,
        image_url: formData.image
      };
      
      let response;
      
      if (isEditing) {
        // Update feed
        response = await feedsService.updateFeed(editId, feedData);
        setSuccessMessage("Feed updated successfully!");
        
        // Update the state with the edited feed
        setFeeds(prev => prev.map(feed => {
          if (feed.id === editId) {
            return response.data;
          }
          return feed;
        }));
      } else {
        // Create new feed
        response = await feedsService.createFeed(feedData);
        setSuccessMessage("Feed created successfully!");
        
        // Add the new feed to the state
        setFeeds(prev => [response.data, ...prev]);
      }
      
      // Reset form
      setFormData({
        title: '',
        image: null,
        content: '',
        sendNotification: false
      });
      
      setIsEditing(false);
      setSuccess(true);
      setActiveTab('list');
      
      // Reset URL parameter if we were editing
      if (editId) {
        navigate('/founder/reminder');
      }
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error submitting feed:", err);
      setError(err.message || "Failed to save feed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle feed deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this feed?")) {
      try {
        setIsLoading(true);
        await feedsService.deleteFeed(id);
        setFeeds(prev => prev.filter(feed => feed.id !== id));
        setSuccessMessage("Feed deleted successfully!");
        setSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } catch (err) {
        console.error("Error deleting feed:", err);
        setError("Failed to delete feed. Please try again.");
      } finally {
        setIsLoading(false);
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
  
  // Get minimum date for expiry (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
              
              {/* Feed Image */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="image">
                  Feed Image
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleInputChange}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload an image for your feed (optional)
                </p>
                {formData.image && (
                  <div className="mt-2">
                    <img 
                      src={URL.createObjectURL(formData.image)} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
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
                      image: null,
                      content: '',
                      sendNotification: false
                    });
                    setIsEditing(false);
                    if (editId) {
                      navigate('/founder/reminder');
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mr-2"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                >
                  {isEditing ? 'Update Feed' : 'Publish Feed'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {/* Feed List */}
            {feeds.length === 0 ? (
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
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
                            {feed.priority.charAt(0).toUpperCase() + feed.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Created: {formatDate(feed.createdAt)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Expires: {formatDate(feed.expiresAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {feed.views} views
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setFormData({
                                title: feed.title,
                                image: feed.image,
                                content: feed.content,
                                sendNotification: false
                              });
                              navigate(`/founder/reminder?edit=${feed.id}`);
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

export default ReminderPage;