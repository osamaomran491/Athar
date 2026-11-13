// RobotStatusCard.jsx — "Robot Status" card for the Dashboard.
// Shows the SAME live robot as /robots (status + battery) and links to Robot Live Control.
// Usage in the dashboard:  <RobotStatusCard />   (replace the old static Robot Status block)
import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { LuBot } from "react-icons/lu";
import { robotStore } from "../../data/robotStore";
import { ROBOT, liveStatusLabels } from "../../data/robotsData";
import "../../styles/robotStatusCard.css";

export default function RobotStatusCard() {
  const { status, battery } = useSyncExternalStore(robotStore.subscribe, robotStore.getSnapshot);
  const level = battery >= 60 ? "high" : battery >= 20 ? "mid" : "low";

  return (
    <section className="rsc">
      <h2 className="rsc__title">Robot Status</h2>
      <Link to="/robots" className="rsc__row" aria-label={`Open Robot Live Control for ${ROBOT.name}`}>
        <LuBot className="rsc__icon" />
        <div className="rsc__info">
          <strong className="rsc__name">{ROBOT.name}</strong>
          <span className={`rsc__status rsc__status--${status}`}>
            <i className="rsc__dot" />{liveStatusLabels[status]}
          </span>
        </div>
        <span className={`rsc__battery rsc__battery--${level}`}>
          <span className="rsc__bar"><span style={{ width: `${battery}%` }} /></span>
          {battery}%
        </span>
        <svg className="rsc__chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6,2 14,10 6,18" />
        </svg>
      </Link>
    </section>
  );
}
