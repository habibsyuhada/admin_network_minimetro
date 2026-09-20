import {
  terrainFor,
  BRIDGES,
  bridgeUse,
  constructionActive,
  floodActive,
} from "./game/environment";
import type { Metro } from "./game/metro";
export default function EnvironmentArt({ state }: { state: Metro }) {
  const terrain = terrainFor(state.levelId);
  return (
    <g
      className="environment-art"
      aria-label="Environment"
      pointerEvents="none"
    >
      {terrain.map((t) => (
        <g
          key={t.id}
          data-terrain={t.kind}
          opacity={
            (t.kind === "construction" && !constructionActive(state.month)) ||
            (t.kind === "flood" && !floodActive(state.month))
              ? 0.5
              : 1
          }
        >
          <rect
            x={t.x}
            y={t.y}
            width={t.width}
            height={t.height}
            rx={t.kind === "river" ? 0 : 3}
            fill={
              {
                building: "#d9dbd5",
                rock: "#c6c9bd",
                river: "#b4dce6",
                construction: "#edcf91",
                flood: "#c5e3e7",
              }[t.kind]
            }
            stroke={
              {
                building: "#bec4ba",
                rock: "#a7af9e",
                river: "#b4dce6",
                construction: "#c09a4d",
                flood: "#8bbfc7",
              }[t.kind]
            }
            strokeWidth="2"
            strokeDasharray={
              t.kind === "construction" || t.kind === "flood"
                ? "8 5"
                : undefined
            }
          />
          <title>{t.label}</title>
          {t.kind === "rock" && (
            <path
              d={`M${t.x + 18} ${t.y + t.height - 25}L${t.x + t.width / 2} ${t.y + 30}L${t.x + t.width - 18} ${t.y + t.height - 25}`}
              fill="none"
              stroke="#a7af9e"
              strokeWidth="2"
            />
          )}
        </g>
      ))}
      {terrain.some((t) => t.kind === "river") &&
        BRIDGES.map((b) => (
          <g key={b.id}>
            <rect
              x="443"
              y={b.y}
              width="114"
              height={b.height}
              fill="#f4f1e8"
              stroke="#8eaaa9"
              strokeWidth="3"
            />
            <path
              d={`M450 ${b.y + 12}H550M450 ${b.y + b.height - 12}H550`}
              stroke="#8eaaa9"
              strokeDasharray="6 4"
            />
            <text
              x="500"
              y={b.y + b.height / 2}
              textAnchor="middle"
              fill="#415e65"
              fontSize="11"
            >
              {bridgeUse(state, b.id)}/2 cables
            </text>
          </g>
        ))}
    </g>
  );
}
