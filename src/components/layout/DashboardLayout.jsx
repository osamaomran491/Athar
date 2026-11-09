import { useEffect, useState } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";

export default function DashboardLayout({ userName, userPicture, onLogout, children }) {
  const [navOpen, setNavOpen] = useState(false);

  /* Esc يغلق الـ sidebar على الموبايل */
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

  /* لما الشاشة تكبر، أعد تهيئة الـ sidebar */
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const reset = (e) => e.matches && setNavOpen(false);
    desktop.addEventListener("change", reset);
    return () => desktop.removeEventListener("change", reset);
  }, []);

  return (
    <div className={`dash ${navOpen ? "dash--nav-open" : ""}`}>
      <Sidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        /* لا onNavigate — الـ sidebar يفضل مفتوح عند التنقل */
      />

      {/* الـ backdrop على الموبايل فقط */}
      <div
        className="dash__backdrop"
        onClick={() => setNavOpen(false)}
        aria-hidden="true"
      />

      <div className="dash__body">
        <Topbar
          name={userName}
          picture={userPicture}
          onLogout={onLogout}
          navOpen={navOpen}
          onMenuClick={() => setNavOpen((o) => !o)}
        />
        <main className="dash__main">{children}</main>
      </div>
    </div>
  );
}