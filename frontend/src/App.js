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
import ReminderPage from "./pages/founder/ReminderPage";
import ScheduleMeeting from "./pages/founder/ScheduleMeeting";
import SendReminder from "./pages/founder/SendReminder";
import TransportPage from "./pages/founder/TransportPage";
import ViewAttendance from "./pages/founder/ViewAttendance";
import WakeUpCallPage from "./pages/founder/WakeUpCallPage";

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
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <Navigate to="/founder/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/dashboard"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <FounderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/add-member"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <AddMember />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/approve-pickup"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
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
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <KnowledgeProgramPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/manage-members"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <ManageMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/meetings"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <MeetingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/mosque-work"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <MosqueWorkPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/reminder"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <ReminderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/schedule-meeting"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <ScheduleMeeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/send-reminder"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <SendReminder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/transport"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <TransportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/view-attendance"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <ViewAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/founder/wake-up-call"
            element={
              <ProtectedRoute roles={["Founder", "WCM", "SuperAdmin"]}>
                <WakeUpCallPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy SuperAdmin routes - redirect to founder routes */}
          <Route
            path="/superadmin/*"
            element={<Navigate to="/founder/dashboard" replace />}
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
