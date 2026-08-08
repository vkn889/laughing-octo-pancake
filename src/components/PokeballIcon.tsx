/** A simple original icon (plain geometry: circle, band, center dot) in
 *  the app's own red/white/ink palette — not a reproduction of any
 *  official artwork. */
export function PokeballIcon({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Pokéball icon"
    >
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#14181f" strokeWidth="6" />
      <path d="M4 50a46 46 0 0 1 92 0z" fill="var(--pokedex-red)" stroke="#14181f" strokeWidth="6" />
      <rect x="4" y="47" width="92" height="6" fill="#14181f" />
      <circle cx="50" cy="50" r="14" fill="#fff" stroke="#14181f" strokeWidth="6" />
      <circle cx="50" cy="50" r="5" fill="#fff" stroke="#14181f" strokeWidth="3" />
    </svg>
  );
}
