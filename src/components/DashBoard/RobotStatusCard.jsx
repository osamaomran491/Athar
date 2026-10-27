import RobotIcon from "./RobotIcon";
import { statusLabels } from "../../Data/dashboardData";

export default function RobotStatusCard({ robots, onSelect, className = "", style }) {
  return (
    <section className={`card robot-panel ${className}`} style={style}>
      <h2 className="robot-panel__title">Robot Status</h2>

      <ul className="robot-list">
        {robots.map((robot) => (
          <li key={robot.id}>
            <button type="button" className="robot-row" onClick={() => onSelect?.(robot)}>
              <RobotIcon className="robot-row__icon" />
              <span className="robot-row__name">{robot.name}</span>
              <span className={`badge badge--${robot.status}`}>{statusLabels[robot.status]}</span>
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