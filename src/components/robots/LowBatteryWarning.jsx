// src/components/robots/LowBatteryWarning.jsx
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { robotStore } from "../../data/robotStore";
import { ROBOT, liveStatusLabels } from "../../data/robotsData";
import { canAccessPage, getSession } from "../../services/authService";
import { BoltCircleIcon, PauseCircleIcon } from "./RobotIcons";
import "../../styles/lowBatteryWarning.css";

const LOW_BATTERY_THRESHOLD = 15;
const SOUND_REPEAT_MS = 10000;

let audioCtx = null;
let audioUnlocked = false;

// حفظ حالة الرسالة بين الصفحات أثناء التنقل في الداشبورد
const alertState = {
  wasLow: false,
  open: false,
  alarmActive: false,
  muted: false,
};

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function initWarningAudio() {
  if (typeof window === "undefined" || audioUnlocked) return;
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    audioUnlocked = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

function playWarningSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const pulses = [
    { start: 0, duration: 0.16, freq: 880 },
    { start: 0.22, duration: 0.16, freq: 880 },
    { start: 0.44, duration: 0.28, freq: 660 },
  ];

  pulses.forEach(({ start, duration, freq }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + start);
    gain.gain.setValueAtTime(0.001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.28, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.02);
  });
}

function sendBrowserWarning(robotName, battery) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const show = () => {
    new Notification(`Low Battery: ${robotName}`, {
      body: `${robotName} battery reached ${battery}%. Please send it to charge.`,
      tag: "athar-low-battery",
      requireInteraction: true,
    });
  };
  if (Notification.permission === "granted") show();
  else if (Notification.permission === "default") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") show();
    });
  }
}

export default function LowBatteryWarning() {
  const { status, battery } = useSyncExternalStore(
    robotStore.subscribe,
    robotStore.getSnapshot
  );
  const telemetry = useSyncExternalStore(
    robotStore.subscribeTelemetry,
    robotStore.getTelemetrySnapshot
  );

  const session = getSession();
  const isAuthorizedAdmin = Boolean(session && canAccessPage(session, "robots"));

  const [open, setOpen] = useState(alertState.open);
  const [muted, setMuted] = useState(alertState.muted);
  const [alarmActive, setAlarmActive] = useState(alertState.alarmActive);

  const isCharging = status === "charging" || Boolean(telemetry?.charging);
  const isLow = isAuthorizedAdmin && battery <= LOW_BATTERY_THRESHOLD && !isCharging;

  useEffect(() => {
    initWarningAudio();
  }, []);

  useEffect(() => {
    if (isLow && !alertState.wasLow) {
      alertState.wasLow = true;
      alertState.open = true;
      alertState.alarmActive = true;
      setOpen(true);
      setAlarmActive(true);
      if (!alertState.muted) playWarningSound();
      sendBrowserWarning(ROBOT.name, battery);
    } else if (!isLow) {
      alertState.wasLow = false;
      alertState.alarmActive = false;
      setAlarmActive(false);
    }
  }, [isLow, battery]);

  useEffect(() => {
    if (!open || !alarmActive || muted) return;

    const timer = setInterval(() => {
      playWarningSound();
    }, SOUND_REPEAT_MS);

    return () => clearInterval(timer);
  }, [open, alarmActive, muted]);

  if (!open) return null;

  const canStop = status === "tour" || status === "returning";
  const canSendToCharge = status === "tour" || status === "paused";

  const handleToggleMute = () => {
    const next = !muted;
    alertState.muted = next;
    setMuted(next);
  };

  const handleStop = () => {
    robotStore.pause();
    alertState.alarmActive = false;
    setAlarmActive(false);
  };

  const handleSendToCharge = () => {
    robotStore.charge();
    alertState.alarmActive = false;
    setAlarmActive(false);
  };

  const handleClose = () => {
    alertState.open = false;
    alertState.alarmActive = false;
    setOpen(false);
    setAlarmActive(false);
  };

  return createPortal(
    <div
      className="athar-warn-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="athar-warn-title"
    >
      <div className="athar-warn-card">
        <div className="athar-warn-crest" aria-hidden="true">
          <svg width="92" height="92" viewBox="0 0 96 96" fill="none">
            <defs>
              <linearGradient id="atharGold" x1="12" y1="8" x2="84" y2="88" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f3d47a" />
                <stop offset="50%" stopColor="#c49a40" />
                <stop offset="100%" stopColor="#8b5e18" />
              </linearGradient>
              <linearGradient id="atharInner" x1="20" y1="16" x2="76" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4a3418" />
                <stop offset="100%" stopColor="#261a0a" />
              </linearGradient>
            </defs>
            <path d="M18 46 C6 42, 3 34, 8 30 C13 33, 18 36, 24 38 Z" fill="url(#atharGold)" />
            <path d="M18 52 C8 51, 5 46, 10 43 C15 45, 19 46, 23 47 Z" fill="url(#atharGold)" opacity="0.85" />
            <path d="M78 46 C90 42, 93 34, 88 30 C83 33, 78 36, 72 38 Z" fill="url(#atharGold)" />
            <path d="M78 52 C88 51, 91 46, 86 43 C81 45, 77 46, 73 47 Z" fill="url(#atharGold)" opacity="0.85" />
            <circle cx="48" cy="48" r="32" fill="url(#atharGold)" />
            <circle cx="48" cy="48" r="27" fill="url(#atharInner)" stroke="#f3d47a" strokeWidth="1.5" />
            <path d="M48 28 L66 60 H30 Z" fill="#c0392b" stroke="#f3d47a" strokeWidth="2.2" strokeLinejoin="round" />
            <rect x="46.3" y="38.5" width="3.4" height="11" rx="1.7" fill="#fff8e7" />
            <circle cx="48" cy="54" r="2" fill="#fff8e7" />
          </svg>
        </div>

        <div className="athar-warn-top">
          <button
            type="button"
            className="athar-warn-iconbtn"
            onClick={handleToggleMute}
            title={muted ? "Unmute sound" : "Mute sound"}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
          >
            {muted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="athar-warn-iconbtn"
            onClick={handleClose}
            title="Close"
            aria-label="Close warning"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="athar-warn-eyebrow">Athar Robot Alert</p>
        <h2 id="athar-warn-title" className="athar-warn-title">
          Low Battery Warning
        </h2>

        <div className="athar-warn-divider" aria-hidden="true">
          <span className="athar-warn-gem" />
        </div>

        <div className="athar-warn-pill">
          <span>{ROBOT.name}</span>
          <span>·</span>
          <strong>{battery}%</strong>
          <span>·</span>
          <span>{liveStatusLabels[status] || status}</span>
        </div>

        <p className="athar-warn-desc">
          {status === "charging"
            ? `${ROBOT.name} is now charging (${battery}%). You can close this warning.`
            : status === "returning"
            ? `${ROBOT.name} battery dropped below 15% and is heading to the charging dock.`
            : `${ROBOT.name} battery is below 15% (${battery}%) and needs to be charged.`}
        </p>

        <div className="athar-warn-actions">
          <button
            type="button"
            className="athar-warn-btn athar-warn-btn--stop"
            onClick={handleStop}
            disabled={!canStop}
          >
            <PauseCircleIcon className="athar-warn-btnicon" />
            <span>Stop</span>
          </button>

          <button
            type="button"
            className="athar-warn-btn athar-warn-btn--charge"
            onClick={handleSendToCharge}
            disabled={!canSendToCharge}
          >
            <BoltCircleIcon className="athar-warn-btnicon" />
            <span>Send to Charge</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}