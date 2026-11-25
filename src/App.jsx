import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Museums from "./pages/Museums.jsx";
import Artifacts from "./pages/Artifacts.jsx";
import Robots from "./pages/Robots.jsx";
import RobotDetails from "./pages/RobotDetails.jsx";
import Bookings from "./pages/Bookings.jsx";
import Setting from "./pages/Setting.jsx";
import Moderators from "./pages/Moderators.jsx";
import {
  USER_WEB_URL,
  canAccessPage,
  getDefaultRoute,
  getSession,
  hasDashboardAccess,
  logout,
} from "./services/authService.js";

function RedirectToUserWeb() {
  useEffect(() => {
    logout();
    window.location.replace(USER_WEB_URL);
  }, []);
  return null;
}

function RequireAccess({ pageKey, children }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (!hasDashboardAccess(session)) return <RedirectToUserWeb />;
  if (pageKey && !canAccessPage(session, pageKey)) {
    const fallback = getDefaultRoute(session);
    return fallback ? <Navigate to={fallback} replace /> : <RedirectToUserWeb />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<RequireAccess pageKey="dashboard"><Dashboard /></RequireAccess>} />
      <Route path="/museums" element={<RequireAccess pageKey="museums"><Museums /></RequireAccess>} />
      <Route path="/artifacts" element={<RequireAccess pageKey="artifacts"><Artifacts /></RequireAccess>} />
      <Route path="/robots" element={<RequireAccess pageKey="robots"><Robots /></RequireAccess>} />
      <Route path="/robots/:id" element={<RequireAccess pageKey="robots"><RobotDetails /></RequireAccess>} />
      <Route path="/bookings" element={<RequireAccess pageKey="bookings"><Bookings /></RequireAccess>} />
      <Route path="/setting" element={<RequireAccess pageKey="setting"><Setting /></RequireAccess>} />
      <Route path="/moderators" element={<RequireAccess pageKey="moderators"><Moderators /></RequireAccess>} />
      {/* any wrong link goes to the dashboard instead of a blank page */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
