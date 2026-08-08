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

/**
 * Generic creature "cry" stand-in for non-basic-stage Pokémon (SRD-adjacent
 * new rule: only basic-stage cards get a silhouette, everything else gets
 * this button instead of an image). Pitch is derived from `seed` so the
 * same card always sounds the same without revealing anything — it's a
 * hash, not the name.
 */
export function playCry(seed: string) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const base = 300 + (hash % 500);
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 1.6, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(base * 0.7, now + 0.22);
  gainNode.gain.setValueAtTime(0.18, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.28);
}

// --- Background loop (opt-in via a mute button; browsers block autoplay
// audio without a user gesture anyway) -------------------------------

const MELODY = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.0]; // original walk, not from any game
let musicPlaying = false;
let musicTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleStep(audioCtx: AudioContext, i: number) {
  if (!musicPlaying) return;
  const now = audioCtx.currentTime;
  tone(audioCtx, MELODY[i % MELODY.length], now, 0.28, 0.05, "triangle");
  musicTimer = setTimeout(() => scheduleStep(audioCtx, i + 1), 320);
}

export function toggleBackgroundMusic(): boolean {
  const audioCtx = getCtx();
  if (!audioCtx) return false;
  if (musicPlaying) {
    musicPlaying = false;
    if (musicTimer) clearTimeout(musicTimer);
    return false;
  }
  musicPlaying = true;
  scheduleStep(audioCtx, 0);
  return true;
}

export function isMusicPlaying(): boolean {
  return musicPlaying;
}
