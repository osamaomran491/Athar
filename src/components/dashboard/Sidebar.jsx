// Sidebar.jsx
// Left menu of the dashboard: logo on top, then the links from data/dashboardData.js.
// A link with a route becomes a NavLink (highlighted when it is the current page).
// A link without a route yet is a plain button, so nothing breaks while the page is missing.
import { NavLink } from "react-router-dom";
import Logo from "../ui/Logo";
import { navItems } from "../../data/dashboardData";

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
