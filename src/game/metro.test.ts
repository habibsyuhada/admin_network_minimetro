import { describe, expect, it } from "vitest";
import {
  SITES,
  changeCable,
  cableChangeCost,
  upgradeCost,
  cableMaintenance,
  nodeService,
  moveTransit,
  sellTransit,
  nodeRefund,
  CLIENT_VARIANTS,
  SERVICES,
  MAX_ENDPOINTS,
  TRANSIT,
  nodeBuffer,
  maintenanceDue,
  maintenanceRate,
  placeRouter,
  routerError,
  cableCapacity,
  connectCable,
  connectionError,
  metroTick,
  newMetro,
  removeCable,
  reward,
  routeCable,
  type Metro,
} from "./metro";
const count = (s: Metro) =>
  s.delivered +
  s.queues.flat().length +
  s.cables.flatMap((c) => c.cargo).length;
const steps = (s: Metro, n: number) => {
  for (let i = 0; i < n; i++) s = metroTick(s);
  return s;
};
const junctions = (...ids: number[]) => {
  const s = newMetro(42);
  s.gold = 5000;
  for (const id of ids) s.nodes[id].shape = 3;
  return s;
};
describe("point-to-point cable transport", () => {
  it("gives every cable its own carrier with exactly two endpoints", () => {
    let s = connectCable(connectCable(junctions(1), 0, 0, 1), 0, 1, 2);
    expect(s.cables.map((c) => c.stops)).toEqual([
      [0, 1],
      [1, 2],
    ]);
    s = steps(s, 15);
    expect(s.cables.every((c) => c.progress > 0)).toBe(true);
    expect(s.cables[0].progress).not.toEqual(s.cables[1].progress);
    expect(s.cables.map((c) => c.at)).toEqual([0, 0]);
  });
  it("waits for a carrier and respects each cable's capacity", () => {
    for (const kind of [0, 1, 2] as const) {
      let s = connectCable(newMetro(42), kind, 0, 1);
      s.queues[0] = Array.from({ length: 12 }, () => ({ service: 1 }));
      s = metroTick(s);
      expect(s.cables[0].cargo).toHaveLength(0);
      expect(s.delivered).toBe(0);
      s = steps(s, 3);
      expect(s.cables[0].cargo).toHaveLength(cableCapacity(s, kind));
      expect(s.queues[0]).toHaveLength(12 - cableCapacity(s, kind));
      expect(count(s)).toBe(12);
    }
  });
  it("unloads at a transfer node and waits for the next cable's carrier", () => {
    let s = connectCable(connectCable(junctions(1), 0, 0, 1), 0, 1, 2);
    s.cables[0].cargo = [{ service: 2 }];
    s.cables[0].progress = 0.99;
    s.cables[0].wait = 0;
    s.cables[1].at = 1;
    s.cables[1].progress = 0.3;
    s.cables[1].wait = 0;
    s = metroTick(s);
    expect(s.queues[1]).toEqual([{ service: 2 }]);
    expect(s.cables[1].cargo).toEqual([]);
    expect(s.delivered).toBe(0);
    s = steps(s, 120);
    expect(s.delivered).toBeGreaterThan(0);
  });
  it("transports traffic in both directions on the same cable", () => {
    let s = connectCable(newMetro(42), 0, 0, 1);
    s.speedBonus = 300;
    s.queues[0] = [{ service: 1 }];
    s.queues[1] = [{ service: 0 }];
    s = steps(s, 28);
    expect(s.delivered).toBe(2);
    expect(count(s)).toBe(2);
    expect(s.cables[0].stops).toEqual([0, 1]);
  });
  it("routes automatically by time and changes preference under queue pressure", () => {
    let s = connectCable(connectCable(junctions(0, 1), 1, 0, 1), 2, 0, 1);
    s = connectCable(s, 0, 1, 2);
    s.queues[0] = [{ service: 2 }];
    expect(routeCable(s, 0, 2)).toBe(s.cables[0].id);
    s.queues[0] = Array.from({ length: 50 }, () => ({ service: 2 }));
    expect(routeCable(s, 0, 2)).toBe(s.cables[1].id);
    expect(routeCable(s, 0, 1)).toBeNull();
  });
  it("finds multihop services and reroutes after a cable is removed", () => {
    let s = placeRouter(junctions(0, 1), 200, 300);
    s = connectCable(
      connectCable(connectCable(connectCable(s, 0, 0, 1), 0, 1, 3), 1, 0, 3),
      0,
      3,
      2,
    );
    expect(routeCable(s, 0, 2)).toBe(s.cables[2].id);
    s = removeCable(s, s.cables[2].id);
    expect(routeCable(s, 0, 2)).toBe(s.cables[0].id);
  });
  it("removing an in-flight cable refunds the full price and returns all cargo to its departure node", () => {
    let s = connectCable(connectCable(junctions(1), 0, 0, 1), 1, 1, 2);
    s.queues[0] = [{ service: 2 }, { service: 2 }];
    s = steps(s, 12);
    const original = s;
    expect(s.cables[0].cargo.length).toBe(2);
    s = removeCable(s, s.cables[0].id);
    expect(count(s)).toBe(count(original));
    expect(s.queues[0]).toEqual([{ service: 2 }, { service: 2 }]);
    expect(s.gold).toBe(original.gold + 100);
    expect(s.cables).toHaveLength(1);
    expect(s.cables[0]).toBe(original.cables[1]);
  });
  it("rejects full endpoint ports, self-links, inactive nodes and insufficient gold", () => {
    let s = connectCable(newMetro(42), 0, 0, 1);
    expect(connectCable(s, 0, 1, 0)).toBe(s);
    expect(connectCable(s, 0, 1, 1)).toBe(s);
    expect(connectCable(s, 0, 1, 10)).toBe(s);
    expect(connectCable(s, 0, 1, 1.5)).toBe(s);
    expect(connectCable({ ...s, gold: 0 }, 1, 1, 2).cables).toBe(s.cables);
    s = { ...s, phase: "over" };
    expect(connectionError(s, 0, 1, 2)).not.toBeNull();
    expect(removeCable(s, 1)).toBe(s);
  });
  it("settles monthly gold and applies capacity/speed upgrades to cable types", () => {
    let s = newMetro(42);
    s.time = 44.9;
    s = metroTick(s);
    expect(s.queues.length).toBeGreaterThanOrEqual(4);
    s.time = 59.9;
    s = metroTick(s);
    expect(s.phase).toBe("reward");
    expect(metroTick(s)).toBe(s);
    const capacity = reward(s, "capacity");
    expect(capacity.gold).toBe(s.gold - 300);
    expect(cableCapacity(capacity, 2)).toBe(10);
    expect(reward(s, "continue").gold).toBe(s.gold);
    expect(reward(s, "speed").speedBonus).toBe(15);
  });
  it("fails only after sustained overload and recovers when queues shrink", () => {
    let s = newMetro(42);
    s.queues[0] = Array.from({ length: 10 }, () => ({ service: 1 }));
    s.overload[0] = 24.8;
    s = metroTick(s);
    expect(s.phase).toBe("running");
    expect(metroTick({ ...s, queues: [[], [], []] }).overload[0]).toBeLessThan(
      s.overload[0],
    );
    s = steps(s, 2);
    expect(s.phase).toBe("over");
    expect(metroTick(s)).toBe(s);
  });
});

describe("service icon routing", () => {
  it("delivers to any reachable node with the same service icon", () => {
    let s = newMetro(42);
    s.nodes.push({ x: 200, y: 250, shape: 1 });
    s.queues.push([]);
    s.overload.push(0);
    s = connectCable(s, 0, 0, 3);
    expect(routeCable(s, 0, 1)).toBe(s.cables[0].id);
    s.cables[0].cargo = [{ service: 1 }];
    s.cables[0].progress = 0.999;
    s.cables[0].wait = 0;
    s = metroTick(s);
    expect(s.delivered).toBe(1);
    expect(s.queues[3]).toEqual([]);
  });
  it("reroutes to another matching service when one connection is removed", () => {
    let s = junctions(0);
    s.nodes.push({ x: 200, y: 250, shape: 1 });
    s.queues.push([]);
    s.overload.push(0);
    s = connectCable(connectCable(s, 0, 0, 1), 0, 0, 3);
    const path = routeCable(s, 0, 1)!;
    s = removeCable(s, path);
    expect(routeCable(s, 0, 1)).toBe(s.cables[0].id);
    expect(routeCable(s, 0, 5)).toBeNull();
  });
  it("generates requests only for active service types and PC-icon replies", () => {
    let s = newMetro(42);
    s = placeRouter(s, 200, 300, 4);
    for (let i = 0; i < 40; i++) {
      s.time = 2.9;
      s.queues = s.queues.map(() => []);
      s = metroTick(s);
      expect(s.queues[0].every((p) => [1, 2].includes(p.service))).toBe(true);
      expect(s.queues[1].every((p) => p.service === 0)).toBe(true);
      expect(s.queues[2].every((p) => p.service === 0)).toBe(true);
      expect(s.queues[3]).toEqual([]);
    }
  });
});

describe("player-built routers", () => {
  it("uses gold, validates spacing and preserves state on invalid placement", () => {
    const initial = newMetro(42);
    expect(placeRouter(initial, 70, 90)).toBe(initial);
    expect(placeRouter(initial, -10, 300)).toBe(initial);
    expect(placeRouter(initial, NaN, 300)).toBe(initial);
    const s = placeRouter(initial, 200, 300);
    expect(initial.nodes).toHaveLength(3);
    expect(s.nodes[3]).toMatchObject({ x: 200, y: 300, shape: 3 });
    expect(s.gold).toBe(1450);
    expect(s.queues[3]).toEqual([]);
    expect(routerError({ ...s, gold: 0 }, 500, 500)).not.toBeNull();
  });
  it("transfers through a router while keeping the exact service", () => {
    let s = placeRouter(newMetro(42), 200, 300);
    s = connectCable(connectCable(s, 0, 0, 3), 0, 3, 1);
    expect(routeCable(s, 0, 1)).toBe(s.cables[0].id);
    s.cables[0].cargo = [{ service: 1 }];
    s.cables[0].progress = 0.99;
    s.cables[0].wait = 0;
    s = metroTick(s);
    expect(s.queues[3]).toEqual([{ service: 1 }]);
    expect(s.delivered).toBe(0);
    expect(routeCable(s, 3, 1)).toBe(s.cables[1].id);
  });
  it("never generates traffic to or from routers, and spawns automatic nodes independently", () => {
    let s = placeRouter(newMetro(42), 200, 300);
    for (let i = 0; i < 20; i++) {
      s.time = 2.9;
      s.queues = s.queues.map(() => []);
      s = metroTick(s);
      expect(s.queues[3]).toEqual([]);
      expect(s.queues.flat().some((p) => p.service === 3)).toBe(false);
    }
    s.time = 44.9;
    s = metroTick(s);
    expect(s.nodes.length).toBeGreaterThanOrEqual(5);
    expect(s.nodes[3].shape).toBe(3);
    expect([0, ...SERVICES]).toContain(s.nodes[4].shape);
    expect(s.spawned).toBe(s.nodes.length - 1);
    expect(s.queues).toHaveLength(s.nodes.length);
    expect(s.overload).toHaveLength(s.nodes.length);
    expect(reward({ ...s, phase: "reward" }, "continue").gold).toBe(s.gold);
  });
});

describe("gold economy", () => {
  it("settles 500 profit minus 200 maintenance exactly once", () => {
    const before = {
      ...newMetro(42),
      time: 59.9,
      profit: 500,
      maintenanceUnits: 120000,
    };
    const paid = metroTick(before);
    expect(paid.gold).toBe(1900);
    expect(paid.report).toEqual({ profit: 500, maintenance: 200, net: 300 });
    expect(paid.phase).toBe("reward");
    expect(metroTick(paid)).toBe(paid);
    const next = reward(paid, "continue");
    expect(next.gold).toBe(1900);
    expect(next.profit).toBe(0);
    expect(next.maintenanceUnits).toBe(0);
  });
  it("accrues running maintenance, retains it on sale, and charges only confirmed assets", () => {
    let s = connectCable(placeRouter(newMetro(42), 200, 300), 0, 0, 3);
    expect(s.gold).toBe(1350);
    expect(maintenanceRate(s)).toBe(50);
    s = steps(s, 120);
    expect(maintenanceDue(s)).toBe(10);
    const sold = removeCable(s, s.cables[0].id);
    expect(sold.gold).toBe(1450);
    expect(sold.maintenanceUnits).toBe(s.maintenanceUnits);
    expect(maintenanceRate(sold)).toBe(30);
  });
  it("earns on final delivery only and blocks spending beyond the balance", () => {
    let s = connectCable(newMetro(42), 0, 0, 1);
    s.cables[0].cargo = [{ service: 1 }];
    s.cables[0].progress = 0.999;
    s.cables[0].wait = 0;
    s = metroTick(s);
    expect(s.profit).toBe(18);
    expect(s.gold).toBe(1500);
    const poor = { ...s, gold: 99 };
    expect(connectCable(poor, 0, 1, 2)).toBe(poor);
    const rewardState = { ...s, gold: 299, phase: "reward" as const };
    expect(reward(rewardState, "capacity")).toBe(rewardState);
  });
  it("deducts losses and ends a run only when settlement makes the balance negative", () => {
    const s = metroTick({
      ...newMetro(42),
      time: 59.9,
      gold: 100,
      maintenanceUnits: 120000,
    });
    expect(s.gold).toBe(-100);
    expect(s.phase).toBe("over");
    const zero = metroTick({
      ...newMetro(42),
      time: 59.9,
      gold: 200,
      maintenanceUnits: 120000,
    });
    expect(zero.gold).toBe(0);
    expect(zero.phase).toBe("reward");
  });
});

describe("switch specifications and random growth", () => {
  it("charges switch price and maintenance and enforces physical port limits", () => {
    let s = placeRouter({ ...junctions(0, 1), gold: 5000 }, 200, 300, 4);
    expect(s.gold).toBe(4920);
    expect(maintenanceRate(s)).toBe(75);
    expect(nodeBuffer(4)).toBe(16);
    expect(nodeBuffer(3)).toBe(24);
    s = connectCable(
      connectCable(connectCable(connectCable(s, 0, 3, 0), 0, 3, 1), 0, 3, 2),
      1,
      3,
      0,
    );
    expect(s.cables).toHaveLength(4);
    expect(connectionError(s, 1, 3, 1)).toContain("penuh (4/4)");
    expect(connectCable(s, 1, 3, 1)).toBe(s);
    expect(TRANSIT[3].ports).toBe(8);
  });
  it("switch transit waits less while delivery still requires the service icon", () => {
    let s = connectCable(placeRouter(newMetro(42), 200, 300, 4), 0, 0, 3);
    s.cables[0].cargo = [{ service: 1 }];
    s.cables[0].progress = 0.999;
    s.cables[0].wait = 0;
    s = metroTick(s);
    expect(s.delivered).toBe(0);
    expect(s.queues[3]).toEqual([{ service: 1 }]);
    expect(s.cables[0].wait).toBe(0.2);
  });
  it("samples every service, duplicate icons, and bursts of 1-3 PCs deterministically", () => {
    const services = new Set<number>();
    const pcSizes = new Set<number>();
    let duplicate = false;
    for (let seed = 0; seed < 1000; seed++) {
      const original = {
        ...newMetro(Math.imul(seed, 2654435761) >>> 0),
        time: 44.9,
      };
      const s = metroTick(original);
      const added = s.nodes.slice(3);
      expect(metroTick(original)).toEqual(s);
      expect(s.nodes.length).toBeLessThanOrEqual(6);
      if (added[0]?.shape === 0) {
        expect(added.every((n) => n.shape === 0)).toBe(true);
        pcSizes.add(added.length);
        for (const n of added)
          expect(
            Math.hypot(n.x - added[0].x, n.y - added[0].y),
          ).toBeLessThanOrEqual(130.001);
      } else if (added[0]) {
        services.add(added[0].shape);
        if ([1, 2].includes(added[0].shape)) duplicate = true;
      }
      s.nodes.forEach((n, i) =>
        s.nodes
          .slice(0, i)
          .forEach((other) =>
            expect(
              Math.hypot(n.x - other.x, n.y - other.y),
            ).toBeGreaterThanOrEqual(
              i >= 3 && s.nodes.indexOf(other) >= 3 ? 75 : 130,
            ),
          ),
      );
    }
    expect([...services].sort()).toEqual([...SERVICES].sort());
    expect([...pcSizes].sort()).toEqual([1, 2, 3]);
    expect(duplicate).toBe(true);
  });
  it("caps automatic population independently of player nodes", () => {
    let s = placeRouter(
      { ...newMetro(42), spawned: MAX_ENDPOINTS - 1, time: 44.9 },
      200,
      300,
      4,
    );
    s = metroTick(s);
    expect(s.spawned).toBe(MAX_ENDPOINTS);
    expect(s.nodes).toHaveLength(5);
    const next = metroTick({ ...s, time: 89.9, month: 2 });
    expect(next.nodes).toHaveLength(5);
  });
});

describe("moving and selling transit nodes", () => {
  it("moves for free while preserving cables, cargo, queues and identity", () => {
    let s = connectCable(placeRouter(newMetro(42), 200, 300), 0, 0, 3);
    s.cables[0].cargo = [{ service: 1 }];
    s.cables[0].progress = 0.5;
    s.queues[3] = [{ service: 2 }];
    s.gold = 0;
    const moved = moveTransit(s, 3, 220, 370);
    expect(moved.nodes[3]).toMatchObject({
      x: 220,
      y: 370,
      shape: 3,
      serial: 4,
    });
    expect(moved.gold).toBe(0);
    expect(moved.cables).toBe(s.cables);
    expect(moved.queues).toBe(s.queues);
    expect(moveTransit(s, 3, 70, 90)).toBe(s);
    expect(moveTransit(s, 3, -1, 300)).toBe(s);
    expect(moveTransit(s, 0, 220, 370)).toBe(s);
  });
  it("refunds node and attached cables once, preserves packets and remaps retained links", () => {
    let s = placeRouter(placeRouter(newMetro(42), 200, 300), 600, 400, 4);
    s = connectCable(connectCable(connectCable(s, 0, 0, 3), 1, 3, 4), 0, 4, 1);
    s.queues[3] = [{ service: 1 }, { service: 0 }];
    s.cables[0].cargo = [{ service: 1 }];
    s.cables[1].cargo = [{ service: 2 }];
    s.maintenanceUnits = 1000;
    const before = count(s),
      gold = s.gold,
      serial = s.nodes[4].serial;
    expect(nodeRefund(s, 3)).toBe(375);
    const sold = sellTransit(s, 3);
    expect(sold.gold).toBe(gold + 375);
    expect(count(sold)).toBe(before);
    expect(sold.profit).toBe(s.profit);
    expect(sold.nodes[3].serial).toBe(serial);
    expect(sold.nodes[3].shape).toBe(4);
    expect(sold.cables).toHaveLength(1);
    expect(sold.cables[0].stops).toEqual([3, 1]);
    expect(sold.maintenanceUnits).toBe(1000);
    expect(
      sold.queues.every((q, i) =>
        q.every((p) => p.service !== sold.nodes[i].shape),
      ),
    ).toBe(true);
    expect(sellTransit(sold, 0)).toBe(sold);
    const soldAgain = sellTransit(sold, 3);
    expect(sellTransit(soldAgain, 3)).toBe(soldAgain);
  });
  it("returns cable cargo to a disconnected node safely when that node is later sold", () => {
    let s = connectCable(placeRouter(newMetro(42), 200, 300), 0, 3, 1);
    s.cables[0].cargo = [{ service: 1 }];
    s = removeCable(s, s.cables[0].id);
    expect(s.queues[3]).toHaveLength(1);
    const sold = sellTransit(s, 3);
    expect(count(sold)).toBe(1);
    expect(sold.queues[2]).toHaveLength(1);
    expect(sold.gold).toBe(1525);
  });
  it("assigns all 16 reproducible visual client variants without changing the PC service type", () => {
    const variants = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const s = metroTick({
        ...newMetro(Math.imul(i, 2654435761) >>> 0),
        time: 44.9,
      });
      for (const n of s.nodes.slice(3))
        if (n.shape === 0) {
          variants.add(n.clientVariant!);
          expect(n.clientVariant).toBeGreaterThanOrEqual(0);
          expect(n.clientVariant).toBeLessThan(CLIENT_VARIANTS.length);
        }
    }
    expect(variants.size).toBe(16);
  });
});

describe("client icons and parallel links", () => {
  it("routes and delivers only to the requested client variant", () => {
    let s = junctions(0);
    s.nodes[1] = { ...s.nodes[1], shape: 0, clientVariant: 1 };
    s.nodes[2] = { ...s.nodes[2], shape: 0, clientVariant: 2 };
    s = connectCable(connectCable(s, 0, 0, 1), 0, 0, 2);
    expect(routeCable(s, 0, nodeService(s.nodes[2]))).toBe(2);
    s.cables[0].cargo = [{ service: 12 }];
    s.cables[0].progress = 0.999;
    s.cables[0].wait = 0;
    s = metroTick(s);
    expect(s.delivered).toBe(0);
    expect(s.queues[1]).toEqual([{ service: 12 }]);
  });
  it("uses both identical parallel carriers and refunds only the removed link", () => {
    let s = junctions(0, 1);
    s = connectCable(connectCable(connectCable(s, 0, 0, 1), 0, 0, 1), 0, 1, 2);
    s.queues[0] = Array.from({ length: 8 }, () => ({ service: 2 }));
    s = steps(s, 4);
    expect(s.cables.slice(0, 2).map((c) => c.cargo.length)).toEqual([4, 4]);
    const gold = s.gold;
    s = removeCable(s, 1);
    expect(s.gold).toBe(gold + 100);
    expect(s.cables.map((c) => c.id)).toEqual([2, 3]);
    expect(count(s)).toBe(8);
  });
});

it("services generate replies for the distinct active client icons", () => {
  let s = newMetro(42);
  s.nodes[0].clientVariant = 2;
  s.nodes.push({ ...s.nodes[0], x: 500, y: 500, clientVariant: 1 });
  s.queues.push([]);
  s.overload.push(0);
  const icons = new Set<number>();
  for (let i = 0; i < 100; i++) {
    s.time = 2.9;
    s.queues = s.queues.map(() => []);
    s = metroTick(s);
    for (const p of [...s.queues[1], ...s.queues[2]]) icons.add(p.service);
  }
  expect([...icons].sort()).toEqual([11, 12]);
});

describe("cable replacement", () => {
  it("charges only the difference and preserves the link and moving cargo", () => {
    let s = connectCable(newMetro(42), 0, 0, 1);
    s.cables[0].progress = 0.5;
    s.cables[0].cargo = [{ service: 1 }];
    s.maintenanceUnits = 321;
    const changed = changeCable(s, 1, 1);
    expect(cableChangeCost(s, 1, 1)).toBe(100);
    expect(changed.gold).toBe(s.gold - 100);
    expect(changed.cables[0]).toEqual({ ...s.cables[0], kind: 1 });
    expect(changed.maintenanceUnits).toBe(321);
    expect(changeCable({ ...s, gold: 99 }, 1, 1).gold).toBe(99);
    expect(changeCable(s, 1, 0)).toBe(s);
  });
  it("returns excess cargo on a smaller replacement and never invents profit", () => {
    const s = connectCable(newMetro(42), 2, 0, 1);
    s.cables[0].cargo = Array.from({ length: 8 }, () => ({ service: 1 }));
    const changed = changeCable(s, 1, 1);
    expect(changed.gold).toBe(s.gold + 50);
    expect(changed.cables[0].cargo).toHaveLength(3);
    expect(changed.queues[0]).toHaveLength(5);
    expect(count(changed)).toBe(count(s));
    expect(changed.profit).toBe(0);
    expect(removeCable(changed, 1).gold).toBe(newMetro(42).gold);
  });
  it("scales network upgrades and their maintenance without repricing accrued costs", () => {
    const s = { ...newMetro(42), phase: "reward" as const };
    const upgraded = reward(s, "capacity");
    expect(upgradeCost(upgraded, "capacity")).toBe(600);
    expect(cableMaintenance(upgraded, 0)).toBe(24);
    expect(upgraded.month).toBe(2);
  });
});
