import { Navigate, useNavigate } from "react-router-dom";
import { LuMapPin } from "react-icons/lu";
import DashboardLayout from "../components/layout/DashboardLayout";
import RobotMap from "../components/robots/RobotMap";
import { StatusCheckIcon, BatteryBoltIcon, PauseCircleIcon, BoltCircleIcon, PlayCircleIcon } from "../components/robots/RobotIcons";
import { ROBOT, liveStatusLabels } from "../data/robotsData";
import useRobotSim from "../hooks/useRobotSim";
import { getSession, logout } from "../services/authService";

function batteryLevel(p) { return p >= 60 ? "high" : p >= 20 ? "mid" : "low"; }

export default function Robots() {
  const navigate = useNavigate();
  const session = getSession();
  
  const robotSim = useRobotSim();
  const { status, battery, markerRef, pause, play, charge } = robotSim;
  const connected = robotSim.connected || false;

  if (!session) return <Navigate to="/login" replace />;

  const handleLogout = () => { 
    logout(); 
    window.location.assign(`${import.meta.env.BASE_URL}login`); 
  };

  const moving = status === "tour" || status === "returning";
  const controls = [
    { key: "pause", label: "Pause", icon: <PauseCircleIcon className="rlc-btn__icon" />, disabled: !moving, onClick: pause },
    { key: "play", label: "Play", icon: <PlayCircleIcon className="rlc-btn__icon" />, disabled: moving, onClick: play },
    { key: "charge", label: "Send to Charging", icon: <BoltCircleIcon className="rlc-btn__icon" />,
      disabled: !(status === "tour" || status === "paused"), onClick: charge },
  ];

  return (
    <DashboardLayout userName={session.name || "Admin"} userPicture={session.picture} onLogout={handleLogout}>
      <div className="rlc">
        <header className="rlc__head reveal" style={{ "--i": 0 }}>
          <h1 className="rlc__title">Robot Live Control</h1>
          <p className="rlc__subtitle">Monitor and control your museum robot in real time</p>
        </header>

        <div className="rlc__grid">
          {/* ===== Robot card ===== */}
          <article className={`rlc-card rlc-card--${status} reveal`} style={{ "--i": 1 }}>
            <div className="rlc-card__body">
              <div className="rlc-card__top">
                <h2 
                  className="rlc-card__name" 
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "10px" }} 
                  onClick={() => navigate(`/robots/${ROBOT.id}`)}
                >
                  {ROBOT.name}
                  <span 
                    className={`rlc-esp-dot ${connected ? "rlc-esp-dot--on" : "rlc-esp-dot--off"}`}
                    title={connected ? "ESP32 Connected" : "ESP32 Offline"} 
                  />
                </h2>

                <button type="button" className="rlc-card__status" onClick={() => navigate(`/robots/${ROBOT.id}`)}>
                  <StatusCheckIcon className="rlc-card__status-icon" />
                  <span>{liveStatusLabels[status]}</span>
                  <svg className="rlc-card__chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="4,2 16,10 4,18" />
                  </svg>
                </button>
              </div>

              <div className={`rlc-card__battery rlc-card__battery--${batteryLevel(battery)}`}>
                <BatteryBoltIcon className="rlc-card__battery-icon" />
                <div className="rlc-card__bar">
                  <div className="rlc-card__fill" style={{ width: `${battery}%` }} />
                </div>
                <span className="rlc-card__pct">{battery}%</span>
              </div>
            </div>
          </article>

          {/* ===== Live Location ===== */}
          <section className="rlc-live rlc-panel reveal" style={{ "--i": 2 }}>
            <h2 className="rlc-panel__title rlc-live__title">
              <LuMapPin className="rlc-live__pin" /> Live Location
              <span className={`rlc-live__tag rlc-live__tag--${status}`}>{liveStatusLabels[status]}</span>
            </h2>
            <div className="rlc-live__map">
              <RobotMap markerRef={markerRef} status={status} />
            </div>
          </section>

          {/* ===== Robot Controls ===== */}
          <section className="rlc-controls rlc-panel reveal" style={{ "--i": 3 }}>
            <h2 className="rlc-panel__title">Robot Controls</h2>
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