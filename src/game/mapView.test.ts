import { describe, it, expect } from "vitest";
import { emptyLine } from "./metro";
import { constrainView, laneSegment, zoomView } from "./mapView";
describe("map presentation", () => {
  it("stops at all four edges without changing zoom", () => {
    expect(
      constrainView({ x: -1000, y: -1000, width: 200, height: 300 }),
    ).toEqual({ x: 0, y: 0, width: 200, height: 300 });
    expect(
      constrainView({ x: 1000, y: 1000, width: 200, height: 300 }),
    ).toEqual({ x: 200, y: 300, width: 200, height: 300 });
    const inside = { x: 40, y: 80, width: 200, height: 300 };
    expect(constrainView(inside)).toEqual(inside);
  });
  it("centers axes larger than the map while allowing the other axis to pan", () => {
    expect(constrainView({ x: 900, y: 100, width: 500, height: 300 })).toEqual({
      x: -50,
      y: 100,
      width: 500,
      height: 300,
    });
    expect(constrainView({ x: -900, y: 900, width: 500, height: 700 })).toEqual(
      { x: -50, y: -50, width: 500, height: 700 },
    );
    expect(constrainView({ x: 40, y: 60, width: 400, height: 600 })).toEqual({
      x: 0,
      y: 0,
      width: 400,
      height: 600,
    });
  });
  it("separates shared connections even when a route runs in reverse", () => {
    const lines = [
      { ...emptyLine(), stops: [0, 1, 2] },
      { ...emptyLine(), stops: [2, 1, 0] },
    ];
    const a = laneSegment(lines, 0, 0, 1),
      b = laneSegment(lines, 1, 1, 0);
    expect(Math.hypot(a[0].x - b[1].x, a[0].y - b[1].y)).toBeCloseTo(12);
    expect(Math.hypot(a[1].x - b[0].x, a[1].y - b[0].y)).toBeCloseTo(12);
    expect(laneSegment(lines, 0, 1, 0)).toEqual([...a].reverse());
  });
  it("keeps all five lines distinct and centers a connection used by one line", () => {
    const lines = Array.from({ length: 5 }, () => ({
      ...emptyLine(),
      stops: [0, 1],
    }));
    const points = lines.map((_, i) => laneSegment(lines, i, 0, 1)[0]);
    expect(new Set(points.map((p) => `${p.x},${p.y}`)).size).toBe(5);
    expect(points[2]).toEqual({ x: 85, y: 125 });
    expect(laneSegment(lines.slice(0, 1), 0, 0, 1)[0]).toEqual(points[2]);
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
    expect(zoomView(view, anchor, 0.01).width).toBeCloseTo(400 / 0.65);
  });
});
