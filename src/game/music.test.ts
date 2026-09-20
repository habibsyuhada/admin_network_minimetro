import { afterEach, beforeEach, expect, it, vi } from "vitest";
let hidden = false,
  time = 0,
  visibility: () => void,
  voices: any[] = [];
class MusicContext {
  state = "running";
  destination = {};
  get currentTime() {
    return time;
  }
  resume = vi.fn(async () => {});
  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  createOscillator() {
    const osc = {
      type: "",
      frequency: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: undefined,
    };
    voices.push(osc);
    return osc;
  }
}
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  hidden = false;
  time = 0;
  voices = [];
  vi.stubGlobal("AudioContext", MusicContext);
  vi.stubGlobal("document", {
    get hidden() {
      return hidden;
    },
    addEventListener: (_name: string, fn: () => void) => (visibility = fn),
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("starts only after unlock and stops scheduled music when muted or hidden", async () => {
  const m = await import("./music");
  m.setMusicEnabled(true);
  expect(voices).toHaveLength(0);
  m.unlockMusic();
  await Promise.resolve();
  expect(voices.length).toBeGreaterThan(0);
  expect(vi.getTimerCount()).toBe(1);
  const count = voices.length;
  m.unlockMusic();
  await Promise.resolve();
  expect(vi.getTimerCount()).toBe(1);
  hidden = true;
  visibility();
  expect(vi.getTimerCount()).toBe(0);
  expect(voices.every((v) => v.stop.mock.calls.length === 2)).toBe(true);
  hidden = false;
  visibility();
  await Promise.resolve();
  expect(voices.length).toBeGreaterThan(count);
  m.setMusicEnabled(false);
  expect(vi.getTimerCount()).toBe(0);
});
it("does not replay a large backlog after a timer stall", async () => {
  const m = await import("./music");
  m.setMusicEnabled(true);
  m.unlockMusic();
  await Promise.resolve();
  const count = voices.length;
  time = 300;
  vi.advanceTimersByTime(180);
  expect(voices.length - count).toBeLessThanOrEqual(5);
  m.setMusicEnabled(false);
});
