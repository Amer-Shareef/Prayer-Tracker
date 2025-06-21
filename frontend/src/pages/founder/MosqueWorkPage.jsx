import React from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

const MosqueWorkPage = () => {
  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Work closely with Masjid to provide Motivation</h1>
          <div className="text-center py-12">
            <div className="text-green-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Mosque Collaboration</h2>
            <p className="text-gray-500">This feature is under development. Check back soon!</p>
          </div>
        </div>
      </div>
    </FounderLayout>
  );
};

export default MosqueWorkPage;
