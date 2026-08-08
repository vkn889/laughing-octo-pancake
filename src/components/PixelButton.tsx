"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "red" | "blue" | "white";
};

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  red: "bg-pokedex-red text-white",
  blue: "bg-pokedex-blue text-white",
  white: "bg-white text-pokedex-ink",
};

/** Retro chunky-border tap target, min 44px tall (SRD 2.5). */
export function PixelButton({ tone = "red", className = "", ...rest }: Props) {
  return (
    <button
      className={`pixel-btn font-pixel text-xs sm:text-sm px-5 py-4 min-h-11 leading-relaxed ${TONES[tone]} ${className}`}
      {...rest}
    />
  );
}
