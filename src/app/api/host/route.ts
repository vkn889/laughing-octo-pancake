import { NextResponse } from "next/server";
import { getHostState } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/host — full live state of all 7 teams for the host dashboard
// (SRD 2.3 screen 5). Includes fields never sent to players (current
// Pokémon name + hiding spot) since this route is host-only by convention.
export async function GET() {
  const teams = await getHostState();
  return NextResponse.json({ teams });
}
