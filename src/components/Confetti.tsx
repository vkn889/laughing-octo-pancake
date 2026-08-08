"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

/** Fires once on mount — used on the "You caught 'em all!" finish screen. */
export function Confetti() {
  useEffect(() => {
    const colors = ["#dc2626", "#2563eb", "#facc15", "#ffffff"];
    const duration = 2200;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return null;
}
