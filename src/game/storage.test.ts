import { afterEach, describe, it, expect, vi } from "vitest";
import { freshProfile, loadProfile, saveProfile, validRun } from "./storage";
import { initial, connect, tick } from "./engine";
afterEach(() => vi.unstubAllGlobals());
describe("local save", () => {
  it("round-trips a running shift and resumes simulation", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => data.get(key),
      setItem: (key: string, value: string) => data.set(key, value),
    });
    let run = connect(connect(initial(), "hq", "router"), "router", "server");
    run = tick(run, 1);
    expect(
      saveProfile({ ...freshProfile(), run, best: 123, wins: 2, sound: false }),
    ).toBe(true);
    const profile = loadProfile();
    expect(profile.run).toEqual(run);
    expect(profile.best).toBe(123);
    expect(profile.sound).toBe(false);
    expect(tick(profile.run!, 1).served).toBeGreaterThan(run.served);
  });
  it("recovers from malformed or old saves", () => {
    vi.stubGlobal("localStorage", { getItem: () => "{broken" });
    expect(loadProfile()).toEqual(freshProfile());
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ version: 0, run: initial() }),
    });
    expect(loadProfile()).toEqual(freshProfile());
    expect(validRun({ ...initial(), sources: null })).toBe(false);
    expect(validRun({ ...initial(), queue: NaN })).toBe(false);
  });
  it("keeps play available when storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("full");
      },
    });
    expect(loadProfile()).toEqual(freshProfile());
    expect(saveProfile(freshProfile())).toBe(false);
  });
});
