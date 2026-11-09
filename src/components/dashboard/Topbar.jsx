import { useEffect, useRef, useState } from "react";
import { LuSearch, LuLogOut, LuMenu, LuX, LuSun, LuMoon } from "react-icons/lu";
import UserAvatar from "./UserAvatar";
import { useTheme } from "../../contexts/ThemeContext";

export default function Topbar({ name, role = "Museum Staff", picture, onLogout, navOpen, onMenuClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef(null);
  const { dark, toggleTheme } = useTheme();

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <header className="topbar">
      {/* زرار الـ menu على الموبايل */}
      <button
        type="button"
        className="topbar__menu-btn"
        onClick={onMenuClick}
        aria-label={navOpen ? "Close menu" : "Open menu"}
        aria-expanded={navOpen}
      >
        {navOpen ? <LuX /> : <LuMenu />}
      </button>

      <label className="search">
        <LuSearch className="search__icon" />
        <input className="search__input" type="search" placeholder="Search anything..." />
      </label>

      <div className="profile">
        <div className="profile__avatar-wrap" ref={avatarRef}>
          <button
            type="button"
            className="profile__toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            <UserAvatar name={name} picture={picture} />
          </button>

          {menuOpen && (
            <div className="profile__menu">
              {/* معلومات المستخدم */}
              <div className="profile__menu-head">
                <UserAvatar name={name} picture={picture} className="avatar--small" />
                <div className="profile__menu-text">
                  <p className="profile__name">{name}</p>
                  <p className="profile__role">{role}</p>
                </div>
              </div>

              {/* ===== زرار Modes ===== */}
              <div className="profile__modes-row">
                <span className="profile__modes-label">Modes</span>
                <button
                  type="button"
                  className={`modes-btn ${dark ? "modes-btn--dark" : ""}`}
                  onClick={toggleTheme}
                  aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <span className="modes-btn__circle">
                    {dark ? <LuMoon /> : <LuSun />}
                  </span>
                </button>
              </div>

              <div className="profile__divider" />

              <button type="button" className="profile__menu-item" onClick={onLogout}>
                <LuLogOut /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}