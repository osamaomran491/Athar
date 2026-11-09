import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LuX, LuChevronLeft, LuChevronRight, LuSun, LuMoon } from "react-icons/lu";
import Logo from "../ui/Logo";
import { navItems } from "../../data/dashboardData";
import { useTheme } from "../../contexts/ThemeContext";

export default function Sidebar({ open = false, onClose }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { dark, toggleTheme } = useTheme();
 const [collapsed, setCollapsed] = useState(
  () => localStorage.getItem("sidebarCollapsed") === "true"
);

useEffect(() => {
  localStorage.setItem("sidebarCollapsed", String(collapsed));
}, [collapsed]);

  /* التنقل — ما بيقفلش الـ sidebar */
  const handleNavClick = (to) => {
    if (to) navigate(to);
    // لا onNavigate هنا — الـ sidebar يفضل مفتوح
  };

  return (
    <aside
      className={[
        "sidebar",
        open ? "sidebar--open" : "",
        collapsed ? "sidebar--collapsed" : "",
      ].join(" ")}
    >
      {/* ===== Header: Logo + Close (mobile) ===== */}
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <Logo />
          
        </div>

        {/* X — موبايل فقط */}
        <button
          type="button"
          className="sidebar__close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <LuX />
        </button>
      </div>

      {/* ===== شريط Collapse — بين اللوجو والـ Nav ===== */}
      <button
        type="button"
        className="sidebar__divider-btn"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span className="sidebar__divider-line" />
        <span className="sidebar__divider-icon">
          {collapsed ? <LuChevronRight /> : <LuChevronLeft />}
        </span>
        <span className="sidebar__divider-line" />
      </button>

      {/* ===== Nav ===== */}
      <nav className="sidebar__nav" aria-label="Main menu">
        

        {navItems.map(({ label, icon: Icon, to }) => (
          <div key={label} className="nav-item__wrap">
            <button
              type="button"
              className={`nav-item ${to && pathname === to ? "nav-item--active" : ""}`}
              onClick={() => handleNavClick(to)}
            >
              <Icon className="nav-item__icon" />
              <span className="nav-item__label">{label}</span>
            </button>
            {/* Tooltip يظهر لما الـ sidebar ينهار */}
            <span className="nav-item__tooltip" aria-hidden="true">{label}</span>
          </div>
        ))}
      </nav>

      {/* ===== Dark Mode — أسفل الـ Sidebar (موبايل) ===== */}
      <div className="sidebar__theme">
        <button
          type="button"
          className={`sidebar__theme-btn ${dark ? "sidebar__theme-btn--dark" : ""}`}
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="sidebar__theme-icon">
            {dark ? <LuMoon /> : <LuSun />}
          </span>
          <span className="sidebar__theme-label">
            {dark ? "Dark Mode" : "Light Mode"}
          </span>
        </button>
      </div>
    </aside>
  );
}