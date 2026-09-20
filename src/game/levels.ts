import type { Site } from "./metro";
export type Zone = { x: number; y: number; width: number; height: number };
export type Level = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  seed: number;
  months: number;
  packets: number;
  gold: number;
  spawnEvery: number;
  traffic: number;
  maxNodes: number;
  color: string;
  zones: Zone[];
  start: Site[];
};
export const LEVELS: Level[] = [
  {
    id: "neighborhood",
    name: "Home Lab",
    subtitle: "01 / FIRST CONNECTION",
    description:
      "A small neighborhood with short connections. Master your first packet flows.",
    seed: 987,
    months: 3,
    packets: 60,
    gold: 1800,
    spawnEvery: 60,
    traffic: 1,
    maxNodes: 10,
    color: "#a4edaa",
    zones: [{ x: 70, y: 70, width: 450, height: 510 }],
    start: [
      { x: 90, y: 110, shape: 0 },
      { x: 330, y: 140, shape: 1 },
      { x: 270, y: 400, shape: 2 },
    ],
  },
  {
    id: "campus",
    name: "Campus",
    subtitle: "02 / RUSH HOUR",
    description:
      "Clients gather inside campus buildings. Place transit devices in the open corridors; cables cannot cut through buildings.",
    seed: 123,
    months: 4,
    packets: 120,
    gold: 1700,
    spawnEvery: 50,
    traffic: 0.9,
    maxNodes: 15,
    color: "#f6ce78",
    zones: [
      { x: 70, y: 70, width: 320, height: 470 },
      { x: 570, y: 500, width: 320, height: 580 },
    ],
    start: [
      { x: 85, y: 110, shape: 0, clientVariant: 1 },
      { x: 340, y: 190, shape: 1 },
      { x: 275, y: 450, shape: 7 },
    ],
  },
  {
    id: "harbor",
    name: "Riverside",
    subtitle: "03 / TWO SHORES",
    description:
      "Cross the river through two bridges, with two cable slots each. Wireless Bridge pairs offer a smaller-capacity alternative.",
    seed: 987,
    months: 6,
    packets: 250,
    gold: 1900,
    spawnEvery: 50,
    traffic: 0.9,
    maxNodes: 22,
    color: "#76d6ec",
    zones: [
      { x: 60, y: 70, width: 290, height: 1030 },
      { x: 650, y: 70, width: 280, height: 1030 },
    ],
    start: [
      { x: 90, y: 100, shape: 0, clientVariant: 2 },
      { x: 325, y: 230, shape: 1 },
      { x: 260, y: 465, shape: 5 },
    ],
  },
  {
    id: "downtown",
    name: "Downtown",
    subtitle: "04 / HEAVY TRAFFIC",
    description:
      "Connect dense city blocks. Road works block new construction in months 3�4 of each four-month cycle, with a warning one month ahead.",
    seed: 2026,
    months: 8,
    packets: 450,
    gold: 1900,
    spawnEvery: 45,
    traffic: 0.9,
    maxNodes: 28,
    color: "#c6a4ff",
    zones: [
      { x: 65, y: 65, width: 340, height: 430 },
      { x: 580, y: 65, width: 340, height: 430 },
      { x: 65, y: 680, width: 340, height: 430 },
      { x: 580, y: 680, width: 340, height: 430 },
    ],
    start: [
      { x: 75, y: 100, shape: 0 },
      { x: 340, y: 190, shape: 2 },
      { x: 260, y: 450, shape: 8 },
    ],
  },
  {
    id: "highlands",
    name: "Highlands",
    subtitle: "05 / REACH FURTHER",
    description:
      "Rocky ridges block cables and devices. Use mountain passes and Cable Relays to route around them.",
    seed: 45678,
    months: 10,
    packets: 700,
    gold: 1800,
    spawnEvery: 45,
    traffic: 0.8,
    maxNodes: 32,
    color: "#f8a78d",
    zones: [
      { x: 65, y: 65, width: 290, height: 350 },
      { x: 360, y: 420, width: 290, height: 350 },
      { x: 650, y: 770, width: 280, height: 340 },
    ],
    start: [
      { x: 80, y: 95, shape: 0, clientVariant: 3 },
      { x: 335, y: 170, shape: 6 },
      { x: 260, y: 450, shape: 9 },
    ],
  },
  {
    id: "metropolis",
    name: "Metro Region",
    subtitle: "06 / A FULL YEAR",
    description:
      "Manage buildings, a river and a ridge. The floodplain slows exposed links every fourth month; prepare Weatherproof Kits.",
    seed: 987,
    months: 12,
    packets: 1100,
    gold: 1600,
    spawnEvery: 45,
    traffic: 1,
    maxNodes: 36,
    color: "#91f0d4",
    zones: [{ x: 80, y: 80, width: 840, height: 1040 }],
    start: [
      { x: 70, y: 90, shape: 0 },
      { x: 350, y: 180, shape: 1 },
      { x: 290, y: 465, shape: 2 },
    ],
  },
];
export const getLevel = (id?: string | null) => LEVELS.find((l) => l.id === id);
export type CampaignProgress = Record<string, number>;
export function readProgress(value: unknown): CampaignProgress {
  const result: CampaignProgress = {};
  if (value && typeof value === "object")
    for (const level of LEVELS) {
      const stars = (value as Record<string, unknown>)[level.id];
      if (
        typeof stars === "number" &&
        Number.isInteger(stars) &&
        stars >= 1 &&
        stars <= 3
      )
        result[level.id] = stars;
    }
  return result;
}
export const levelUnlocked = (id: string, progress: CampaignProgress) => {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i === 0 || (i > 0 && !!progress[LEVELS[i - 1].id]);
};
export const missionStars = (level: Level, delivered: number, gold: number) =>
  1 +
  Number(delivered >= Math.ceil(level.packets * 1.25)) +
  Number(gold >= level.gold / 2);
