import { describe, it, expect } from "vitest";
import { nodeStats } from "./engine";
import { connect, initial, tick, upgrade, route, type State } from "./engine";
const advance = (s: State, seconds: number) => {
  for (let i = 0; i < seconds * 10; i++) s = tick(s, 0.1);
  return s;
};
const start = () =>
  connect(connect(initial(), "hq", "router"), "router", "server");
describe("Level 1", () => {
  it("keeps office totals separate when a new office joins and during congestion", () => {
    let s = advance(start(), 26);
    const hqBefore = s.served;
    expect(nodeStats(s, "branch").served).toBe(0);
    expect(nodeStats(s, "branch").uptime).toBe(0);
    s = connect(s, "branch", "router");
    s = advance(s, 1);
    expect(nodeStats(s, "hq").served).toBeCloseTo(hqBefore + 38);
    expect(nodeStats(s, "branch").served).toBeCloseTo(24);
    s = advance(s, 25);
    expect(s.sources.hq.served + s.sources.branch.served).toBeCloseTo(s.served);
    expect(s.sources.hq.queue + s.sources.branch.queue).toBeCloseTo(s.queue);
    expect(nodeStats(s, "router").served).toBeCloseTo(s.served);
    expect(nodeStats(s, "server").served).toBeCloseTo(s.served);
    s = advance(upgrade(s), 22);
    expect(s.sources.hq.served + s.sources.branch.served).toBeCloseTo(s.served);
    expect(s.sources.hq.queue + s.sources.branch.queue).toBe(0);
  });
  it("rejects bypass, hidden branch and duplicate links", () => {
    let s = initial();
    expect(connect(s, "hq", "server").links).toHaveLength(0);
    expect(connect(s, "branch", "router").links).toHaveLength(0);
    s = connect(s, "hq", "router");
    expect(connect(s, "router", "hq").links).toHaveLength(1);
  });
  it("supports reverse setup order and only serves reachable sources", () => {
    let s = connect(initial(), "server", "router");
    s = advance(s, 2);
    expect(s.served).toBe(0);
    s = connect(s, "router", "hq");
    expect(s.phase).toBe("observe");
    s = advance(s, 1);
    expect(s.served).toBeCloseTo(38);
    expect(s.latency).toBe(18);
  });
  it("routes the branch through HQ without looping", () => {
    let s = advance(start(), 26);
    s = connect(s, "branch", "hq");
    expect(route(s, "branch")).toEqual(["branch", "hq", "router", "server"]);
    s = connect(s, "branch", "router");
    expect(route(s, "branch")).toEqual(["branch", "router", "server"]);
  });
  it("runs congestion, packet loss, upgrade and stable completion", () => {
    let s = start();
    s = advance(s, 26);
    expect(s.phase).toBe("branch");
    s = connect(s, "branch", "router");
    s = advance(s, 25);
    expect(s.phase).toBe("rush");
    expect(s.queue).toBe(80);
    expect(s.loss).toBeGreaterThan(1);
    expect(s.latency).toBeGreaterThan(50);
    expect(s.load).toBe(160);
    const conserved = s.served + s.dropped + s.queue;
    expect(conserved).toBeCloseTo(s.total, 5);
    expect(advance(s, 30).phase).toBe("rush");
    s = upgrade(s);
    expect(s.budget).toBe(200);
    expect(upgrade(s).budget).toBe(200);
    s = advance(s, 1);
    expect(s.queue).toBe(0);
    expect(s.loss).toBe(0);
    expect(s.phase).toBe("recover");
    s = advance(s, 21);
    expect(s.phase).toBe("complete");
    expect(tick(s, 10)).toEqual(s);
  });
  it("does not allow early upgrades or premature recovery completion", () => {
    expect(upgrade(initial()).upgraded).toBe(false);
    let s: State = {
      ...start(),
      phase: "recover" as const,
      upgraded: true,
      queue: 80,
    };
    s = tick(s, 0.1);
    expect(s.stable).toBe(0);
    expect(s.phase).toBe("recover");
  });
});
