import {
  MAP,
  nodes,
  offices,
  routers,
  type NodeId,
  type OfficeId,
  type RouterId,
} from "./map";
export {
  MAP,
  nodes,
  offices,
  routers,
  type NodeId,
  type OfficeId,
  type RouterId,
} from "./map";
export type Link = [NodeId, NodeId];
export type Phase = "running" | "complete" | "failed";
export interface State {
  version: 2;
  seed: number;
  phase: Phase;
  time: number;
  links: Link[];
  upgraded: Record<RouterId, boolean>;
  budget: number;
  repaired: boolean;
  sources: Record<OfficeId, { queue: number; served: number; dropped: number }>;
  served: number;
  dropped: number;
  total: number;
  loss: number;
  latency: number;
  uptime: number;
  onlineTime: number;
  measuredTime: number;
  badTime: number;
  stable: number;
  incidentSeconds: number;
  message: string;
  tutorial: boolean;
}
export const initial = (seed = 1, tutorial = true): State => ({
  version: 2,
  seed: seed >>> 0,
  phase: "running",
  time: 0,
  links: [],
  upgraded: { router: false, backup: false },
  budget: MAP.budget,
  repaired: false,
  sources: {
    hq: { queue: 0, served: 0, dropped: 0 },
    branch: { queue: 0, served: 0, dropped: 0 },
    studio: { queue: 0, served: 0, dropped: 0 },
  },
  served: 0,
  dropped: 0,
  total: 0,
  loss: 0,
  latency: 0,
  uptime: 100,
  onlineTime: 0,
  measuredTime: 0,
  badTime: 0,
  stable: 0,
  incidentSeconds: 0,
  message: "",
  tutorial,
});
export const active = (s: State, id: NodeId) =>
  nodes.some((n) => n.id === id && n.unlock <= s.time);
export const linkKey = (a: NodeId, b: NodeId) => [a, b].sort().join(":");
export const has = (s: State, a: NodeId, b: NodeId) =>
  s.links.some((l) => linkKey(...l) === linkKey(a, b));
export const legal = (a: NodeId, b: NodeId) =>
  a !== b &&
  nodes.some((n) => n.id === a) &&
  nodes.some((n) => n.id === b) &&
  (routers.includes(a as RouterId) || routers.includes(b as RouterId));
export const broken = (s: State, a: NodeId, b: NodeId) =>
  s.time >= MAP.outageAt &&
  !s.repaired &&
  linkKey(a, b) === linkKey("router", "server");
export function route(s: State, start: NodeId): NodeId[] {
  if (!active(s, start)) return [];
  const pending: NodeId[][] = [[start]],
    seen = new Set<NodeId>();
  while (pending.length) {
    const path = pending.shift()!,
      end = path[path.length - 1];
    if (end === "server") return path;
    if (seen.has(end)) continue;
    seen.add(end);
    if (end !== start && !routers.includes(end as RouterId)) continue;
    const neighbors = s.links
      .filter((l) => l.includes(end) && !broken(s, ...l))
      .map((l) => (l[0] === end ? l[1] : l[0]))
      .sort();
    for (const id of neighbors)
      if (active(s, id) && !seen.has(id)) pending.push([...path, id]);
  }
  return [];
}
export function connect(s: State, a: NodeId, b: NodeId): State {
  if (s.phase !== "running") return s;
  const reason = !legal(a, b)
    ? "Koneksi harus melalui router. Office tidak meneruskan traffic."
    : !active(s, a) || !active(s, b)
      ? "Node belum aktif."
      : has(s, a, b)
        ? "Koneksi ini sudah ada."
        : s.budget < MAP.linkCost
          ? "Budget tidak cukup untuk koneksi baru."
          : "";
  if (reason) return { ...s, message: reason };
  return {
    ...s,
    links: [...s.links, [a, b]],
    budget: s.budget - MAP.linkCost,
    message: "Koneksi terpasang. Biaya 40 kredit.",
  };
}
export function disconnect(s: State, a: NodeId, b: NodeId): State {
  if (s.phase !== "running" || !has(s, a, b)) return s;
  return {
    ...s,
    links: s.links.filter((l) => linkKey(...l) !== linkKey(a, b)),
    budget: s.budget + MAP.refund,
    message: "Koneksi dilepas. Pengembalian 20 kredit.",
  };
}
export function upgrade(s: State, id: RouterId = "router"): State {
  if (
    s.phase !== "running" ||
    !routers.includes(id) ||
    !active(s, id) ||
    s.upgraded[id]
  )
    return s;
  if (s.budget < MAP.upgradeCost)
    return { ...s, message: "Budget upgrade tidak cukup." };
  return {
    ...s,
    upgraded: { ...s.upgraded, [id]: true },
    budget: s.budget - MAP.upgradeCost,
    message: "Kapasitas router meningkat menjadi 260 req/s.",
  };
}
export function repair(s: State): State {
  if (s.phase !== "running" || s.time < MAP.outageAt || s.repaired) return s;
  if (s.budget < MAP.repairCost)
    return {
      ...s,
      message: "Budget perbaikan tidak cukup. Coba jalur melalui Router B.",
    };
  return {
    ...s,
    repaired: true,
    budget: s.budget - MAP.repairCost,
    message:
      "Jalur Router A–Server pulih. Koneksi yang dilepas perlu dibuat kembali.",
  };
}
export const capacity = (s: State, id: RouterId) =>
  s.upgraded[id] ? MAP.upgradedCapacity : MAP.capacity;
export function demand(s: State): Record<OfficeId, number> {
  // Stateless seeded variation: repeatable across save/resume and frame rates.
  let hash = (s.seed ^ Math.floor(s.time / 15)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
  const variation = 0.96 + (hash % 9) / 100;
  const base =
    s.time >= MAP.finalRushAt
      ? [88, 74, 60]
      : s.time >= MAP.rushAt
        ? [82, 66, 54]
        : [38, 30, 24];
  return Object.fromEntries(
    offices.map((id, i) => [id, active(s, id) ? base[i] * variation : 0]),
  ) as Record<OfficeId, number>;
}
export function routerLoad(s: State, id: RouterId) {
  const rates = demand(s);
  return (
    (offices.reduce(
      (sum, o) => sum + (route(s, o).includes(id) ? rates[o] : 0),
      0,
    ) /
      capacity(s, id)) *
    100
  );
}
export const stage = (s: State) =>
  s.time < 90
    ? "Orientasi"
    : s.time < 240
      ? "Ekspansi"
      : s.time < 360
        ? "Jam sibuk"
        : s.time < 390
          ? "Peringatan jalur"
          : s.time < 480
            ? "Pemulihan"
            : "Penutupan shift";
export function objective(s: State) {
  if (s.phase === "complete")
    return "Shift selesai. Semua kantor mendapat layanan yang stabil.";
  if (s.phase === "failed") return s.message;
  if (s.time < 75 && !route(s, "hq").length)
    return "Hubungkan Kantor HQ → Router A → App Server. Pilih node, lalu pilih Sambungkan atau tarik ke tujuan.";
  if (s.time >= 360 && s.time < 390)
    return "Jalur Router A–Server akan terganggu pada 06:30. Siapkan Router B atau sisakan 120 kredit untuk perbaikan.";
  if (
    s.time >= 390 &&
    !s.repaired &&
    offices.some((id) => !route(s, id).length)
  )
    return "Jalur Router A–Server terganggu. Alihkan lewat Router B atau perbaiki jalur (120 kredit).";
  if (offices.some((id) => active(s, id) && !route(s, id).length))
    return "Ada kantor belum tersambung. Hubungkan ke router yang memiliki jalur menuju server.";
  if (s.loss > 1 || s.latency >= 50)
    return "Traffic menumpuk. Tingkatkan kapasitas atau bagi beban ke Router B.";
  if (s.time >= 390 && !s.repaired)
    return "Jalur cadangan menjaga layanan tetap online. Perbaikan jalur A–Server bersifat opsional; pertahankan kualitas sampai akhir shift.";
  return "Jaga latency <50 ms dan loss ≤1%. Akhiri shift dengan layanan stabil selama 20 detik dan uptime ≥90%.";
}
export function tick(s: State, dt: number = MAP.step): State {
  if (s.phase !== "running" || !Number.isFinite(dt) || dt <= 0) return s;
  dt = Math.min(dt, MAP.step, MAP.duration - s.time);
  const n: State = {
    ...s,
    time: Math.round((s.time + dt) * 1e6) / 1e6,
    sources: { ...s.sources },
  };
  const rates = demand(s),
    paths = Object.fromEntries(
      offices.map((id) => [id, route(s, id)]),
    ) as Record<OfficeId, NodeId[]>;
  const available = Object.fromEntries(
    offices.map((id) => [id, s.sources[id].queue + rates[id] * dt]),
  ) as Record<OfficeId, number>;
  const ratios = Object.fromEntries(
    routers.map((id) => {
      const offered = offices.reduce(
        (sum, office) =>
          sum + (paths[office].includes(id) ? available[office] : 0),
        0,
      );
      return [id, offered ? Math.min(1, (capacity(s, id) * dt) / offered) : 1];
    }),
  ) as Record<RouterId, number>;
  let newServed = 0,
    newDropped = 0,
    latency = 18,
    incoming = 0;
  for (const id of offices) {
    if (!active(s, id)) continue;
    incoming += rates[id] * dt;
    const path = paths[id],
      reachable = path.length > 0;
    const pathRouters = routers.filter((r) => path.includes(r));
    const served = reachable
      ? available[id] * Math.min(1, ...pathRouters.map((r) => ratios[r]))
      : 0;
    const queue = reachable
      ? Math.min(MAP.queueMax, Math.max(0, available[id] - served))
      : 0;
    const dropped = Math.max(0, available[id] - served - queue);
    const source = s.sources[id];
    n.sources[id] = {
      queue,
      served: source.served + served,
      dropped: source.dropped + dropped,
    };
    newServed += served;
    newDropped += dropped;
    if (queue)
      latency = Math.max(
        latency,
        18 + (queue / Math.max(served / dt, 1)) * 1000,
      );
  }
  n.total += incoming;
  n.served += newServed;
  n.dropped += newDropped;
  n.loss = incoming ? Math.min(100, (newDropped / incoming) * 100) : 0;
  n.latency = latency;
  const eligible = offices.filter(
    (id) =>
      s.time >=
      Math.max(75, nodes.find((v) => v.id === id)!.unlock + MAP.grace),
  );
  const online = eligible.filter((id) => paths[id].length).length;
  n.measuredTime += eligible.length * dt;
  n.onlineTime += online * dt;
  n.uptime = n.measuredTime ? (n.onlineTime / n.measuredTime) * 100 : 100;
  const grace =
    s.time < 75 ||
    nodes.some(
      (v) =>
        v.kind === "office" &&
        s.time >= v.unlock &&
        s.time < v.unlock + MAP.grace,
    );
  const allOnline = offices
    .filter((id) => active(s, id))
    .every((id) => paths[id].length);
  const unhealthy = !allOnline || n.loss > 8 || n.latency > 250;
  n.badTime = !grace && unhealthy ? s.badTime + dt : 0;
  n.stable = allOnline && n.loss <= 1 && n.latency < 50 ? s.stable + dt : 0;
  if (s.time >= MAP.outageAt && !allOnline) n.incidentSeconds += dt;
  if (n.badTime >= MAP.failureAfter) {
    n.phase = "failed";
    n.message =
      "Layanan terganggu selama 45 detik berturut-turut. Siapkan kapasitas dan jalur pemulihan lebih awal.";
  } else if (n.time >= MAP.duration) {
    n.phase = n.uptime >= 90 && n.stable >= 20 ? "complete" : "failed";
    n.message =
      n.phase === "failed"
        ? "Shift berakhir sebelum target tercapai. Butuh uptime ≥90% dan 20 detik terakhir yang stabil."
        : "";
  }
  return n;
}
