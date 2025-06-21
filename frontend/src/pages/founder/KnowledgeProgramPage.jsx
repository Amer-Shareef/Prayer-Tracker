import React from 'react';
import FounderLayout from '../../components/layouts/FounderLayout';

const KnowledgeProgramPage = () => {
  return (
    <FounderLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Periodic Program for Knowledge & Motivation</h1>
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
