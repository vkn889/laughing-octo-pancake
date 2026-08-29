"use client";

import { useCallback, useSyncExternalStore } from "react";

// Module-scoped so every component reading the same key re-renders when
// any of them writes it (e.g. the toggle button updating live).
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readValue(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false; // private mode / storage disabled — just default off
  }
}

function writeValue(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // ignore — worst case the setting doesn't persist across reloads
  }
  listeners.forEach((listener) => listener());
}

/**
 * A boolean persisted to localStorage, hydration-safe (mirrors useOrigin's
 * useSyncExternalStore pattern instead of reading localStorage in a
 * useEffect + setState, which would cause a hydration mismatch since the
 * server can't know the stored value).
 */
export function useLocalStorageToggle(key: string): readonly [boolean, () => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readValue(key),
    () => false // server snapshot: always "off" until mounted
  );
  const toggle = useCallback(() => writeValue(key, !readValue(key)), [key]);
  return [value, toggle] as const;
}
