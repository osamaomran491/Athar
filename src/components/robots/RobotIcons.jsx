// RobotIcons.jsx
// Small SVG icons used only by the Robot Live Control page (shapes copied from the design).

/* filled circle with a check — the status icon before "On Tour" / "Charging" ... */
export function StatusCheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="currentColor" />
      <polyline points="5,9.4 7.9,12.1 13,6.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* battery with a bolt — color comes from `currentColor` */
export function BatteryBoltIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 14" aria-hidden="true">
      <rect x="0.9" y="0.9" width="19.2" height="12.2" rx="3" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.5" />
      <rect x="21.6" y="4.5" width="2" height="5" rx="1" fill="currentColor" />
      <polygon points="11.4,2.6 7.6,7.6 10.6,7.6 9.6,11.4 13.6,6.2 10.6,6.2" fill="currentColor" />
    </svg>
  );
}

/* gold circle with the "pause" bars (Pause Tour button) */
export function PauseCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="13" fill="currentColor" />
      <rect x="8.6" y="8" width="3" height="10" rx="1.5" fill="#fff" />
      <rect x="14.4" y="8" width="3" height="10" rx="1.5" fill="#fff" />
    </svg>
  );
}

/* gold circle with a bolt (Send to Charging button) */
export function BoltCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="13" fill="currentColor" />
      <polygon points="14.6,4.8 7.6,14.2 12.4,14.2 11.4,21.2 18.4,11.6 13.6,11.6" fill="#fff" />
    </svg>
  );
}

/* gold circle with a play triangle (Play button) */
export function PlayCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="13" fill="currentColor" />
      <polygon points="10,7.6 19,13 10,18.4" fill="#fff" />
    </svg>
  );
}
