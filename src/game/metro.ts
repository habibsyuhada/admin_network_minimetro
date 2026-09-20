import { ITEMS, ITEM_KEYS, type ItemKind } from "./items";
import {
  placementTerrainError,
  linkTerrainError,
  floodedLink,
} from "./environment";
import { LEVELS, getLevel } from "./levels";
export type Shape =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type Site = {
  x: number;
  y: number;
  shape: Shape;
  clientVariant?: number;
  serial?: number;
  items?: ItemKind[];
  service?: number;
  cacheCharges?: number;
  priority?: number;
};
export const CLIENT_VARIANTS = [
  "Desktop",
  "Laptop",
  "Phone",
  "Tablet",
  "Console",
  "Smart TV",
  "Printer",
  "CCTV Camera",
  "Smartwatch",
  "Smart speaker",
  "Kiosk",
  "Headset VR",
  "Handheld",
  "Mini PC",
  "Workstation",
  "POS terminal",
];
const nextSerial = (s: Metro) =>
  Math.max(0, ...s.nodes.map((n, i) => n.serial ?? i + 1)) + 1;
export const WORLD = { width: 1000, height: 1200 };
export const SERVICES: Shape[] = [1, 2, 5, 6, 7, 8, 9];
export const MAX_ENDPOINTS = 36;
export const OVERLOAD_SECONDS = 25;
export type TransitKind = 3 | 4 | 10 | 11 | 12 | 13 | 14;
export const TRANSIT_KINDS: TransitKind[] = [3, 4, 10, 11, 12, 13, 14];
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
  10: {
    name: "Cable Relay",
    cost: 50,
    maintenance: 5,
    ports: 2,
    buffer: 6,
    dwell: 0.2,
  },
  11: {
    name: "Wireless Bridge",
    cost: 220,
    maintenance: 25,
    ports: 2,
    buffer: 12,
    dwell: 0.3,
  },
  12: {
    name: "Cache Server",
    cost: 350,
    maintenance: 35,
    ports: 2,
    buffer: 16,
    dwell: 0.3,
  },
  13: {
    name: "Distribution Hub",
    cost: 400,
    maintenance: 65,
    ports: 12,
    buffer: 40,
    dwell: 0.4,
  },
  14: {
    name: "Service Gateway",
    cost: 550,
    maintenance: 65,
    ports: 1,
    buffer: 10,
    dwell: 0.4,
  },
} as const;
export const isTransit = (shape: Shape): shape is TransitKind =>
  TRANSIT_KINDS.includes(shape as TransitKind);
export const nodeBuffer = (value: Shape | Site) => {
  const n: Pick<Site, "shape" | "items"> =
    typeof value === "number" ? { shape: value } : value;
  return (
    (isTransit(n.shape) ? TRANSIT[n.shape].buffer : 10) +
    (n.items?.includes("buffer") ? 8 : 0)
  );
};
export const nodePorts = (value: Shape | Site) => {
  const n: Pick<Site, "shape" | "items"> =
    typeof value === "number" ? { shape: value } : value;
  return (
    (isTransit(n.shape) ? TRANSIT[n.shape].ports : 1) +
    (n.items?.includes("ports") ? 2 : 0)
  );
};
export const nodeService = (node: Site) =>
  node.shape === 14
    ? (node.service ?? 1)
    : isTransit(node.shape)
      ? -1
      : node.shape === 0 && node.clientVariant
        ? 10 + node.clientVariant
        : node.shape;
export const packetKind = (service: number) => (service >= 10 ? 0 : service);
export const packetVariant = (service: number) =>
  service >= 10 ? service - 10 : 0;
export type Packet = { service: number; refillTarget?: number };
export type CableKind = 0 | 1 | 2 | 3;
export const CABLE_TYPES = [
  {
    name: "Ethernet",
    color: "#58b8af",
    capacity: 4,
    speed: 60,
    cost: 100,
    maintenance: 20,
    note: "Balanced",
  },
  {
    name: "Fiber",
    color: "#ee785d",
    capacity: 3,
    speed: 100,
    cost: 200,
    maintenance: 35,
    note: "Faster",
  },
  {
    name: "Backbone",
    color: "#a596db",
    capacity: 8,
    speed: 45,
    cost: 250,
    maintenance: 40,
    note: "High capacity",
  },
  {
    name: "Wireless",
    color: "#e2ce74",
    capacity: 2,
    speed: 90,
    cost: 150,
    maintenance: 30,
    note: "One radio link per bridge; range 650",
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
  version: 10;
  levelId?: string;
  inventory: ItemKind[];
  purchasedThisMonth: boolean;
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
  month: number;
  phase: "running" | "reward" | "over" | "complete";
};
export const hasItem = (n: Site, key: ItemKind) => !!n.items?.includes(key);
export const linkItem = (s: Metro, c: Cable | undefined, key: ItemKind) =>
  !!c?.stops.some((id) => hasItem(s.nodes[id], key));
export const cableCapacity = (s: Metro, kind: CableKind, c?: Cable) =>
  CABLE_TYPES[kind].capacity + (linkItem(s, c, "bandwidth") ? 2 : 0);
export const cableSpeed = (s: Metro, kind: CableKind, c?: Cable) =>
  CABLE_TYPES[kind].speed *
  (c && floodedLink(s, c) ? (linkItem(s, c, "weather") ? 0.9 : 0.5) : 1);
export const campaignNumber = (s: Metro) =>
  s.levelId ? LEVELS.findIndex((l) => l.id === s.levelId) + 1 : 6;
export const transitUnlocked = (s: Metro, kind: TransitKind) =>
  campaignNumber(s) >= { 3: 1, 4: 1, 10: 5, 11: 3, 12: 4, 13: 6, 14: 6 }[kind];
export const itemSlots = (n: Site) =>
  n.shape === 3 || n.shape === 13
    ? 2
    : n.shape === 4 || n.shape === 11 || n.shape === 12
      ? 1
      : 0;
export const itemAllowed = (n: Site, key: ItemKind) =>
  itemSlots(n) > 0 && (key !== "traffic" || n.shape === 3 || n.shape === 13);
export const monthlyItems = (s: Metro) =>
  ITEM_KEYS.filter((k) => ITEMS[k].level <= campaignNumber(s));
export function buyItem(s: Metro, key: ItemKind): Metro {
  if (
    s.phase !== "reward" ||
    s.purchasedThisMonth ||
    !monthlyItems(s).includes(key) ||
    s.gold < ITEMS[key].cost
  )
    return s;
  return {
    ...s,
    gold: s.gold - ITEMS[key].cost,
    inventory: [...s.inventory, key],
    purchasedThisMonth: true,
  };
}
export function installItem(s: Metro, id: number, key: ItemKind): Metro {
  const n = s.nodes[id];
  if (
    s.phase !== "running" ||
    !n ||
    !s.inventory.includes(key) ||
    !itemAllowed(n, key) ||
    hasItem(n, key) ||
    (n.items?.length ?? 0) >= itemSlots(n)
  )
    return s;
  const inventory = [...s.inventory];
  inventory.splice(inventory.indexOf(key), 1);
  return {
    ...s,
    inventory,
    nodes: s.nodes.map((v, i) =>
      i === id ? { ...v, items: [...(v.items ?? []), key] } : v,
    ),
  };
}
export function removeItemError(s: Metro, id: number, key: ItemKind) {
  const n = s.nodes[id];
  if (!n || !hasItem(n, key)) return "Item not installed.";
  if (
    key === "ports" &&
    s.cables.filter((c) => c.stops.includes(id)).length > nodePorts(n) - 2
  )
    return "Disconnect the extra ports before removing this item.";
  return null;
}
export function uninstallItem(s: Metro, id: number, key: ItemKind): Metro {
  if (s.phase !== "running" || removeItemError(s, id, key)) return s;
  const next = {
    ...s,
    inventory: [...s.inventory, key],
    nodes: s.nodes.map((n, i) =>
      i === id ? { ...n, items: n.items?.filter((k) => k !== key) } : n,
    ),
    queues: s.queues.map((q) => [...q]),
  };
  next.cables = s.cables.map((c) => {
    const cap = cableCapacity(next, c.kind, c);
    next.queues[c.stops[c.at]].push(...c.cargo.slice(cap));
    return { ...c, cargo: c.cargo.slice(0, cap) };
  });
  return next;
}
export function configureService(s: Metro, id: number, service: number): Metro {
  const n = s.nodes[id];
  if (
    s.phase !== "running" ||
    !n ||
    ![12, 14].includes(n.shape) ||
    !SERVICES.includes(service as Shape) ||
    n.service === service
  )
    return s;
  // A cache reconfiguration cancels only maintenance refills, never player packets.
  return {
    ...s,
    nodes: s.nodes.map((v, i) =>
      i === id ? { ...v, service, cacheCharges: 0 } : v,
    ),
    queues: s.queues.map((q) => q.filter((p) => p.refillTarget !== n.serial)),
    cables: s.cables.map((c) => ({
      ...c,
      cargo: c.cargo.filter((p) => p.refillTarget !== n.serial),
    })),
  };
}
export function setPriority(s: Metro, id: number, service: number): Metro {
  if (
    s.phase !== "running" ||
    !s.nodes[id] ||
    !hasItem(s.nodes[id], "priority") ||
    !SERVICES.includes(service as Shape)
  )
    return s;
  return {
    ...s,
    nodes: s.nodes.map((n, i) => (i === id ? { ...n, priority: service } : n)),
  };
}
const accepts = (n: Site, p: Packet) =>
  p.refillTarget !== undefined
    ? n.shape === 12 && n.serial === p.refillTarget
    : nodeService(n) === p.service ||
      (n.shape === 12 &&
        (n.service ?? 1) === p.service &&
        (n.cacheCharges ?? 0) > 0);
export function newMetro(seed = Date.now() >>> 0, levelId?: string): Metro {
  const level = getLevel(levelId);
  return {
    version: 10,
    inventory: [],
    purchasedThisMonth: false,
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
  if (s.phase !== "running") return "The simulation is paused.";
  if (
    !CABLE_TYPES[kind] ||
    !Number.isInteger(a) ||
    !Number.isInteger(b) ||
    !s.queues[a] ||
    !s.queues[b]
  )
    return "This device is not available.";
  if (a === b) return "Choose two different devices.";
  for (const id of [a, b]) {
    const n = s.nodes[id];
    const ports = nodePorts(n);
    if (s.cables.filter((c) => c.stops.includes(id)).length >= ports)
      return `Port ${isTransit(n.shape) ? TRANSIT[n.shape].name : n.shape === 0 ? CLIENT_VARIANTS[n.clientVariant ?? 0] : ["", "YouTube", "Facebook", "", "", "TikTok", "Instagram", "WhatsApp", "Netflix", "Spotify"][n.shape]} ${n.serial ?? id + 1} full (${ports}/${ports}). Remove a cable in Node details to free a port.`;
  }
  const radio = s.nodes[a].shape === 11 && s.nodes[b].shape === 11;
  if (kind === 3 && !radio)
    return "Wireless links require two Wireless Bridges.";
  if (
    radio &&
    s.cables.some(
      (c) => c.kind === 3 && (c.stops.includes(a) || c.stops.includes(b)),
    )
  )
    return "Each Wireless Bridge supports one radio link.";
  const terrainError = linkTerrainError(s, s.nodes[a], s.nodes[b], radio);
  if (terrainError) return terrainError;
  if (s.gold < CABLE_TYPES[radio ? 3 : kind].cost)
    return "Not enough gold for this cable.";
  return null;
}
export function connectCable(
  s: Metro,
  kind: CableKind,
  a: number,
  b: number,
): Metro {
  if (connectionError(s, kind, a, b)) return s;
  if (s.nodes[a].shape === 11 && s.nodes[b].shape === 11) kind = 3;
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
    cable.kind === 3 ||
    kind === 3 ||
    cable.kind === kind
  )
    return s;
  const cost = cableChangeCost(s, id, kind);
  if (s.gold < cost) return s;
  const capacity = cableCapacity(s, kind, cable);
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
  return Math.hypot(a.x - b.x, a.y - b.y) / cableSpeed(s, c.kind, c);
}
// Positive edge costs include journey time and queued loads. Dijkstra chooses
// any reachable node matching the service icon; equal costs use stable cable IDs.
function edgeCost(s: Metro, c: Cable, from: number, service: number) {
  const loads =
    s.queues[from].filter((p) => p.service === service).length /
    cableCapacity(s, c.kind, c);
  return (
    travelTime(s, c) *
      (1 + loads + c.cargo.length / cableCapacity(s, c.kind, c)) +
    0.4
  );
}
export function routeCable(
  s: Metro,
  start: number,
  destination: number | Packet,
): number | null {
  const packet =
    typeof destination === "number" ? { service: destination } : destination;
  const service = packet.service;
  const best = s.queues.map(() => Infinity);
  const first: (number | null)[] = s.queues.map(() => null);
  const visited = new Set<number>();
  best[start] = 0;
  while (visited.size < s.queues.length) {
    let node = -1;
    for (let i = 0; i < best.length; i++)
      if (!visited.has(i) && (node < 0 || best[i] < best[node])) node = i;
    if (node < 0 || !Number.isFinite(best[node])) break;
    if (accepts(s.nodes[node], packet)) return first[node];
    visited.add(node);
    for (const cable of s.cables) {
      if (!cable.stops.includes(node)) continue;
      const next = cable.stops[0] === node ? cable.stops[1] : cable.stops[0];
      const cost =
        best[node] +
        edgeCost(s, cable, node, service) +
        (hasItem(s.nodes[start], "traffic")
          ? s.queues[next].length * 3 + cable.cargo.length * 2
          : 0);
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
export const cableMaintenance = (s: Metro, kind: CableKind, c?: Cable) =>
  CABLE_TYPES[kind].maintenance + (linkItem(s, c, "bandwidth") ? 4 : 0);
export const maintenanceRate = (s: Metro) =>
  s.cables.reduce((sum, c) => sum + cableMaintenance(s, c.kind, c), 0) +
  s.nodes.reduce(
    (sum, n) =>
      sum +
      (isTransit(n.shape)
        ? Math.ceil(
            TRANSIT[n.shape].maintenance * (hasItem(n, "efficiency") ? 0.7 : 1),
          )
        : 0) +
      (n.items ?? []).reduce((v, k) => v + ITEMS[k].maintenance, 0),
    0,
  );
export const maintenanceDue = (s: Metro) => Math.ceil(s.maintenanceUnits / 600);
export function reward(s: Metro, _choice: "continue" = "continue"): Metro {
  if (s.phase !== "reward") return s;
  return {
    ...s,
    phase: "running",
    month: s.month + 1,
    profit: 0,
    maintenanceUnits: 0,
    purchasedThisMonth: false,
  };
}
export function metroTick(state: Metro): Metro {
  if (state.phase !== "running") return state;
  const s: Metro = {
    ...state,
    time: Math.round((state.time + 0.1) * 10) / 10,
    maintenanceUnits: state.maintenanceUnits + maintenanceRate(state),
    nodes: state.nodes.map((n) => ({
      ...n,
      items: n.items ? [...n.items] : undefined,
    })),
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
        if (placementTerrainError(s, candidate, true)) continue;
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
    s.nodes.some((n) => nodeService(n) === kind),
  );
  if (Math.floor(s.time / 3) > Math.floor(state.time / 3))
    for (let id = 0; id < s.nodes.length; id++) {
      const shape = s.nodes[id].shape;
      if (
        (isTransit(shape) && shape !== 14) ||
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
  if (Math.floor(s.time / 15) > Math.floor(state.time / 15))
    for (const n of s.nodes) {
      if (n.shape !== 12 || (n.cacheCharges ?? 0) > 0) continue;
      const pending = [
        ...s.queues.flat(),
        ...s.cables.flatMap((c) => c.cargo),
      ].some((p) => p.refillTarget === n.serial);
      if (pending) continue;
      const dest = s.nodes.indexOf(n),
        source = s.nodes.findIndex(
          (v, id) =>
            nodeService(v) === (n.service ?? 1) &&
            routeCable(s, id, {
              service: n.service ?? 1,
              refillTarget: n.serial,
            }) !== null,
        );
      if (source >= 0 && source !== dest)
        s.queues[source].push({
          service: n.service ?? 1,
          refillTarget: n.serial,
        });
    }
  // Departures happen before arrivals: transferring cargo must wait for the
  // next cable's own carrier, regardless of cable iteration order.
  for (const c of s.cables) {
    if (c.wait > 0) {
      c.wait = Math.max(0, Math.round((c.wait - 0.1) * 10) / 10);
      if (c.wait > 0) continue;
      const node = c.stops[c.at];
      if (hasItem(s.nodes[node], "priority"))
        s.queues[node].sort(
          (a, b) =>
            Number(b.service === (s.nodes[node].priority ?? 1)) -
            Number(a.service === (s.nodes[node].priority ?? 1)),
        );
      const routeKey = (p: Packet) => `${p.service}:${p.refillTarget ?? ""}`;
      const routes = new Map(
        s.queues[node].map((p) => [routeKey(p), routeCable(s, node, p)]),
      );
      s.queues[node] = s.queues[node].filter((packet) => {
        if (
          c.cargo.length < cableCapacity(s, c.kind, c) &&
          routes.get(routeKey(packet)) === c.id
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
      c.wait =
        (isTransit(arrivalShape) ? TRANSIT[arrivalShape].dwell : 0.4) *
        (hasItem(s.nodes[c.stops[c.at]], "transfer") ? 0.5 : 1);
      const node = c.stops[c.at];
      for (const packet of c.cargo) {
        if (accepts(s.nodes[node], packet)) {
          if (packet.refillTarget !== undefined) {
            s.nodes[node].cacheCharges = 5;
            continue;
          }
          if (s.nodes[node].shape === 12)
            s.nodes[node].cacheCharges = (s.nodes[node].cacheCharges ?? 0) - 1;
          s.delivered++;
          s.profit += PACKET_PROFIT;
        } else s.queues[node].push(packet);
      }
      c.cargo = [];
    }
  for (let id = 0; id < s.nodes.length; id++)
    if (s.nodes[id].shape === 12) {
      const n = s.nodes[id];
      s.queues[id] = s.queues[id].filter((p) => {
        if (p.refillTarget === undefined && accepts(n, p)) {
          n.cacheCharges = (n.cacheCharges ?? 0) - 1;
          s.delivered++;
          s.profit += PACKET_PROFIT;
          return false;
        }
        return true;
      });
    }
  s.overload = s.queues.map((q, i) =>
    q.length >= nodeBuffer(s.nodes[i])
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
  if (s.phase !== "running") return "The simulation is paused.";
  if (!transitUnlocked(s, kind))
    return "This device is unlocked in a later mission.";
  const terrainError = placementTerrainError(s, { x, y });
  if (terrainError) return terrainError;
  if (ignoreId !== undefined) {
    const proposed = {
      ...s,
      nodes: s.nodes.map((n, i) => (i === ignoreId ? { ...n, x, y } : n)),
    };
    for (const c of s.cables.filter((c) => c.stops.includes(ignoreId))) {
      const error = linkTerrainError(
        proposed,
        proposed.nodes[c.stops[0]],
        proposed.nodes[c.stops[1]],
        c.kind === 3,
        c.id,
      );
      if (error) return `Connected link: ${error}`;
    }
  }

  if (ignoreId !== undefined && s.nodes[ignoreId]?.shape !== kind)
    return "This device cannot be moved.";
  if (ignoreId === undefined && s.gold < TRANSIT[kind].cost)
    return `Not enough gold to place ${TRANSIT[kind].name}.`;
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 40 ||
    y < 40 ||
    x > WORLD.width - 40 ||
    y > WORLD.height - 40
  )
    return "Place the device inside the map boundaries.";
  if (
    s.nodes.some((n, i) => i !== ignoreId && Math.hypot(n.x - x, n.y - y) < 75)
  )
    return "Too close to another device. Choose an open area.";
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
    nodes: [
      ...s.nodes,
      {
        x,
        y,
        shape: kind,
        serial: nextSerial(s),
        items: [],
        ...(kind === 12 || kind === 14 ? { service: 1, cacheCharges: 0 } : {}),
      },
    ],
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
  const cargo = [...queues[id], ...removed.flatMap((c) => c.cargo)].filter(
    (p) => p.refillTarget !== node.serial,
  );
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
    inventory: [...s.inventory, ...(node.items ?? [])],
    nodes: s.nodes.filter((_, i) => i !== id),
    queues: queues
      .filter((_, i) => i !== id)
      .map((q) => q.filter((p) => p.refillTarget !== node.serial)),
    overload: s.overload.filter((_, i) => i !== id),
    cables: s.cables
      .filter((c) => !c.stops.includes(id))
      .map((c) => ({
        ...c,
        cargo: c.cargo.filter((p) => p.refillTarget !== node.serial),
        stops: c.stops.map((n) => (n > id ? n - 1 : n)) as [number, number],
      })),
  };
}
