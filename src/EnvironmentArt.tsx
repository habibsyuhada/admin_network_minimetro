import { getLevel } from "./game/levels";
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
      {(
        getLevel(state.levelId)?.zones ?? [
          { x: 40, y: 40, width: 420, height: 520 },
          { x: 520, y: 480, width: 410, height: 650 },
        ]
      ).map((z, i) => (
        <path
          key={i}
          data-land-region={i}
          fill={["#28453b", "#233d4b", "#424333", "#3c3548"][i % 4]}
          d={`M${z.x + 70} ${z.y - 30} Q${z.x - 35} ${z.y - 25} ${z.x - 25} ${z.y + 90} L${z.x - 10} ${z.y + z.height - 70} Q${z.x - 20} ${z.y + z.height + 35} ${z.x + 100} ${z.y + z.height + 25} L${z.x + z.width - 60} ${z.y + z.height + 10} Q${z.x + z.width + 50} ${z.y + z.height + 10} ${z.x + z.width + 25} ${z.y + z.height - 100} L${z.x + z.width + 15} ${z.y + 50} Q${z.x + z.width + 5} ${z.y - 45} ${z.x + z.width - 95} ${z.y - 20} Z`}
        />
      ))}
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
                building: "#4a5c56",
                rock: "#4e5b50",
                river: "#234d66",
                construction: "#75613d",
                flood: "#32616a",
              }[t.kind]
            }
            stroke={
              {
                building: "#74877a",
                rock: "#819079",
                river: "#234d66",
                construction: "#b9944f",
                flood: "#6098a0",
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
              stroke="#819079"
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
              fill="#69786b"
              stroke="#a9b39a"
              strokeWidth="3"
            />
            <path
              d={`M450 ${b.y + 12}H550M450 ${b.y + b.height - 12}H550`}
              stroke="#a9b39a"
              strokeDasharray="6 4"
            />
            <text
              x="500"
              y={b.y + b.height / 2}
              textAnchor="middle"
              fill="#ecedcf"
              fontSize="11"
            >
              {bridgeUse(state, b.id)}/2 cables
            </text>
          </g>
        ))}
    </g>
  );
}
