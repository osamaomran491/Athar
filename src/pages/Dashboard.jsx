import { Navigate, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatCard from "../components/dashboard/StatCard";
import RobotStatusCard from "../components/dashboard/RobotStatusCard";
import { robots, stats } from "../data/dashboardData";
import { getSession, logout } from "../services/authService";

// "Good Morning" / "Good Afternoon" / "Good Evening" depending on the hour
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;

  const firstName = session.name?.split(" ")[0] || "Admin";

  const handleLogout = () => {
    logout();
    window.location.assign(`${import.meta.env.BASE_URL}login`);
  };

  return (
    <DashboardLayout userName={session.name || "Admin"} userPicture={session.picture} onLogout={handleLogout}>
      <header className="dash__greeting reveal" style={{ "--i": 0 }}>
        <h1 className="dash__title">{getGreeting()}, {firstName}</h1>
        <p className="dash__subtitle">Here’s Whats happening at your museum today.</p>
      </header>

      <section className="dash__stats">
        {stats.map((stat, index) => (
          // the wrapper plays the fade-in (.reveal), the card inside plays the hover lift
          <div key={stat.id} className="reveal" style={{ "--i": index + 1 }}>
            <StatCard
              {...stat}
              // in the design the third card sits 4px higher than the other two
              className={index === 2 ? "stat-card--raised" : ""}
            />
          </div>
        ))}
      </section>

      <RobotStatusCard robots={robots} onOpen={() => navigate("/robots")}
        onSelect={(robot) => navigate(`/robots/${robot.id}`)} className="reveal" style={{ "--i": 4 }} />
    </DashboardLayout>
  );
}
