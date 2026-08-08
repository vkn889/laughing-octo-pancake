"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RetroHeader } from "@/components/RetroHeader";
import { PixelPanel } from "@/components/PixelPanel";
import { usePoll } from "@/hooks/usePoll";

const STORAGE_KEY = "pokemon-hunt-team-id";

type TeamSummary = { id: string; name: string; color: string; claimed: boolean };

async function fetchTeams(): Promise<TeamSummary[]> {
  const res = await fetch("/api/teams", { cache: "no-store" });
  if (!res.ok) throw new Error("failed");
  const json = await res.json();
  return json.teams;
}

export default function Home() {
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const { data: teams, error } = usePoll(fetchTeams, 2500);

  // Graceful reconnect: if this device already claimed a team, skip
  // straight back to its clue screen (SRD 2.5).
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) router.replace(`/team/${savedId}`);
  }, [router]);

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
      localStorage.setItem(STORAGE_KEY, teamId);
      router.push(`/team/${teamId}`);
    } catch {
      setErrorId(teamId);
      setClaimingId(null);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-5 p-4 sm:p-6">
      <div className="w-full max-w-md flex flex-col gap-4">
        <RetroHeader
          title="Who's That Pokemon?"
          subtitle="Scavenger Hunt - Pick Your Team"
        />

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
