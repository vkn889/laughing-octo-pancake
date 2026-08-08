"use client";

// All sound here is synthesized at runtime with the Web Audio API — no
// audio files, nothing sampled or extracted from anywhere. None of this
// is Pokémon game audio (that's copyrighted and not something to embed);
// it's original short tones/melodies written for this app.

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!ctx) ctx = new AudioCtor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  audioCtx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  gain = 0.15,
  type: OscillatorType = "square"
) {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Ascending 4-note arpeggio, played when a guess is correct. */
export function playRevealChime() {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => tone(audioCtx, f, now + i * 0.09, 0.16));
}

/** Short descending blip, played on a wrong guess. */
export function playWrongBlip() {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  tone(audioCtx, 392, now, 0.09, 0.12, "sawtooth");
  tone(audioCtx, 311, now + 0.08, 0.14, 0.12, "sawtooth");
}

// --- Looping background track (opt-in via a mute button; browsers block
// autoplay audio without a user gesture anyway). An original melody, not
// sampled from anywhere.

const TRACKS = {
  game: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.0],
} as const;
export type Track = keyof typeof TRACKS;

let currentTrack: Track | null = null;
let musicTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleStep(audioCtx: AudioContext, track: Track, i: number) {
  if (currentTrack !== track) return;
  const now = audioCtx.currentTime;
  const notes = TRACKS[track];
  tone(audioCtx, notes[i % notes.length], now, 0.28, 0.05, "triangle");
  musicTimer = setTimeout(() => scheduleStep(audioCtx, track, i + 1), 320);
}

/** Starts (or restarts, if a different track is already playing) a loop. */
export function playTrack(track: Track) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  if (musicTimer) clearTimeout(musicTimer);
  currentTrack = track;
  scheduleStep(audioCtx, track, 0);
}

export function stopMusic() {
  currentTrack = null;
  if (musicTimer) clearTimeout(musicTimer);
}

/** Toggle helper for a single-track player (e.g. the in-hunt screens). */
export function toggleTrack(track: Track): boolean {
  if (currentTrack === track) {
    stopMusic();
    return false;
  }
  playTrack(track);
  return true;
}

export function isMusicPlaying(): boolean {
  return currentTrack !== null;
}

export function currentTrackName(): Track | null {
  return currentTrack;
}
