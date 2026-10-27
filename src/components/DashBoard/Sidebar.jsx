import { NavLink } from "react-router-dom";
import Logo from "../ui/Logo";
import { navItems } from "../../Data/dashboardData";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Logo />
      </div>

      <nav className="sidebar__nav" aria-label="Main menu">
        {navItems.map(({ label, icon: Icon, to }) => {
          const content = (
            <>
              <Icon className="nav-item__icon" />
              <span className="nav-item__label">{label}</span>
            </>
          );

          return to ? (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? "nav-item--active" : ""}`}
            >
              {content}
            </NavLink>
          ) : (
            // TODO: give this item a route in dashboardData.js when its page is ready
            <button key={label} type="button" className="nav-item">
              {content}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}