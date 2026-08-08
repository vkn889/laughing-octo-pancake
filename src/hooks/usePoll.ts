"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Polls `fetcher` every `intervalMs` and exposes the latest result. Used
 * throughout the player + host screens (SRD 2.4: client polls storage every
 * ~2s). Polling pauses while the tab is hidden to save battery, and resumes
 * (with an immediate refetch) when it becomes visible again — covers the
 * "close/reopen the site and resume" requirement (SRD 2.5).
 */
export function usePoll<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const refetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch {
      setError("Connection issue — retrying…");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      if (cancelled || document.hidden) return;
      await refetch();
    };

    tick();
    timer = setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, refetch, ...deps]);

  return { data, error, refetch };
}
