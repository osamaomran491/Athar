// RobotMap.jsx — live museum map (Pharaonic style) built from the floor plan in the_Ground.pdf.
import { WALLS, WALL_BOTTOM, Monuments, SHOWCASES, ROUTE } from "../../data/robotsData";

const routeD = "M" + ROUTE.map((p) => `${p.x},${p.y}`).join(" L") + " Z";
const dock = ROUTE.find((p) => p.dock);

function Ankh({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="var(--m-gold)" strokeWidth="5" strokeLinecap="round">
      <ellipse cx="0" cy="-16" rx="9" ry="13" /><path d="M0 -3 V34 M-14 8 H14" />
    </g>
  );
}

export default function RobotMap({ markerRef, status }) {
  return (
    <svg className={`rmap rmap--${status}`} viewBox="0 0 1345 896" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Live robot location map">
      <defs>
        <pattern id="rmSand" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill="var(--m-sand)" />
          <path d="M0 12 H24 M12 0 V24" stroke="var(--m-grid)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="4" y="4" width="1337" height="888" rx="10" fill="url(#rmSand)" stroke="var(--m-gold)" strokeWidth="8" />
      <rect x="22" y="22" width="1301" height="852" rx="6" fill="none" stroke="var(--m-gold)" strokeWidth="2" strokeDasharray="14 8" opacity=".6" />

    {Monuments.map((h) => {
     const IN = 14;     
     const BOTTOM = 36;  
     const dw = h.w - IN * 2;
     const dh = h.h - IN - BOTTOM;
     return (
    <g key={h.label}>
      <rect x={h.x} y={h.y} width={h.w} height={h.h} fill="var(--m-stone)" stroke="var(--m-gold)" strokeWidth="3" />
      <rect x={h.x + IN} y={h.y + IN} width={dw} height={dh}
            fill="none" stroke="var(--m-gold)" strokeWidth="1.5" strokeDasharray="6 5" />
      <Ankh x={h.x + h.w / 2} y={h.y + IN + dh / 2 - 4} s={1.1} />
      <text x={h.x + h.w / 2} y={h.y + h.h - 12} textAnchor="middle" className="rmap__label">{h.label}</text>
    </g>
  );
})}

      {/* walls */}
      <path d={WALLS} fill="none" stroke="var(--m-wall)" strokeWidth="14" strokeLinejoin="round" strokeLinecap="round" />
      <path d={WALL_BOTTOM} fill="none" stroke="var(--m-wall)" strokeWidth="14" strokeLinecap="round" />
      <path d={WALLS} fill="none" stroke="var(--m-gold)" strokeWidth="3" strokeDasharray="3 13" strokeLinecap="round" />

      {SHOWCASES.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx="4" fill="var(--m-wall)" stroke="var(--m-gold)" strokeWidth="3" />
      ))}

      {/* robot route */}
      <path d={routeD} fill="none" stroke="var(--m-gold)" strokeWidth="4" strokeDasharray="4 14" strokeLinecap="round" opacity=".7" />

      {/* charging dock */}
      <g transform={`translate(${dock.x} ${dock.y})`}>
        <rect x="-26" y="-26" width="52" height="52" rx="10" fill="var(--m-sand)" stroke="var(--m-green)" strokeWidth="4" />
        <polygon points="4,-16 -10,4 -1,4 -4,16 10,-4 1,-4" fill="var(--m-green)" />
        <text y="72" textAnchor="middle" className="rmap__label">Charging Dock</text>
      </g>

      {/* the robot (moved directly through the ref → smooth) */}
      <g ref={markerRef} className="rmap__robot">
        <circle className="rmap__pulse" r="22" />
        <circle r="17" fill="var(--m-gold)" stroke="#fff" strokeWidth="4" />
        <path d="M-8 3 Q0 -9 8 3 Q0 10 -8 3Z M0 -1 V3" fill="#fff" stroke="none" />
        <circle cx="0" cy="1" r="2.6" fill="var(--m-gold)" />
      </g>
    </svg>
  );
}
