import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./utils/ProtectedRoute";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Member Pages
import Dashboard from "./pages/member/Dashboard";
import MyArea from "./pages/member/MyArea";
import MyPrayers from "./pages/member/MyPrayers";
import MyStats from "./pages/member/MyStats";
import Profile from "./pages/member/Profile";
import RequestPickup from "./pages/member/RequestPickup";
import DailyActivities from "./pages/member/DailyActivities";
import ChangePassword from "./pages/member/ChangePassword";

// Founder Pages
import FounderDashboard from "./components/dashboard/FounderDashboard";
import AddMember from "./pages/founder/AddMember";
import ApprovePickup from "./pages/founder/ApprovePickup";
import AreaPage from "./pages/founder/AreaPage";
import KnowledgeProgramPage from "./pages/founder/KnowledgeProgramPage";
import ManageMembers from "./pages/founder/ManageMembers";
import MeetingsPage from "./pages/founder/MeetingsPage";
import MosqueWorkPage from "./pages/founder/MosqueWorkPage";
import PostFeeds from "./pages/founder/PostFeeds";
import ReminderPage from "./pages/founder/ReminderPage";
import ScheduleMeeting from "./pages/founder/ScheduleMeeting";
import SendReminder from "./pages/founder/SendReminder";
import TransportPage from "./pages/founder/TransportPage";
import ViewAttendance from "./pages/founder/ViewAttendance";
import WakeUpCallPage from "./pages/founder/WakeUpCallPage";

// SuperAdmin Pages
import SuperAdminDashboardComplete from "./components/dashboard/SuperAdminDashboardComplete";
import AssignFounder from "./pages/superadmin/AssignFounder";
import PromoteUser from "./pages/superadmin/PromoteUser";
import SuperAdminKnowledgeProgramPage from "./pages/superadmin/SuperAdminKnowledgeProgramPage";
import SuperAdminManageMembers from "./pages/superadmin/SuperAdminManageMembers";
import SuperAdminMeetingsPage from "./pages/superadmin/SuperAdminMeetingsPage";
import SuperAdminPostFeeds from "./pages/superadmin/SuperAdminPostFeeds";
import SuperAdminReminderPage from "./pages/superadmin/SuperAdminReminderPage";
import SuperAdminTransportPage from "./pages/superadmin/SuperAdminTransportPage";
import SuperAdminViewAttendance from "./pages/superadmin/SuperAdminViewAttendance";
import SuperAdminWakeUpCallPage from "./pages/superadmin/SuperAdminWakeUpCallPage";
import ViewAreas from "./pages/superadmin/ViewAreas";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
            path="/member/area"
            element={
              <ProtectedRoute role="Member">
                <MyArea />
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
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <Navigate to="/founder/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/dashboard"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <FounderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/add-member"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <AddMember />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/approve-pickup"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <ApprovePickup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/area"
            element={
              <ProtectedRoute role="SuperAdmin">
                <AreaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/knowledge-program"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <KnowledgeProgramPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/manage-members"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <ManageMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/meetings"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <MeetingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/mosque-work"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <MosqueWorkPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/post-feeds"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <PostFeeds />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/reminder"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <ReminderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/schedule-meeting"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <ScheduleMeeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/send-reminder"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <SendReminder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/transport"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <TransportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/view-attendance"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <ViewAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/wake-up-call"
            element={
              <ProtectedRoute roles={["Founder", "Admin"]}>
                <WakeUpCallPage />
              </ProtectedRoute>
            }
          />

          {/* SuperAdmin Routes */}
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute role="SuperAdmin">
                <SuperAdminDashboardComplete />
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
            path="/superadmin/knowledge-program"
            element={
              <ProtectedRoute role="SuperAdmin">
                <SuperAdminKnowledgeProgramPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/manage-members"
            element={
              <ProtectedRoute role="SuperAdmin">
                <SuperAdminManageMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/meetings"
            element={
              <ProtectedRoute role="SuperAdmin">
                <SuperAdminMeetingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/post-feeds"
            element={
              <ProtectedRoute role="SuperAdmin">
                <SuperAdminPostFeeds />
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
            path="/superadmin/reminder"
            element={
              <ProtectedRoute role="SuperAdmin">
                <SuperAdminReminderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/transport"
            element={
              <ProtectedRoute role="SuperAdmin">
                <SuperAdminTransportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/view-areas"
            element={
              <ProtectedRoute role="SuperAdmin">
                <ViewAreas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/view-attendance"
            element={
              <ProtectedRoute role="SuperAdmin">
                <SuperAdminViewAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/wake-up-call"
            element={
              <ProtectedRoute role="SuperAdmin">
                <SuperAdminWakeUpCallPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
