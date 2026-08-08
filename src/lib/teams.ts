// Fixed 7-team roster (PRD 1.5, field-test scope). Each team gets its own
// swatch (used on buttons + dashboard rows) so they stay "clearly
// distinguishable" per SRD 2.7 even though the names themselves don't
// encode color anymore.

export type TeamConfig = {
  id: string;
  name: string;
  color: string; // swatch used on buttons / dashboard rows
};

export const TEAMS: TeamConfig[] = [
  { id: "alpha", name: "Team Alpha", color: "#7c3aed" },
  { id: "magma", name: "Team Magma", color: "#dc2626" },
  { id: "aqua", name: "Team Aqua", color: "#2563eb" },
  { id: "ball", name: "Team Ball", color: "#eab308" },
  { id: "pegasus", name: "Team Pegasus", color: "#0891b2" },
  { id: "touch", name: "Team Touch", color: "#16a34a" },
  { id: "doom", name: "Team Doom", color: "#1e293b" },
];

export const TEAM_BY_ID: Record<string, TeamConfig> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t])
);
