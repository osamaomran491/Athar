import logo3x from "../../assets/images/logo@3x.png";
import { TIMINGS } from "./loaderConfig";

/**
 * شاشة التحميل:
 *  - الطبقة الباهتة (ghost) = اللوجو بشفافية قليلة
 *  - طبقة التعبئة (fill)   = نفس اللوجو بالألوان الكاملة، بيتكشف من تحت لفوق بحافة مائلة
 */
export default function Loader({ phase, instant }) {
  const vars = {
    "--t-overlay-in": `${TIMINGS.overlayIn}ms`,
    "--t-ghost-delay": `${TIMINGS.ghostDelay}ms`,
    "--t-ghost-dur": `${TIMINGS.ghostDur}ms`,
    "--t-fill-delay": `${TIMINGS.fillDelay}ms`,
    "--t-fill-dur": `${TIMINGS.fillDur}ms`,
    "--t-out-dur": `${TIMINGS.outDur}ms`,
  };

  return (
    <div
      className={`loader ${instant ? "loader--instant" : ""}`}
      data-phase={phase}
      style={vars}
      role="status"
      aria-label="Loading"
    >
      <div className="loader__logo">
        <img className="loader__ghost" src={logo3x} alt="" />
        <img className="loader__fill" src={logo3x} alt="" />
      </div>
    </div>
  );
}
