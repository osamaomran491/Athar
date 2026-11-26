// src/utils/warningSound.js
// Generates a warning beep using Web Audio API (no external audio file required)
// and optionally fires a browser Notification for the admin.

let audioCtx = null;
let unlocked = false;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

/**
 * Unlocks Web Audio on the first user interaction so later automatic
 * low-battery alerts are not blocked by browser autoplay policies.
 */
export function initWarningAudio() {
  if (typeof window === "undefined" || unlocked) return;

  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    unlocked = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

/**
 * Plays a 3-pulse urgent warning tone.
 */
export function playWarningSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

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

/**
 * Sends an OS/browser notification if permission is granted.
 */
export function sendBrowserWarning(robotName, battery) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  const show = () => {
    new Notification(`⚠️ Low Battery: ${robotName}`, {
      body: `${robotName} battery reached ${battery}%. Please send it to charge.`,
      tag: "athar-low-battery",
      requireInteraction: true,
    });
  };

  if (Notification.permission === "granted") {
    show();
  } else if (Notification.permission === "default") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") show();
    });
  }
}