import { useEffect, useRef, useState } from "react";
import type { Metro } from "./game/metro";
import { playCue } from "./game/audio";
type Pulse = { serial: number; key: number; kind: "arrival" | "build" };
export default function useGameFeedback(s: Metro) {
  const previous = useRef(s);
  const sequence = useRef(0);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  useEffect(() => {
    const old = previous.current;
    previous.current = s;
    if (s.time < old.time) {
      setPulses([]);
      return;
    }
    const events = new Map<number, Pulse["kind"]>();
    const mark = (id: number, kind: Pulse["kind"]) => {
      if (s.nodes[id]) events.set(s.nodes[id].serial!, kind);
    };
    if (s.phase !== old.phase) {
      if (s.phase === "complete") playCue("win");
      else if (s.phase === "over") playCue("fail");
      else if (s.phase === "reward") playCue("month");
    } else if (s.delivered > old.delivered) playCue("delivery");
    if (s.overload.some((v, i) => v > 0 && !(old.overload[i] > 0)))
      playCue("rush");
    if (s.nodes.length > old.nodes.length) {
      playCue(s.spawned > old.spawned ? "spawn" : "link");
      s.nodes.forEach((n, i) => {
        if (!old.nodes.some((p) => p.serial === n.serial)) mark(i, "build");
      });
    }
    if (
      s.nodes.length < old.nodes.length ||
      s.cables.length < old.cables.length
    )
      playCue("remove");
    if (s.inventory.length > old.inventory.length && s.gold < old.gold)
      playCue("upgrade");
    s.nodes.forEach((n, i) => {
      const p = old.nodes.find((v) => v.serial === n.serial);
      if (
        p &&
        (p.x !== n.x ||
          p.y !== n.y ||
          p.service !== n.service ||
          JSON.stringify(p.items) !== JSON.stringify(n.items))
      ) {
        mark(i, "build");
        playCue("upgrade");
      }
    });
    s.cables.forEach((c) => {
      const p = old.cables.find((v) => v.id === c.id);
      if (!p || p.kind !== c.kind) {
        c.stops.forEach((id) => mark(id, "build"));
        if (p) playCue("upgrade");
      } else if (p.at !== c.at && p.cargo.length)
        mark(c.stops[c.at], "arrival");
    });
    if (events.size)
      setPulses(
        [...events]
          .slice(0, 12)
          .map(([serial, kind]) => ({ serial, kind, key: ++sequence.current })),
      );
  }, [s]);
  useEffect(() => {
    if (!pulses.length) return;
    const timer = setTimeout(() => setPulses([]), 700);
    return () => clearTimeout(timer);
  }, [pulses]);
  return pulses;
}
