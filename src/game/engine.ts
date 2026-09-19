export type NodeId = "hq" | "router" | "server" | "branch";
export type Phase =
  | "hq"
  | "server"
  | "observe"
  | "branch"
  | "normal"
  | "rush"
  | "recover"
  | "complete";
export const LEVEL = {
  observe: 25,
  normal: 20,
  stable: 20,
  capacity: 100,
  upgradeCapacity: 240,
  queueMax: 80,
  upgradeCost: 300,
};
export const nodes: {
  id: NodeId;
  name: string;
  x: number;
  y: number;
  type: string;
}[] = [
  { id: "hq", name: "Office HQ", x: 80, y: 210, type: "OFFICE / 01" },
  { id: "router", name: "Router-A", x: 240, y: 210, type: "CORE ROUTER" },
  { id: "server", name: "App Server", x: 400, y: 210, type: "APPLICATION" },
  { id: "branch", name: "Branch Office", x: 240, y: 65, type: "OFFICE / 02" },
];
export type Link = [NodeId, NodeId];
export interface State {
  sources: Record<
    "hq" | "branch",
    { served: number; queue: number; loss: number }
  >;
  phase: Phase;
  time: number;
  phaseTime: number;
  links: Link[];
  queue: number;
  load: number;
  latency: number;
  loss: number;
  served: number;
  dropped: number;
  total: number;
  stable: number;
  upgraded: boolean;
  budget: number;
  peak: number;
  uptime: number;
  message: string;
}
export const initial = (): State => ({
  sources: {
    hq: { served: 0, queue: 0, loss: 0 },
    branch: { served: 0, queue: 0, loss: 0 },
  },
  phase: "hq",
  time: 0,
  phaseTime: 0,
  links: [],
  queue: 0,
  load: 0,
  latency: 0,
  loss: 0,
  served: 0,
  dropped: 0,
  total: 0,
  stable: 0,
  upgraded: false,
  budget: 500,
  peak: 0,
  uptime: 100,
  message: "",
});
export const has = (s: State, a: NodeId, b: NodeId) =>
  s.links.some((l) => l.includes(a) && l.includes(b));
export function route(s: State, start: NodeId): NodeId[] {
  const pending: NodeId[][] = [[start]],
    seen = new Set<NodeId>();
  while (pending.length) {
    const p = pending.shift()!,
      n = p[p.length - 1];
    if (n === "server") return p;
    if (seen.has(n)) continue;
    seen.add(n);
    for (const l of s.links)
      if (l.includes(n)) pending.push([...p, l[0] === n ? l[1] : l[0]]);
  }
  return [];
}
const phase = (s: State, p: Phase): State => ({
  ...s,
  phase: p,
  phaseTime: 0,
  message: "",
});
export function connect(s: State, a: NodeId, b: NodeId): State {
  if (s.phase === "complete" || a === b || has(s, a, b)) return s;
  if (
    (a === "branch" || b === "branch") &&
    ["hq", "server", "observe"].includes(s.phase)
  )
    return s;
  const valid =
    a === "router" ||
    b === "router" ||
    ([a, b].includes("branch") && [a, b].includes("hq"));
  if (!valid)
    return {
      ...s,
      message:
        "Hubungkan office melalui Router-A. Server hanya menerima link dari router.",
    };
  let n = {
    ...s,
    links: [...s.links, [a, b] as Link],
    message: "Link terpasang.",
  };
  if (n.phase === "hq" && has(n, "hq", "router")) n = phase(n, "server");
  if (n.phase === "server" && route(n, "hq").length) n = phase(n, "observe");
  if (n.phase === "branch" && route(n, "branch").length) n = phase(n, "normal");
  return n;
}
export function upgrade(s: State): State {
  return s.phase === "rush" && !s.upgraded && s.budget >= LEVEL.upgradeCost
    ? phase(
        { ...s, upgraded: true, budget: s.budget - LEVEL.upgradeCost },
        "recover",
      )
    : s;
}
export function demand(s: State) {
  const rush = ["rush", "recover", "complete"].includes(s.phase);
  return { hq: rush ? 90 : 38, branch: rush ? 70 : 24 };
}
export function tick(s: State, dt: number): State {
  if (s.phase === "complete" || dt <= 0) return s;
  let n = { ...s, time: s.time + dt, phaseTime: s.phaseTime + dt };
  const rates = demand(s);
  let incoming = 0;
  for (const id of ["hq", "branch"] as const)
    if (route(s, id).length) incoming += rates[id];
  const cap = s.upgraded ? LEVEL.upgradeCapacity : LEVEL.capacity;
  const available = s.queue + incoming * dt,
    served = Math.min(available, cap * dt),
    remaining = available - served;
  const dropped = Math.max(0, remaining - LEVEL.queueMax);
  n.queue = Math.min(LEVEL.queueMax, remaining);
  // A shared fluid queue: retain each office's contribution across ticks.
  n.sources = { ...s.sources };
  for (const id of ["hq", "branch"] as const) {
    const contribution =
      s.sources[id].queue + (route(s, id).length ? rates[id] * dt : 0);
    const share = available ? contribution / available : 0;
    n.sources[id] = {
      served: s.sources[id].served + served * share,
      queue: n.queue * share,
      loss: route(s, id).length
        ? ((dropped * share) / (rates[id] * dt)) * 100
        : 0,
    };
  }
  n.load = (incoming / cap) * 100;
  n.peak = Math.max(s.peak, n.load);
  n.served += served;
  n.dropped += dropped;
  n.total += incoming * dt;
  n.loss = incoming ? (dropped / (incoming * dt)) * 100 : 0;
  n.latency = incoming ? 18 + (n.queue / cap) * 1000 : 0;
  // Availability measures reachable services, independently from congestion loss.
  n.uptime = route(s, "hq").length ? 100 : 0;
  if (n.phase === "observe" && n.phaseTime >= LEVEL.observe)
    n = phase(n, "branch");
  if (n.phase === "normal" && n.phaseTime >= LEVEL.normal) n = phase(n, "rush");
  if (n.phase === "recover") {
    n.stable =
      n.loss <= 1 && n.latency < 50 && n.uptime >= 99 ? n.stable + dt : 0;
    if (n.stable >= LEVEL.stable) n = phase(n, "complete");
  }
  return n;
}

export function nodeStats(s: State, id: NodeId) {
  const office = id === "hq" || id === "branch";
  const connected = office
    ? route(s, id).length > 0
    : id === "router"
      ? route(s, "router").length > 0
      : s.links.some((l) => l.includes("server"));
  const incoming = (["hq", "branch"] as const).reduce(
    (sum, key) => sum + (route(s, key).length ? demand(s)[key] : 0),
    0,
  );
  const active = connected && (office || incoming > 0);
  return {
    connected,
    uptime: connected ? 100 : 0,
    latency: active ? s.latency : null,
    loss: active ? (office ? s.sources[id].loss : s.loss) : null,
    served: office ? s.sources[id].served : s.served,
    rate: office ? demand(s)[id] : incoming,
    scope: office
      ? "Request dari office ini ke App Server. Uptime menunjukkan koneksi layanan saat ini."
      : "Gabungan traffic Office HQ dan Branch Office. Uptime menunjukkan koneksi layanan saat ini.",
  };
}
