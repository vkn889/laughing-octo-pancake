import { NextResponse } from "next/server";
import { confirmHandoff } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/host/confirm { teamId } — the host-gated progression checkpoint
// (PRD 1.5 step 6 / SRD 2.4). Only advances teams currently awaiting a card
// handoff.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const teamId = typeof body?.teamId === "string" ? body.teamId : "";

  const result = await confirmHandoff(teamId);
  if (!result.ok) {
    const status = result.error === "unknown_team" ? 404 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ team: result.team });
}
