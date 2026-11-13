import { useEffect, useRef, useSyncExternalStore } from "react";
import { robotStore } from "../data/robotStore";
export default function useRobotSim() {
  const { status, battery } = useSyncExternalStore(robotStore.subscribe, robotStore.getSnapshot);
  // NEW: ESP32 telemetry (voltage, current, power, charging, connected)
  const telemetry = useSyncExternalStore(robotStore.subscribeTelemetry, robotStore.getTelemetrySnapshot);
  const markerRef = useRef(null);
  // move the map marker every frame without re-rendering React
  useEffect(
    () => robotStore.onFrame((p) => markerRef.current?.setAttribute("transform", `translate(${p.x} ${p.y})`)),
    []
  );
  return {
    status,
    battery,
    markerRef,
    pause: robotStore.pause,
    play: robotStore.play,
    charge: robotStore.charge,
    // NEW ↓
    telemetry,       // { voltage, current, power, charging, connected }
    connected: telemetry.connected,
  };
}