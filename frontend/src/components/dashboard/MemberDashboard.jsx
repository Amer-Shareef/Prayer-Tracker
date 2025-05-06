import React from "react";

const MemberDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Member Dashboard</h1>
        <p className="text-gray-700 mb-4">
          This is the dashboard for members. Here, you can track your prayers, view mosque announcements, and manage your profile.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">My Prayers</h2>
            <p>Track your daily prayers and progress.</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">Announcements</h2>
            <p>Stay updated with the latest announcements from your mosque.</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">Profile</h2>
            <p>Manage your profile and update your information.</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">Community</h2>
            <p>Connect with other members of your mosque.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;