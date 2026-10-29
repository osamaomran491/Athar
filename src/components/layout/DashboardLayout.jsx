import { useEffect, useState } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";

export default function DashboardLayout({ userName, userPicture, onLogout, children }) {
  const [navOpen, setNavOpen] = useState(false);

  // while the sidebar is open: Esc closes it and the page behind it can't scroll
  useEffect(() => {
    if (!navOpen) return;
    const closeOnEscape = (e) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  // if the window becomes wide (desktop), the sidebar is always visible, so reset the state
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const reset = (e) => e.matches && setNavOpen(false);
    desktop.addEventListener("change", reset);
    return () => desktop.removeEventListener("change", reset);
  }, []);

  return (
    <div className={`dash ${navOpen ? "dash--nav-open" : ""}`}>
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} onClose={() => setNavOpen(false)} />

      {/* dark area behind the sidebar on phones */}
      <div className="dash__backdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />

      <div className="dash__body">
        <Topbar
          name={userName}
          picture={userPicture}
          onLogout={onLogout}
          navOpen={navOpen}
          onMenuClick={() => setNavOpen((open) => !open)}
        />
        <main className="dash__main">{children}</main>
      </div>
    </div>
  );
}