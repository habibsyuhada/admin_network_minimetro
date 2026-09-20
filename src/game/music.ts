// Original, gently pulsing eight-bar synth loop. Runs on wall time, not game speed.
let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let enabled = false;
let timer: ReturnType<typeof setInterval> | undefined;
let next = 0,
  step = 0;
const voices = new Set<OscillatorNode>();
const beat = 60 / 84 / 2;
const chords = [
  [48, 55, 60, 64],
  [45, 52, 57, 60],
  [41, 48, 53, 57],
  [43, 50, 55, 59],
];
function stop() {
  clearInterval(timer);
  timer = undefined;
  voices.forEach((v) => {
    try {
      v.stop();
    } catch {
      /* Already ended. */
    }
  });
  voices.clear();
}
function note(midi: number, time: number, length: number, volume: number) {
  if (!ctx || !bus) return;
  const osc = ctx.createOscillator(),
    gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
  osc.connect(gain);
  gain.connect(bus);
  voices.add(osc);
  osc.onended = () => {
    voices.delete(osc);
    osc.disconnect();
    gain.disconnect();
  };
  osc.start(time);
  osc.stop(time + length + 0.05);
}
function schedule() {
  if (!ctx || !enabled || document.hidden || ctx.state !== "running") return;
  if (next < ctx.currentTime) next = ctx.currentTime + 0.03;
  while (next < ctx.currentTime + 0.4) {
    const chord = chords[Math.floor(step / 16) % 4];
    if (step % 8 === 0) note(chord[0] - 12, next, beat * 7, 0.1);
    if (step % 2 === 0)
      note(chord[(step / 2) % 4] + 12, next, beat * 2.8, 0.035);
    if (step % 16 === 0)
      chord.slice(1).forEach((n) => note(n, next, beat * 14, 0.018));
    step = (step + 1) % 64;
    next += beat;
  }
}
function start() {
  if (!ctx || !enabled || document.hidden || timer) return;
  next = ctx.currentTime + 0.06;
  step = 0;
  timer = setInterval(schedule, 180);
  schedule();
}
export function setMusicEnabled(value: boolean) {
  enabled = value;
  if (value) start();
  else stop();
}
export function unlockMusic() {
  if (!enabled) return;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      bus = ctx.createGain();
      bus.gain.value = 0.35;
      bus.connect(ctx.destination);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else if (enabled)
          void ctx
            ?.resume()
            .then(start)
            .catch(() => {});
      });
    }
    void ctx
      .resume()
      .then(start)
      .catch(() => {});
  } catch {
    /* Music is optional on unsupported devices. */
  }
}
