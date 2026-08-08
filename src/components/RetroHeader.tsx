type Props = {
  title: string;
  subtitle?: string;
};

/** Pokédex-strip header: big "lens" + status dots, used on every screen. */
export function RetroHeader({ title, subtitle }: Props) {
  return (
    <header className="pixel-panel bg-pokedex-red text-white px-4 py-3 flex items-center gap-3">
      <div className="shrink-0 size-8 sm:size-9 rounded-full bg-pokedex-blue border-4 border-white shadow-[0_0_0_3px_var(--pokedex-ink)]" />
      <div className="flex gap-1.5 shrink-0">
        <span className="size-2.5 rounded-full bg-red-400 border-2 border-white" />
        <span className="size-2.5 rounded-full bg-yellow-300 border-2 border-white" />
        <span className="size-2.5 rounded-full bg-green-400 border-2 border-white" />
      </div>
      <div className="min-w-0">
        <h1 className="font-pixel text-[11px] sm:text-sm leading-relaxed truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="font-pixel text-[8px] sm:text-[10px] text-white/80 truncate mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
