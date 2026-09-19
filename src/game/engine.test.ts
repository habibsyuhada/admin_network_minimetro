import { describe, expect, it } from "vitest";
import {
  initial,
  tick,
  connect,
  disconnect,
  upgrade,
  repair,
  route,
  capacity,
  offices,
  MAP,
  type State,
} from "./engine";
import { validRun, score } from "./storage";
const advance = (s: State, seconds: number) => {
  for (let i = 0; i < seconds * 10; i++) s = tick(s);
  return s;
};
const start = (seed = 1) =>
  connect(connect(initial(seed), "hq", "router"), "router", "server");
export function playShift(strategy: "repair" | "backup", seed = 1) {
  let s = start(seed);
  s = advance(s, 90);
  s = connect(s, "branch", "router");
  s = advance(s, 90);
  s = connect(s, "studio", strategy === "backup" ? "backup" : "router");
  if (strategy === "backup") s = connect(s, "backup", "server");
  s = upgrade(s);
  s = advance(s, 180);
  if (strategy === "backup") {
    s = connect(s, "router", "backup");
    s = upgrade(s, "backup");
  }
  s = advance(s, 32);
  if (strategy === "repair") s = repair(s);
  s = advance(s, 208);
  return s;
}
describe("HQ District", () => {
  it.each(["repair", "backup"] as const)(
    "completes all 600 seconds using %s with legal persisted states",
    (strategy) => {
      for (const seed of [1, 9, 42, 2026, 0xffffffff]) {
        const s = playShift(strategy, seed);
        expect(s.phase).toBe("complete");
        expect(s.time).toBe(600);
        expect(validRun(s)).toBe(true);
        expect(s.budget).toBeGreaterThanOrEqual(0);
        expect(s.uptime).toBeGreaterThan(99);
        expect(
          s.served +
            s.dropped +
            offices.reduce((sum, id) => sum + s.sources[id].queue, 0),
        ).toBeCloseTo(s.total, 5);
        expect(score(s)).toBeGreaterThan(7000);
        expect(tick(s)).toBe(s);
        expect(connect(s, "hq", "backup")).toBe(s);
      }
    },
  );
  it("rejects illegal, duplicate, hidden and unaffordable links without charging", () => {
    const s = initial();
    expect(connect(s, "hq", "server").budget).toBe(1000);
    expect(connect(s, "hq", "branch").links).toHaveLength(0);
    expect(connect(s, "hq", "backup").links).toHaveLength(0);
    const linked = connect(s, "hq", "router");
    expect(connect(linked, "router", "hq").budget).toBe(960);
    expect(connect({ ...s, budget: 39 }, "hq", "router").links).toHaveLength(0);
    expect(disconnect(linked, "router", "hq").budget).toBe(980);
    expect(disconnect(s, "hq", "router").budget).toBe(1000);
  });
  it("does not route transit traffic through offices and is insertion-order independent", () => {
    const s = {
      ...initial(),
      time: 180,
      links: [
        ["hq", "router"],
        ["hq", "backup"],
        ["backup", "server"],
      ],
    } as State;
    expect(route(s, "router")).toEqual([]);
    const n = connect(s, "router", "backup");
    expect(route(n, "router")).toEqual(["router", "backup", "server"]);
    expect(route({ ...n, links: [...n.links].reverse() }, "hq")).toEqual(
      route(n, "hq"),
    );
  });
  it("limits throughput at every router on a path and conserves dropped traffic", () => {
    let s = { ...initial(), time: 250 };
    s = connect(
      connect(
        connect(connect(s, "hq", "router"), "branch", "router"),
        "studio",
        "router",
      ),
      "router",
      "backup",
    );
    s = connect(s, "backup", "server");
    s = upgrade(s, "router");
    const n = advance(s, 5);
    expect(n.served - s.served).toBeCloseTo(capacity(s, "backup") * 5, 5);
    expect(n.loss).toBeGreaterThan(1);
    const recovered = advance(upgrade(n, "backup"), 10);
    expect(recovered.loss).toBe(0);
    expect(recovered.latency).toBe(18);
    expect(
      recovered.served +
        recovered.dropped +
        offices.reduce((sum, id) => sum + recovered.sources[id].queue, 0),
    ).toBeCloseTo(recovered.total, 5);
  });
  it("warns before outage, excludes failed links, and charges repair once", () => {
    const s = { ...start(), time: 390 };
    expect(route(s, "hq")).toEqual([]);
    const fixed = repair(s);
    expect(route(fixed, "hq")).toEqual(["hq", "router", "server"]);
    expect(fixed.budget).toBe(s.budget - 120);
    expect(repair(fixed)).toBe(fixed);
    expect(repair({ ...s, budget: 119 }).repaired).toBe(false);
  });
  it("ends sustained outage after the visible tolerance and freezes the result", () => {
    let s = { ...start(), time: 250 };
    s = advance(s, 46);
    expect(s.phase).toBe("failed");
    expect(s.badTime).toBeGreaterThanOrEqual(MAP.failureAfter);
    expect(tick(s)).toBe(s);
    expect(upgrade(s)).toBe(s);
  });
  it("resets failure countdown after recovery and measures historic availability", () => {
    let s = { ...start(), time: 250 };
    s = advance(s, 10);
    expect(s.badTime).toBeGreaterThan(9);
    expect(s.uptime).toBeLessThan(40);
    s = upgrade(connect(connect(s, "branch", "router"), "studio", "router"));
    s = advance(s, 10);
    expect(s.badTime).toBe(0);
    expect(s.uptime).toBeGreaterThan(60);
    expect(s.uptime).toBeLessThan(100);
  });
  it("refuses invalid elapsed time and never simulates a large wall-clock jump", () => {
    const s = start();
    expect(tick(s, NaN)).toBe(s);
    expect(tick(s, -1)).toBe(s);
    expect(tick(s, Infinity)).toBe(s);
    expect(tick(s, 100).time).toBe(0.1);
  });
  it("requires a stable finish and sufficient historic uptime", () => {
    let s = playShift("repair");
    s = { ...s, time: 599.9, phase: "running", stable: 0 };
    expect(tick(s).phase).toBe("failed");
    expect(tick({ ...s, stable: 30, onlineTime: 0 }).phase).toBe("failed");
  });
});
