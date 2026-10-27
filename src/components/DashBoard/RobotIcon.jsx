export default function RobotIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 62 68" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {/* antenna */}
      <line x1="31" y1="0" x2="31" y2="8" />
      {/* head */}
      <rect x="7" y="8" width="48" height="28" rx="14" />
      {/* eyes */}
      <circle cx="24" cy="22" r="1.3" fill="currentColor" />
      <circle cx="38" cy="22" r="1.3" fill="currentColor" />
      {/* shoulders (open at the bottom) */}
      <path d="M1 67 V58 Q1 46 14 46 H48 Q61 46 61 58 V67" />
    </svg>
  );
}