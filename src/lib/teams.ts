// Fixed 7-team roster (PRD 1.5, field-test scope). Names are colors, not
// Pokémon, so they never hint at an answer, and doubling as the dashboard's
// color-coding satisfies the "clearly distinguishable" requirement (SRD 2.7).

export type TeamConfig = {
  id: string;
  name: string;
  color: string; // swatch used on buttons / dashboard rows
};

export const TEAMS: TeamConfig[] = [
  { id: "red", name: "Team Red", color: "#dc2626" },
  { id: "blue", name: "Team Blue", color: "#2563eb" },
  { id: "yellow", name: "Team Yellow", color: "#ca8a04" },
  { id: "green", name: "Team Green", color: "#16a34a" },
  { id: "orange", name: "Team Orange", color: "#ea580c" },
  { id: "purple", name: "Team Purple", color: "#9333ea" },
  { id: "pink", name: "Team Pink", color: "#db2777" },
];

export const TEAM_BY_ID: Record<string, TeamConfig> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t])
);
