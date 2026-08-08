"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {}; // origin never changes during a session

function getSnapshot() {
  return window.location.origin;
}

function getServerSnapshot() {
  return ""; // unknown during SSR — matches first client render, avoiding
  // the hydration mismatch a `useState(() => window.location.origin)`
  // initializer would cause. React re-renders with the real snapshot
  // right after hydration completes.
}

/** Current page origin, hydration-safe. Empty string until mounted. */
export function useOrigin(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
