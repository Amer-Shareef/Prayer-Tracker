import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FounderLayout from '../../components/layouts/FounderLayout';

const PostAnnouncement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get editId from URL params if available
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get('edit') ? parseInt(queryParams.get('edit')) : null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expiry: '',
    priority: 'normal',
    sendNotification: false
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
    // All announcements
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: "Ramadan Preparation Workshop",
      content: "Join us for a special workshop to prepare for the upcoming Ramadan. Topics include spiritual preparation, meal planning, and maintaining health during fasting. The workshop will be held in the main hall after Isha prayer next Tuesday.",
      createdAt: "2025-05-05T14:30:00",
      expiresAt: "2025-05-12",
      priority: "high",
      author: "Mohamed Imthiaz",
      views: 78
    },
    {
      id: 2,
      title: "Community Iftar Planning",
      content: "We are organizing community iftars for the coming Ramadan. Please register to volunteer or sponsor meals. We need volunteers for setup, cooking, serving, and cleanup. Please sign up at the reception desk or contact Br. Rizwan.",
      createdAt: "2025-05-05T16:45:00",
      expiresAt: "2025-05-15",
      priority: "normal",
      author: "Ahmed Fazil",
      views: 65
    },
    {
      id: 3,
      title: "Mosque Cleaning Day",
      content: "Please join us for our monthly mosque cleaning day. Bring your family and earn rewards while helping maintain our beautiful mosque. Cleaning supplies will be provided. Lunch will be served for all volunteers.",
      createdAt: "2025-05-06T09:15:00",
      expiresAt: "2025-05-10",
      priority: "normal",
      author: "Abdullah Rahman",
      views: 42
    },
    {
      id: 4,
      title: "Schedule Change for Isha Prayer",
      content: "Please note that starting next week, the Isha prayer will be held at 9:15 PM instead of 9:00 PM to accommodate the changing sunset times. Please update your schedules accordingly.",
      createdAt: "2025-05-07T11:20:00",
      expiresAt: "2025-05-14",
      priority: "urgent",
      author: "Abdullah Rahman",
      views: 95
    }
  ]);

  useEffect(() => {
    // In the app, fetch announcements from your API
    // For now, we'll use the static data defined above
    
    // Check if we're in edit mode
    if (editId) {
      const announcementToEdit = announcements.find(a => a.id === editId);
      if (announcementToEdit) {
        setFormData({
          title: announcementToEdit.title,
          content: announcementToEdit.content,
          expiry: announcementToEdit.expiresAt,
          priority: announcementToEdit.priority,
          sendNotification: false
        });
        setIsEditing(true);
      }
    }
  }, [editId, announcements]);
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }
    
    if (!formData.expiry) {
      newErrors.expiry = "Expiry date is required";
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
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEditing) {
      // Update announcement
      setAnnouncements(prev => prev.map(announcement => {
        if (announcement.id === editId) {
          return {
            ...announcement,
            title: formData.title,
            content: formData.content,
            expiresAt: formData.expiry,
            priority: formData.priority,
            updatedAt: new Date().toISOString()
          };
        }
        return announcement;
      }));
      
      setSuccessMessage("Announcement updated successfully!");
    } else {
      // Create new announcement
      const newAnnouncement = {
        id: Date.now(),
        title: formData.title,
        content: formData.content,
        createdAt: new Date().toISOString(),
        expiresAt: formData.expiry,
        priority: formData.priority,
        author: "Abdullah Rahman", // In a real app, this would be the current user
        views: 0
      };
      
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      setSuccessMessage("Announcement created successfully!");
    }
    
    // Reset form
    setFormData({
      title: '',
      content: '',
      expiry: '',
      priority: 'normal',
      sendNotification: false
    });
    
    setIsEditing(false);
    setSuccess(true);
    setActiveTab('list');
    
    // Reset URL parameter if we were editing
    if (editId) {
      navigate('/founder/post-announcement');
    }
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };
  
  // Handle announcement deletion
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
      
      if (editId === id) {
        // Reset form and navigate back if we were editing the deleted announcement
        setFormData({
          title: '',
          content: '',
          expiry: '',
          priority: 'normal',
          sendNotification: false
        });
        setIsEditing(false);
        navigate('/founder/post-announcement');
      }
      
      setSuccessMessage("Announcement deleted successfully!");
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
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
          {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
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
                {isEditing ? 'Edit Announcement' : 'Create New'}
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
                All Announcements
                <span className="ml-1 bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {announcements.length}
                </span>
              </button>
            </li>
          </ul>
        </div>
        
        {activeTab === 'editor' ? (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
                  Announcement Title*
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
                  placeholder="Enter announcement title"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              
              {/* Content */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="content">
                  Announcement Content*
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
                  placeholder="Enter announcement content"
                ></textarea>
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1">{errors.content}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Expiry Date */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="expiry">
                    Expiry Date*
                  </label>
                  <input
                    type="date"
                    id="expiry"
                    name="expiry"
                    value={formData.expiry}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.expiry ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.expiry && (
                    <p className="text-red-500 text-sm mt-1">{errors.expiry}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    The announcement will be hidden after this date
                  </p>
                </div>
                
                {/* Priority */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="priority">
                    Priority Level
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
                  {formData.priority === 'urgent' 
                    ? 'Urgent announcements automatically send notifications' 
                    : 'Members will receive a push notification about this announcement'}
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
                      expiry: '',
                      priority: 'normal',
                      sendNotification: false
                    });
                    setIsEditing(false);
                    if (editId) {
                      navigate('/founder/post-announcement');
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
                  {isEditing ? 'Update Announcement' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {/* Announcement List */}
            {announcements.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No announcements yet</p>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create New Announcement
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Announcement
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
                    {announcements.map(announcement => (
                      <tr key={announcement.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{announcement.title}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {announcement.content}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(announcement.priority)}`}>
                            {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Created: {formatDate(announcement.createdAt)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Expires: {formatDate(announcement.expiresAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {announcement.views} views
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setFormData({
                                title: announcement.title,
                                content: announcement.content,
                                expiry: announcement.expiresAt,
                                priority: announcement.priority,
                                sendNotification: false
                              });
                              navigate(`/founder/post-announcement?edit=${announcement.id}`);
                              setActiveTab('editor');
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(announcement.id)}
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

export default PostAnnouncement;