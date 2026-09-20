import { describe, expect, it } from "vitest";
import {
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
describe("point-to-point cable transport", () => {
  it("gives every cable its own carrier with exactly two endpoints", () => {
    let s = connectCable(connectCable(newMetro(42), 0, 0, 1), 0, 1, 2);
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
      s.queues[0] = Array.from({ length: 12 }, () => ({ destination: 1 }));
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
    let s = connectCable(connectCable(newMetro(42), 0, 0, 1), 0, 1, 2);
    s.cables[0].cargo = [{ destination: 2 }];
    s.cables[0].progress = 0.99;
    s.cables[0].wait = 0;
    s.cables[1].at = 1;
    s.cables[1].progress = 0.3;
    s.cables[1].wait = 0;
    s = metroTick(s);
    expect(s.queues[1]).toEqual([{ destination: 2 }]);
    expect(s.cables[1].cargo).toEqual([]);
    expect(s.delivered).toBe(0);
    s = steps(s, 120);
    expect(s.delivered).toBeGreaterThan(0);
  });
  it("transports traffic in both directions on the same cable", () => {
    let s = connectCable(newMetro(42), 0, 0, 1);
    s.speedBonus = 300;
    s.queues[0] = [{ destination: 1 }];
    s.queues[1] = [{ destination: 0 }];
    s = steps(s, 23);
    expect(s.delivered).toBe(2);
    expect(count(s)).toBe(2);
    expect(s.cables[0].stops).toEqual([0, 1]);
  });
  it("routes automatically by time and changes preference under queue pressure", () => {
    let s = connectCable(connectCable(newMetro(42), 1, 0, 1), 2, 0, 1);
    s.queues[0] = [{ destination: 1 }];
    expect(routeCable(s, 0, 1)).toBe(s.cables[0].id);
    s.queues[0] = Array.from({ length: 50 }, () => ({ destination: 1 }));
    expect(routeCable(s, 0, 1)).toBe(s.cables[1].id);
    expect(routeCable(s, 0, 2)).toBeNull();
  });
  it("finds multihop destinations and reroutes after a cable is removed", () => {
    let s = connectCable(
      connectCable(connectCable(newMetro(42), 0, 0, 1), 0, 1, 2),
      1,
      0,
      2,
    );
    expect(routeCable(s, 0, 2)).toBe(s.cables[2].id);
    s = removeCable(s, s.cables[2].id);
    expect(routeCable(s, 0, 2)).toBe(s.cables[0].id);
  });
  it("removing an in-flight cable refunds stock and returns all cargo to its departure node", () => {
    let s = connectCable(connectCable(newMetro(42), 0, 0, 1), 1, 1, 2);
    s.queues[0] = [{ destination: 1 }, { destination: 1 }];
    s = steps(s, 12);
    const original = s;
    expect(s.cables[0].cargo.length).toBe(2);
    s = removeCable(s, s.cables[0].id);
    expect(count(s)).toBe(count(original));
    expect(s.queues[0]).toEqual([{ destination: 1 }, { destination: 1 }]);
    expect(s.stock).toBe(original.stock + 1);
    expect(s.cables).toHaveLength(1);
    expect(s.cables[0]).toBe(original.cables[1]);
  });
  it("rejects duplicate pairs, self-links, inactive nodes and insufficient stock", () => {
    let s = connectCable(newMetro(42), 0, 0, 1);
    expect(connectCable(s, 0, 1, 0)).toBe(s);
    expect(connectCable(s, 0, 1, 1)).toBe(s);
    expect(connectCable(s, 0, 1, 10)).toBe(s);
    expect(connectCable(s, 0, 1, 1.5)).toBe(s);
    expect(connectCable({ ...s, stock: 0 }, 1, 1, 2).cables).toBe(s.cables);
    s = { ...s, phase: "over" };
    expect(connectionError(s, 0, 1, 2)).not.toBeNull();
    expect(removeCable(s, 1)).toBe(s);
  });
  it("provides weekly stock and applies capacity/speed upgrades to cable types", () => {
    let s = newMetro(42);
    s.time = 34.9;
    s = metroTick(s);
    expect(s.queues).toHaveLength(4);
    s.time = 59.9;
    s = metroTick(s);
    expect(s.phase).toBe("reward");
    expect(metroTick(s)).toBe(s);
    const capacity = reward(s, "capacity");
    expect(capacity.stock).toBe(s.stock + 2);
    expect(cableCapacity(capacity, 2)).toBe(10);
    expect(reward(s, "stock").stock).toBe(s.stock + 6);
    expect(reward(s, "speed").speedBonus).toBe(15);
  });
  it("fails only after sustained overload and recovers when queues shrink", () => {
    let s = newMetro(42);
    s.queues[0] = Array.from({ length: 8 }, () => ({ destination: 1 }));
    s.overload[0] = 19.8;
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

describe("specific node destinations", () => {
  it("passes through an identical icon without delivering to the wrong node", () => {
    let s = newMetro(42);
    s.queues.push([], [], []);
    s.overload.push(0, 0, 0);
    s = connectCable(connectCable(s, 0, 0, 1), 0, 1, 5);
    s.cables[0].cargo = [{ destination: 5 }];
    s.cables[0].progress = 0.99;
    s.cables[0].wait = 0;
    s = metroTick(s);
    expect(s.delivered).toBe(0);
    expect(s.queues[1]).toEqual([{ destination: 5 }]);
    expect(routeCable(s, 1, 5)).toBe(s.cables[1].id);
    s.cables[1].cargo = s.queues[1];
    s.queues[1] = [];
    s.cables[1].progress = 0.99;
    s.cables[1].wait = 0;
    s = metroTick(s);
    expect(s.delivered).toBe(1);
    expect(count(s)).toBe(1);
  });
  it("does not substitute a reachable node with the same icon", () => {
    let s = newMetro(42);
    s.queues.push([], [], []);
    s.overload.push(0, 0, 0);
    s = connectCable(s, 0, 0, 1);
    expect(routeCable(s, 0, 5)).toBeNull();
    s.queues[0] = [{ destination: 5 }];
    s = steps(s, 4);
    expect(s.queues[0]).toHaveLength(1);
    expect(s.cables[0].cargo).toHaveLength(0);
  });
  it("generates only active, distinct destinations including matching device types", () => {
    let s = newMetro(42);
    s.queues.push([], [], []);
    s.overload.push(0, 0, 0);
    let sameType = false;
    for (let i = 0; i < 40; i++) {
      s.time = 2.9;
      s.queues = s.queues.map(() => []);
      s = metroTick(s);
      s.queues.forEach((queue, source) =>
        queue.forEach((packet) => {
          expect(packet.destination).not.toBe(source);
          expect(packet.destination).toBeGreaterThanOrEqual(0);
          expect(packet.destination).toBeLessThan(s.queues.length);
          if (
            (source === 1 && packet.destination === 5) ||
            (source === 5 && packet.destination === 1)
          )
            sameType = true;
        }),
      );
    }
    expect(sameType).toBe(true);
  });
});
