export type Shape = 0 | 1 | 2;
export const SHAPES = ["●", "▲", "■"] as const;
export const COLORS = ["#ee785d", "#58b8af", "#a596db", "#daa840", "#729acf"];
export const SITES: { x: number; y: number; shape: Shape }[] = [
  { x: 85, y: 125, shape: 0 },
  { x: 235, y: 205, shape: 1 },
  { x: 305, y: 365, shape: 2 },
  { x: 95, y: 410, shape: 0 },
  { x: 310, y: 80, shape: 2 },
  { x: 75, y: 275, shape: 1 },
  { x: 230, y: 495, shape: 0 },
  { x: 335, y: 260, shape: 1 },
  { x: 175, y: 65, shape: 2 },
  { x: 165, y: 335, shape: 2 },
  { x: 65, y: 520, shape: 1 },
  { x: 325, y: 540, shape: 0 },
];
export type Line = {
  stops: number[];
  at: number;
  direction: 1 | -1;
  progress: number;
  cargo: Shape[];
};
export type Metro = {
  version: 1;
  time: number;
  seed: number;
  delivered: number;
  queues: Shape[][];
  overload: number[];
  lines: Line[];
  capacity: number;
  speed: number;
  week: number;
  phase: "running" | "reward" | "over";
};
export const emptyLine = (): Line => ({
  stops: [],
  at: 0,
  direction: 1,
  progress: 0,
  cargo: [],
});
export function newMetro(seed = Date.now() >>> 0): Metro {
  return {
    version: 1,
    time: 0,
    seed,
    delivered: 0,
    queues: [[], [], []],
    overload: [0, 0, 0],
    lines: [emptyLine(), emptyLine(), emptyLine()],
    capacity: 4,
    speed: 60,
    week: 1,
    phase: "running",
  };
}
// Distance through all drawn lines allows packets to transfer at shared nodes.
export function distance(s: Metro, start: number, shape: Shape): number {
  const seen = new Set([start]);
  const pending = [{ id: start, hops: 0 }];
  for (const { id, hops } of pending) {
    if (SITES[id].shape === shape) return hops;
    for (const line of s.lines) {
      const i = line.stops.indexOf(id);
      if (i < 0) continue;
      for (const next of [line.stops[i - 1], line.stops[i + 1]]) {
        if (next !== undefined && !seen.has(next)) {
          seen.add(next);
          pending.push({ id: next, hops: hops + 1 });
        }
      }
    }
  }
  return Infinity;
}
export function extendLine(s: Metro, index: number, id: number): Metro {
  const line = s.lines[index];
  if (
    s.phase !== "running" ||
    !line ||
    !s.queues[id] ||
    line.stops.includes(id)
  )
    return s;
  return {
    ...s,
    lines: s.lines.map((v, i) =>
      i === index ? { ...v, stops: [...v.stops, id] } : v,
    ),
  };
}
export function clearLine(s: Metro, index: number): Metro {
  if (s.phase !== "running" || !s.lines[index]) return s;
  const line = s.lines[index];
  const queues = s.queues.map((q) => [...q]);
  if (line.stops.length) queues[line.stops[line.at]].push(...line.cargo);
  return {
    ...s,
    queues,
    lines: s.lines.map((l, i) => (i === index ? emptyLine() : l)),
  };
}
export function reward(s: Metro, choice: "line" | "capacity" | "speed"): Metro {
  if (
    s.phase !== "reward" ||
    (choice === "line" && s.lines.length >= COLORS.length)
  )
    return s;
  return {
    ...s,
    phase: "running",
    week: s.week + 1,
    lines: choice === "line" ? [...s.lines, emptyLine()] : s.lines,
    capacity: s.capacity + (choice === "capacity" ? 2 : 0),
    speed: s.speed + (choice === "speed" ? 15 : 0),
  };
}
function service(s: Metro, line: Line) {
  const id = line.stops[line.at];
  const next = line.stops[line.at + line.direction];
  const keep: Shape[] = [];
  for (const packet of line.cargo) {
    if (SITES[id].shape === packet) s.delivered++;
    else if (distance(s, next, packet) < distance(s, id, packet))
      keep.push(packet);
    else s.queues[id].push(packet);
  }
  line.cargo = keep;
  s.queues[id] = s.queues[id].filter((packet) => {
    if (
      line.cargo.length < s.capacity &&
      distance(s, next, packet) < distance(s, id, packet)
    ) {
      line.cargo.push(packet);
      return false;
    }
    return true;
  });
}
export function metroTick(state: Metro): Metro {
  if (state.phase !== "running") return state;
  const s: Metro = {
    ...state,
    time: Math.round((state.time + 0.1) * 10) / 10,
    queues: state.queues.map((q) => [...q]),
    overload: [...state.overload],
    lines: state.lines.map((l) => ({
      ...l,
      stops: [...l.stops],
      cargo: [...l.cargo],
    })),
  };
  const random = () => {
    s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
    return s.seed / 4294967296;
  };
  if (
    Math.floor(s.time / 35) > Math.floor(state.time / 35) &&
    s.queues.length < SITES.length
  ) {
    s.queues.push([]);
    s.overload.push(0);
  }
  if (Math.floor(s.time / 3) > Math.floor(state.time / 3)) {
    for (let id = 0; id < s.queues.length; id++) {
      if (random() > Math.min(0.85, 0.4 + s.time / 900)) continue;
      const shape = ((SITES[id].shape + 1 + Math.floor(random() * 2)) %
        3) as Shape;
      s.queues[id].push(shape);
    }
  }
  for (const line of s.lines) {
    if (line.stops.length < 2) continue;
    if (line.at === line.stops.length - 1) line.direction = -1;
    else if (line.at === 0) line.direction = 1;
    if (line.progress === 0) service(s, line);
    const a = SITES[line.stops[line.at]],
      b = SITES[line.stops[line.at + line.direction]];
    line.progress += (s.speed * 0.1) / Math.hypot(a.x - b.x, a.y - b.y);
    if (line.progress >= 1) {
      line.at += line.direction;
      line.progress = 0;
      if (line.at === line.stops.length - 1) line.direction = -1;
      else if (line.at === 0) line.direction = 1;
      service(s, line);
    }
  }
  s.overload = s.queues.map((q, i) =>
    q.length >= 8 ? s.overload[i] + 0.1 : Math.max(0, s.overload[i] - 0.2),
  );
  if (s.overload.some((t) => t >= 20)) s.phase = "over";
  else if (s.time >= s.week * 60) s.phase = "reward";
  return s;
}
