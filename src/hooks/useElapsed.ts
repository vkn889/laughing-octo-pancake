"use client";

import { useEffect, useState } from "react";

/**
 * Live elapsed time between startTime and (finishTime ?? now), recomputed
 * client-side every second (SRD 2.4 timer spec).
 */
export function useElapsed(startTime: number | null, finishTime: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (finishTime) return; // stopped, no need to tick
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finishTime]);

  if (!startTime) return null;
  const end = finishTime ?? now;
  return Math.max(0, end - startTime);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
