import { NextResponse } from "next/server";
import { listPublicTeams } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/teams: landing screen roster (id, name, color, claimed).
export async function GET() {
  const teams = await listPublicTeams();
  return NextResponse.json({ teams });
}
