// src/hooks/useLowBatteryWarning.js
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { robotStore } from "../data/robotStore";
import { ROBOT } from "../data/robotsData";
import { canAccessPage, getSession } from "../services/authService";
import {
  initWarningAudio,
  playWarningSound,
  sendBrowserWarning,
} from "../utils/warningSound";

const LOW_BATTERY_THRESHOLD = 15;
const SOUND_REPEAT_MS = 10000; // يكرر صوت التحذير كل 10 ثواني لحد ما تكتمه أو يبدأ الشحن

export default function useLowBatteryWarning() {
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

  const [dismissed, setDismissed] = useState(false);
  const [muted, setMuted] = useState(false);
  const wasLowRef = useRef(false);

  const isCharging = status === "charging" || Boolean(telemetry?.charging);
  const isLow = isAuthorizedAdmin && battery <= LOW_BATTERY_THRESHOLD && !isCharging;

  // فك قفل الصوت في المتصفح مع أول تفاعل للمستخدم
  useEffect(() => {
    initWarningAudio();
  }, []);

  // إعادة ضبط التحذير لما البطارية تزيد عن 15% أو الروبوت يبدأ يشحن
  useEffect(() => {
    if (!isLow) {
      setDismissed(false);
      wasLowRef.current = false;
    }
  }, [isLow]);

  // تشغيل الصوت + إشعار المتصفح أول ما البطارية توصل <= 15%
  useEffect(() => {
    if (!isLow || dismissed) return;

    if (!wasLowRef.current) {
      wasLowRef.current = true;
      if (!muted) playWarningSound();
      sendBrowserWarning(ROBOT.name, battery);
    }

    if (muted) return;

    const timer = setInterval(() => {
      playWarningSound();
    }, SOUND_REPEAT_MS);

    return () => clearInterval(timer);
  }, [isLow, dismissed, muted, battery]);

  return {
    showWarning: isLow && !dismissed,
    isCritical: isLow,
    battery,
    status,
    muted,
    toggleMute: () => setMuted((m) => !m),
    dismiss: () => setDismissed(true),
    sendToCharge: () => {
      robotStore.charge();
      setDismissed(true);
    },
  };
}