import { describe, expect, it } from "vitest";
import { LEVELS, levelUnlocked, readProgress, missionStars } from "./levels";
import { metroTick, newMetro, reward } from "./metro";
describe("campaign maps", () => {
  it("provides six distinct, valid map definitions and preserves free play", () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(6);
    for (const level of LEVELS) {
      const s = newMetro(level.seed, level.id);
      expect(s.levelId).toBe(level.id);
      expect(s.gold).toBe(level.gold);
      expect(s.nodes.map((n) => ({ x: n.x, y: n.y, shape: n.shape }))).toEqual(
        level.start.map((n) => ({ x: n.x, y: n.y, shape: n.shape })),
      );
      expect(
        level.zones.every(
          (z) =>
            z.x >= 40 &&
            z.y >= 40 &&
            z.x + z.width <= 960 &&
            z.y + z.height <= 1160,
        ),
      ).toBe(true);
    }
    expect(newMetro(42).levelId).toBeUndefined();
    expect(newMetro(42).gold).toBe(1600);
  });
  it("requires both mission goals, stops on completion and never awards a failed run", () => {
    const l = LEVELS[0];
    const s = {
      ...newMetro(l.seed, l.id),
      time: 179.9,
      month: 3,
      delivered: 60,
    };
    const complete = metroTick(s);
    expect(complete.phase).toBe("complete");
    expect(metroTick(complete)).toBe(complete);
    expect(reward(complete, "continue")).toBe(complete);
    expect(metroTick({ ...s, delivered: 59 }).phase).toBe("reward");
    expect(metroTick({ ...s, gold: -1 }).phase).toBe("over");
    expect(
      metroTick({
        ...s,
        queues: [Array.from({ length: 10 }, () => ({ service: 1 })), [], []],
        overload: [25, 0, 0],
      }).phase,
    ).toBe("over");
  });
  it("unlocks sequentially and accepts only valid saved stars", () => {
    const p = readProgress({
      neighborhood: 2,
      campus: 99,
      harbor: "3",
      fake: 3,
    });
    expect(p).toEqual({ neighborhood: 2 });
    expect(levelUnlocked("campus", p)).toBe(true);
    expect(levelUnlocked("harbor", p)).toBe(false);
    expect(levelUnlocked("bad", p)).toBe(false);
    expect(missionStars(LEVELS[0], 75, 900)).toBe(3);
    expect(missionStars(LEVELS[0], 60, 0)).toBe(1);
  });
});
