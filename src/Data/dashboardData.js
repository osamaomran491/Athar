import { LuHouse, LuLandmark, LuHexagon, LuCalendarDays, LuSettings } from "react-icons/lu";
import RobotFaceIcon from "../components/dashboard/RobotFaceIcon";

// Sidebar links. `to` is the route of the page; keep it null until that page exists.
export const navItems = [
  { label: "Dashboard", icon: LuHouse, to: "/dashboard" },
  { label: "Museums", icon: LuLandmark, to: null },
  { label: "Artifacts", icon: LuHexagon, to: null },
  { label: "Robots", icon: RobotFaceIcon, to: null },
  { label: "Bookings", icon: LuCalendarDays, to: null },
  { label: "Settings", icon: LuSettings, to: null },
];

// The three cards at the top
export const stats = [
  { id: "visitors", label: "Total Visitors", value: "1,248", change: "+12%" },
  { id: "bookings", label: "Total Bookings", value: "432", change: "+6%" },
  { id: "revenue", label: "Revenue", value: "EGP 87,450", change: "+12%" },
];

// Robot list. status is one of: "tour" | "charging" | "standby"
export const robots = [
  { id: 1, name: "RoboGuide 01", status: "tour" },
  { id: 2, name: "RoboGuide 02", status: "charging" },
  { id: 3, name: "RoboGuide 03", status: "standby" },
  { id: 4, name: "RoboGuide 04", status: "tour" },
];

// Text shown inside each status badge
export const statusLabels = {
  tour: "On Tour",
  charging: "Charging",
  standby: "Standby",
};