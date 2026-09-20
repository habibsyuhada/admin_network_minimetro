import { SITES, type Site, type Cable } from "./metro";
export type Point = { x: number; y: number };
export type View = Point & { width: number; height: number };
export const MAP_BOUNDS: View = { x: 0, y: 0, width: 1000, height: 1200 };
export function constrainView(view: View): View {
  const axis = (
    position: number,
    size: number,
    start: number,
    extent: number,
  ) =>
    size >= extent
      ? start + (extent - size) / 2
      : Math.max(start, Math.min(start + extent - size, position));
  return {
    ...view,
    x: axis(view.x, view.width, MAP_BOUNDS.x, MAP_BOUNDS.width),
    y: axis(view.y, view.height, MAP_BOUNDS.y, MAP_BOUNDS.height),
  };
}
export function zoomView(view: View, anchor: Point, factor: number): View {
  const width = Math.max(
    400 / 3,
    Math.min(MAP_BOUNDS.width, view.width / factor),
  );
  const ratio = width / view.width;
  return {
    x: anchor.x - (anchor.x - view.x) * ratio,
    y: anchor.y - (anchor.y - view.y) * ratio,
    width,
    height: view.height * ratio,
  };
}
// Canonical endpoint order keeps lanes on the same side even for reverse routes.
export function laneSegment(
  lines: Cable[],
  lineIndex: number,
  a: number,
  b: number,
  sites: Site[] = SITES,
): [Point, Point] {
  const users = lines.flatMap((line, i) =>
    line.stops.some(
      (id, j) =>
        j > 0 &&
        ((id === a && line.stops[j - 1] === b) ||
          (id === b && line.stops[j - 1] === a)),
    )
      ? [i]
      : [],
  );
  const offset = (users.indexOf(lineIndex) - (users.length - 1) / 2) * 12;
  const lo = sites[Math.min(a, b)],
    hi = sites[Math.max(a, b)];
  const length = Math.hypot(hi.x - lo.x, hi.y - lo.y);
  const dx = (-(hi.y - lo.y) / length) * offset,
    dy = ((hi.x - lo.x) / length) * offset;
  return [
    { x: sites[a].x + dx, y: sites[a].y + dy },
    { x: sites[b].x + dx, y: sites[b].y + dy },
  ];
}
export function linePath(
  lines: Cable[],
  index: number,
  sites: Site[] = SITES,
): string {
  const stops = lines[index].stops;
  return stops
    .slice(1)
    .map((b, i) => {
      const a = stops[i];
      const [p, q] = laneSegment(lines, index, a, b, sites);
      // Short connectors stay beneath each device, hiding lane joins at corners.
      return `M${sites[a].x},${sites[a].y} L${p.x},${p.y} L${q.x},${q.y} L${sites[b].x},${sites[b].y}`;
    })
    .join(" ");
}
