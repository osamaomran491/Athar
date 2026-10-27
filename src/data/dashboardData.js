// dashboardData.js
// Temporary data for the dashboard page. Replace these arrays with API calls later,
// the components only care about the shape of each item.
import { LuHouse, LuLandmark, LuHexagon, LuCalendarDays, LuSettings } from "react-icons/lu";
import RobotFaceIcon from "../components/dashboard/RobotFaceIcon";

// Sidebar links. `to` is the route of the page; keep it null until that page exists.
export const navItems = [
  { label: "Dashboard", icon: LuHouse, to: "/dashboard" },
  { label: "Museums", icon: LuLandmark, to: null },
  { label: "Artifacts", icon: LuHexagon, to: null },
  { label: "Robots", icon: RobotFaceIcon, to: null },
  { label: "Bookings", icon: LuCalendarDays, to: null },
  { label: "Setting", icon: LuSettings, to: null },
];

// The three cards at the top (value / change stay empty until they are connected to the API)
export const stats = [
  { id: "visitors", label: "Total Visitors", value: "", change: "" },
  { id: "bookings", label: "Total Bookings", value: "", change: "" },
  { id: "revenue", label: "Revenue", value: "", change: "" },
];

// Robot list. status is one of: "tour" | "charging" | "standby" (leave it null until it is connected)
export const robots = [
  { id: 1, name: "RoboGuide 01", status: null },
];

// Text shown inside each status badge
export const statusLabels = {
  tour: "On Tour",
  charging: "Charging",
  standby: "Standby",
};
