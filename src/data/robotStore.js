// robotStore.js — ONE shared robot simulation for the whole app (Dashboard + Robot Live Control).
// It runs once, keeps going while you move between pages, and is saved in localStorage (survives refresh).
// Replace the movement logic with real robot data (socket/API) later; components only use `robotStore`.
import { ROUTE, STOPS, STOP_SECONDS } from "./robotsData";

const KEY = "athar.robot.v2";
const SPEED = 70;         // map units / second (tour)
const RETURN_SPEED = 130; // heading back to the dock is faster

// loop geometry (route closes back to the first point; the dock is the first point)
const pts = [...ROUTE, ROUTE[0]];
const cum = [0];
for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
export const LOOP = cum[cum.length - 1];
const DOCK_S = 0;

const STOP_S = STOPS.map((st) => {
  let best = 0, bd = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], l = cum[i] - cum[i - 1];
    const t = Math.max(0, Math.min(1, ((st.x - a.x) * (b.x - a.x) + (st.y - a.y) * (b.y - a.y)) / (l * l)));
    const d = Math.hypot(a.x + (b.x - a.x) * t - st.x, a.y + (b.y - a.y) * t - st.y);
    if (d < bd) { bd = d; best = cum[i - 1] + l * t; }
  }
  return best;
});

export function pointAt(s) {
  const d = ((s % LOOP) + LOOP) % LOOP;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  const a = pts[i - 1], b = pts[i];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && typeof v.s === "number") return v;
  } catch { /* ignore */ }
  return { status: "tour", s: 0, battery: 68 };
}

const sim = load();
let wait = 0;
let snapshot = { status: sim.status, battery: Math.round(sim.battery) };
const listeners = new Set();   // React state changes (status / battery)
const frameListeners = new Set(); // every animation frame (map marker)
let started = false;

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(sim)); } catch { /* ignore */ } };
const publish = () => {
  const battery = Math.round(sim.battery);
  if (snapshot.status !== sim.status || snapshot.battery !== battery) {
    snapshot = { status: sim.status, battery };
    listeners.forEach((l) => l());
  }
};
const setStatus = (st) => { sim.status = st; publish(); save(); };

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (sim.status === "tour") {
      if (wait > 0) wait -= dt;                 // standing at an artifact
      else {
        const prev = sim.s;
        let next = prev + SPEED * dt;
        const hit = STOP_S.find((st) => prev < st - 0.01 && next >= st);
        if (hit !== undefined) { next = hit; wait = STOP_SECONDS; }
        sim.s = next >= LOOP ? 0 : next;
      }
    } else if (sim.status === "returning") {
      const back = sim.s <= LOOP - sim.s;       // shortest way to the dock
      sim.s += (back ? -1 : 1) * RETURN_SPEED * dt;
      if ((back && sim.s <= 0) || (!back && sim.s >= LOOP)) { sim.s = DOCK_S; setStatus("charging"); }
    }
    frameListeners.forEach((f) => f(pointAt(sim.s)));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  setInterval(() => {
    if (sim.status === "tour") sim.battery = Math.max(0, sim.battery - 0.3);
    else if (sim.status === "returning") sim.battery = Math.max(0, sim.battery - 0.2);
    else if (sim.status === "charging") sim.battery = Math.min(100, sim.battery + 0.35);
    if (sim.status === "tour" && sim.battery <= 15) setStatus("returning"); // low battery → go charge
    publish(); save();
  }, 1500);
  window.addEventListener("beforeunload", save);
}

export const robotStore = {
  subscribe(l) { start(); listeners.add(l); return () => listeners.delete(l); },
  getSnapshot: () => snapshot,
  onFrame(f) { start(); frameListeners.add(f); f(pointAt(sim.s)); return () => frameListeners.delete(f); },
  pause() { if (sim.status === "tour" || sim.status === "returning") setStatus("paused"); },
  play() { if (sim.status === "paused" || sim.status === "charging") { wait = 0; setStatus("tour"); } },
  charge() { if (sim.status === "tour" || sim.status === "paused") setStatus("returning"); },
};
