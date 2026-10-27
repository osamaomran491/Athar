import { useEffect, useRef, useState } from "react";
import { LuSearch, LuCircleUser, LuLogOut } from "react-icons/lu";

export default function Topbar({ name, role = "Museum Staff", onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // close the menu when the user clicks anywhere else
  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <header className="topbar">
      <label className="search">
        <LuSearch className="search__icon" />
        <input className="search__input" type="search" placeholder="Search anything..." />
      </label>

      <div className="profile" ref={profileRef}>
        <button
          type="button"
          className="profile__toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
        >
          <span className="profile__info">
            <span className="profile__name">{name}</span>
            <span className="profile__role">{role}</span>
          </span>
          <span className="profile__divider" />
          <LuCircleUser className="profile__avatar" />
        </button>

        {menuOpen && (
          <div className="profile__menu">
            <button type="button" className="profile__menu-item" onClick={onLogout}>
              <LuLogOut /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}