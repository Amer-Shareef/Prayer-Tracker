import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProtectedRoute from "./utils/ProtectedRoute";

// Member Pages
import Dashboard from "./pages/member/Dashboard";
import MyMosque from "./pages/member/MyMosque";
import MyPrayers from "./pages/member/MyPrayers";
import MyStats from "./pages/member/MyStats";
import Profile from "./pages/member/Profile";
import RequestPickup from "./pages/member/RequestPickup";
import DailyActivities from "./pages/member/DailyActivities";
import ChangePassword from "./pages/member/ChangePassword"; // NEW IMPORT

// Founder Pages
import FounderDashboard from "./components/dashboard/FounderDashboard";
import ApprovePickup from "./pages/founder/ApprovePickup";
import PostFeeds from "./pages/founder/PostFeeds";
import ViewAttendance from "./pages/founder/ViewAttendance";
import ManageMembers from "./pages/founder/ManageMembers";
import SendReminder from "./pages/founder/SendReminder";
import AddMember from "./pages/founder/AddMember";
import ReminderPage from "./pages/founder/ReminderPage";
import MeetingsPage from "./pages/founder/MeetingsPage";
import WakeUpCallPage from "./pages/founder/WakeUpCallPage";
import TransportPage from "./pages/founder/TransportPage";
import MosqueWorkPage from "./pages/founder/MosqueWorkPage";
import KnowledgeProgramPage from "./pages/founder/KnowledgeProgramPage";
import ScheduleMeeting from "./pages/founder/ScheduleMeeting";

// SuperAdmin Pages
import SuperAdminDashboard from "./components/dashboard/SuperAdminDashboard";
import AssignFounder from "./pages/superadmin/AssignFounder";
import PromoteUser from "./pages/superadmin/PromoteUser";
import ViewMosques from "./pages/superadmin/ViewMosques";

// Test Page
import TestPage from "./pages/TestPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
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
                <Dashboard />
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
            path="/member/daily-activities"
            element={
              <ProtectedRoute role="Member">
                <DailyActivities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/change-password"
            element={
              <ProtectedRoute role="Member">
                <ChangePassword />
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
            path="/founder/schedule-meeting"
            element={
              <ProtectedRoute role="Founder">
                <ScheduleMeeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/post-feeds"
            element={
              <ProtectedRoute role="Founder">
                <PostFeeds />
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
          <Route
            path="/founder/manage-members"
            element={
              <ProtectedRoute role="Founder">
                <ManageMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/add-member"
            element={
              <ProtectedRoute role="Founder">
                <AddMember />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/send-reminder"
            element={
              <ProtectedRoute role="Founder">
                <SendReminder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/reminder"
            element={
              <ProtectedRoute role="Founder">
                <ReminderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/meetings"
            element={
              <ProtectedRoute role="Founder">
                <MeetingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/wake-up-call"
            element={
              <ProtectedRoute role="Founder">
                <WakeUpCallPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/transport"
            element={
              <ProtectedRoute role="Founder">
                <TransportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/mosque-work"
            element={
              <ProtectedRoute role="Founder">
                <MosqueWorkPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/knowledge-program"
            element={
              <ProtectedRoute role="Founder">
                <KnowledgeProgramPage />
              </ProtectedRoute>
            }
          />

          {/* SuperAdmin Routes - Use "SuperAdmin" to match database */}
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

          {/* Test Page for debugging */}
          <Route path="/test" element={<TestPage />} />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
