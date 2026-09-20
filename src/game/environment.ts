import type { Metro, Site, Cable } from "./metro";
export type Terrain = {
  id: string;
  kind: "building" | "rock" | "river" | "construction" | "flood";
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};
const block = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  kind: Terrain["kind"],
  label: string,
): Terrain => ({ id, x, y, width, height, kind, label });
const river = block("river", 450, 0, 100, 1200, "river", "River");
export const BRIDGES = [
  { id: "north", y: 200, height: 100, label: "North bridge" },
  { id: "south", y: 850, height: 100, label: "South bridge" },
];
export function terrainFor(id?: string): Terrain[] {
  switch (id) {
    case "campus":
      return [
        block("lab", 55, 65, 250, 280, "building", "Lab"),
        block("library", 240, 430, 280, 280, "building", "Library"),
        block("dorm", 600, 730, 340, 420, "building", "Dorms"),
      ];
    case "harbor":
      return [river];
    case "downtown":
      return [
        block("west", 115, 260, 170, 140, "building", "Office block"),
        block("east", 670, 240, 160, 220, "building", "Market"),
        block("south", 250, 800, 200, 170, "building", "Apartments"),
        block("works", 470, 420, 150, 180, "construction", "Road works"),
      ];
    case "highlands":
      return [
        block("ridge1", 395, 190, 130, 370, "rock", "North ridge"),
        block("ridge2", 420, 740, 145, 330, "rock", "South ridge"),
      ];
    case "metropolis":
      return [
        river,
        block("block", 110, 260, 145, 120, "building", "Offices"),
        block("ridge", 730, 570, 125, 230, "rock", "Ridge"),
        block("lowland", 565, 805, 150, 270, "flood", "Floodplain"),
      ];
    default:
      return [];
  }
}
export const contains = (p: { x: number; y: number }, r: Terrain, margin = 0) =>
  p.x >= r.x - margin &&
  p.x <= r.x + r.width + margin &&
  p.y >= r.y - margin &&
  p.y <= r.y + r.height + margin;
// Liang–Barsky clipping: tests the whole segment, not just its endpoints.
export function intersects(
  a: { x: number; y: number },
  b: { x: number; y: number },
  r: Terrain,
) {
  let lo = 0,
    hi = 1;
  const dx = b.x - a.x,
    dy = b.y - a.y;
  for (const [p, q] of [
    [-dx, a.x - r.x],
    [dx, r.x + r.width - a.x],
    [-dy, a.y - r.y],
    [dy, r.y + r.height - a.y],
  ]) {
    if (Math.abs(p) < 1e-9) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) lo = Math.max(lo, t);
    else hi = Math.min(hi, t);
    if (lo > hi) return false;
  }
  return true;
}
export const constructionActive = (month: number) =>
  month % 4 === 3 || month % 4 === 0;
export const floodActive = (month: number) => month % 4 === 0;
export function terrainNotice(s: Metro) {
  if (s.levelId === "downtown")
    return constructionActive(s.month)
      ? "Road works active: new construction is blocked in the marked area."
      : s.month % 4 === 2
        ? "Next month: road works begin in the marked area for two months."
        : "Road works are scheduled for months 3–4 of each four-month cycle.";
  if (s.levelId === "metropolis")
    return floodActive(s.month)
      ? "Flood active: exposed links in the floodplain run at half speed."
      : s.month % 4 === 3
        ? "Next month: the floodplain floods for one month. Prepare your links."
        : "The floodplain floods every fourth month. Existing equipment remains intact.";
  return "";
}
export function placementTerrainError(
  s: Metro,
  p: { x: number; y: number },
  automatic = false,
) {
  for (const t of terrainFor(s.levelId)) {
    if (!contains(p, t, automatic ? 12 : 26)) continue;
    if (t.kind === "river" || t.kind === "rock")
      return `Cannot build on ${t.label.toLowerCase()}.`;
    if (!automatic && t.kind === "building")
      return "Place transit devices outside buildings.";
    if (t.kind === "construction" && (automatic || constructionActive(s.month)))
      return "This area is reserved for road works.";
  }
  return null;
}
export function bridgeFor(a: Site, b: Site) {
  if ((a.x < 450 && b.x > 550) || (b.x < 450 && a.x > 550)) {
    const y1 = a.y + ((b.y - a.y) * (450 - a.x)) / (b.x - a.x),
      y2 = a.y + ((b.y - a.y) * (550 - a.x)) / (b.x - a.x);
    return (
      BRIDGES.find(
        (v) => Math.min(y1, y2) >= v.y && Math.max(y1, y2) <= v.y + v.height,
      )?.id ?? null
    );
  }
  return null;
}
export function bridgeUse(s: Metro, id: string, ignore?: number) {
  return s.cables.filter(
    (c) =>
      c.id !== ignore &&
      c.kind !== 3 &&
      bridgeFor(s.nodes[c.stops[0]], s.nodes[c.stops[1]]) === id,
  ).length;
}
export function linkTerrainError(
  s: Metro,
  a: Site,
  b: Site,
  wireless = false,
  ignore?: number,
) {
  if (wireless && Math.hypot(a.x - b.x, a.y - b.y) > 650)
    return "Wireless links have a maximum range of 650.";
  for (const t of terrainFor(s.levelId)) {
    if (!intersects(a, b, t)) continue;
    if (t.kind === "rock") return "Route around the rocky ridge.";
    if (t.kind === "building" && !contains(a, t) && !contains(b, t))
      return "Cables cannot cut through a building. Use a relay.";
    if (t.kind === "construction" && constructionActive(s.month))
      return "New links cannot cross active road works.";
    if (t.kind === "river" && !wireless) {
      const bridge = bridgeFor(a, b);
      if (!bridge) return "Cross the river through a bridge.";
      if (bridgeUse(s, bridge, ignore) >= 2)
        return "Bridge slots are full (2/2). Use another crossing.";
    }
  }
  return null;
}
export function floodedLink(s: Metro, c: Cable) {
  return (
    floodActive(s.month) &&
    terrainFor(s.levelId).some(
      (t) =>
        t.kind === "flood" &&
        intersects(s.nodes[c.stops[0]], s.nodes[c.stops[1]], t),
    )
  );
}
