import React, { useState, useEffect } from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';
import { prayerService, mosqueService } from '../../services/api';

const MyPrayers = () => {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [recordingPrayer, setRecordingPrayer] = useState(null);
  const [mosque, setMosque] = useState(null);

  const prayerTypes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  useEffect(() => {
    fetchPrayers();
    fetchMosqueData();

    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
      const newToday = getTodayDate();
      if (selectedDate === getTodayDate() && newToday !== selectedDate) {
        setSelectedDate(newToday);
      }
    }, 60000);

    return () => clearInterval(dateInterval);
  }, [selectedDate]);

  const fetchPrayers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await prayerService.getPrayers({ date: selectedDate });
      
      if (response.data.success) {
        setPrayers(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch prayers');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchMosqueData = async () => {
    try {
      const response = await mosqueService.getMosques();
      
      if (response.data.success && response.data.data.length > 0) {
        setMosque(response.data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching mosque data:', err);
    }
  };

  const recordPrayer = async (prayerType, status, location = 'mosque', notes = '') => {
    try {
      setRecordingPrayer(prayerType);
      setError('');

      const response = await prayerService.recordPrayer({
        prayer_type: prayerType,
        prayer_date: selectedDate,
        status: status,
        location: location,
        notes: notes
      });

      if (response.data.success) {
        setPrayers(prevPrayers => {
          const filtered = prevPrayers.filter(p => {
            const prayerDate = p.prayer_date;
            return !(p.prayer_type === prayerType && prayerDate === selectedDate);
          });
          return [...filtered, response.data.data];
        });
        setError('');
      } else {
        setError(response.data.message || 'Failed to record prayer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error recording prayer');
    } finally {
      setRecordingPrayer(null);
    }
  };

  const getPrayerStatus = (prayerType) => {
    const prayer = prayers.find(p => {
      const prayerDate = p.prayer_date;
      return p.prayer_type === prayerType && prayerDate === selectedDate;
    });
    return prayer ? prayer.status : 'upcoming';
  };

  const getPrayerLocation = (prayerType) => {
    const prayer = prayers.find(p => {
      const prayerDate = p.prayer_date;
      return p.prayer_type === prayerType && prayerDate === selectedDate;
    });
    return prayer ? prayer.location : 'mosque';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'prayed': return 'bg-green-100 text-green-800 border-green-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'prayed':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'missed':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatPrayerTime = (prayerType) => {
    if (!mosque?.today_prayer_times?.[prayerType]) return null;
    
    try {
      const time = mosque.today_prayer_times[prayerType];
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg">Loading prayers...</div>
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Prayers</h1>
            <p className="text-gray-600">
              Today is {currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Time</p>
            <p className="text-lg font-semibold text-blue-600">
              {currentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Date</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-sm text-gray-600">
                {selectedDate === getTodayDate() 
                  ? '📅 Today (Current)' 
                  : `📅 ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}`
                }
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedDate(getTodayDate())}
                className={`px-3 py-1 rounded text-sm ${
                  selectedDate === getTodayDate()
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const year = yesterday.getFullYear();
                  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
                  const day = String(yesterday.getDate()).padStart(2, '0');
                  const yesterdayStr = `${year}-${month}-${day}`;
                  setSelectedDate(yesterdayStr);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded text-sm"
              >
                Yesterday
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prayerTypes.map((prayerType) => {
            const status = getPrayerStatus(prayerType);
            const location = getPrayerLocation(prayerType);
            const isRecording = recordingPrayer === prayerType;
            const prayerTime = formatPrayerTime(prayerType);

            return (
              <div key={prayerType} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{prayerType}</h3>
                    {prayerTime && (
                      <p className="text-sm font-medium text-blue-600">{prayerTime}</p>
                    )}
                  </div>
                  {getStatusIcon(status)}
                </div>

                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mb-4 ${getStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>

                {status !== 'upcoming' && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Location: </span>
                    <span className="text-sm font-medium capitalize">{location}</span>
                  </div>
                )}

                <div className="space-y-2">
                  {status === 'upcoming' && (
                    <>
                      <button
                        onClick={() => recordPrayer(prayerType, 'prayed', 'mosque')}
                        disabled={isRecording}
                        className={`w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          isRecording ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isRecording ? 'Recording...' : 'Mark as Prayed (Mosque)'}
                      </button>
                      <button
                        onClick={() => recordPrayer(prayerType, 'prayed', 'home')}
                        disabled={isRecording}
                        className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isRecording ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isRecording ? 'Recording...' : 'Mark as Prayed (Home)'}
                      </button>
                      <button
                        onClick={() => recordPrayer(prayerType, 'missed')}
                        disabled={isRecording}
                        className={`w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          isRecording ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isRecording ? 'Recording...' : 'Mark as Missed'}
                      </button>
                    </>
                  )}

                  {status !== 'upcoming' && (
                    <button
                      onClick={() => recordPrayer(prayerType, 'upcoming')}
                      disabled={isRecording}
                      className={`w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                        isRecording ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isRecording ? 'Updating...' : 'Reset Status'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Prayer Summary for {selectedDate}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {prayers.filter(p => {
                  const prayerDate = p.prayer_date;
                  return prayerDate === selectedDate && p.status === 'prayed';
                }).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {prayers.filter(p => {
                  const prayerDate = p.prayer_date;
                  return prayerDate === selectedDate && p.status === 'missed';
                }).length}
              </div>
              <div className="text-sm text-gray-600">Missed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {prayerTypes.length - prayers.filter(p => {
                  const prayerDate = p.prayer_date;
                  return prayerDate === selectedDate && p.status !== 'upcoming';
                }).length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default MyPrayers;