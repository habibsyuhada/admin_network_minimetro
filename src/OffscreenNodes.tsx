import { useLayoutEffect, useState, type RefObject } from "react";
import { ArrowUp } from "lucide-react";
import { type Metro, type Site } from "./game/metro";
import { DeviceGlyph } from "./NetworkArt";
import { nodeName } from "./NodeDetails";
import type { View } from "./game/mapView";
type Marker = {
  id: number;
  count: number;
  x: number;
  y: number;
  angle: number;
  urgent: boolean;
};
export default function OffscreenNodes({
  state,
  view,
  svg,
  disabled,
  onFocus,
}: {
  state: Metro;
  view: View;
  svg: RefObject<SVGSVGElement | null>;
  disabled: boolean;
  onFocus: (n: Site) => void;
}) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  useLayoutEffect(() => {
    const el = svg.current;
    if (!el) return;
    const update = () => {
      const matrix = el.getScreenCTM(),
        box = el.getBoundingClientRect(),
        parent = el.parentElement!.getBoundingClientRect();
      if (!matrix || !box.width || !box.height) return;
      const bins = new Map<number, { id: number; urgent: boolean }[]>();
      const cx = box.width / 2,
        cy = box.height / 2;
      state.nodes.forEach((n, id) => {
        const urgent = state.overload[id] > 0;
        if (!urgent && state.cables.some((c) => c.stops.includes(id))) return;
        const point = new DOMPoint(n.x, n.y).matrixTransform(matrix),
          x = point.x - box.left,
          y = point.y - box.top;
        if (x >= 0 && x <= box.width && y >= 0 && y <= box.height) return;
        const bin =
          (Math.round(Math.atan2(y - cy, x - cx) / (Math.PI / 4)) + 8) % 8;
        bins.set(bin, [...(bins.get(bin) ?? []), { id, urgent }]);
      });
      setMarkers(
        [...bins].map(([bin, nodes]) => {
          nodes.sort(
            (a, b) =>
              Number(b.urgent) - Number(a.urgent) ||
              state.overload[b.id] - state.overload[a.id],
          );
          const angle = (bin * Math.PI) / 4,
            dx = Math.cos(angle),
            dy = Math.sin(angle);
          const scale = Math.min(
            Math.max(10, cx - 38) / (Math.abs(dx) || 0.0001),
            Math.max(10, cy - 70) / (Math.abs(dy) || 0.0001),
          );
          const x = box.left - parent.left + cx + dx * scale;
          let y = box.top - parent.top + cy + dy * scale;
          for (const control of el.parentElement!.querySelectorAll(
            ".map-camera-controls, .camera-toggle",
          )) {
            const r = control.getBoundingClientRect();
            if (
              r.width &&
              x + 28 > r.left - parent.left &&
              x - 28 < r.right - parent.left &&
              y + 28 > r.top - parent.top &&
              y - 28 < r.bottom - parent.top
            )
              y = r.top - parent.top - 36;
          }
          return {
            id: nodes[0].id,
            count: nodes.length,
            urgent: nodes.some((n) => n.urgent),
            angle: (angle * 180) / Math.PI + 90,
            x,
            y,
          };
        }),
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [state.nodes, state.cables, state.overload, view, svg]);
  return (
    <div className="offscreen-nodes" aria-label="Offscreen devices">
      {markers.map((m) => (
        <button
          key={m.id}
          className={`offscreen-node ${m.urgent ? "urgent" : ""}`}
          style={{ left: m.x, top: m.y }}
          disabled={disabled}
          onClick={() => onFocus(state.nodes[m.id])}
          aria-label={`Show ${nodeName(m.id, state.nodes)} on map${m.urgent ? ", overloaded" : ""}${m.count > 1 ? `, ${m.count} devices in this direction` : ""}`}
        >
          <ArrowUp
            className="edge-arrow"
            size={16}
            style={{ transform: `rotate(${m.angle}deg)` }}
          />
          <svg viewBox="-30 -30 60 60" aria-hidden="true">
            <DeviceGlyph
              kind={state.nodes[m.id].shape}
              variant={state.nodes[m.id].clientVariant}
            />
          </svg>
          {m.count > 1 && <span className="edge-count">{m.count}</span>}
          {m.urgent && <span className="edge-alert">!</span>}
        </button>
      ))}
    </div>
  );
}
