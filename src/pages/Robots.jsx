import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LuMapPin } from "react-icons/lu";
import DashboardLayout from "../components/layout/DashboardLayout";
import RobotMap from "../components/robots/RobotMap";
import { StatusCheckIcon, BatteryBoltIcon, PauseCircleIcon, BoltCircleIcon, PlayCircleIcon } from "../components/robots/RobotIcons";
import { ROBOTS, liveStatusLabels } from "../data/robotsData";
import useRobotSim from "../hooks/useRobotSim";
import { getSession, logout } from "../services/authService";

function batteryLevel(p) { return p >= 60 ? "high" : p >= 20 ? "mid" : "low"; }

export default function Robots() {
  const navigate = useNavigate();
  const session = getSession();
  
  const robotSim = useRobotSim();
  const { status, battery, markerRef, pause, play, charge } = robotSim;
  const connected = robotSim.connected || false;
  const [selectedId, setSelectedId] = useState(ROBOTS[0].id); // card clicked -> the controls below act on this robot
  const selected = ROBOTS.find((r) => r.id === selectedId) || ROBOTS[0];
  const selOffline = selected.offline;

  if (!session) return <Navigate to="/login" replace />;

  const handleLogout = () => { 
    logout(); 
    window.location.assign(`${import.meta.env.BASE_URL}login`); 
  };

  const moving = status === "tour" || status === "returning";
  const controls = [
    { key: "pause", label: "Pause", icon: <PauseCircleIcon className="rlc-btn__icon" />, disabled: selOffline || !moving, onClick: pause },
    { key: "play", label: "Play", icon: <PlayCircleIcon className="rlc-btn__icon" />, disabled: selOffline || moving, onClick: play },
    { key: "charge", label: "Send to Charging", icon: <BoltCircleIcon className="rlc-btn__icon" />,
      disabled: selOffline || !(status === "tour" || status === "paused"), onClick: charge },
  ];

  return (
    <DashboardLayout userName={session.name || "Admin"} userPicture={session.picture} onLogout={handleLogout}>
      <div className="rlc">
        <header className="rlc__head reveal" style={{ "--i": 0 }}>
          <h1 className="rlc__title">Robot Live Control</h1>
          <p className="rlc__subtitle">Monitor and control your museum robots in real time</p>
        </header>

        <div className="rlc__grid">
          {/* ===== Robot cards (RoboGuide 01 = live · RoboGuide 02 = offline, not built yet) ===== */}
          {ROBOTS.map((r, idx) => {
            const st = r.offline ? "offline" : status;
            const pct = r.offline ? 0 : battery;
            const online = !r.offline && connected;
            return (
              <article
                key={r.id}
                className={`rlc-card rlc-card--${st} ${r.id === selected.id ? "rlc-card--selected" : ""} reveal`}
                style={{ "--i": 1 + idx * 0.2 }}
                role="button" tabIndex={0} aria-pressed={r.id === selected.id}
                onClick={() => setSelectedId(r.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(r.id); } }}
              >
                <div className="rlc-card__body">
                  <div className="rlc-card__top">
                    <h2
                      className="rlc-card__name"
                      style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
                    >
                      {r.name}
                      <span
                        className={`rlc-esp-dot ${online ? "rlc-esp-dot--on" : "rlc-esp-dot--off"}`}
                        title={online ? "ESP32 Connected" : "ESP32 Offline"}
                      />
                    </h2>
                  </div>

                  <button type="button" className="rlc-card__status" disabled={r.offline} onClick={(e) => { e.stopPropagation(); navigate(`/robots/${r.id}`); }}>
                    <StatusCheckIcon className="rlc-card__status-icon" />
                    <span>{liveStatusLabels[st]}</span>
                    {!r.offline && (
                      <svg className="rlc-card__chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="4,2 16,10 4,18" />
                      </svg>
                    )}
                  </button>

                  <div className={`rlc-card__battery rlc-card__battery--${r.offline ? "off" : batteryLevel(pct)}`}>
                    <BatteryBoltIcon className="rlc-card__battery-icon" />
                    <div className="rlc-card__bar">
                      <div className="rlc-card__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="rlc-card__pct">{r.offline ? "--" : `${pct}%`}</span>
                  </div>
                </div>
              </article>
            );
          })}

          {/* ===== Live Location ===== */}
          <section className="rlc-live rlc-panel reveal" style={{ "--i": 2 }}>
            <h2 className="rlc-panel__title rlc-live__title">
              <LuMapPin className="rlc-live__pin" /> Live Location
              <span className={`rlc-live__tag rlc-live__tag--${selOffline ? "offline" : status}`}>{selOffline ? liveStatusLabels.offline : liveStatusLabels[status]}</span>
            </h2>
            <div className="rlc-live__map">
              <RobotMap markerRef={markerRef} status={selOffline ? "offline" : status} hideRobot={selOffline} />
            </div>
          </section>

          {/* ===== Robot Controls ===== */}
          <section className="rlc-controls rlc-panel reveal" style={{ "--i": 3 }}>
            <h2 className="rlc-panel__title">Robot Controls</h2>
            <p className="rlc-controls__who">{selected.name}{selOffline ? " · Offline" : ""}</p>
            <div className="rlc-controls__list">
              {controls.map((c) => (
                <button key={c.key} type="button" className="rlc-btn" disabled={c.disabled} onClick={c.onClick}>
                  {c.icon}<span>{c.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}