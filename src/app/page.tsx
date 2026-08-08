"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PixelPanel } from "@/components/PixelPanel";
import { PixelButton } from "@/components/PixelButton";
import { PokeballIcon } from "@/components/PokeballIcon";
import { usePoll } from "@/hooks/usePoll";
import { playTrack, stopMusic } from "@/lib/chiptune";

const STORAGE_KEY = "pokemon-hunt-team-id";

type Screen = "title" | "intro" | "select";

type TeamSummary = { id: string; name: string; color: string; claimed: boolean };

async function fetchTeams(): Promise<TeamSummary[]> {
  const res = await fetch("/api/teams", { cache: "no-store" });
  if (!res.ok) throw new Error("failed");
  const json = await res.json();
  return json.teams;
}

export default function Home() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("title");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const { data: teams, error } = usePoll(fetchTeams, 2500);

  // Graceful reconnect: if this device already claimed a team, skip
  // straight back to its clue screen (SRD 2.5) — no need to sit through
  // the title/intro screens again.
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) router.replace(`/team/${savedId}`);
  }, [router]);

  // Stop the title-screen music once we leave for the actual game.
  useEffect(() => stopMusic, []);

  async function handlePick(teamId: string) {
    setErrorId(null);
    setClaimingId(teamId);
    try {
      const res = await fetch(`/api/team/${teamId}/claim`, { method: "POST" });
      if (!res.ok) {
        setErrorId(teamId);
        setClaimingId(null);
        return;
      }
      stopMusic();
      localStorage.setItem(STORAGE_KEY, teamId);
      router.push(`/team/${teamId}`);
    } catch {
      setErrorId(teamId);
      setClaimingId(null);
    }
  }

  if (screen === "title") {
    return <TitleScreen onStart={() => { playTrack("title"); setScreen("intro"); }} />;
  }

  if (screen === "intro") {
    return <IntroScreen onContinue={() => setScreen("select")} />;
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-5 p-4 sm:p-6">
      <div className="w-full max-w-md flex flex-col gap-4">
        <PixelPanel tone="white" className="bg-pokedex-red text-white px-4 py-3 flex items-center gap-3">
          <PokeballIcon size={32} />
          <div className="min-w-0">
            <h1 className="font-pixel text-[11px] sm:text-sm leading-relaxed">
              Pick Your Team
            </h1>
            <p className="font-pixel text-[8px] sm:text-[10px] text-white/80 mt-1">
              Scavenger Hunt
            </p>
          </div>
        </PixelPanel>

        <PixelPanel tone="screen" className="p-4 flex flex-col gap-3">
          <p className="font-pixel text-[10px] leading-loose text-pokedex-ink">
            Tap your team below. Once picked, it&apos;s locked in for your
            device.
          </p>

          <div className="flex flex-col gap-3">
            {(teams ?? []).map((team) => {
              const disabled = team.claimed || claimingId !== null;
              const isClaiming = claimingId === team.id;
              return (
                <button
                  key={team.id}
                  onClick={() => handlePick(team.id)}
                  disabled={disabled}
                  className="pixel-btn font-pixel text-xs sm:text-sm px-4 py-4 min-h-11 text-white flex items-center justify-between disabled:opacity-70"
                  style={{ backgroundColor: team.color }}
                >
                  <span>{team.name}</span>
                  <span className="text-[9px] sm:text-[10px]">
                    {isClaiming ? "..." : team.claimed ? "TAKEN" : "TAP TO JOIN"}
                  </span>
                </button>
              );
            })}
            {teams === null && !error && (
              <p className="font-pixel text-[9px] text-pokedex-ink/60 text-center py-4">
                Loading teams…
              </p>
            )}
          </div>

          {errorId && (
            <p className="font-pixel text-[9px] text-pokedex-red-dark leading-relaxed">
              That team was just claimed by someone else. Pick another!
            </p>
          )}
          {error && (
            <p className="font-pixel text-[9px] text-pokedex-red-dark leading-relaxed">
              {error}
            </p>
          )}
        </PixelPanel>

        <p className="font-pixel text-[8px] text-white/80 text-center leading-relaxed">
          Host running the party? Open /host on your device.
        </p>
      </div>
    </main>
  );
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-5">
        <PokeballIcon size={72} />
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-pixel text-white text-2xl sm:text-4xl leading-relaxed drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
            SCAVENGER
            <br />
            HUNT
          </h1>
          <p className="font-pixel text-[10px] sm:text-xs text-white/90">
            A Pokémon Card Hunt
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="font-pixel text-white text-sm sm:text-base animate-blink"
      >
        ▶ PRESS START
      </button>
    </main>
  );
}

function IntroScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-5 p-4 sm:p-6">
      <div className="w-full max-w-md flex flex-col gap-4">
        <PixelPanel tone="white" className="bg-pokedex-blue text-white px-4 py-3">
          <h1 className="font-pixel text-[11px] sm:text-sm leading-relaxed">
            A Message From The Professor
          </h1>
        </PixelPanel>

        <PixelPanel tone="screen" className="p-5 flex flex-col gap-4">
          <p className="text-5xl text-center">🧑‍🔬</p>
          <div className="font-pixel text-[10px] leading-loose text-pokedex-ink flex flex-col gap-3">
            <p>Ah, hello there! Welcome to the hunt!</p>
            <p>
              Somewhere around here, a whole collection of cards is hidden.
              Some are common. A few are rare. And one, the legendary Mega
              Rayquaza, outshines them all.
            </p>
            <p>
              Your job: guess the silhouette, track down the card, and bring
              it to me to make it official. Every card is worth points, and
              once a card is claimed, it&apos;s gone, so move quickly!
            </p>
            <p>Are you ready to begin?</p>
          </div>
          <PixelButton type="button" tone="blue" onClick={onContinue}>
            Continue ▶
          </PixelButton>
        </PixelPanel>
      </div>
    </main>
  );
}
