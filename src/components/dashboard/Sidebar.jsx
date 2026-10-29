import { useLocation, useNavigate } from "react-router-dom";
import { LuX } from "react-icons/lu";
import Logo from "../ui/Logo";
import { navItems } from "../../data/dashboardData";

export default function Sidebar({ open = false, onNavigate, onClose }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close menu">
        <LuX />
      </button>
      <div className="sidebar__logo">
        <Logo />
      </div>

      <nav className="sidebar__nav" aria-label="Main menu">
        {navItems.map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            type="button"
            className={`nav-item ${to && pathname === to ? "nav-item--active" : ""}`}
            onClick={() => to && navigate(to)}
          >
            <Icon className="nav-item__icon" />
            <span className="nav-item__label">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}