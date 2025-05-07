import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mosqueService } from '../../services/api';

const MyMosque = () => {
  const [mosque, setMosque] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMosqueData = async () => {
      try {
        setLoading(true);
        // In a real implementation, you would get the user's mosque ID from user data
        // and pass it to the service
        const mosqueData = await mosqueService.getMosques();
        // For now, we'll just use the first mosque in the list
        setMosque(mosqueData.data[0] || {
          name: "Sample Mosque",
          address: "123 Prayer St, Faith City",
          imamName: "Imam Abdullah",
          prayerTimes: {
            fajr: "5:30 AM",
            dhuhr: "1:15 PM",
            asr: "4:45 PM",
            maghrib: "7:30 PM",
            isha: "9:00 PM"
          }
        });
      } catch (err) {
        setError("Failed to load mosque information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMosqueData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">My Mosque</h1>
        
        {mosque ? (
          <div>
            <div className="bg-green-50 p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-bold mb-2">{mosque.name}</h2>
              <p className="text-gray-700 mb-2"><span className="font-medium">Address:</span> {mosque.address}</p>
              <p className="text-gray-700"><span className="font-medium">Imam:</span> {mosque.imamName}</p>
            </div>
            
            <h3 className="text-lg font-bold mb-3">Prayer Times</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-green-100 p-4 rounded-lg shadow text-center">
                <h4 className="font-bold">Fajr</h4>
                <p>{mosque.prayerTimes?.fajr || "5:30 AM"}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow text-center">
                <h4 className="font-bold">Dhuhr</h4>
                <p>{mosque.prayerTimes?.dhuhr || "1:15 PM"}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow text-center">
                <h4 className="font-bold">Asr</h4>
                <p>{mosque.prayerTimes?.asr || "4:45 PM"}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow text-center">
                <h4 className="font-bold">Maghrib</h4>
                <p>{mosque.prayerTimes?.maghrib || "7:30 PM"}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg shadow text-center">
                <h4 className="font-bold">Isha</h4>
                <p>{mosque.prayerTimes?.isha || "9:00 PM"}</p>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-3">Recent Announcements</h3>
            <div className="border rounded-lg p-4">
              <p className="italic text-gray-500">No recent announcements</p>
            </div>
          </div>
        ) : (
          <p>You are not associated with any mosque yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyMosque;