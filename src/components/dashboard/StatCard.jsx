import { motion } from "framer-motion";
import { LuArrowUpRight, LuArrowDownRight } from "react-icons/lu";

export default function StatCard({ label, value, change, className = "" }) {
  // a change that starts with "-" is shown as a drop (red arrow down)
  const isDrop = typeof change === "string" && change.trim().startsWith("-");
  const TrendIcon = isDrop ? LuArrowDownRight : LuArrowUpRight;

  return (
    <motion.article
      className={`glass-card stat-card ${className}`}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <h2 className="stat-card__label">{label}</h2>

      {/* the number and the weekly change only show when there is real data */}
      {value && <p className="stat-card__value">{value}</p>}
      {change && (
        <p className={`stat-card__trend ${isDrop ? "stat-card__trend--down" : ""}`}>
          <TrendIcon className="stat-card__arrow" />
          <span className="stat-card__change">{change}</span>
          <span className="stat-card__note">From last week</span>
        </p>
      )}
    </motion.article>
  );
}