// DashboardPage.jsx
// Shared frame for the simple dashboard pages (Museums, Artifacts, Bookings, Setting).
// Checks the session (redirects to /login if nobody is signed in), wraps the page in
// DashboardLayout and shows the page title. Put the page content as children when it is ready.
import { Navigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { getSession, logout } from "../../services/authService";

export default function DashboardPage({ title, children }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    window.location.assign(`${import.meta.env.BASE_URL}login`);
  };

  return (
    <DashboardLayout userName={session.name || "Admin"} onLogout={handleLogout}>
      <header className="dash__greeting reveal" style={{ "--i": 0 }}>
        <h1 className="dash__title">{title}</h1>
      </header>
      {children}
    </DashboardLayout>
  );
}
