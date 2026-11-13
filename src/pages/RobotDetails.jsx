// src/pages/RobotDetails.jsx — Route: /robots/:id
import { useNavigate } from "react-router-dom";
import DashboardPage from "../components/dashboard/DashboardPage";
import { ROBOT } from "../data/robotsData";
import useRobotSim from "../hooks/useRobotSim";

export default function RobotDetails() {
  const navigate = useNavigate();
  const robotSim = useRobotSim();
  
  const telemetry = robotSim.telemetry || { voltage: 0, current: 0, power: 0, charging: false };
  const connected = robotSim.connected || false;

  return (
    <DashboardPage title={ROBOT.name}>
      <div className="rlc" style={{ padding: "0" }}>
        
        {/* زر رجوع لصفحة التحكم */}
        <button 
          onClick={() => navigate("/robots")}
          className="rlc-card__status"
          style={{ marginBottom: "20px", display: "inline-flex", cursor: "pointer", fontSize: "15px" }}
        >
          ← Back to Robots
        </button>

        {/* الجزء اللي في صورتك بالظبط */}
        <section className="rlc-telemetry rlc-panel" style={{ marginTop: "10px" }}>
          <h2 className="rlc-panel__title" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚡</span> Live Telemetry
          </h2>

          <div className="rlc-telemetry__grid">
            <div className="rlc-telemetry__item">
              <span className="rlc-telemetry__value">{Number(telemetry.voltage || 0).toFixed(2)}</span>
              <span className="rlc-telemetry__unit">VOLT</span>
            </div>

            <div className="rlc-telemetry__item">
              <span className="rlc-telemetry__value">{Number(telemetry.current || 0).toFixed(2)}</span>
              <span className="rlc-telemetry__unit">AMP</span>
            </div>

            <div className="rlc-telemetry__item">
              <span className="rlc-telemetry__value">{Number(telemetry.power || 0).toFixed(1)}</span>
              <span className="rlc-telemetry__unit">WATT</span>
            </div>

            <div className="rlc-telemetry__item" style={{ background: "transparent", border: "none" }}>
              <span className={`rlc-telemetry__badge ${telemetry.charging ? "rlc-telemetry__badge--charging" : ""}`}>
                {telemetry.charging ? "⚡ Charging" : "🔋 Discharging"}
              </span>
            </div>
          </div>

          {!connected && (
            <p className="rlc-telemetry__hint" style={{ marginTop: "14px" }}>
              ⚠️ ESP32 offline — showing simulated data
            </p>
          )}
        </section>

      </div>
    </DashboardPage>
  );
}