import React, { useState, useEffect } from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';
import { useAuth } from '../../context/AuthContext';
import { areaService } from '../../services/api';

const KnowledgeProgramPage = () => {
  const { user } = useAuth();
  
  // Add date and area state
  const [currentDate, setCurrentDate] = useState({
    gregorian: 'Loading...',
    hijri: 'Loading...'
  });
  const [areaName, setAreaName] = useState('Loading...');

  // Fetch current date
  useEffect(() => {
    const today = new Date();
    
    const gregorianDate = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    let hijriDate;
    try {
      hijriDate = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(today);
    } catch (error) {
      hijriDate = "Hijri date not supported";
    }

    setCurrentDate({
      gregorian: gregorianDate,
      hijri: hijriDate
    });
  }, []);

  // Fetch user area name
  useEffect(() => {
    const fetchUserArea = async () => {
      if (user?.areaId || user?.area_id) {
        try {
          const response = await areaService.getAreaStats(user.areaId || user.area_id);
          if (response.data.success) {
            setAreaName(response.data.data.area.name || 'Area');
          }
        } catch (error) {
          console.error('Error fetching area:', error);
          setAreaName('Area');
        }
      }
    };
    
    if (user) {
      fetchUserArea();
    }
  }, [user]);

  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {user?.role === "Founder" ? "Working Committee Dashboard" : "Super Admin Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {areaName} • {currentDate.gregorian} • {currentDate.hijri}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Periodic Program for Knowledge & Motivation</h2>
          <div className="text-center py-12">
            <div className="text-green-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Knowledge & Motivation Programs</h2>
            <p className="text-gray-500">This feature is under development. Check back soon!</p>
          </div>
        </div>
      </div>
    </FounderLayout>
  );
};

export default KnowledgeProgramPage;
