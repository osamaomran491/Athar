// RobotDetails.jsx
// Route: /robots/:id
// Page of one robot (opened from the arrow in the Robot Status list).
// Empty for now: only the robot name as the title. Add the real content inside <DashboardPage> later.
import { Navigate, useParams } from "react-router-dom";
import DashboardPage from "../components/dashboard/DashboardPage";
import { robots } from "../data/dashboardData";

export default function RobotDetails() {
  const { id } = useParams();
  const robot = robots.find((r) => String(r.id) === id);

  // unknown robot id -> back to the list
  if (!robot) return <Navigate to="/robots" replace />;

  return <DashboardPage title={robot.name} />;
}
