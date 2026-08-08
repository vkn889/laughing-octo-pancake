"use client";

import { useState } from "react";
import { toggleTrack, type Track } from "@/lib/chiptune";

/**
 * Music on/off button for a given track. Starts paused — browsers block
 * autoplay audio without a user gesture anyway, and it's more considerate
 * at a party to let people opt in. Every track is an original synthesized
 * melody (src/lib/chiptune.ts), not game audio.
 */
export function MusicToggle({ track = "game" }: { track?: Track }) {
  const [playing, setPlaying] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setPlaying(toggleTrack(track))}
      className="pixel-btn font-pixel text-[9px] px-3 py-2 min-h-9 bg-white text-pokedex-ink shrink-0"
      aria-label={playing ? "Mute music" : "Play music"}
    >
      {playing ? "🔊 Music" : "🔇 Music"}
    </button>
  );
}
