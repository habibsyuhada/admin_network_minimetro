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
            rx={t.kind === "river" ? 0 : 14}
            fill={
              {
                building: "#35464b",
                rock: "#485252",
                river: "#173f60",
                construction: "#715937",
                flood: "#2c6667",
              }[t.kind]
            }
            stroke={
              {
                building: "#89999b",
                rock: "#91938b",
                river: "#549abe",
                construction: "#eab46b",
                flood: "#76bec3",
              }[t.kind]
            }
            strokeWidth="2"
            strokeDasharray={
              t.kind === "construction" || t.kind === "flood"
                ? "8 5"
                : undefined
            }
          />
          <text
            x={t.x + t.width / 2}
            y={t.y + 25}
            textAnchor="middle"
            fill="#d4e3db"
            fontSize="10"
          >
            {t.label}
          </text>
          {t.kind === "rock" && (
            <path
              d={`M${t.x + 15} ${t.y + t.height - 25} L${t.x + t.width / 2} ${t.y + 55} L${t.x + t.width - 15} ${t.y + t.height - 25}Z`}
              fill="#727769"
              opacity=".4"
            />
          )}
          {t.kind === "building" &&
            [0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${t.x + 20} ${t.y + 50 + i * 20}h${t.width - 40}`}
                stroke="#829697"
                strokeWidth="5"
                strokeDasharray="8 8"
              />
            ))}
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
              fill="#6e7762"
              stroke="#c7c69d"
              strokeWidth="3"
            />
            <path
              d={`M450 ${b.y + 12}H550M450 ${b.y + b.height - 12}H550`}
              stroke="#c7c69d"
              strokeDasharray="6 4"
            />
            <text
              x="500"
              y={b.y + b.height / 2}
              textAnchor="middle"
              fill="#f1f3d9"
              fontSize="11"
            >
              {bridgeUse(state, b.id)}/2 cables
            </text>
          </g>
        ))}
    </g>
  );
}
