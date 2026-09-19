import {
  initial,
  MAP,
  nodes,
  offices,
  legal,
  linkKey,
  type State,
} from "./engine";
export const KEY = "noc-shift-save-v2";
export interface Profile {
  run: State | null;
  best: number;
  wins: number;
  sound: boolean;
  tutorial: boolean;
  legacyBest: number;
  notice: string;
}
export const freshProfile = (): Profile => ({
  run: null,
  best: 0,
  wins: 0,
  sound: true,
  tutorial: true,
  legacyBest: 0,
  notice: "",
});
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const close = (a: number, b: number) => Math.abs(a - b) < 0.01;
export function validRun(value: unknown): value is State {
  if (!value || typeof value !== "object") return false;
  const s = value as State;
  if (s.version !== 2 || !["running", "complete", "failed"].includes(s.phase))
    return false;
  for (const key of [
    "seed",
    "time",
    "budget",
    "served",
    "dropped",
    "total",
    "loss",
    "latency",
    "uptime",
    "onlineTime",
    "measuredTime",
    "badTime",
    "stable",
    "incidentSeconds",
  ] as const)
    if (!finite(s[key])) return false;
  if (
    !Number.isInteger(s.seed) ||
    s.seed > 0xffffffff ||
    s.time > MAP.duration ||
    s.budget > MAP.budget ||
    !Number.isInteger(s.budget) ||
    s.loss > 100 ||
    s.uptime > 100.000001 ||
    s.onlineTime > s.measuredTime + 0.001 ||
    s.measuredTime > 3 * s.time + 0.001 ||
    s.stable > s.time + 0.001 ||
    s.badTime > s.time + 0.001 ||
    s.incidentSeconds > s.time + 0.001
  )
    return false;
  if (
    typeof s.repaired !== "boolean" ||
    typeof s.tutorial !== "boolean" ||
    typeof s.message !== "string" ||
    s.message.length > 500 ||
    typeof s.upgraded?.router !== "boolean" ||
    typeof s.upgraded?.backup !== "boolean"
  )
    return false;
  if (
    (s.repaired && s.time < MAP.outageAt) ||
    (s.upgraded.backup && s.time < 90)
  )
    return false;
  if (
    !Array.isArray(s.links) ||
    s.links.length > 9 ||
    !s.links.every(
      (l) =>
        Array.isArray(l) &&
        l.length === 2 &&
        legal(...l) &&
        l.every((id) => nodes.some((n) => n.id === id && n.unlock <= s.time)),
    )
  )
    return false;
  if (new Set(s.links.map((l) => linkKey(...l))).size !== s.links.length)
    return false;
  if (
    !offices.every((id) => {
      const v = s.sources?.[id];
      return (
        v &&
        finite(v.queue) &&
        v.queue <= MAP.queueMax &&
        finite(v.served) &&
        finite(v.dropped)
      );
    })
  )
    return false;
  const sum = (k: "queue" | "served" | "dropped") =>
    offices.reduce((a, id) => a + s.sources[id][k], 0);
  if (
    !close(sum("served"), s.served) ||
    !close(sum("dropped"), s.dropped) ||
    !close(s.served + s.dropped + sum("queue"), s.total)
  )
    return false;
  if (
    !close(
      s.uptime,
      s.measuredTime ? (s.onlineTime / s.measuredTime) * 100 : 100,
    )
  )
    return false;
  const maxBudget =
    MAP.budget -
    s.links.length * MAP.linkCost -
    (Number(s.upgraded.router) + Number(s.upgraded.backup)) * MAP.upgradeCost -
    Number(s.repaired) * MAP.repairCost;
  if (s.budget > maxBudget) return false;
  if (
    s.phase === "complete" &&
    (s.time !== MAP.duration || s.stable < 20 || s.uptime < 90)
  )
    return false;
  if (
    s.phase === "running" &&
    (s.time >= MAP.duration || s.badTime >= MAP.failureAfter)
  )
    return false;
  if (
    s.phase === "failed" &&
    s.time < MAP.duration &&
    s.badTime < MAP.failureAfter
  )
    return false;
  return true;
}
function decode(raw: unknown): Profile | null {
  if (
    !raw ||
    typeof raw !== "object" ||
    (raw as { version?: number }).version !== 2
  )
    return null;
  const data = raw as Profile;
  return {
    run: validRun(data.run) ? data.run : null,
    best: finite(data.best) ? data.best : 0,
    wins: Number.isInteger(data.wins) && data.wins >= 0 ? data.wins : 0,
    sound: data.sound !== false,
    tutorial: data.tutorial !== false,
    legacyBest: finite(data.legacyBest) ? data.legacyBest : 0,
    notice:
      data.run && !validRun(data.run)
        ? "Save shift tidak valid. Rekor tetap tersedia; mulai shift baru."
        : "",
  };
}
export function loadProfile(): Profile {
  try {
    const current = localStorage.getItem(KEY);
    if (current) {
      try {
        const value = decode(JSON.parse(current));
        if (value && !value.notice) return value;
        if (value) {
          const backup = decode(
            JSON.parse(localStorage.getItem(KEY + "-backup") || "null"),
          );
          return backup
            ? {
                ...backup,
                notice: "Save utama rusak. Cadangan terakhir dipulihkan.",
              }
            : value;
        }
      } catch {
        /* Try the last valid snapshot. */
      }
      const backup = decode(
        JSON.parse(localStorage.getItem(KEY + "-backup") || "null"),
      );
      return backup
        ? {
            ...backup,
            notice: "Save utama rusak. Cadangan terakhir dipulihkan.",
          }
        : {
            ...freshProfile(),
            notice: "Save tidak dapat dibaca. Mulai shift baru.",
          };
    }
    const old = JSON.parse(localStorage.getItem("noc-shift-save-v1") || "null");
    if (old?.version === 1) {
      // The old tutorial is a different scenario. Preserve its record and source
      // snapshot, and carry its completed onboarding into the new map.
      return {
        ...freshProfile(),
        wins: Number.isInteger(old.wins) && old.wins >= 0 ? old.wins : 0,
        legacyBest: finite(old.best) ? old.best : 0,
        sound: old.sound !== false,
        tutorial: !old.wins,
        notice:
          "Versi baru memiliki shift 10 menit. Rekor tutorial lama disimpan; shift lama tetap tersimpan sebagai arsip di perangkat. Mulai shift baru untuk HQ District.",
      };
    }
    return freshProfile();
  } catch {
    return {
      ...freshProfile(),
      notice:
        "Penyimpanan tidak tersedia atau tidak dapat dibaca. Game tetap bisa dimainkan.",
    };
  }
}
export function saveProfile(profile: Profile): boolean {
  try {
    const previous = localStorage.getItem(KEY);
    if (previous) {
      try {
        const parsed = JSON.parse(previous);
        if (decode(parsed) && (!parsed.run || validRun(parsed.run)))
          localStorage.setItem(KEY + "-backup", previous);
      } catch {
        /* Preserve existing backup. */
      }
    }
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...profile, notice: "", version: 2 }),
    );
    return true;
  } catch {
    return false;
  }
}
export function score(s: State) {
  const delivery = s.total ? s.served / s.total : 0;
  return Math.max(
    0,
    Math.round(
      s.uptime * 40 + delivery * 4000 + s.budget * 2 - s.incidentSeconds * 5,
    ),
  );
}
export function newRun(profile: Profile) {
  return initial(
    crypto.getRandomValues(new Uint32Array(1))[0],
    profile.tutorial,
  );
}
