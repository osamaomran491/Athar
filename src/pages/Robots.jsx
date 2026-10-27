// Robots.jsx
// Route: /robots
// Opened from the "Robots" link in the sidebar. Shows the same Robot Status list as the dashboard.
// Redirects to /login when nobody is signed in.
import { Navigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import RobotStatusCard from "../components/dashboard/RobotStatusCard";
import { robots } from "../data/dashboardData";
import { getSession, logout } from "../services/authService";

export default function Robots() {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    window.location.assign(`${import.meta.env.BASE_URL}login`);
  };

  return (
    <DashboardLayout userName={session.name || "Admin"} onLogout={handleLogout}>
      <header className="dash__greeting reveal" style={{ "--i": 0 }}>
        <h1 className="dash__title">Robots</h1>
        <p className="dash__subtitle">See the status of your museum robots.</p>
      </header>

      <RobotStatusCard robots={robots} className="robot-panel--page reveal" style={{ "--i": 1 }} />
    </DashboardLayout>
  );
}
