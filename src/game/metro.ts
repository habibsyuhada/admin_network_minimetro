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
export type TransitKind = 3 | 4;
export const TRANSIT = {
  3: {
    name: "Router",
    cost: 150,
    maintenance: 30,
    ports: 8,
    buffer: 16,
    dwell: 0.4,
  },
  4: {
    name: "Switch",
    cost: 80,
    maintenance: 15,
    ports: 4,
    buffer: 10,
    dwell: 0.2,
  },
} as const;
export const isTransit = (shape: Shape): shape is TransitKind =>
  shape === 3 || shape === 4;
export const nodeBuffer = (shape: Shape) =>
  isTransit(shape) ? TRANSIT[shape].buffer : 8;
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
  version: 7;
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
  week: number;
  phase: "running" | "reward" | "over";
};
export const cableCapacity = (s: Metro, kind: CableKind) =>
  CABLE_TYPES[kind].capacity + s.capacityBonus;
export const cableSpeed = (s: Metro, kind: CableKind) =>
  CABLE_TYPES[kind].speed + s.speedBonus;
export function newMetro(seed = Date.now() >>> 0): Metro {
  return {
    version: 7,
    nodes: SITES.slice(0, 3).map((n, i) => ({
      ...n,
      serial: i + 1,
      ...(n.shape === 0 ? { clientVariant: 0 } : {}),
    })),
    spawned: 3,
    gold: 1000,
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
  for (const id of [a, b]) {
    const shape = s.nodes[id].shape;
    if (
      isTransit(shape) &&
      s.cables.filter((c) => c.stops.includes(id)).length >=
        TRANSIT[shape].ports
    )
      return `Port ${TRANSIT[shape].name} ${s.nodes[id].serial ?? id + 1} penuh (${TRANSIT[shape].ports}/${TRANSIT[shape].ports}). Hapus kabel di detail node untuk membebaskan port.`;
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
  return travelTime(s, c) * (1 + loads) + 0.4;
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
    if (s.nodes[node].shape === service) return first[node];
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
export const PACKET_PROFIT = 25;
export const maintenanceRate = (s: Metro) =>
  s.cables.reduce((total, c) => total + CABLE_TYPES[c.kind].maintenance, 0) +
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
  const cost = choice === "capacity" ? 300 : choice === "speed" ? 250 : 0;
  if (s.phase !== "reward" || s.gold < cost) return s;
  return {
    ...s,
    phase: "running",
    week: s.week + 1,
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
  const random = () => {
    s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
    return s.seed / 4294967296;
  };
  if (
    Math.floor(s.time / 35) > Math.floor(state.time / 35) &&
    s.spawned < MAX_ENDPOINTS
  ) {
    const pcWave = random() < 0.5;
    const roll = random();
    const count = pcWave ? (roll < 0.6 ? 1 : roll < 0.9 ? 2 : 3) : 1;
    for (let i = 0; i < count && s.spawned < MAX_ENDPOINTS; i++) {
      const shape: Shape = pcWave
        ? 0
        : SERVICES[Math.floor(random() * SERVICES.length)];
      for (let attempt = 0; attempt < 80; attempt++) {
        const candidate = {
          shape,
          x: 80 + random() * 840,
          y: 80 + random() * 1040,
        };
        if (
          !s.nodes.every(
            (n) =>
              Math.hypot(n.x - candidate.x, n.y - candidate.y) >=
              (isTransit(n.shape) ? 75 : 130),
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
      if (isTransit(shape) || random() > Math.min(0.85, 0.4 + s.time / 900))
        continue;
      const targets: Shape[] = shape === 0 ? activeServices : [0];
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
        if (s.nodes[node].shape === packet.service) {
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
  if (s.time >= s.week * 60) {
    const maintenance = maintenanceDue(s);
    s.report = { profit: s.profit, maintenance, net: s.profit - maintenance };
    s.gold += s.report.net;
    s.phase = s.gold < 0 ? "over" : "reward";
  }
  if (s.overload.some((t) => t >= 20)) s.phase = "over";
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
    TRANSIT[node.shape].cost +
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
      i !== id && n.shape !== packet.service ? [i] : [],
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
