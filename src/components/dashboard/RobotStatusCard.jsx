import RobotIcon from "./RobotIcon";
import { statusLabels } from "../../data/dashboardData";

export default function RobotStatusCard({ robots, onOpen, onSelect, className = "", style }) {
  return (
    <section
      className={`glass-card robot-panel ${onOpen ? "robot-panel--link" : ""} ${className}`}
      style={style}
      onClick={onOpen}
    >
      <h2 className="robot-panel__title">Robot Status</h2>

      <ul className="robot-list">
        {robots.map((robot) => (
          <li key={robot.id}>
            <button type="button" className="robot-row" onClick={(e) => {
                e.stopPropagation(); // do not also trigger the panel's onOpen
                onSelect?.(robot);
              }}>
              <RobotIcon className="robot-row__icon" />
              <span className="robot-row__name">{robot.name}</span>
              <span className="robot-row__status">
              {robot.status && (
                <span className={`badge badge--${robot.status}`}>{statusLabels[robot.status]}</span>
              )}
              </span>
              <svg className="robot-row__chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="2,2 18,10 2,18" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
