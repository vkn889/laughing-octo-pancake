"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RetroHeader } from "@/components/RetroHeader";
import { PixelPanel } from "@/components/PixelPanel";
import { PixelButton } from "@/components/PixelButton";
import { Confetti } from "@/components/Confetti";
import { usePoll } from "@/hooks/usePoll";
import { useElapsed, formatDuration } from "@/hooks/useElapsed";

const STORAGE_KEY = "pokemon-hunt-team-id";

type TeamStatus = "unclaimed" | "guessing" | "awaiting_handoff" | "finished";

type PlayerTeamView = {
  teamId: string;
  teamName: string;
  color: string;
  status: TeamStatus;
  currentClueNumber: number;
  totalClues: number;
  hintText: string | null;
  hintImage: string | null;
  wrongGuesses: number;
  startTime: number | null;
  finishTime: number | null;
};

export default function TeamPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;
  const router = useRouter();

  const [guess, setGuess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const { data: team, refetch } = usePoll<PlayerTeamView>(
    async () => {
      const res = await fetch(`/api/team/${teamId}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
        throw new Error("unknown team");
      }
      const json = await res.json();
      return json.team;
    },
    2000,
    [teamId]
  );

  // If the team got reset (or was never claimed), bounce back to landing.
  useEffect(() => {
    if (notFound || team?.status === "unclaimed") {
      localStorage.removeItem(STORAGE_KEY);
      router.replace("/");
    }
  }, [notFound, team?.status, router]);

  const elapsed = useElapsed(team?.startTime ?? null, team?.finishTime ?? null);

  async function submitGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim() || submitting) return;
    setSubmitting(true);
    setWrongFlash(false);
    try {
      const res = await fetch(`/api/team/${teamId}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess }),
      });
      const json = await res.json();
      if (res.ok) {
        if (!json.correct) setWrongFlash(true);
        setGuess("");
        await refetch();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!team) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <p className="font-pixel text-[10px] text-white animate-blink">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4 sm:p-6">
      <div className="w-full max-w-md flex flex-col gap-4">
        <RetroHeader
          title={team.teamName}
          subtitle={
            team.status === "finished"
              ? "Hunt Complete!"
              : `Clue ${team.currentClueNumber} of ${team.totalClues}`
          }
        />

        {team.status === "guessing" && (
          <GuessingScreen
            team={team}
            guess={guess}
            setGuess={setGuess}
            submitting={submitting}
            wrongFlash={wrongFlash}
            onSubmit={submitGuess}
            elapsedLabel={elapsed !== null ? formatDuration(elapsed) : null}
          />
        )}

        {team.status === "awaiting_handoff" && <AwaitingHandoffScreen />}

        {team.status === "finished" && (
          <FinishedScreen elapsedMs={elapsed} />
        )}
      </div>
    </main>
  );
}

function GuessingScreen({
  team,
  guess,
  setGuess,
  submitting,
  wrongFlash,
  onSubmit,
  elapsedLabel,
}: {
  team: PlayerTeamView;
  guess: string;
  setGuess: (v: string) => void;
  submitting: boolean;
  wrongFlash: boolean;
  onSubmit: (e: React.FormEvent) => void;
  elapsedLabel: string | null;
}) {
  return (
    <PixelPanel tone="screen" className="p-4 flex flex-col gap-4">
      {elapsedLabel && (
        <p className="font-pixel text-[9px] text-pokedex-ink/70 text-right">
          ⏱ {elapsedLabel}
        </p>
      )}

      {team.hintImage && (
        <div className="pixel-panel bg-white p-3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.hintImage}
            alt="Who's that Pokémon? (silhouette)"
            className="silhouette h-40 w-40 object-contain"
          />
        </div>
      )}

      <p className="font-pixel text-[11px] leading-loose text-pokedex-ink">
        {team.hintText}
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="Type your guess…"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          className="pixel-panel px-3 py-3 min-h-11 font-pixel text-xs bg-white text-pokedex-ink outline-none"
        />
        <PixelButton type="submit" tone="blue" disabled={submitting || !guess.trim()}>
          {submitting ? "Checking…" : "Submit Guess"}
        </PixelButton>
      </form>

      {wrongFlash && (
        <p className="font-pixel text-[10px] text-pokedex-red-dark leading-relaxed">
          Not quite! Try again.
        </p>
      )}

      {team.wrongGuesses > 0 && (
        <p className="font-pixel text-[8px] text-pokedex-ink/60">
          Wrong guesses so far: {team.wrongGuesses}
        </p>
      )}
    </PixelPanel>
  );
}

function AwaitingHandoffScreen() {
  return (
    <PixelPanel tone="screen" className="p-6 flex flex-col items-center gap-4 text-center">
      <p className="font-pixel text-3xl">📇</p>
      <p className="font-pixel text-[12px] leading-loose text-pokedex-ink">
        Found it? Bring the card to the host!
      </p>
      <p className="font-pixel text-[9px] text-pokedex-ink/70 animate-blink leading-relaxed">
        Waiting for host to confirm…
      </p>
    </PixelPanel>
  );
}

function FinishedScreen({ elapsedMs }: { elapsedMs: number | null }) {
  return (
    <PixelPanel tone="screen" className="p-6 flex flex-col items-center gap-4 text-center">
      <Confetti />
      <p className="font-pixel text-4xl">🏆</p>
      <p className="font-pixel text-sm leading-loose text-pokedex-ink">
        You caught &apos;em all!
      </p>
      {elapsedMs !== null && (
        <p className="font-pixel text-[11px] text-pokedex-ink/80">
          Total time: {formatDuration(elapsedMs)}
        </p>
      )}
    </PixelPanel>
  );
}
