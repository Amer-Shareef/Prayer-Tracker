import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { prayerService } from '../../services/api';

const MyPrayers = () => {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // For demonstration purposes
  const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const [selectedPrayer, setSelectedPrayer] = useState('');
  const [attended, setAttended] = useState(true);

  useEffect(() => {
    const fetchPrayers = async () => {
      try {
        setLoading(true);
        // In a real app, this would get prayers from the backend
        // const response = await prayerService.getPrayers();
        // setPrayers(response.data);
        
        // For demo, generate sample data
        const demoData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          demoData.push({
            date: dateStr,
            day: daysOfWeek[date.getDay()],
            prayers: {
              Fajr: Math.random() > 0.3,
              Dhuhr: Math.random() > 0.2,
              Asr: Math.random() > 0.25,
              Maghrib: Math.random() > 0.1,
              Isha: Math.random() > 0.15
            }
          });
        }
        setPrayers(demoData);
      } catch (err) {
        setError("Failed to load prayer data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrayers();
  }, []);
  
  const handlePrayerRecord = async (e) => {
    e.preventDefault();
    if (!selectedPrayer) return;
    
    try {
      // This would be an API call in a real app
      // await prayerService.recordPrayer({ prayer: selectedPrayer, attended });
      
      // For demo, update the UI directly
      const today = new Date().toISOString().split('T')[0];
      setPrayers(prev => {
        return prev.map(day => {
          if (day.date === today) {
            return {
              ...day,
              prayers: {
                ...day.prayers,
                [selectedPrayer]: attended
              }
            };
          }
          return day;
        });
      });
      
      setSelectedPrayer('');
      // Show success message
      alert(`${selectedPrayer} prayer recorded successfully!`);
    } catch (err) {
      setError("Failed to record prayer");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  // Calculate statistics
  const getTotalPrayed = () => {
    let count = 0;
    prayers.forEach(day => {
      Object.values(day.prayers).forEach(prayed => {
        if (prayed) count++;
      });
    });
    return count;
  };
  
  const getTotalPossible = () => prayers.length * 5; // 5 prayers per day
  
  const getPercentage = () => {
    const prayed = getTotalPrayed();
    const possible = getTotalPossible();
    return possible > 0 ? Math.round((prayed / possible) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">My Prayers</h1>
        
        <div className="bg-green-50 p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">Weekly Statistics</h2>
          <div className="flex items-center mb-4">
            <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
              <div 
                className="bg-green-500 h-4 rounded-full" 
                style={{ width: `${getPercentage()}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{getPercentage()}%</span>
          </div>
          <p className="text-gray-700">
            You've attended {getTotalPrayed()} out of {getTotalPossible()} prayers this week.
          </p>
        </div>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Record Today's Prayer</h2>
          <form onSubmit={handlePrayerRecord} className="flex flex-wrap items-center gap-4">
            <div className="flex-grow min-w-[200px]">
              <select 
                value={selectedPrayer} 
                onChange={(e) => setSelectedPrayer(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select Prayer</option>
                {prayerNames.map(prayer => (
                  <option key={prayer} value={prayer}>{prayer}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="attendance"
                  checked={attended}
                  onChange={() => setAttended(true)}
                  className="h-4 w-4 text-green-600"
                />
                <span className="ml-2">Attended</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="attendance"
                  checked={!attended}
                  onChange={() => setAttended(false)}
                  className="h-4 w-4 text-red-600"
                />
                <span className="ml-2">Missed</span>
              </label>
            </div>
            <button 
              type="submit" 
              className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
            >
              Record
            </button>
          </form>
        </div>
        
        <h2 className="text-lg font-semibold mb-4">Past 7 Days</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Date</th>
                {prayerNames.map(prayer => (
                  <th key={prayer} className="py-3 px-4 text-center">{prayer}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prayers.map((day, index) => (
                <tr key={index} className="border-t">
                  <td className="py-3 px-4">
                    <div className="font-medium">{day.day}</div>
                    <div className="text-xs text-gray-500">{day.date}</div>
                  </td>
                  {prayerNames.map(prayer => (
                    <td key={prayer} className="py-3 px-4 text-center">
                      {day.prayers[prayer] ? (
                        <span className="inline-block w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-block w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center">
                          ✗
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyPrayers;