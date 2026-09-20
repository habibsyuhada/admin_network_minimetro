import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type PointerEvent,
} from "react";
import {
  constrainView,
  zoomView,
  MAP_BOUNDS,
  type Point,
  type View,
} from "./game/mapView";
type Motion = {
  kind: "pan" | "pinch" | "draw";
  view: View;
  center: Point;
  anchor: Point;
  distance: number;
  scale: number;
};
export default function useMapCamera(
  svg: RefObject<SVGSVGElement | null>,
  fit: View,
  frozen: boolean,
) {
  const [custom, setCustom] = useState<View>(fit);
  const view = constrainView(custom);
  const live = useRef(view);
  live.current = view;
  const disabled = useRef(frozen);
  disabled.current = frozen;
  const points = useRef(new Map<number, Point>());
  const motion = useRef<Motion | null>(null);
  const update = (v: View) => {
    const bounded = constrainView(v);
    live.current = bounded;
    setCustom(bounded);
  };
  const world = (p: Point): Point => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(p.x, p.y).matrixTransform(matrix.inverse())
      : p;
  };
  const clear = () => {
    points.current.clear();
    motion.current = null;
  };
  useEffect(() => {
    if (frozen) clear();
  }, [frozen]);
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (disabled.current || points.current.size) return;
      const amount =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1);
      update(
        zoomView(
          live.current,
          world({ x: e.clientX, y: e.clientY }),
          Math.exp(-Math.max(-200, Math.min(200, amount)) * 0.003),
        ),
      );
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [svg]);
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (frozen || e.button !== 0) return false;
    e.preventDefault();
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    svg.current?.setPointerCapture(e.pointerId);
    const values = [...points.current.values()];
    const a = values[0],
      b = values[1];
    const center = b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a;
    const node = (e.target as Element).closest(
      "[data-node-id], [data-router-draft]",
    );
    motion.current = {
      kind: b ? "pinch" : node ? "draw" : "pan",
      view: { ...live.current },
      center,
      anchor: world(center),
      distance: b ? Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)) : 1,
      scale: svg.current?.getScreenCTM()?.a || 1,
    };
    return motion.current.kind !== "draw";
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!points.current.has(e.pointerId)) return false;
    points.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const m = motion.current;
    if (!m || frozen) return true;
    if (m.kind === "draw") return false;
    const [a, b] = [...points.current.values()];
    if (m.kind === "pinch" && !b) return true;
    const center = b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a;
    const zoomed = b
      ? zoomView(
          m.view,
          m.anchor,
          Math.hypot(b.x - a.x, b.y - a.y) / m.distance,
        )
      : m.view;
    const scale = (m.scale * m.view.width) / zoomed.width;
    update({
      ...zoomed,
      x: zoomed.x - (center.x - m.center.x) / scale,
      y: zoomed.y - (center.y - m.center.y) / scale,
    });
    return true;
  };
  const end = (e: PointerEvent<SVGSVGElement>) => {
    const consumed = !motion.current || motion.current.kind !== "draw";
    points.current.delete(e.pointerId);
    if (!points.current.size) motion.current = null;
    return consumed;
  };
  return {
    view,
    down,
    move,
    end,
    clear,
    reset: () => {
      clear();
      setCustom(constrainView(fit));
    },
    overview: () => {
      clear();
      update(MAP_BOUNDS);
    },
    focus: (point: Point) => {
      clear();
      update({ x: point.x - 200, y: point.y - 200, width: 400, height: 400 });
    },
    zoom: (factor: number) => {
      if (!frozen)
        update(
          zoomView(
            live.current,
            {
              x: live.current.x + live.current.width / 2,
              y: live.current.y + live.current.height / 2,
            },
            factor,
          ),
        );
    },
  };
}
