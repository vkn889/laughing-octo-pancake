import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  tone?: "screen" | "white";
};

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  screen: "bg-pokedex-screen",
  white: "bg-white",
};

export function PixelPanel({ tone = "white", className = "", ...rest }: Props) {
  return <div className={`pixel-panel ${TONES[tone]} ${className}`} {...rest} />;
}
