import { NextResponse } from "next/server";
import { resetAllTeams } from "@/lib/store";

export const dynamic = "force-dynamic";

// POST /api/host/reset: testing/rehearsal utility, not in the original
// SRD data model. Wipes all team progress back to "unclaimed" so you can
// replay the whole hunt without restarting the server. Gate this behind a
// confirm dialog in the UI; there's no undo.
export async function POST() {
  await resetAllTeams();
  return NextResponse.json({ ok: true });
}
