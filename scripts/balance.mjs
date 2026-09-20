import fs from "node:fs";
import ts from "typescript";
import { pathToFileURL } from "node:url";
let source = fs.readFileSync(
  new URL("../src/game/metro.ts", import.meta.url),
  "utf8",
);
if (process.env.BALANCE_TRIAL) {
  const tune = JSON.parse(process.env.BALANCE_TRIAL);
  for (const [from, to] of Object.entries(tune))
    source = source.replaceAll(from, to);
}
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
let linked = compiled;
for (const name of ["levels", "items", "environment"]) {
  const text = fs.readFileSync(
    new URL(`../src/game/${name}.ts`, import.meta.url),
    "utf8",
  );
  const js = ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  linked = linked.replaceAll(
    `"./${name}"`,
    JSON.stringify(
      "data:text/javascript;base64," + Buffer.from(js).toString("base64"),
    ),
  );
}
export const g = await import(
  "data:text/javascript;base64," + Buffer.from(linked).toString("base64")
);
export function play(seed, strategy = "adaptive", levelId) {
  let s = g.newMetro(seed, levelId),
    actions = [],
    reports = [],
    peak = 0,
    maxWait = 0;
  const act = (type, args, next) => {
    if (next !== s) {
      actions.push({ time: s.time, type, args });
      s = next;
      return true;
    }
    return false;
  };
  const ports = (id) => s.cables.filter((c) => c.stops.includes(id)).length;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const link = (a, b, trunk = false) => {
    let kind =
      strategy === "cheap"
        ? 0
        : trunk
          ? 2
          : dist(s.nodes[a], s.nodes[b]) > 280
            ? 1
            : 0;
    if (s.gold < g.CABLE_TYPES[kind].cost) kind = 0;
    return act("connect", [kind, a, b], g.connectCable(s, kind, a, b));
  };
  const build = () => {
    for (let id = 0; id < s.nodes.length; id++) {
      if (g.isTransit(s.nodes[id].shape) || ports(id)) continue;
      const n = s.nodes[id];
      const routers = s.nodes
        .map((n, i) => ({ n, i }))
        .filter(({ n, i }) => g.isTransit(n.shape) && ports(i) < 7)
        .sort((a, b) => dist(a.n, n) - dist(b.n, n));
      let near = routers[0]?.i;
      if (
        near === undefined ||
        (dist(s.nodes[near], n) > 380 && s.gold >= 600)
      ) {
        const candidates = [];
        if (near === undefined) candidates.push({ x: 200, y: 280 });
        for (let r of [100, 150, 210])
          for (let a = 0; a < 12; a++)
            candidates.push({
              x: n.x + Math.cos((a * Math.PI) / 6) * r,
              y: n.y + Math.sin((a * Math.PI) / 6) * r,
            });
        candidates.sort((a, b) =>
          near === undefined
            ? dist(a, { x: 200, y: 280 }) - dist(b, { x: 200, y: 280 })
            : dist(a, s.nodes[near]) - dist(b, s.nodes[near]),
        );
        const p = candidates.find((p) => !g.routerError(s, p.x, p.y));
        if (p && s.gold >= (near === undefined ? 250 : 600)) {
          const old = near;
          if (act("place", [p.x, p.y, 3], g.placeRouter(s, p.x, p.y))) {
            near = s.nodes.length - 1;
            if (old !== undefined) link(near, old, true);
          }
        }
      }
      if (near !== undefined) link(id, near);
    }
    if (strategy === "adaptive") {
      for (const c of s.cables) {
        if (c.kind === 2 || s.gold < 750) continue;
        const [a, b] = c.stops;
        const pressure =
          s.queues[a].filter((p) => g.routeCable(s, a, p.service) === c.id)
            .length +
          s.queues[b].filter((p) => g.routeCable(s, b, p.service) === c.id)
            .length;
        if (pressure >= 6) act("change", [c.id, 2], g.changeCable(s, c.id, 2));
      }
    }
  };
  while (s.time < 720 && s.phase !== "over" && s.phase !== "complete") {
    if (s.phase === "reward") {
      reports.push({
        month: s.month,
        gold: s.gold,
        ...s.report,
        delivered: s.delivered,
        nodes: s.spawned,
        waiting: s.queues.flat().length,
        peak,
        maxWait,
      });
      if (s.month === 12) break;
      if (strategy !== "cheap" && s.gold > 1000) {
        const target = s.nodes.findIndex(
          (n) =>
            g.isTransit(n.shape) &&
            g.itemSlots(n) > (n.items?.length ?? 0) &&
            !g.hasItem(n, "bandwidth"),
        );
        if (target >= 0 && g.monthlyItems(s).includes("bandwidth"))
          act("buy", ["bandwidth"], g.buyItem(s, "bandwidth"));
      }
      act("reward", ["continue"], g.reward(s));
      for (const key of [...s.inventory]) {
        const id = s.nodes.findIndex(
          (n) =>
            g.itemAllowed(n, key) &&
            g.itemSlots(n) > (n.items?.length ?? 0) &&
            !g.hasItem(n, key),
        );
        if (id >= 0) act("equip", [id, key], g.installItem(s, id, key));
      }
    }
    if (Math.round(s.time * 10) % 10 === 0) build();
    s = g.metroTick(s);
    peak = Math.max(peak, ...s.queues.map((q) => q.length));
    maxWait = Math.max(maxWait, ...s.overload);
  }
  if (
    (s.phase === "reward" || s.phase === "complete") &&
    !reports.some((r) => r.month === s.month)
  )
    reports.push({
      month: s.month,
      gold: s.gold,
      ...s.report,
      delivered: s.delivered,
      nodes: s.spawned,
      waiting: s.queues.flat().length,
      peak,
      maxWait,
    });
  return {
    seed,
    strategy,
    month: s.month,
    time: s.time,
    phase: s.phase,
    gold: s.gold,
    delivered: s.delivered,
    waiting: s.queues.flat().length,
    peak,
    maxWait,
    nodes: s.spawned,
    routers: s.nodes.length - s.spawned,
    bottleneck: s.nodes[s.overload.indexOf(Math.max(...s.overload))],
    reports,
    actions,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const results = [];
  for (const strategy of ["cheap", "adaptive"])
    for (const seed of process.env.BALANCE_SEEDS
      ? process.env.BALANCE_SEEDS.split(",").map(Number)
      : [42, 123, 987, 2026, 45678]) {
      const r = play(seed, strategy);
      results.push(r);
      console.log(
        JSON.stringify({ ...r, reports: undefined, actions: undefined }),
      );
    }
  fs.writeFileSync(
    process.argv[2] || "docs/balance/latest.json",
    JSON.stringify(results, null, 2),
  );
}
