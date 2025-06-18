import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { useAuth } from '../../context/AuthContext';
import { mosqueService, announcementService } from '../../services/api';

const MyMosque = () => {
  const { user } = useAuth();
  const [mosque, setMosque] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMosqueData();
  }, []);

  const fetchMosqueData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch mosque information
      const mosqueResponse = await mosqueService.getMosques();
      if (mosqueResponse.data.success && mosqueResponse.data.data.length > 0) {
        const mosqueData = mosqueResponse.data.data[0];
        
        // Parse prayer_times if it's a string
        if (typeof mosqueData.prayer_times === 'string') {
          try {
            mosqueData.prayer_times = JSON.parse(mosqueData.prayer_times);
          } catch (e) {
            console.error('Error parsing prayer times:', e);
            mosqueData.prayer_times = null;
          }
        }
        
        setMosque(mosqueData);
      }

      // Fetch announcements
      const announcementResponse = await announcementService.getAnnouncements();
      if (announcementResponse.data.success) {
        setAnnouncements(announcementResponse.data.data);
      }

    } catch (err) {
      console.error('Error fetching mosque data:', err);
      setError('Error loading mosque information');
    } finally {
      setLoading(false);
    }
  };

  const formatPrayerTime = (time) => {
    if (!time) return 'Not set';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg">Loading mosque information...</div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Area</h1>

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

        {mosque ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mosque Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Area Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{mosque.name}</p>
                </div>
                
                {mosque.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-gray-900">{mosque.address}</p>
                  </div>
                )}
                
                {mosque.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-gray-900">{mosque.phone}</p>
                  </div>
                )}
                
                {mosque.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">{mosque.email}</p>
                  </div>
                )}
                
                {mosque.founder_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Founder</label>
                    <p className="mt-1 text-gray-900">{mosque.founder_name}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Members</label>
                  <p className="mt-1 text-gray-900">{mosque.member_count || 0} members</p>
                </div>
              </div>
            </div>

            {/* Prayer Times */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Prayer Times</h2>
              
              {mosque.prayer_times ? (
                <div className="space-y-3">
                  {/* Fixed prayer order - Isha will be last */}
                  {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
                    const time = mosque.prayer_times[prayer] || mosque.prayer_times[prayer.toLowerCase()];
                    return (
                      <div key={prayer} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{prayer}</span>
                        <span className="text-lg font-semibold text-blue-600">{formatPrayerTime(time)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Prayer times not set</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No mosque assigned</h3>
              <p className="mt-1 text-sm text-gray-500">You are not currently assigned to any mosque.</p>
            </div>
          </div>
        )}

        {/* Announcements */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Mosque Announcements</h2>
          
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{announcement.content}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>By {announcement.author_name}</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  
                  {announcement.expires_at && (
                    <div className="mt-2 text-xs text-gray-500">
                      Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
              <p className="mt-1 text-sm text-gray-500">There are no announcements from your mosque at this time.</p>
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  );
};

export default MyMosque;