
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

  return (
    <section
      className={`glass-card robot-panel ${className}`}
      style={style}
    >
      <h2 className="robot-panel__title">
        Robot Status
      </h2>

      <div className="robot-list">
        {robots.map((robot) => (
          <button
            key={robot.id}
            className="robot-status-row"
            onClick={() => navigate("/robots")}
            type="button"
          >
            <div className="robot-status-header">
              <span className="robot-status-name">
                {robot.name}
              </span>

              <span className={`robot-status-state ${status}`}>
                <span className="status-dot">●</span>
                {liveStatusLabels[status] || "Unknown"}
                <span className="robot-arrow">›</span>
              </span>
            </div>

            <div className="robot-battery-row">
              <span className="battery-icon">▰</span>

              <div className="battery-track">
                <div
                  className="battery-fill"
                  style={{
                    width: `${battery}%`
                  }}
                />
              </div>

              <span className="battery-value">
                {battery}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
