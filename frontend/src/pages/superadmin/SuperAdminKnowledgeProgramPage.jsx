import React, { useState } from 'react';
import SuperAdminLayout from '../../components/layouts/SuperAdminLayout';

const SuperAdminKnowledgeProgramPage = () => {
  const [activeTab, setActiveTab] = useState('programs');
  const [programs, setPrograms] = useState([
    {
      id: 1,
      title: 'Islam 101 for Youth',
      mosque: 'All Mosques',
      instructor: 'Imam Abdullah',
      startDate: '2025-07-15',
      duration: '8 weeks',
      participants: 45,
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'Quran Tajweed Classes',
      mosque: 'Central Mosque',
      instructor: 'Qari Muhammad',
      startDate: '2025-07-01',
      duration: '12 weeks',
      participants: 32,
      status: 'ongoing'
    }
  ]);

  const [newProgram, setNewProgram] = useState({
    title: '',
    mosque: 'all',
    instructor: '',
    startDate: '',
    duration: '',
    maxParticipants: '',
    description: '',
    category: 'general'
  });

  const [resources, setResources] = useState([
    {
      id: 1,
      title: 'Basic Islamic Principles',
      type: 'PDF',
      mosque: 'All Mosques',
      downloads: 156,
      uploadDate: '2025-06-15'
    },
    {
      id: 2,
      title: 'Prayer Guide Video',
      type: 'Video',
      mosque: 'Central Mosque',
      downloads: 89,
      uploadDate: '2025-06-20'
    }
  ]);

  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating program:', newProgram);
      
      const programToAdd = {
        id: programs.length + 1,
        ...newProgram,
        participants: 0,
        status: 'upcoming'
      };
      
      setPrograms([...programs, programToAdd]);
      
      // Reset form
      setNewProgram({
        title: '',
        mosque: 'all',
        instructor: '',
        startDate: '',
        duration: '',
        maxParticipants: '',
        description: '',
        category: 'general'
      });
      
      alert('Knowledge program created successfully!');
    } catch (error) {
      console.error('Error creating program:', error);
      alert('Failed to create program');
    }
  };

  const handleDeleteProgram = (id) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      setPrograms(programs.filter(program => program.id !== id));
    }
  };

  const handleDeleteResource = (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setResources(resources.filter(resource => resource.id !== id));
    }
  };

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Knowledge & Motivation Programs (All Mosques)</h1>
          <p className="text-gray-600">Manage educational programs and resources across all mosques</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-500">Total Programs</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">245</div>
            <div className="text-sm text-gray-500">Active Participants</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">68</div>
            <div className="text-sm text-gray-500">Resources Available</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600">1,234</div>
            <div className="text-sm text-gray-500">Total Downloads</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('programs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'programs'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Programs
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Program
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'resources'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resources
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {activeTab === 'programs' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">Knowledge Programs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mosque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {programs.map((program) => (
                    <tr key={program.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{program.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{program.mosque}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{program.instructor}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{program.startDate}</div>
                        <div className="text-sm text-gray-500">{program.duration}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.participants}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          program.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                          program.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {program.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteProgram(program.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">Create New Knowledge Program</h3>
            <form onSubmit={handleSubmitProgram}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Program Title
                    </label>
                    <input
                      type="text"
                      value={newProgram.title}
                      onChange={(e) => setNewProgram({...newProgram, title: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Mosque
                    </label>
                    <select
                      value={newProgram.mosque}
                      onChange={(e) => setNewProgram({...newProgram, mosque: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="all">All Mosques</option>
                      <option value="1">Masjid Ul Jabbar</option>
                      <option value="2">Al-Noor Mosque</option>
                      <option value="3">Central Mosque</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor
                    </label>
                    <input
                      type="text"
                      value={newProgram.instructor}
                      onChange={(e) => setNewProgram({...newProgram, instructor: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newProgram.category}
                      onChange={(e) => setNewProgram({...newProgram, category: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="general">General Islamic Studies</option>
                      <option value="quran">Quran Studies</option>
                      <option value="hadith">Hadith Studies</option>
                      <option value="fiqh">Fiqh (Islamic Jurisprudence)</option>
                      <option value="youth">Youth Programs</option>
                      <option value="women">Women's Programs</option>
                      <option value="converts">New Muslim Programs</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newProgram.startDate}
                      onChange={(e) => setNewProgram({...newProgram, startDate: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={newProgram.duration}
                      onChange={(e) => setNewProgram({...newProgram, duration: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="e.g., 8 weeks, 3 months"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={newProgram.maxParticipants}
                      onChange={(e) => setNewProgram({...newProgram, maxParticipants: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProgram.description}
                      onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                      rows="3"
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Program description and objectives..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Create Program
              </button>
            </form>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium">Learning Resources</h3>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                Upload Resource
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mosque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Downloads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resources.map((resource) => (
                    <tr key={resource.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{resource.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          resource.type === 'PDF' ? 'bg-red-100 text-red-800' :
                          resource.type === 'Video' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {resource.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {resource.mosque}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {resource.downloads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {resource.uploadDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-purple-600 hover:text-purple-900 mr-3">
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-6">Program Analytics</h3>
            
            {/* Participation by Mosque */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">Participation by Mosque</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-40 text-sm">Masjid Ul Jabbar</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-500 h-3 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-right">78 members</div>
                </div>
                <div className="flex items-center">
                  <div className="w-40 text-sm">Al-Noor Mosque</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-500 h-3 rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-right">65 members</div>
                </div>
                <div className="flex items-center">
                  <div className="w-40 text-sm">Central Mosque</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-500 h-3 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-right">92 members</div>
                </div>
              </div>
            </div>

            {/* Popular Programs */}
            <div className="mb-8">
              <h4 className="font-medium mb-4">Most Popular Programs</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-medium text-purple-800">Quran Tajweed</h5>
                  <p className="text-sm text-purple-600">156 participants</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-800">Youth Islamic Studies</h5>
                  <p className="text-sm text-blue-600">134 participants</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-800">New Muslim Program</h5>
                  <p className="text-sm text-green-600">87 participants</p>
                </div>
              </div>
            </div>

            {/* Completion Rates */}
            <div>
              <h4 className="font-medium mb-4">Program Completion Rates</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-gray-500">Overall Completion</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">6.2</div>
                    <div className="text-sm text-gray-500">Avg. Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">8.5</div>
                    <div className="text-sm text-gray-500">Avg. Weeks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">76%</div>
                    <div className="text-sm text-gray-500">Repeat Enrollment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminKnowledgeProgramPage;
