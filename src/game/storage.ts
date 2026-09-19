import { initial, type State, type NodeId } from "./engine";
const KEY = "noc-shift-save-v1";
export interface Profile {
  run: State | null;
  best: number;
  wins: number;
  sound: boolean;
}
export const freshProfile = (): Profile => ({
  run: null,
  best: 0,
  wins: 0,
  sound: true,
});
const ids: NodeId[] = ["hq", "router", "server", "branch"];
export function validRun(value: unknown): value is State {
  if (!value || typeof value !== "object") return false;
  const s = value as State;
  if (
    ![
      "hq",
      "server",
      "observe",
      "branch",
      "normal",
      "rush",
      "recover",
      "complete",
    ].includes(s.phase)
  )
    return false;
  for (const k of Object.keys(initial()) as (keyof State)[])
    if (
      typeof initial()[k] === "number" &&
      (typeof s[k] !== "number" ||
        !Number.isFinite(s[k]) ||
        (s[k] as number) < 0)
    )
      return false;
  if (
    typeof s.upgraded !== "boolean" ||
    typeof s.message !== "string" ||
    !Array.isArray(s.links) ||
    s.links.length > 6
  )
    return false;
  if (
    !s.links.every(
      (l) =>
        Array.isArray(l) &&
        l.length === 2 &&
        ids.includes(l[0]) &&
        ids.includes(l[1]) &&
        l[0] !== l[1],
    )
  )
    return false;
  return ["hq", "branch"].every((id) => {
    const item = s.sources?.[id as "hq" | "branch"];
    return (
      item &&
      ["served", "queue", "loss"].every(
        (k) =>
          typeof item[k as keyof typeof item] === "number" &&
          Number.isFinite(item[k as keyof typeof item]) &&
          item[k as keyof typeof item] >= 0,
      )
    );
  });
}
export function loadProfile(): Profile {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw || raw.version !== 1) return freshProfile();
    return {
      run: validRun(raw.run) ? raw.run : null,
      best: Number.isFinite(raw.best) && raw.best >= 0 ? raw.best : 0,
      wins: Number.isInteger(raw.wins) && raw.wins >= 0 ? raw.wins : 0,
      sound: raw.sound !== false,
    };
  } catch {
    return freshProfile();
  }
}
export function saveProfile(profile: Profile): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, ...profile }));
    return true;
  } catch {
    return false;
  }
}
export function score(s: State) {
  return Math.max(0, Math.round(10000 - s.time * 15 - s.dropped * 2));
}
