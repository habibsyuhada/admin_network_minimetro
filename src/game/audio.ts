import { unlockMusic } from "./music";
let context: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
const voices = new Set<OscillatorNode>();
const lastPlayed = new Map<string, number>();
const cues = {
  tap: [440],
  link: [523, 784],
  rush: [220, 165, 220],
  upgrade: [392, 523, 784],
  win: [523, 659, 784, 1047],
  fail: [330, 262, 196],
  error: [180, 140],
  delivery: [880],
  spawn: [587, 784],
  remove: [392, 262],
  month: [523, 659],
} as const;
export type SoundCue = keyof typeof cues;
export function setAudioEnabled(value: boolean) {
  enabled = value;
  if (master && context)
    master.gain.setValueAtTime(value ? 0.6 : 0, context.currentTime);
  if (!value) {
    for (const voice of voices) {
      try {
        voice.stop();
      } catch {
        /* Already stopped. */
      }
    }
    voices.clear();
  }
}
export function unlockAudio() {
  unlockMusic();
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    if (!master) {
      master = context.createGain();
      master.gain.value = 0.6;
      master.connect(context.destination);
    }
    void context.resume().catch(() => {});
  } catch {
    /* Audio remains optional on unsupported WebViews. */
  }
}
export function playCue(cue: SoundCue) {
  if (
    !enabled ||
    document.hidden ||
    !context ||
    !master ||
    context.state !== "running"
  )
    return;
  const now = context.currentTime;
  const cooldown = cue === "rush" ? 6 : cue === "delivery" ? 0.7 : 0.12;
  if (now - (lastPlayed.get(cue) ?? -Infinity) < cooldown || voices.size >= 16)
    return;
  lastPlayed.set(cue, now);
  cues[cue].forEach((frequency, index) => {
    const t = now + index * 0.12;
    const osc = context!.createOscillator(),
      gain = context!.createGain();
    osc.type = ["rush", "error", "fail"].includes(cue) ? "triangle" : "sine";
    osc.frequency.value = frequency;
    const volume = cue === "delivery" ? 0.018 : 0.065;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(master!);
    voices.add(osc);
    osc.onended = () => {
      voices.delete(osc);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(t);
    osc.stop(t + 0.2);
  });
}
