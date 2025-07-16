import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';
import { feedsService } from '../../services/api';

const SuperAdminPostFeeds = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sendNotification: false,
    priority: 'normal',
    mosqueId: 'all' // Super Admin can post to all mosques
  });

  useEffect(() => {
    if (activeTab === 'feeds') {
      fetchFeeds();
    }
  }, [activeTab]);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const response = await feedsService.getAllFeeds();
      if (response && response.data) {
        setFeeds(response.data);
      }
    } catch (error) {
      console.error('Error fetching feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await feedsService.createFeed(formData);
      if (response && response.success) {
        alert('Feed posted successfully!');
        setFormData({
          title: '',
          content: '',
          sendNotification: false,
          priority: 'normal',
          mosqueId: 'all'
        });
        if (activeTab === 'feeds') {
          fetchFeeds();
        }
      }
    } catch (error) {
      console.error('Error creating feed:', error);
      alert('Failed to post feed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feed?')) {
      try {
        await feedsService.deleteFeed(id);
        setFeeds(feeds.filter(feed => feed.id !== id));
      } catch (error) {
        console.error('Error deleting feed:', error);
        alert('Failed to delete feed');
      }
    }
  };

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Feeds (All Mosques)</h1>
          <p className="text-gray-600">Create and manage feeds across all mosques</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('editor')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'editor'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Feed
            </button>
            <button
              onClick={() => setActiveTab('feeds')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'feeds'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Feeds
            </button>
          </nav>
        </div>

        {activeTab === 'editor' && (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Mosque
                </label>
                <select
                  value={formData.mosqueId}
                  onChange={(e) => setFormData({...formData, mosqueId: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="all">All Mosques</option>
                  <option value="1">Masjid Ul Jabbar</option>
                  <option value="2">Al-Noor Mosque</option>
                  <option value="3">Central Mosque</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows="6"
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.sendNotification}
                    onChange={(e) => setFormData({...formData, sendNotification: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Send push notification</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Feed'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'feeds' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full border-4 border-gray-300 border-t-purple-600 h-10 w-10"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mosque
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feeds.map((feed) => (
                      <tr key={feed.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{feed.title}</div>
                          <div className="text-sm text-gray-500">{feed.content.substring(0, 100)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {feed.mosque_name || 'All Mosques'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {feed.author_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            feed.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            feed.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            feed.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {feed.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(feed.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
    </SuperAdminLayout>
  );
};

export default SuperAdminPostFeeds;
