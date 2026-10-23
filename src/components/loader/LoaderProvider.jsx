import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Loader from "./Loader";
import { SHOW_ON_PAGE_LOAD, TIMINGS, TOTAL } from "./loaderConfig";

const LoaderContext = createContext({ showLoader: () => Promise.resolve() });

/** استخدمها في أي صفحة:  const { showLoader } = useLoader();
 *  await showLoader({ onCovered: () => navigate("/dashboard") });
 *  - onCovered: بتتنفذ والشاشة مغطية كل حاجة (هنا بتغيّر الصفحة)
 *  - الـ Promise بتخلص لما الشاشة تختفي تمامًا */
export const useLoader = () => useContext(LoaderContext);

export function LoaderProvider({ children }) {
  const [phase, setPhase] = useState(SHOW_ON_PAGE_LOAD ? "in" : "idle"); // idle | in | out
  const [run, setRun] = useState({ id: 1, instant: true });              // instant = من غير fade-in (أول تحميل)
  const timers = useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const showLoader = useCallback(({ onCovered, instant = false } = {}) => {
    return new Promise((resolve) => {
      clearTimers();
      setRun((r) => ({ id: r.id + 1, instant }));
      setPhase("in");
      later(() => onCovered?.(), TIMINGS.covered);
      later(() => setPhase("out"), TIMINGS.outStart);
      later(() => { setPhase("idle"); resolve(); }, TOTAL);
    });
  }, []);

  // تشغيل الأنيميشن مع أول تحميل/reload للصفحة
  useEffect(() => {
    if (SHOW_ON_PAGE_LOAD) showLoader({ instant: true });
    return clearTimers;
  }, [showLoader]);

  // لحد ما الشاشة تبدأ تختفي، أنيميشن ظهور الصفحة (.reveal) يفضل واقف، فيبدأ مع اختفاء اللوجو
  useEffect(() => {
    document.documentElement.dataset.loader = phase === "in" ? "on" : "off";
  }, [phase]);

  return (
    <LoaderContext.Provider value={{ showLoader }}>
      {children}
      {phase !== "idle" && <Loader key={run.id} phase={phase} instant={run.instant} />}
    </LoaderContext.Provider>
  );
}
