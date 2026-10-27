import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Museums from "./pages/Museums.jsx";
import Artifacts from "./pages/Artifacts.jsx";
import Robots from "./pages/Robots.jsx";
import RobotDetails from "./pages/RobotDetails.jsx";
import Bookings from "./pages/Bookings.jsx";
import Setting from "./pages/Setting.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/museums" element={<Museums />} />
      <Route path="/artifacts" element={<Artifacts />} />
      <Route path="/robots" element={<Robots />} />
      <Route path="/robots/:id" element={<RobotDetails />} />
      <Route path="/bookings" element={<Bookings />} />
      <Route path="/setting" element={<Setting />} />
      {/* any wrong link goes to the dashboard instead of a blank page */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
