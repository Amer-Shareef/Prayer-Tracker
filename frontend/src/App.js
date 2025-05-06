import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import MemberDashboard from "./components/dashboard/MemberDashboard";
import FounderDashboard from "./components/dashboard/FounderDashboard";
import SuperAdminDashboard from "./components/dashboard/SuperAdminDashboard";
import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/member/dashboard"
          element={
            <ProtectedRoute role="Member">
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/founder/dashboard"
          element={
            <ProtectedRoute role="Founder">
              <FounderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute role="SuperAdmin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
