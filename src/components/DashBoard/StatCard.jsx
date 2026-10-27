export default function StatCard({ label, value, change, className = "", style }) {
  return (
    <article className={`card stat-card ${className}`} style={style}>
      <h2 className="stat-card__label">{label}</h2>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__trend">
        {/* green triangle */}
        <svg className="stat-card__arrow" viewBox="0 0 14 12" aria-hidden="true">
          <polygon points="7,0 14,12 0,12" />
        </svg>
        <span className="stat-card__change">{change}</span>
        <span className="stat-card__note">From last week</span>
      </p>
    </article>
  );
}