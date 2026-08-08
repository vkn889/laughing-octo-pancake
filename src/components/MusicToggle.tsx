"use client";

import { useState } from "react";
import { toggleBackgroundMusic } from "@/lib/chiptune";

/**
 * Background-music on/off button. Starts paused — browsers block autoplay
 * audio without a user gesture anyway, and it's more considerate at a
 * party to let people opt in. The loop is an original synthesized melody
 * (src/lib/chiptune.ts), not game audio.
 */
export function MusicToggle() {
  const [playing, setPlaying] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setPlaying(toggleBackgroundMusic())}
      className="pixel-btn font-pixel text-[9px] px-3 py-2 min-h-9 bg-white text-pokedex-ink shrink-0"
      aria-label={playing ? "Mute music" : "Play music"}
    >
      {playing ? "🔊 Music" : "🔇 Music"}
    </button>
  );
}
