import { getLevel } from "./levels";
export type Shape = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Site = {
  x: number;
  y: number;
  shape: Shape;
  clientVariant?: number;
  serial?: number;
};
export const CLIENT_VARIANTS = [
  "Desktop",
  "Laptop",
  "Ponsel",
  "Tablet",
  "Konsol",
  "Smart TV",
  "Printer",
  "Kamera CCTV",
  "Jam pintar",
  "Speaker pintar",
  "Kios",
  "Headset VR",
  "Handheld",
  "Mini PC",
  "Workstation",
  "Terminal kasir",
];
const nextSerial = (s: Metro) =>
  Math.max(0, ...s.nodes.map((n, i) => n.serial ?? i + 1)) + 1;
export const WORLD = { width: 1000, height: 1200 };
export const SERVICES: Shape[] = [1, 2, 5, 6, 7, 8, 9];
export const MAX_ENDPOINTS = 36;
export const OVERLOAD_SECONDS = 25;
export type TransitKind = 3 | 4;
export const TRANSIT = {
  3: {
    name: "Router",
    cost: 150,
    maintenance: 30,
    ports: 8,
    buffer: 24,
    dwell: 0.4,
  },
  4: {
    name: "Switch",
    cost: 80,
    maintenance: 15,
    ports: 4,
    buffer: 16,
    dwell: 0.2,
  },
} as const;
export const isTransit = (shape: Shape): shape is TransitKind =>
  shape === 3 || shape === 4;
export const nodeBuffer = (shape: Shape) =>
  isTransit(shape) ? TRANSIT[shape].buffer : 10;
export const nodePorts = (shape: Shape) =>
  isTransit(shape) ? TRANSIT[shape].ports : 1;
export const nodeService = (node: Site) =>
  node.shape === 0 && node.clientVariant ? 10 + node.clientVariant : node.shape;
export const packetKind = (service: number) => (service >= 10 ? 0 : service);
export const packetVariant = (service: number) =>
  service >= 10 ? service - 10 : 0;
export type Packet = { service: number };
export type CableKind = 0 | 1 | 2;
export const CABLE_TYPES = [
  {
    name: "Ethernet",
    color: "#58b8af",
    capacity: 4,
    speed: 60,
    cost: 100,
    maintenance: 20,
    note: "Seimbang",
  },
  {
    name: "Fiber",
    color: "#ee785d",
    capacity: 3,
    speed: 100,
    cost: 200,
    maintenance: 35,
    note: "Lebih cepat",
  },
  {
    name: "Backbone",
    color: "#a596db",
    capacity: 8,
    speed: 45,
    cost: 250,
    maintenance: 40,
    note: "Muatan besar",
  },
] as const;
export const SITES: Site[] = [
  { x: 70, y: 90, shape: 0 },
  { x: 350, y: 180, shape: 1 },
  { x: 290, y: 465, shape: 2 },
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
  version: 9;
  levelId?: string;
  nodes: Site[];
  spawned: number;
  gold: number;
  profit: number;
  maintenanceUnits: number;
  report: { profit: number; maintenance: number; net: number } | null;
  time: number;
  seed: number;
  delivered: number;
  queues: Packet[][];
  overload: number[];
  cables: Cable[];
  nextCableId: number;
  capacityBonus: number;
  speedBonus: number;
  month: number;
  phase: "running" | "reward" | "over" | "complete";
};
export const cableCapacity = (s: Metro, kind: CableKind) =>
  CABLE_TYPES[kind].capacity + s.capacityBonus;
export const cableSpeed = (s: Metro, kind: CableKind) =>
  CABLE_TYPES[kind].speed + s.speedBonus;
export function newMetro(seed = Date.now() >>> 0, levelId?: string): Metro {
  const level = getLevel(levelId);
  return {
    version: 9,
    ...(level ? { levelId: level.id } : {}),
    nodes: (level?.start ?? SITES.slice(0, 3)).map((n, i) => ({
      ...n,
      serial: i + 1,
      ...(n.shape === 0 ? { clientVariant: n.clientVariant ?? 0 } : {}),
    })),
    spawned: 3,
    gold: level?.gold ?? 1600,
    profit: 0,
    maintenanceUnits: 0,
    report: null,
    time: 0,
    seed,
    delivered: 0,
    queues: [[], [], []],
    overload: [0, 0, 0],
    cables: [],
    nextCableId: 1,
    capacityBonus: 0,
    speedBonus: 0,
    month: 1,
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
  for (const id of [a, b]) {
    const n = s.nodes[id];
    const ports = nodePorts(n.shape);
    if (s.cables.filter((c) => c.stops.includes(id)).length >= ports)
      return `Port ${isTransit(n.shape) ? TRANSIT[n.shape].name : n.shape === 0 ? CLIENT_VARIANTS[n.clientVariant ?? 0] : ["", "YouTube", "Facebook", "", "", "TikTok", "Instagram", "WhatsApp", "Netflix", "Spotify"][n.shape]} ${n.serial ?? id + 1} penuh (${ports}/${ports}). Hapus kabel di detail node untuk membebaskan port.`;
  }
  if (s.gold < CABLE_TYPES[kind].cost)
    return "Gold tidak cukup untuk memasang kabel ini.";
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
    gold: s.gold - CABLE_TYPES[kind].cost,
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
    gold: s.gold + CABLE_TYPES[cable.kind].cost,
  };
}
export function cableChangeCost(s: Metro, id: number, kind: CableKind): number {
  const cable = s.cables.find((c) => c.id === id);
  return cable ? CABLE_TYPES[kind].cost - CABLE_TYPES[cable.kind].cost : 0;
}
export function changeCable(s: Metro, id: number, kind: CableKind): Metro {
  const cable = s.cables.find((c) => c.id === id);
  if (
    s.phase !== "running" ||
    !cable ||
    !CABLE_TYPES[kind] ||
    cable.kind === kind
  )
    return s;
  const cost = cableChangeCost(s, id, kind);
  if (s.gold < cost) return s;
  const capacity = cableCapacity(s, kind);
  const queues = s.queues.map((q) => [...q]);
  queues[cable.stops[cable.at]].push(...cable.cargo.slice(capacity));
  return {
    ...s,
    gold: s.gold - cost,
    queues,
    cables: s.cables.map((c) =>
      c.id === id ? { ...c, kind, cargo: c.cargo.slice(0, capacity) } : c,
    ),
  };
}
function travelTime(s: Metro, c: Cable) {
  const [a, b] = c.stops.map((id) => s.nodes[id]);
  return Math.hypot(a.x - b.x, a.y - b.y) / cableSpeed(s, c.kind);
}
// Positive edge costs include journey time and queued loads. Dijkstra chooses
// any reachable node matching the service icon; equal costs use stable cable IDs.
function edgeCost(s: Metro, c: Cable, from: number, service: number) {
  const loads =
    s.queues[from].filter((p) => p.service === service).length /
    cableCapacity(s, c.kind);
  return (
    travelTime(s, c) * (1 + loads + c.cargo.length / cableCapacity(s, c.kind)) +
    0.4
  );
}
export function routeCable(
  s: Metro,
  start: number,
  service: number,
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
    if (nodeService(s.nodes[node]) === service) return first[node];
    visited.add(node);
    for (const cable of s.cables) {
      if (!cable.stops.includes(node)) continue;
      const next = cable.stops[0] === node ? cable.stops[1] : cable.stops[0];
      const cost = best[node] + edgeCost(s, cable, node, service);
      if (cost < best[next] - 1e-9) {
        best[next] = cost;
        first[next] = first[node] ?? cable.id;
      }
    }
  }
  return null;
}
export const ROUTER_COST = 150;
export const ROUTER_MAINTENANCE = 30;
export const PACKET_PROFIT = 18;
export const upgradeCost = (
  s: Metro,
  choice: "capacity" | "speed" | "continue",
) =>
  choice === "capacity"
    ? 300 + s.capacityBonus * 150
    : choice === "speed"
      ? 250 + s.speedBonus * 15
      : 0;
export const cableMaintenance = (s: Metro, kind: CableKind) =>
  CABLE_TYPES[kind].maintenance +
  Math.ceil(s.capacityBonus * 2 + s.speedBonus / 10);
export const maintenanceRate = (s: Metro) =>
  s.cables.reduce((total, c) => total + cableMaintenance(s, c.kind), 0) +
  s.nodes.reduce(
    (total, n) =>
      total + (isTransit(n.shape) ? TRANSIT[n.shape].maintenance : 0),
    0,
  );
export const maintenanceDue = (s: Metro) => Math.ceil(s.maintenanceUnits / 600);
export function reward(
  s: Metro,
  choice: "continue" | "capacity" | "speed",
): Metro {
  const cost = upgradeCost(s, choice);
  if (s.phase !== "reward" || s.gold < cost) return s;
  return {
    ...s,
    phase: "running",
    month: s.month + 1,
    profit: 0,
    maintenanceUnits: 0,
    gold: s.gold - cost,
    capacityBonus: s.capacityBonus + (choice === "capacity" ? 2 : 0),
    speedBonus: s.speedBonus + (choice === "speed" ? 15 : 0),
  };
}
export function metroTick(state: Metro): Metro {
  if (state.phase !== "running") return state;
  const s: Metro = {
    ...state,
    time: Math.round((state.time + 0.1) * 10) / 10,
    maintenanceUnits: state.maintenanceUnits + maintenanceRate(state),
    nodes: [...state.nodes],
    queues: state.queues.map((q) => [...q]),
    overload: [...state.overload],
    cables: state.cables.map((c) => ({ ...c, cargo: [...c.cargo] })),
  };
  const level = getLevel(s.levelId);
  const spawnEvery = level?.spawnEvery ?? 45;
  const maxNodes = level?.maxNodes ?? MAX_ENDPOINTS;
  const random = () => {
    s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
    return s.seed / 4294967296;
  };
  if (
    Math.floor(s.time / spawnEvery) > Math.floor(state.time / spawnEvery) &&
    s.spawned < maxNodes
  ) {
    const pcWave = random() < 0.5;
    const roll = random();
    const count = pcWave ? (roll < 0.6 ? 1 : roll < 0.9 ? 2 : 3) : 1;
    const waveStart = s.nodes.length;
    let anchor: Site | undefined;
    for (let i = 0; i < count && s.spawned < maxNodes; i++) {
      const shape: Shape = pcWave
        ? 0
        : SERVICES[Math.floor(random() * SERVICES.length)];
      for (let attempt = 0; attempt < 80; attempt++) {
        const angle = random() * Math.PI * 2;
        const distance = 85 + random() * 45;
        const zone = level
          ? level.zones[
              level.zones.length === 1
                ? 0
                : Math.floor(random() * level.zones.length)
            ]
          : undefined;
        const candidate = {
          shape,
          x: anchor
            ? anchor.x + Math.cos(angle) * distance
            : (zone?.x ?? 80) + random() * (zone?.width ?? 840),
          y: anchor
            ? anchor.y + Math.sin(angle) * distance
            : (zone?.y ?? 80) + random() * (zone?.height ?? 1040),
        };
        if (
          candidate.x < 40 ||
          candidate.x > 960 ||
          candidate.y < 40 ||
          candidate.y > 1160
        )
          continue;
        if (
          !s.nodes.every(
            (n, index) =>
              Math.hypot(n.x - candidate.x, n.y - candidate.y) >=
              (index >= waveStart || isTransit(n.shape) ? 75 : 130),
          )
        )
          continue;
        s.nodes.push({
          ...candidate,
          serial: nextSerial(s),
          ...(shape === 0
            ? { clientVariant: Math.floor(random() * CLIENT_VARIANTS.length) }
            : {}),
        });
        if (pcWave && !anchor) anchor = candidate;
        s.queues.push([]);
        s.overload.push(0);
        s.spawned++;
        break;
      }
    }
  }
  const activeServices = SERVICES.filter((kind) =>
    s.nodes.some((n) => n.shape === kind),
  );
  if (Math.floor(s.time / 3) > Math.floor(state.time / 3))
    for (let id = 0; id < s.nodes.length; id++) {
      const shape = s.nodes[id].shape;
      if (
        isTransit(shape) ||
        random() >
          Math.min(
            0.85,
            Math.min(0.65, 0.32 + s.time / 2400) * (level?.traffic ?? 1),
          )
      )
        continue;
      const targets: number[] =
        shape === 0
          ? activeServices
          : [...new Set(s.nodes.filter((n) => n.shape === 0).map(nodeService))];
      if (targets.length)
        s.queues[id].push({
          service: targets[Math.floor(random() * targets.length)],
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
        if (!routes.has(packet.service))
          routes.set(packet.service, routeCable(s, node, packet.service));
      s.queues[node] = s.queues[node].filter((packet) => {
        if (
          c.cargo.length < cableCapacity(s, c.kind) &&
          routes.get(packet.service) === c.id
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
      const arrivalShape = s.nodes[c.stops[c.at]].shape;
      c.wait = isTransit(arrivalShape) ? TRANSIT[arrivalShape].dwell : 0.4;
      const node = c.stops[c.at];
      for (const packet of c.cargo) {
        if (nodeService(s.nodes[node]) === packet.service) {
          s.delivered++;
          s.profit += PACKET_PROFIT;
        } else s.queues[node].push(packet);
      }
      c.cargo = [];
    }
  s.overload = s.queues.map((q, i) =>
    q.length >= nodeBuffer(s.nodes[i].shape)
      ? s.overload[i] + 0.1
      : Math.max(0, s.overload[i] - 0.2),
  );
  if (s.time >= s.month * 60) {
    const maintenance = maintenanceDue(s);
    s.report = { profit: s.profit, maintenance, net: s.profit - maintenance };
    s.gold += s.report.net;
    s.phase = s.gold < 0 ? "over" : "reward";
  }
  if (s.overload.some((t) => t >= OVERLOAD_SECONDS)) s.phase = "over";
  if (
    s.phase === "reward" &&
    level &&
    s.month >= level.months &&
    s.delivered >= level.packets
  )
    s.phase = "complete";
  return s;
}

export function routerError(
  s: Metro,
  x: number,
  y: number,
  kind: TransitKind = 3,
  ignoreId?: number,
): string | null {
  if (s.phase !== "running") return "Permainan sedang dijeda.";
  if (ignoreId !== undefined && s.nodes[ignoreId]?.shape !== kind)
    return "Perangkat ini tidak dapat dipindahkan.";
  if (ignoreId === undefined && s.gold < TRANSIT[kind].cost)
    return `Gold tidak cukup untuk memasang ${TRANSIT[kind].name}.`;
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 40 ||
    y < 40 ||
    x > WORLD.width - 40 ||
    y > WORLD.height - 40
  )
    return "Tempatkan perangkat di dalam batas peta.";
  if (
    s.nodes.some((n, i) => i !== ignoreId && Math.hypot(n.x - x, n.y - y) < 75)
  )
    return "Terlalu dekat dengan perangkat lain. Pilih area yang lebih kosong.";
  return null;
}
export function placeRouter(
  s: Metro,
  x: number,
  y: number,
  kind: TransitKind = 3,
): Metro {
  if (routerError(s, x, y, kind)) return s;
  return {
    ...s,
    nodes: [...s.nodes, { x, y, shape: kind, serial: nextSerial(s) }],
    queues: [...s.queues, []],
    overload: [...s.overload, 0],
    gold: s.gold - TRANSIT[kind].cost,
  };
}

export function moveTransit(s: Metro, id: number, x: number, y: number): Metro {
  const node = s.nodes[id];
  if (!node || !isTransit(node.shape) || routerError(s, x, y, node.shape, id))
    return s;
  return {
    ...s,
    nodes: s.nodes.map((n, i) => (i === id ? { ...n, x, y } : n)),
  };
}
export function nodeRefund(s: Metro, id: number): number {
  const node = s.nodes[id];
  if (!node || !isTransit(node.shape)) return 0;
  return (
    Math.floor(TRANSIT[node.shape].cost / 2) +
    s.cables
      .filter((c) => c.stops.includes(id))
      .reduce((sum, c) => sum + CABLE_TYPES[c.kind].cost, 0)
  );
}
export function sellTransit(s: Metro, id: number): Metro {
  const node = s.nodes[id];
  if (s.phase !== "running" || !node || !isTransit(node.shape)) return s;
  const removed = s.cables.filter((c) => c.stops.includes(id));
  const queues = s.queues.map((q) => [...q]);
  const cargo = [...queues[id], ...removed.flatMap((c) => c.cargo)];
  const neighbors = new Set(
    removed.flatMap((c) => c.stops).filter((i) => i !== id),
  );
  // Keep every packet waiting, without granting delivery profit for selling assets.
  for (const packet of cargo) {
    const candidates = s.nodes.flatMap((n, i) =>
      i !== id && nodeService(n) !== packet.service ? [i] : [],
    );
    candidates.sort(
      (a, b) =>
        Number(neighbors.has(b)) - Number(neighbors.has(a)) ||
        Math.hypot(s.nodes[a].x - node.x, s.nodes[a].y - node.y) -
          Math.hypot(s.nodes[b].x - node.x, s.nodes[b].y - node.y),
    );
    if (!candidates.length) return s;
    queues[candidates[0]].push(packet);
  }
  return {
    ...s,
    gold: s.gold + nodeRefund(s, id),
    nodes: s.nodes.filter((_, i) => i !== id),
    queues: queues.filter((_, i) => i !== id),
    overload: s.overload.filter((_, i) => i !== id),
    cables: s.cables
      .filter((c) => !c.stops.includes(id))
      .map((c) => ({
        ...c,
        stops: c.stops.map((n) => (n > id ? n - 1 : n)) as [number, number],
      })),
  };
}
