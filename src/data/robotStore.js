// robotStore.js — Real ESP32 WebSocket connection + simulation fallback.
// Replaces the old simulation-only store. Connects to ESP32 via WebSocket
// for REAL telemetry (battery, status, charging) and sends commands (pause/play/charge).
// Falls back to the old simulation when ESP32 is not reachable.
//
// ⚡ Drop-in replacement: same API as before — nothing else needs to change.
import { ROUTE, STOPS, STOP_SECONDS } from "./robotsData";
// ─── ESP32 Configuration ───────────────────────────────────────────
const ESP32_IP   = "192.168.4.1";
const WS_URL     = `ws://${ESP32_IP}/ws`;
const RECONNECT  = 2000;   // ms before retrying connection
// ─── Simulation fallback (used when ESP32 is offline) ──────────────
const KEY = "athar.robot.v2";
const SPEED = 70;
const RETURN_SPEED = 130;
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
// ─── Shared state ──────────────────────────────────────────────────
const sim = load();
let wait = 0;
let snapshot = { status: sim.status, battery: Math.round(sim.battery) };
// ─── NEW: Extra telemetry from ESP32 ───────────────────────────────
let espTelemetry = {
  voltage:  0,
  current:  0,
  power:    0,
  charging: false,
  connected: false,    // true when WebSocket is open
};
let telemetrySnapshot = { ...espTelemetry };
const listeners = new Set();
const frameListeners = new Set();
const telemetryListeners = new Set();   // NEW: for voltage/current/power subscribers
let started = false;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(sim)); } catch { /* ignore */ } };
const publish = () => {
  const battery = Math.round(sim.battery);
  if (snapshot.status !== sim.status || snapshot.battery !== battery) {
    snapshot = { status: sim.status, battery };
    listeners.forEach((l) => l());
  }
};
const publishTelemetry = () => {
  const next = { ...espTelemetry };
  if (JSON.stringify(next) !== JSON.stringify(telemetrySnapshot)) {
    telemetrySnapshot = next;
    telemetryListeners.forEach((l) => l());
  }
};
const setStatus = (st) => { sim.status = st; publish(); save(); };
// ─── WebSocket connection to ESP32 ─────────────────────────────────
let ws = null;
let reconnectTimer = null;
let useESP = false;   // switches to true once we receive real data
function connectESP() {
  if (typeof window === "undefined") return;
  try {
    ws = new WebSocket(WS_URL);
  } catch {
    scheduleReconnect();
    return;
  }
    ws.onopen = () => {
    console.log("✅ Connected to ATHAR ESP32");
    espTelemetry.connected = true;
    useESP = true;
    publishTelemetry();
  };
  ws.onclose = () => {
    console.log("❌ ESP32 disconnected. Retrying in 2s…");
    espTelemetry.connected = false;
    publishTelemetry();
    scheduleReconnect();
  };
  ws.onerror = () => {
    ws?.close();
  };
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Update battery & status from real robot
      if (data.percent  != null) sim.battery = data.percent;
      if (data.charging != null) espTelemetry.charging = data.charging;
      if (data.voltage  != null) espTelemetry.voltage  = data.voltage;
      if (data.current  != null) espTelemetry.current  = data.current;
      if (data.power    != null) espTelemetry.power    = data.power;
      // Map ESP32 status strings to our internal status keys
      if (data.status) {
        const map = {
          "MOVING":  "tour",
          "STOPPED": "paused",
          "STALL":   "paused",
        };
             const mapped = map[data.status] || sim.status;
        // If charging flag is on, override to charging
        if (data.charging) {
          sim.status = "charging";
        } else {
          sim.status = mapped;
        }
      }
      publish();
      publishTelemetry();
      save();
    } catch (e) {
      console.warn("Bad JSON from ESP32:", e);
    }
  };
}
function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connectESP, RECONNECT);
}
function sendToESP(cmd) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(cmd));
    console.log("📤 Sent to ESP32:", cmd);
    return true;
  }
  return false;
}
// ─── Simulation engine (runs only when ESP32 is offline) ───────────
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  // Try connecting to ESP32 first
  connectESP();
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    // Only run simulation movement when ESP32 is NOT connected
    if (!useESP || !espTelemetry.connected) {
      if (sim.status === "tour") {
        if (wait > 0) wait -= dt;
        else {
          const prev = sim.s;
          let next = prev + SPEED * dt;
          const hit = STOP_S.find((st) => prev < st - 0.01 && next >= st);
          if (hit !== undefined) { next = hit; wait = STOP_SECONDS; }
          sim.s = next >= LOOP ? 0 : next;
        }
      } else if (sim.status === "returning") {
        const back = sim.s <= LOOP - sim.s;
        sim.s += (back ? -1 : 1) * RETURN_SPEED * dt;
        if ((back && sim.s <= 0) || (!back && sim.s >= LOOP)) { sim.s = DOCK_S; setStatus("charging"); }
      }
    }
    frameListeners.forEach((f) => f(pointAt(sim.s)));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
    // Battery drain simulation (only when ESP32 is offline)
  setInterval(() => {
    if (!useESP || !espTelemetry.connected) {
      if (sim.status === "tour") sim.battery = Math.max(0, sim.battery - 0.3);
      else if (sim.status === "returning") sim.battery = Math.max(0, sim.battery - 0.2);
      else if (sim.status === "charging") sim.battery = Math.min(100, sim.battery + 0.35);
      if (sim.status === "tour" && sim.battery <= 15) setStatus("returning");
    }
    publish(); save();
  }, 1500);
  window.addEventListener("beforeunload", save);
}
// ─── Public API (same as before + new telemetry) ───────────────────
export const robotStore = {
  subscribe(l) { start(); listeners.add(l); return () => listeners.delete(l); },
  getSnapshot: () => snapshot,
  onFrame(f) { start(); frameListeners.add(f); f(pointAt(sim.s)); return () => frameListeners.delete(f); },
  // NEW: subscribe to ESP32 telemetry (voltage, current, power, charging, connected)
  subscribeTelemetry(l) { start(); telemetryListeners.add(l); return () => telemetryListeners.delete(l); },
  getTelemetrySnapshot: () => telemetrySnapshot,
  // Commands — send to ESP32 if connected, otherwise do local simulation
  pause() {
    if (!sendToESP({ action: "STOP" })) {
      if (sim.status === "tour" || sim.status === "returning") setStatus("paused");
    }
  },
    play() {
    if (!sendToESP({ action: "FORWARD" })) {
      if (sim.status === "paused" || sim.status === "charging") { wait = 0; setStatus("tour"); }
    }
  },
  charge() {
    if (!sendToESP({ action: "CHARGE" })) {
      if (sim.status === "tour" || sim.status === "paused") setStatus("returning");
    }
  },
  // NEW: Check if ESP32 is connected
  get isESPConnected() { return espTelemetry.connected; },
};