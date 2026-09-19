import { afterEach, describe, it, expect, vi } from "vitest";
import {
  KEY,
  freshProfile,
  loadProfile,
  saveProfile,
  validRun,
} from "./storage";
import { initial, connect, tick, type State } from "./engine";
afterEach(() => vi.unstubAllGlobals());
function storage() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  });
  return data;
}
describe("versioned saves", () => {
  it("round-trips a shift and resumes identically", () => {
    storage();
    let run = connect(
      connect(initial(2026), "hq", "router"),
      "router",
      "server",
    );
    for (let i = 0; i < 200; i++) run = tick(run);
    expect(saveProfile({ ...freshProfile(), run })).toBe(true);
    const restored = loadProfile();
    expect(restored.run).toEqual(run);
    expect(tick(restored.run!)).toEqual(tick(run));
  });
  it("rejects duplicate/bypass links, corrupt totals, impossible phases and economy", () => {
    const s = connect(initial(), "hq", "router");
    for (const invalid of [
      { ...s, budget: 1000 },
      { ...s, links: [["hq", "server"]] },
      { ...s, links: [...s.links, ["router", "hq"]] },
      { ...s, served: 100 },
      { ...s, time: NaN },
      { ...s, phase: "complete" },
      { ...s, phase: "failed" },
      { ...s, repaired: true },
      { ...s, sources: null },
      { ...s, uptime: 10 },
    ])
      expect(validRun(invalid)).toBe(false);
    expect(validRun(s)).toBe(true);
  });
  it("restores the previous valid snapshot after a corrupted write", () => {
    const data = storage(),
      profile = { ...freshProfile(), run: initial() };
    saveProfile(profile);
    saveProfile({ ...profile, run: tick(profile.run) });
    data.set(KEY, "{broken");
    const restored = loadProfile();
    expect(restored.run).toEqual(profile.run);
    expect(restored.notice).toContain("Cadangan");
  });
  it("preserves legacy records, sound and the unmodified old save with an explicit migration notice", () => {
    const data = storage(),
      old = JSON.stringify({
        version: 1,
        best: 8700,
        wins: 2,
        sound: false,
        run: { phase: "rush" },
      });
    data.set("noc-shift-save-v1", old);
    const p = loadProfile();
    expect(p.legacyBest).toBe(8700);
    expect(p.wins).toBe(2);
    expect(p.sound).toBe(false);
    expect(p.run).toBeNull();
    expect(p.notice).toContain("arsip");
    saveProfile(p);
    expect(data.get("noc-shift-save-v1")).toBe(old);
  });
  it("keeps playing possible when storage is blocked or quota exhausted", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("full");
      },
    });
    expect(loadProfile().run).toBeNull();
    expect(saveProfile(freshProfile())).toBe(false);
  });
  it("keeps valid profile records when only the run is corrupt", () => {
    const data = storage();
    data.set(
      KEY,
      JSON.stringify({
        ...freshProfile(),
        version: 2,
        best: 9000,
        run: { ...initial(), total: 999 } as State,
      }),
    );
    expect(loadProfile().best).toBe(9000);
    expect(loadProfile().run).toBeNull();
  });
});
