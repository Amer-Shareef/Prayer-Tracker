import React from 'react';
import MemberLayout from '../../components/layouts/MemberLayout';

const WakeupCall = () => {
  return (
    <MemberLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📞</div>
          <h1 className="text-3xl font-bold text-blue-800 mb-4">Wake-up Call System Active</h1>
          <p className="text-lg text-blue-700 mb-4">
            The automatic wake-up call system is now operational
          </p>
          <p className="text-blue-600 mb-6">
            You will receive automatic calls for Fajr prayer. The system tracks your responses
            and provides reports to the mosque administration.
          </p>

          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">How it works:</h3>
            <ul className="text-left text-gray-600 space-y-2">
              <li>• Automatic calls are made before Fajr prayer time</li>
              <li>• Press 1 to confirm you're awake (Accepted)</li>
              <li>• Press 2 if you decline the call</li>
              <li>• No response is recorded as "No Answer"</li>
              <li>• All responses are tracked for attendance monitoring</li>
            </ul>
          </div>

          <div className="mt-6">
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
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