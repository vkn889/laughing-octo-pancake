import { NextResponse } from "next/server";
import { claimTeam } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/team/:teamId/claim: landing screen tap (PRD 1.5 step 1-2).
// First write wins (SRD 2.7): if the team is already claimed, this fails
// and the client should show it as locked.
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await ctx.params;
  const result = await claimTeam(teamId);

  if (!result.ok) {
    const status = result.error === "unknown_team" ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ team: result.team });
}
