import { Navigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatCard from "../components/dashboard/StatCard";
import RobotStatusCard from "../components/DashBoard/RobotStatusCard";
import { robots, stats } from "../Data/dashboardData";
import { getSession, logout } from "../services/authService";

// "Good Morning" / "Good Afternoon" / "Good Evening" depending on the hour
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;

  const firstName = session.name?.split(" ")[0] || "Admin";

  const handleLogout = () => {
    logout();
    window.location.assign(`${import.meta.env.BASE_URL}login`);
  };

  return (
    <DashboardLayout userName={session.name || "Admin"} onLogout={handleLogout}>
      <header className="dash__greeting reveal" style={{ "--i": 0 }}>
        <h1 className="dash__title">{getGreeting()}, {firstName}</h1>
        <p className="dash__subtitle">Here’s Whats happening at your museum today.</p>
      </header>

      <section className="dash__stats">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.id}
            {...stat}
            // in the design the third card sits 4px higher than the other two
            className={`reveal ${index === 2 ? "stat-card--raised" : ""}`}
            style={{ "--i": index + 1 }}
          />
        ))}
      </section>

      <RobotStatusCard robots={robots} className="reveal" style={{ "--i": 4 }} />
    </DashboardLayout>
  );
}