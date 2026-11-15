
import { useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { robotStore } from "../../data/robotStore";
import { liveStatusLabels } from "../../data/robotsData";

export default function RobotStatusCard({
  robots,
  className = "",
  style
}) {
  const navigate = useNavigate();

  const { status, battery } = useSyncExternalStore(
    robotStore.subscribe,
    robotStore.getSnapshot
  );

  // ESP32 connection (same dot as Robot Live Control)
  const { connected } = useSyncExternalStore(
    robotStore.subscribeTelemetry,
    robotStore.getTelemetrySnapshot
  );

  return (
    <section
      className={`glass-card robot-panel ${className}`}
      style={style}
    >
      <h2 className="robot-panel__title">
        Robot Status
      </h2>

      <div className="robot-list">
        {robots.map((robot) => {
          // RoboGuide 1 = live robot · robots flagged `offline` (not built yet) are always Offline
          const st = robot.offline ? "offline" : status;
          const pct = robot.offline ? 0 : battery;
          const espOn = !robot.offline && connected;
          return (
          <button
            key={robot.id}
            className="robot-status-row"
            onClick={() => navigate("/robots")}
            type="button"
          >
            <div className="robot-status-header">
              <span className="robot-status-name">
                {robot.name}
                <span
                  className={`robot-esp-dot ${espOn ? "robot-esp-dot--on" : "robot-esp-dot--off"}`}
                  title={espOn ? "ESP32 Connected" : "ESP32 Offline"}
                />
              </span>

              <span className={`robot-status-state ${st}`}>
                <span className="status-dot">●</span>
                {liveStatusLabels[st] || "Unknown"}
                <span className="robot-arrow">›</span>
              </span>
            </div>

            <div className="robot-battery-row">
              <span className={`battery-icon ${robot.offline ? "battery-icon--off" : ""}`}>▰</span>

              <div className="battery-track">
                <div
                  className="battery-fill"
                  style={{
                    width: `${pct}%`
                  }}
                />
              </div>

              <span className="battery-value">
                {robot.offline ? "--" : `${pct}%`}
              </span>
            </div>
          </button>
          );
        })}
      </div>
    </section>
  );
}
