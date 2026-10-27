export default function RobotFaceIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* head */}
      <rect x="3" y="7" width="18" height="13" rx="4" />
      {/* antenna */}
      <path d="M12 7V4" />
      {/* ears */}
      <path d="M1 12.5v3" />
      <path d="M23 12.5v3" />
      {/* eyes */}
      <path d="M9 12.5v.01" />
      <path d="M15 12.5v.01" />
      {/* smile */}
      <path d="M9.5 16.2c1.4 1.1 3.6 1.1 5 0" />
    </svg>
  );
}