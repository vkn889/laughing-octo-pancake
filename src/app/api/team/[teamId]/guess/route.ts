import { NextResponse } from "next/server";
import { submitGuess } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/team/:teamId/guess { guess: string } — fuzzy-matched against
// the current clue's accepted answers (SRD 2.4). Unlimited retries.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const guess = typeof body?.guess === "string" ? body.guess : "";

  const result = await submitGuess(teamId, guess);
  if (!result.ok) {
    const status = result.error === "unknown_team" ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ correct: result.correct, team: result.team });
}
