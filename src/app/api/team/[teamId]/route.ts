import { NextResponse } from "next/server";
import { getPlayerTeamView } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/team/:teamId — polled every ~2s by the clue screen (SRD 2.4).
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await ctx.params;
  const team = await getPlayerTeamView(teamId);
  if (!team) {
    return NextResponse.json({ error: "unknown_team" }, { status: 404 });
  }
  return NextResponse.json({ team });
}
