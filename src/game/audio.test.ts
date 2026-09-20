import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
let now = 0;
let oscillators: any[] = [];
let gains: any[] = [];
class AudioMock {
  state = "running";
  destination = {};
  get currentTime() {
    return now;
  }
  resume = vi.fn(async () => {});
  createGain() {
    const gain = {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    gains.push(gain);
    return gain;
  }
  createOscillator() {
    const osc = {
      frequency: { value: 0 },
      type: "",
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: undefined as any,
    };
    oscillators.push(osc);
    return osc;
  }
}
beforeEach(() => {
  vi.resetModules();
  now = 0;
  oscillators = [];
  gains = [];
  vi.stubGlobal("AudioContext", AudioMock);
  vi.stubGlobal("document", { hidden: false });
});
afterEach(() => vi.unstubAllGlobals());
describe("game audio lifecycle", () => {
  it("waits for a gesture, throttles packet sounds and disconnects finished voices", async () => {
    const audio = await import("./audio");
    audio.playCue("delivery");
    expect(oscillators).toHaveLength(0);
    audio.unlockAudio();
    audio.playCue("delivery");
    audio.playCue("delivery");
    expect(oscillators).toHaveLength(1);
    now = 0.8;
    audio.playCue("delivery");
    expect(oscillators).toHaveLength(2);
    oscillators[0].onended();
    expect(oscillators[0].disconnect).toHaveBeenCalled();
    expect(gains[1].disconnect).toHaveBeenCalled();
  });
  it("mutes existing and scheduled notes, remains silent when hidden and can resume", async () => {
    const audio = await import("./audio");
    audio.unlockAudio();
    audio.playCue("win");
    expect(oscillators).toHaveLength(4);
    audio.setAudioEnabled(false);
    expect(gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(0, 0);
    expect(oscillators.every((o) => o.stop.mock.calls.length === 2)).toBe(true);
    audio.playCue("link");
    expect(oscillators).toHaveLength(4);
    audio.setAudioEnabled(true);
    vi.stubGlobal("document", { hidden: true });
    audio.playCue("link");
    expect(oscillators).toHaveLength(4);
    vi.stubGlobal("document", { hidden: false });
    audio.playCue("link");
    expect(oscillators).toHaveLength(6);
  });
  it("limits warning repetition and tolerates unavailable audio", async () => {
    const audio = await import("./audio");
    audio.unlockAudio();
    audio.playCue("rush");
    now = 2;
    audio.playCue("rush");
    expect(oscillators).toHaveLength(3);
    now = 7;
    audio.playCue("rush");
    expect(oscillators).toHaveLength(6);
    vi.resetModules();
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          throw Error("unsupported");
        }
      },
    );
    const unavailable = await import("./audio");
    expect(() => {
      unavailable.unlockAudio();
      unavailable.playCue("win");
    }).not.toThrow();
  });
});
