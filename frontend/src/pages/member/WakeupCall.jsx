import React from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';

const WakeupCall = () => {
  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-3xl font-bold text-yellow-800 mb-4">Feature Coming Soon</h1>
          <p className="text-lg text-yellow-700 mb-4">
            The Wakeup Call / Send Reminders feature is currently under development
          </p>
          <p className="text-yellow-600">
            This feature will be available in the next phase of Prayer Tracker.
            Stay tuned for automatic prayer reminder calls!
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
};

export default WakeupCall;