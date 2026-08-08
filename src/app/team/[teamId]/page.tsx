"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RetroHeader } from "@/components/RetroHeader";
import { PixelPanel } from "@/components/PixelPanel";
import { PixelButton } from "@/components/PixelButton";
import { Confetti } from "@/components/Confetti";
import { MusicToggle } from "@/components/MusicToggle";
import { usePoll } from "@/hooks/usePoll";
import { useElapsed, formatDuration } from "@/hooks/useElapsed";
import { playCry, playRevealChime, playWrongBlip } from "@/lib/chiptune";

const STORAGE_KEY = "pokemon-hunt-team-id";

type TeamStatus = "unclaimed" | "guessing" | "awaiting_handoff" | "finished";
type CardRarity = "normal" | "legendary";

type PlayerTeamView = {
  teamId: string;
  teamName: string;
  color: string;
  status: TeamStatus;
  caughtCount: number;
  totalClues: number;
  score: number;
  hintText: string | null;
  hintImage: string | null;
  hintAudioSeed: string | null;
  hintPoints: number | null;
  hintRarity: CardRarity | null;
  wrongGuesses: number;
  revealImage: string | null;
  revealName: string | null;
  revealPoints: number | null;
  revealRarity: CardRarity | null;
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
        if (json.correct) {
          playRevealChime();
        } else {
          playWrongBlip();
          setWrongFlash(true);
        }
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
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <RetroHeader
              title={team.teamName}
              subtitle={
                team.status === "finished"
                  ? `Hunt Complete! · ${team.score} pts`
                  : `Caught ${team.caughtCount} of ${team.totalClues} · ${team.score} pts`
              }
            />
          </div>
          <MusicToggle />
        </div>

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

        {team.status === "awaiting_handoff" && <AwaitingHandoffScreen team={team} />}

        {team.status === "finished" && (
          <FinishedScreen elapsedMs={elapsed} score={team.score} caughtCount={team.caughtCount} />
        )}
      </div>
    </main>
  );
}

function RarityBadge({ points, rarity }: { points: number; rarity: CardRarity }) {
  return (
    <span
      className={`font-pixel text-[8px] px-2 py-1 rounded inline-block text-white shrink-0 ${
        rarity === "legendary" ? "bg-pokedex-red" : "bg-pokedex-blue"
      }`}
    >
      {rarity === "legendary" ? `⭐ LEGENDARY · ${points} pts` : `${points} pts`}
    </span>
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
      <div className="flex items-center justify-between gap-2">
        {team.hintPoints !== null && team.hintRarity !== null && (
          <RarityBadge points={team.hintPoints} rarity={team.hintRarity} />
        )}
        {elapsedLabel && (
          <p className="font-pixel text-[9px] text-pokedex-ink/70 ml-auto">
            ⏱ {elapsedLabel}
          </p>
        )}
      </div>

      {team.hintImage && (
        <div className="pixel-panel bg-white p-3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.hintImage}
            alt="Who's that Pokémon? (silhouette)"
            className="silhouette h-40 w-40 object-contain"
            onError={(e) => {
              // Degrade gracefully rather than showing a broken-image icon
              // if a sprite is ever missing from the deployment.
              e.currentTarget.closest("div")!.style.display = "none";
            }}
          />
        </div>
      )}

      {!team.hintImage && team.hintAudioSeed && (
        <div className="pixel-panel bg-white p-4 flex flex-col items-center gap-2">
          <p className="font-pixel text-[8px] text-pokedex-ink/60 text-center leading-relaxed">
            This one&apos;s already evolved, no silhouette. Listen instead:
          </p>
          <PixelButton
            type="button"
            tone="blue"
            className="px-4 py-3 min-h-11 text-[10px]"
            onClick={() => playCry(team.hintAudioSeed!)}
          >
            🔊 Play Cry
          </PixelButton>
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

function AwaitingHandoffScreen({ team }: { team: PlayerTeamView }) {
  return (
    <PixelPanel tone="screen" className="p-6 flex flex-col items-center gap-4 text-center">
      {team.revealImage && (
        <div className="pixel-panel bg-white p-3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.revealImage}
            alt={team.revealName ?? "Caught Pokémon"}
            className="h-32 w-32 object-contain"
            style={{ imageRendering: "pixelated" }}
            onError={(e) => {
              e.currentTarget.closest("div")!.style.display = "none";
            }}
          />
        </div>
      )}
      {team.revealName && (
        <p className="font-pixel text-sm leading-relaxed text-pokedex-ink">
          It&apos;s {team.revealName}!
        </p>
      )}
      {team.revealPoints !== null && team.revealRarity !== null && (
        <RarityBadge points={team.revealPoints} rarity={team.revealRarity} />
      )}
      <p className="font-pixel text-[12px] leading-loose text-pokedex-ink">
        Found it? Bring the card to the host!
      </p>
      <p className="font-pixel text-[9px] text-pokedex-ink/70 animate-blink leading-relaxed">
        Waiting for host to confirm…
      </p>
    </PixelPanel>
  );
}

function FinishedScreen({
  elapsedMs,
  score,
  caughtCount,
}: {
  elapsedMs: number | null;
  score: number;
  caughtCount: number;
}) {
  return (
    <PixelPanel tone="screen" className="p-6 flex flex-col items-center gap-4 text-center">
      <Confetti />
      <p className="font-pixel text-4xl">🏆</p>
      <p className="font-pixel text-sm leading-loose text-pokedex-ink">
        No cards left, the hunt is over!
      </p>
      <p className="font-pixel text-[13px] text-pokedex-ink">
        You caught {caughtCount} · {score} pts
      </p>
      {elapsedMs !== null && (
        <p className="font-pixel text-[11px] text-pokedex-ink/80">
          Total time: {formatDuration(elapsedMs)}
        </p>
      )}
    </PixelPanel>
  );
}
