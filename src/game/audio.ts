let context: AudioContext | null = null;
let enabled = true;
export function setAudioEnabled(value: boolean) {
  enabled = value;
}
export function unlockAudio() {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
  } catch {
    /* Audio is optional on unsupported WebViews. */
  }
}
export function playCue(cue: "tap" | "link" | "rush" | "upgrade" | "win") {
  if (!enabled || !context || context.state !== "running") return;
  const notes = {
    tap: [440],
    link: [523, 784],
    rush: [220, 165, 220],
    upgrade: [392, 523, 784],
    win: [523, 659, 784, 1047],
  }[cue];
  notes.forEach((frequency, index) => {
    const t = context!.currentTime + index * 0.12;
    const osc = context!.createOscillator(),
      gain = context!.createGain();
    osc.type = cue === "rush" ? "triangle" : "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(context!.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}
