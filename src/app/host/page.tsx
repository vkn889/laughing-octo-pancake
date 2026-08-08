"use client";

import { useEffect, useState } from "react";
import { RetroHeader } from "@/components/RetroHeader";
import { PixelPanel } from "@/components/PixelPanel";
import { PixelButton } from "@/components/PixelButton";
import { QrCode } from "@/components/QrCode";
import { usePoll } from "@/hooks/usePoll";
import { useOrigin } from "@/hooks/useOrigin";

type TeamStatus = "unclaimed" | "guessing" | "awaiting_handoff" | "finished";

type HostTeamView = {
  teamId: string;
  teamName: string;
  color: string;
  status: TeamStatus;
  clueOrder: string[];
  currentIndex: number;
  startTime: number | null;
  finishTime: number | null;
  wrongGuesses: number;
  currentPokemonName: string | null;
  currentHidingSpot: string | null;
};

const STATUS_LABEL: Record<TeamStatus, string> = {
  unclaimed: "Not joined",
  guessing: "Guessing",
  awaiting_handoff: "AWAITING HANDOFF",
  finished: "Finished 🏆",
};

async function fetchHostState(): Promise<HostTeamView[]> {
  const res = await fetch("/api/host", { cache: "no-store" });
  if (!res.ok) throw new Error("failed");
  const json = await res.json();
  return json.teams;
}

function formatElapsed(startTime: number | null, finishTime: number | null, now: number) {
  if (!startTime) return "—";
  const end = finishTime ?? now;
  const totalSeconds = Math.max(0, Math.floor((end - startTime) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function HostPage() {
  const { data: teams, refetch } = usePoll<HostTeamView[]>(fetchHostState, 2000);
  const [now, setNow] = useState(() => Date.now());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const joinUrl = useOrigin();
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function confirmHandoff(teamId: string) {
    setConfirmingId(teamId);
    try {
      await fetch("/api/host/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      await refetch();
    } finally {
      setConfirmingId(null);
    }
  }

  async function resetAll() {
    await fetch("/api/host/reset", { method: "POST" });
    setResetOpen(false);
    await refetch();
  }

  const totalClues = teams?.[0]?.clueOrder.length || 7;

  return (
    <main className="flex-1 flex flex-col items-center gap-4 p-4 sm:p-6">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <RetroHeader title="Host Dashboard" subtitle="Live team progress" />

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <PixelPanel tone="screen" className="p-3 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="font-pixel text-[9px] text-pokedex-ink/70">
                  <th className="p-2">Team</th>
                  <th className="p-2">Clue</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Wrong</th>
                  <th className="p-2">Handoff</th>
                </tr>
              </thead>
              <tbody>
                {(teams ?? []).map((team) => (
                  <tr
                    key={team.teamId}
                    className="border-t-2 border-pokedex-ink/20 align-middle"
                  >
                    <td className="p-2">
                      <span
                        className="font-pixel text-[10px] px-2 py-1.5 rounded inline-block text-white"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.teamName}
                      </span>
                    </td>
                    <td className="p-2 font-pixel text-[10px]">
                      {team.status === "unclaimed"
                        ? "—"
                        : `${Math.min(team.currentIndex + 1, totalClues)}/${totalClues}`}
                    </td>
                    <td className="p-2 font-pixel text-[9px]">
                      <span
                        className={
                          team.status === "awaiting_handoff"
                            ? "text-pokedex-red-dark animate-blink"
                            : "text-pokedex-ink/80"
                        }
                      >
                        {STATUS_LABEL[team.status]}
                      </span>
                      {team.status === "awaiting_handoff" && team.currentHidingSpot && (
                        <div className="text-pokedex-ink/50 mt-1 normal-case">
                          {team.currentPokemonName} · {team.currentHidingSpot}
                        </div>
                      )}
                    </td>
                    <td className="p-2 font-pixel text-[10px]">
                      {formatElapsed(team.startTime, team.finishTime, now)}
                    </td>
                    <td className="p-2 font-pixel text-[10px]">{team.wrongGuesses}</td>
                    <td className="p-2">
                      <PixelButton
                        tone="blue"
                        className="px-3 py-2 min-h-9 text-[9px]"
                        disabled={
                          team.status !== "awaiting_handoff" || confirmingId === team.teamId
                        }
                        onClick={() => confirmHandoff(team.teamId)}
                      >
                        {confirmingId === team.teamId ? "…" : "Confirm"}
                      </PixelButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PixelPanel>

          <PixelPanel tone="white" className="p-4 flex flex-col items-center gap-3 h-fit">
            <p className="font-pixel text-[9px] text-center leading-relaxed">
              Scan to join
            </p>
            {joinUrl && <QrCode value={joinUrl} size={140} />}
            <p className="font-pixel text-[8px] text-pokedex-ink/60 text-center break-all">
              {joinUrl}
            </p>
          </PixelPanel>
        </div>

        <PixelPanel tone="white" className="p-3 flex items-center justify-between gap-3">
          <p className="font-pixel text-[8px] text-pokedex-ink/60 leading-relaxed">
            Testing utility — wipes all team progress.
          </p>
          {!resetOpen ? (
            <PixelButton
              tone="white"
              className="px-3 py-2 min-h-9 text-[9px]"
              onClick={() => setResetOpen(true)}
            >
              Reset All
            </PixelButton>
          ) : (
            <div className="flex gap-2">
              <PixelButton
                tone="red"
                className="px-3 py-2 min-h-9 text-[9px]"
                onClick={resetAll}
              >
                Confirm Reset
              </PixelButton>
              <PixelButton
                tone="white"
                className="px-3 py-2 min-h-9 text-[9px]"
                onClick={() => setResetOpen(false)}
              >
                Cancel
              </PixelButton>
            </div>
          )}
        </PixelPanel>
      </div>
    </main>
  );
}
