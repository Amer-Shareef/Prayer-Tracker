import React, { useState, useEffect } from 'react';
import { testConnection, testAuth, debugLog, apiDebug } from '../utils/debugHelper';
import { authService, memberAPI, prayerService } from '../services/api';

const TestPage = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    debugLog('TestPage', `Running ${testName}`);
    
    try {
      const result = await testFunction();
      setResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
      debugLog('TestPage', `${testName} Success`, result);
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
      debugLog('TestPage', `${testName} Failed`, error);
    }
    
    setLoading(false);
  };

  const tests = {
    'Backend Connection': async () => {
      return await testConnection();
    },
    
    'Auth Status': async () => {
      return testAuth();
    },
    
    'Login Test': async () => {
      const response = await authService.login('testmember', 'password123');
      apiDebug('/auth/login', 'POST', { username: 'testmember' }, response.data);
      return response.data;
    },
    
    'Get Members (Founder)': async () => {
      // First login as founder
      const loginRes = await authService.login('testfounder', 'password123');
      localStorage.setItem('token', loginRes.data.token);
      
      const response = await memberAPI.getMembers();
      apiDebug('/members', 'GET', null, response);
      return response;
    },
    
    'Get Prayers (Member)': async () => {
      // Login as member
      const loginRes = await authService.login('testmember', 'password123');
      localStorage.setItem('token', loginRes.data.token);
      
      const response = await prayerService.getPrayers();
      apiDebug('/prayers', 'GET', null, response.data);
      return response.data;
    },
    
    'Get Prayer Stats': async () => {
      const response = await prayerService.getStats();
      apiDebug('/prayers/stats', 'GET', null, response.data);
      return response.data;
    }
  };

  const runAllTests = async () => {
    setResults({});
    for (const [testName, testFunction] of Object.entries(tests)) {
      await runTest(testName, testFunction);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🧪 Prayer Tracker Frontend Tests</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(tests).map(([testName, testFunction]) => (
            <div key={testName} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{testName}</h3>
                <button
                  onClick={() => runTest(testName, testFunction)}
                  disabled={loading}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  Run Test
                </button>
              </div>
              
              {results[testName] && (
                <div className={`p-4 rounded-lg ${
                  results[testName].success 
                    ? 'bg-green-100 border border-green-300' 
                    : 'bg-red-100 border border-red-300'
                }`}>
                  <div className={`flex items-center mb-2 ${
                    results[testName].success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <span className="text-lg mr-2">
                      {results[testName].success ? '✅' : '❌'}
                    </span>
                    <span className="font-medium">
                      {results[testName].success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  
                  {results[testName].success ? (
                    <pre className="text-sm text-green-700 overflow-auto max-h-40">
                      {JSON.stringify(results[testName].data, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-red-700">
                      {results[testName].error}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Test Accounts Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">🔑 Test Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-green-700">Member</h4>
              <p className="text-sm">Username: testmember</p>
              <p className="text-sm">Password: password123</p>
              <p className="text-sm">Role: Member</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-purple-700">Founder</h4>
              <p className="text-sm">Username: testfounder</p>
              <p className="text-sm">Password: password123</p>
              <p className="text-sm">Role: Founder</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-red-700">Admin</h4>
              <p className="text-sm">Username: testadmin</p>
              <p className="text-sm">Password: password123</p>
              <p className="text-sm">Role: SuperAdmin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
