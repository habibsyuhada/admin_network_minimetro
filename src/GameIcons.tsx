import {
  MemoryStick,
  Network,
  Gauge,
  Zap,
  GitFork,
  ListOrdered,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { ItemKind } from "./game/items";
const visuals = {
  buffer: [MemoryStick, "#95c9ff"],
  ports: [Network, "#9ce3bd"],
  bandwidth: [Gauge, "#edc779"],
  transfer: [Zap, "#efab7f"],
  traffic: [GitFork, "#bfa9f5"],
  priority: [ListOrdered, "#ef9db8"],
  weather: [ShieldCheck, "#7fd5e6"],
  efficiency: [Leaf, "#b5df85"],
} as const;
export function ItemIcon({ kind }: { kind: ItemKind }) {
  const [Icon, color] = visuals[kind];
  return (
    <span
      className="item-art"
      style={{ "--item-color": color } as CSSProperties}
      aria-hidden="true"
      data-item-icon={kind}
    >
      <Icon size={30} strokeWidth={1.8} />
      <span className="item-art-light" />
    </span>
  );
}
export function Gold({ amount }: { amount: number | undefined }) {
  return (
    <span className="gold-value">
      <svg className="gold-coin" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="13" r="10" fill="#9d6a22" />
        <circle cx="12" cy="11" r="10" fill="#f0c65c" />
        <circle
          cx="12"
          cy="11"
          r="7"
          fill="#d99d38"
          stroke="#ffe8a0"
          strokeWidth="1.2"
        />
        <path d="m12 6 4 5-4 5-4-5Z" fill="#ffecaa" />
      </svg>
      <span>
        {amount ?? 0}
        <span className="sr-only"> gold</span>
      </span>
    </span>
  );
}
