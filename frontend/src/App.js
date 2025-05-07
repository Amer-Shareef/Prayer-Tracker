import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import MemberDashboard from "./components/dashboard/MemberDashboard";
import FounderDashboard from "./components/dashboard/FounderDashboard";
import SuperAdminDashboard from "./components/dashboard/SuperAdminDashboard";
import ProtectedRoute from "./utils/ProtectedRoute";
import NavigationBar from "./components/shared/NavigationBar";

// Member Pages
import MyMosque from "./pages/member/MyMosque";
import MyPrayers from "./pages/member/MyPrayers";
import MyStats from "./pages/member/MyStats";
import Profile from "./pages/member/Profile";
import RequestPickup from "./pages/member/RequestPickup";
import WakeupCall from "./pages/member/WakeupCall";

// Founder Pages
import ApprovePickup from "./pages/founder/ApprovePickup";
import PostAnnouncement from "./pages/founder/PostAnnouncement";
import ViewAttendance from "./pages/founder/ViewAttendance";

// SuperAdmin Pages
import AssignFounder from "./pages/superadmin/AssignFounder";
import PromoteUser from "./pages/superadmin/PromoteUser";
import ViewMosques from "./pages/superadmin/ViewMosques";

function App() {
  return (
    <Router>
      <AuthProvider>
        <NavigationBar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Member Routes */}
          <Route
            path="/member"
            element={
              <ProtectedRoute role="Member">
                <Navigate to="/member/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/dashboard"
            element={
              <ProtectedRoute role="Member">
                <MemberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/mosque"
            element={
              <ProtectedRoute role="Member">
                <MyMosque />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/prayers"
            element={
              <ProtectedRoute role="Member">
                <MyPrayers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/stats"
            element={
              <ProtectedRoute role="Member">
                <MyStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/profile"
            element={
              <ProtectedRoute role="Member">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/request-pickup"
            element={
              <ProtectedRoute role="Member">
                <RequestPickup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/wakeup"
            element={
              <ProtectedRoute role="Member">
                <WakeupCall />
              </ProtectedRoute>
            }
          />

          {/* Founder Routes */}
          <Route
            path="/founder"
            element={
              <ProtectedRoute role="Founder">
                <Navigate to="/founder/dashboard" replace />
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
            path="/founder/approve-pickup"
            element={
              <ProtectedRoute role="Founder">
                <ApprovePickup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/post-announcement"
            element={
              <ProtectedRoute role="Founder">
                <PostAnnouncement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/view-attendance"
            element={
              <ProtectedRoute role="Founder">
                <ViewAttendance />
              </ProtectedRoute>
            }
          />

          {/* SuperAdmin Routes */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute role="SuperAdmin">
                <Navigate to="/superadmin/dashboard" replace />
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
          <Route
            path="/superadmin/assign-founder"
            element={
              <ProtectedRoute role="SuperAdmin">
                <AssignFounder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/promote-user"
            element={
              <ProtectedRoute role="SuperAdmin">
                <PromoteUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/view-mosques"
            element={
              <ProtectedRoute role="SuperAdmin">
                <ViewMosques />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
