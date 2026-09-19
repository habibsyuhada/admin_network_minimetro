import { describe, expect, it } from "vitest";
import {
  clearLine,
  distance,
  extendLine,
  metroTick,
  newMetro,
  reward,
} from "./metro";

describe("NOC Flow simulation", () => {
  it("delivers across two lines with a shared transfer node", () => {
    let s = newMetro(42);
    s = extendLine(extendLine(s, 0, 0), 0, 1);
    s = extendLine(extendLine(s, 1, 1), 1, 2);
    s.queues[0] = [2];
    expect(distance(s, 0, 2)).toBe(2);
    for (let i = 0; i < 150; i++) s = metroTick(s);
    expect(s.delivered).toBeGreaterThanOrEqual(1);
    expect(s.queues[0]).not.toContain(2);
  });
  it("conserves all packets between demand pulses and on line reset", () => {
    let s = extendLine(extendLine(newMetro(12), 0, 0), 0, 1);
    s.queues[0] = [1, 1, 2];
    for (let i = 0; i < 25; i++) s = metroTick(s);
    const count = (v: typeof s) =>
      v.delivered +
      v.queues.flat().length +
      v.lines.flatMap((l) => l.cargo).length;
    expect(count(s)).toBe(3);
    expect(s.lines[0].cargo.length).toBeLessThanOrEqual(s.capacity);
    s = clearLine(s, 0);
    expect(count(s)).toBe(3);
    expect(s.lines[0].stops).toEqual([]);
  });
  it("spawns nodes and pauses for a weekly choice", () => {
    let s = newMetro(42);
    s.time = 34.9;
    s = metroTick(s);
    expect(s.queues).toHaveLength(4);
    s.time = 59.9;
    s = metroTick(s);
    expect(s.phase).toBe("reward");
    expect(metroTick(s)).toBe(s);
    s = reward(s, "line");
    expect(s.lines).toHaveLength(4);
    expect(s.week).toBe(2);
    expect(s.phase).toBe("running");
  });
  it("ends only after sustained overload and recovers after draining", () => {
    let s = newMetro();
    s.queues[0] = Array(8).fill(1);
    s.overload[0] = 19.8;
    s = metroTick(s);
    expect(s.phase).toBe("running");
    const recovered = metroTick({ ...s, queues: [[], [], []] });
    expect(recovered.overload[0]).toBeLessThan(s.overload[0]);
    s = metroTick(metroTick(s));
    expect(s.phase).toBe("over");
    expect(metroTick(s)).toBe(s);
  });
  it("rejects duplicate stops and edits after game over", () => {
    const s = extendLine(newMetro(), 0, 0);
    expect(extendLine(s, 0, 0)).toBe(s);
    const over = { ...s, phase: "over" as const };
    expect(extendLine(over, 0, 1)).toBe(over);
    expect(clearLine(over, 0)).toBe(over);
  });
});
