export type Shape = 0 | 1 | 2;
export type Packet = { destination: number };
export type CableKind = 0 | 1 | 2;
export const CABLE_TYPES = [
  {
    name: "Ethernet",
    color: "#58b8af",
    capacity: 4,
    speed: 60,
    cost: 1,
    note: "Seimbang",
  },
  {
    name: "Fiber",
    color: "#ee785d",
    capacity: 3,
    speed: 100,
    cost: 2,
    note: "Lebih cepat",
  },
  {
    name: "Backbone",
    color: "#a596db",
    capacity: 8,
    speed: 45,
    cost: 2,
    note: "Muatan besar",
  },
] as const;
export const SITES: { x: number; y: number; shape: Shape }[] = [
  { x: 85, y: 125, shape: 0 },
  { x: 235, y: 205, shape: 1 },
  { x: 305, y: 365, shape: 2 },
  { x: 238, y: 820, shape: 0 },
  { x: 775, y: 160, shape: 2 },
  { x: 188, y: 550, shape: 1 },
  { x: 575, y: 990, shape: 0 },
  { x: 838, y: 520, shape: 1 },
  { x: 438, y: 130, shape: 2 },
  { x: 413, y: 670, shape: 2 },
  { x: 163, y: 1040, shape: 1 },
  { x: 813, y: 1080, shape: 0 },
];

export type Cable = {
  id: number;
  kind: CableKind;
  stops: [number, number];
  at: 0 | 1;
  progress: number;
  wait: number;
  cargo: Packet[];
};
export type Metro = {
  version: 3;
  time: number;
  seed: number;
  delivered: number;
  queues: Packet[][];
  overload: number[];
  cables: Cable[];
  stock: number;
  nextCableId: number;
  capacityBonus: number;
  speedBonus: number;
  week: number;
  phase: "running" | "reward" | "over";
};
export const cableCapacity = (s: Metro, kind: CableKind) =>
  CABLE_TYPES[kind].capacity + s.capacityBonus;
export const cableSpeed = (s: Metro, kind: CableKind) =>
  CABLE_TYPES[kind].speed + s.speedBonus;
export function newMetro(seed = Date.now() >>> 0): Metro {
  return {
    version: 3,
    time: 0,
    seed,
    delivered: 0,
    queues: [[], [], []],
    overload: [0, 0, 0],
    cables: [],
    stock: 6,
    nextCableId: 1,
    capacityBonus: 0,
    speedBonus: 0,
    week: 1,
    phase: "running",
  };
}
export function connectionError(
  s: Metro,
  kind: CableKind,
  a: number,
  b: number,
): string | null {
  if (s.phase !== "running") return "Permainan sedang dijeda.";
  if (
    !CABLE_TYPES[kind] ||
    !Number.isInteger(a) ||
    !Number.isInteger(b) ||
    !s.queues[a] ||
    !s.queues[b]
  )
    return "Perangkat belum tersedia.";
  if (a === b) return "Pilih dua perangkat yang berbeda.";
  if (
    s.cables.some(
      (c) => c.kind === kind && c.stops.includes(a) && c.stops.includes(b),
    )
  )
    return "Kabel jenis ini sudah menghubungkan kedua perangkat.";
  if (s.stock < CABLE_TYPES[kind].cost)
    return "Stok kabel tidak cukup. Hapus kabel atau tunggu bekal mingguan.";
  return null;
}
export function connectCable(
  s: Metro,
  kind: CableKind,
  a: number,
  b: number,
): Metro {
  if (connectionError(s, kind, a, b)) return s;
  const cable: Cable = {
    id: s.nextCableId,
    kind,
    stops: [a, b],
    at: 0,
    progress: 0,
    wait: 0.4,
    cargo: [],
  };
  return {
    ...s,
    cables: [...s.cables, cable],
    stock: s.stock - CABLE_TYPES[kind].cost,
    nextCableId: s.nextCableId + 1,
  };
}
export function removeCable(s: Metro, id: number): Metro {
  const cable = s.cables.find((c) => c.id === id);
  if (!cable || s.phase !== "running") return s;
  const queues = s.queues.map((q) => [...q]);
  queues[cable.stops[cable.at]].push(...cable.cargo);
  return {
    ...s,
    queues,
    cables: s.cables.filter((c) => c.id !== id),
    stock: s.stock + CABLE_TYPES[cable.kind].cost,
  };
}
function travelTime(s: Metro, c: Cable) {
  const [a, b] = c.stops.map((id) => SITES[id]);
  return Math.hypot(a.x - b.x, a.y - b.y) / cableSpeed(s, c.kind);
}
// Positive edge costs include journey time and queued loads. Dijkstra chooses
// the exact destination node; equal costs use stable cable IDs.
function edgeCost(s: Metro, c: Cable, from: number, destination: number) {
  const loads =
    s.queues[from].filter((p) => p.destination === destination).length /
    cableCapacity(s, c.kind);
  return travelTime(s, c) * (1 + loads) + 0.4;
}
export function routeCable(
  s: Metro,
  start: number,
  destination: number,
): number | null {
  const best = s.queues.map(() => Infinity);
  const first: (number | null)[] = s.queues.map(() => null);
  const visited = new Set<number>();
  best[start] = 0;
  while (visited.size < s.queues.length) {
    let node = -1;
    for (let i = 0; i < best.length; i++)
      if (!visited.has(i) && (node < 0 || best[i] < best[node])) node = i;
    if (node < 0 || !Number.isFinite(best[node])) break;
    if (node === destination) return first[node];
    visited.add(node);
    for (const cable of s.cables) {
      if (!cable.stops.includes(node)) continue;
      const next = cable.stops[0] === node ? cable.stops[1] : cable.stops[0];
      const cost = best[node] + edgeCost(s, cable, node, destination);
      if (cost < best[next] - 1e-9) {
        best[next] = cost;
        first[next] = first[node] ?? cable.id;
      }
    }
  }
  return null;
}
export function reward(
  s: Metro,
  choice: "stock" | "capacity" | "speed",
): Metro {
  if (s.phase !== "reward") return s;
  return {
    ...s,
    phase: "running",
    week: s.week + 1,
    stock: s.stock + 2 + (choice === "stock" ? 4 : 0),
    capacityBonus: s.capacityBonus + (choice === "capacity" ? 2 : 0),
    speedBonus: s.speedBonus + (choice === "speed" ? 15 : 0),
  };
}
export function metroTick(state: Metro): Metro {
  if (state.phase !== "running") return state;
  const s: Metro = {
    ...state,
    time: Math.round((state.time + 0.1) * 10) / 10,
    queues: state.queues.map((q) => [...q]),
    overload: [...state.overload],
    cables: state.cables.map((c) => ({ ...c, cargo: [...c.cargo] })),
  };
  const random = () => {
    s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
    return s.seed / 4294967296;
  };
  if (
    Math.floor(s.time / 35) > Math.floor(state.time / 35) &&
    s.queues.length < SITES.length
  ) {
    s.queues.push([]);
    s.overload.push(0);
  }
  if (Math.floor(s.time / 3) > Math.floor(state.time / 3))
    for (let id = 0; id < s.queues.length; id++) {
      if (random() > Math.min(0.85, 0.4 + s.time / 900)) continue;
      const targets = s.queues.flatMap((_, target) =>
        target !== id && !(SITES[id].shape === 0 && SITES[target].shape === 0)
          ? [target]
          : [],
      );
      if (targets.length)
        s.queues[id].push({
          destination: targets[Math.floor(random() * targets.length)],
        });
    }
  // Departures happen before arrivals: transferring cargo must wait for the
  // next cable's own carrier, regardless of cable iteration order.
  for (const c of s.cables) {
    if (c.wait > 0) {
      c.wait = Math.max(0, Math.round((c.wait - 0.1) * 10) / 10);
      if (c.wait > 0) continue;
      const node = c.stops[c.at];
      const routes = new Map<number, number | null>();
      for (const packet of s.queues[node])
        if (!routes.has(packet.destination))
          routes.set(
            packet.destination,
            routeCable(s, node, packet.destination),
          );
      s.queues[node] = s.queues[node].filter((packet) => {
        if (
          c.cargo.length < cableCapacity(s, c.kind) &&
          routes.get(packet.destination) === c.id
        ) {
          c.cargo.push(packet);
          return false;
        }
        return true;
      });
    }
    if (!c.wait) c.progress += 0.1 / travelTime(s, c);
  }
  for (const c of s.cables)
    if (c.progress >= 1) {
      c.at = c.at === 0 ? 1 : 0;
      c.progress = 0;
      c.wait = 0.4;
      const node = c.stops[c.at];
      for (const packet of c.cargo) {
        if (node === packet.destination) s.delivered++;
        else s.queues[node].push(packet);
      }
      c.cargo = [];
    }
  s.overload = s.queues.map((q, i) =>
    q.length >= 8 ? s.overload[i] + 0.1 : Math.max(0, s.overload[i] - 0.2),
  );
  if (s.overload.some((t) => t >= 20)) s.phase = "over";
  else if (s.time >= s.week * 60) s.phase = "reward";
  return s;
}
