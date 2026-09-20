import { describe, it, expect } from "vitest";
import { type Cable } from "./metro";
const cable = (a: number, b: number, kind: 0 | 1 | 2 = 0): Cable => ({
  id: kind + 1,
  kind,
  stops: [a, b],
  at: 0,
  progress: 0,
  wait: 0.4,
  cargo: [],
});
import { constrainView, laneSegment, zoomView } from "./mapView";
describe("map presentation", () => {
  it("stops at all four edges without changing zoom", () => {
    expect(
      constrainView({ x: -1000, y: -1000, width: 200, height: 300 }),
    ).toEqual({ x: 0, y: 0, width: 200, height: 300 });
    expect(
      constrainView({ x: 10000, y: 10000, width: 200, height: 300 }),
    ).toEqual({ x: 800, y: 900, width: 200, height: 300 });
    const inside = { x: 40, y: 80, width: 200, height: 300 };
    expect(constrainView(inside)).toEqual(inside);
  });
  it("centers views larger than the fivefold map", () => {
    expect(constrainView({ x: 900, y: 100, width: 1100, height: 300 })).toEqual(
      { x: -50, y: 100, width: 1100, height: 300 },
    );
    expect(
      constrainView({ x: 900, y: 900, width: 1100, height: 1300 }),
    ).toEqual({ x: -50, y: -50, width: 1100, height: 1300 });
  });
  it("separates shared connections even when a route runs in reverse", () => {
    const lines = [cable(0, 1), cable(1, 0, 1)];
    const a = laneSegment(lines, 0, 0, 1),
      b = laneSegment(lines, 1, 1, 0);
    expect(Math.hypot(a[0].x - b[1].x, a[0].y - b[1].y)).toBeCloseTo(12);
    expect(Math.hypot(a[1].x - b[0].x, a[1].y - b[0].y)).toBeCloseTo(12);
    expect(laneSegment(lines, 0, 1, 0)).toEqual([...a].reverse());
  });
  it("keeps all three cable types distinct and centers a connection used by one line", () => {
    const lines = [cable(0, 1, 0), cable(0, 1, 1), cable(0, 1, 2)];
    const points = lines.map((_, i) => laneSegment(lines, i, 0, 1)[0]);
    expect(new Set(points.map((p) => `${p.x},${p.y}`)).size).toBe(3);
    expect(points[1]).toEqual({ x: 85, y: 125 });
    expect(laneSegment(lines.slice(0, 1), 0, 0, 1)[0]).toEqual(points[1]);
  });
  it("preserves the world point under the zoom anchor and bounds zoom", () => {
    const view = { x: 20, y: 60, width: 400, height: 500 },
      anchor = { x: 100, y: 200 };
    const next = zoomView(view, anchor, 2);
    expect((anchor.x - next.x) / next.width).toBeCloseTo(
      (anchor.x - view.x) / view.width,
    );
    expect((anchor.y - next.y) / next.height).toBeCloseTo(
      (anchor.y - view.y) / view.height,
    );
    expect(zoomView(view, anchor, 100).width).toBeCloseTo(400 / 3);
    expect(zoomView(view, anchor, 0.01).width).toBeCloseTo(1000);
  });
});
