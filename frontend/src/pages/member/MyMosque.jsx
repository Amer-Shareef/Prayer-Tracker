import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';

const MyMosque = () => {
  const [mosque, setMosque] = useState({
    name: 'Masjid Al-Taqwa',
    address: '123 Kawdana Road, Dehiwala, 10350',
    phone: '077 123 4567',
    imam: 'Imam Abdurahman',
    prayerTimes: {
      fajr: '4:50 AM',
      dhuhr: '12:30 PM',
      asr: '3:20 PM',
      maghrib: '6:20 PM',
      isha: '7:30 PM',
      jumuah: '12:30 PM'
    }
  });
  
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Ramadan Preparation Workshop',
      date: 'May 12, 2025',
      content: 'Join us for a special workshop to prepare for the upcoming Ramadan. Topics include spiritual preparation, meal planning, and maintaining health during fasting.'
    },
    {
      id: 2,
      title: 'Community Iftar Planning',
      date: 'May 15, 2025',
      content: 'We are organizing community iftars for the coming Ramadan. Please register to volunteer or sponsor meals.'
    },
    {
      id: 3,
      title: 'Mosque Cleaning Day',
      date: 'May 10, 2025',
      content: 'Please join us for our monthly mosque cleaning day. Bring your family and earn rewards while helping maintain our beautiful mosque.'
    }
  ]);
  
  useEffect(() => {
    // In a real app, we would fetch this data from API
    // For now, we'll use the static data defined above
    
    // Load Google Maps script
    const googleMapScript = document.createElement('script');
    googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places`;
    googleMapScript.async = true;
    googleMapScript.defer = true;
    window.document.body.appendChild(googleMapScript);
    
    googleMapScript.addEventListener('load', () => {
      if (window.google) {
        initMap();
      }
    });
    
    return () => {
      // Cleanup
      window.document.body.removeChild(googleMapScript);
    };
  }, []);
  
  const initMap = () => {
    // Sample coordinates for the mosque
    const mosqueLocation = { lat: 34.0522, lng: -118.2437 };
    
    const mapElement = document.getElementById('mosque-map');
    if (mapElement && window.google) {
      const map = new window.google.maps.Map(mapElement, {
        center: mosqueLocation,
        zoom: 15,
      });
      
      new window.google.maps.Marker({
        position: mosqueLocation,
        map: map,
        title: mosque.name
      });
    }
  };

  return (
    <MemberLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Mosque</h1>
        
        {/* Mosque Information Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{mosque.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="font-semibold text-gray-700 block mb-1">Address:</label>
                <p>{mosque.address}</p>
              </div>
              <div className="mb-4">
                <label className="font-semibold text-gray-700 block mb-1">Phone:</label>
                <p>{mosque.phone}</p>
              </div>
              <div className="mb-4">
                <label className="font-semibold text-gray-700 block mb-1">Imam:</label>
                <p>{mosque.imam}</p>
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Jumu'ah Prayer:</label>
                <p className="text-green-600">{mosque.prayerTimes.jumuah}</p>
              </div>
            </div>
            
            {/* Google Map */}
            <div>
              <div 
                id="mosque-map" 
                className="h-64 rounded-lg border border-gray-300" 
                style={{ width: '100%' }}
              >
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <p className="text-gray-500">Map loading...</p>
                </div>
              </div>
              <div className="mt-2">
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mosque.address)}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 text-sm hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Prayer Times Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Prayer Times</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(mosque.prayerTimes)
              .filter(([key]) => key !== 'jumuah')  // Exclude Jumuah from this display
              .map(([prayer, time]) => (
                <div 
                  key={prayer}
                  className="bg-green-50 rounded-lg p-4 text-center"
                >
                  <h3 className="font-bold text-lg capitalize">{prayer}</h3>
                  <p className="text-green-600 text-lg">{time}</p>
                </div>
              ))
            }
          </div>
        </div>
        
        {/* Announcements Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Mosque Announcements</h2>
          
          {announcements.length === 0 ? (
            <p className="text-gray-500">No current announcements</p>
          ) : (
            <div className="space-y-4">
              {announcements.map(announcement => (
                <div 
                  key={announcement.id}
                  className="border-l-4 border-green-500 pl-4 py-1"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold">{announcement.title}</h3>
                    <span className="text-sm text-gray-500">{announcement.date}</span>
                  </div>
                  <p className="text-gray-700">{announcement.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  );
};

export default MyMosque;