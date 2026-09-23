import GameSettings, { type GameSettingsProps } from "./GameSettings";
import VisualGuide from "./VisualGuide";
import { ItemIcon, Gold } from "./GameIcons";
import OffscreenNodes from "./OffscreenNodes";
import useGameFeedback from "./useGameFeedback";
import ItemPanel from "./ItemPanel";
import EnvironmentArt from "./EnvironmentArt";
import { ITEMS } from "./game/items";
import { terrainFor, terrainNotice } from "./game/environment";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Pause,
  Play,
  Settings2,
  Plus,
  Cable,
  Menu,
  Maximize,
  Target,
} from "lucide-react";
import { getLevel, missionStars } from "./game/levels";
import Dialog from "./Dialog";
import NodeDetails, { nodeName, nodeCode } from "./NodeDetails";
import {
  CABLE_TYPES,
  OVERLOAD_SECONDS,
  changeCable,
  monthlyItems,
  buyItem,
  TRANSIT_KINDS,
  transitUnlocked,
  itemSlots,
  packetKind,
  packetVariant,
  TRANSIT,
  isTransit,
  moveTransit,
  sellTransit,
  nodeRefund,
  type TransitKind,
  nodeBuffer,
  maintenanceDue,
  maintenanceRate,
  cableCapacity,
  connectionError,
  type CableKind,
  placeRouter,
  routerError,
  removeCable,
  connectCable,
  metroTick,
  newMetro,
  reward,
} from "./game/metro";
import "./metro.css";
import { DeviceGlyph, DEVICE_COLORS } from "./NetworkArt";
import { playCue } from "./game/audio";
import useMapCamera from "./useMapCamera";
import { laneSegment, linePath, MAP_BOUNDS } from "./game/mapView";

export default function MetroGame({
  onMenu,
  levelId,
  onComplete,
  music = true,
  onToggleMusic,
  sound = true,
  onToggleSound,
  displaySettings,
}: {
  displaySettings: Pick<
    GameSettingsProps,
    "orientation" | "orientationNote" | "onOrientation"
  >;
  music?: boolean;
  onToggleMusic?: () => void;
  sound?: boolean;
  onToggleSound?: () => void;
  onMenu: (delivered: number) => void;
  levelId?: string;
  onComplete?: (id: string, stars: number) => void;
}) {
  const level = getLevel(levelId);
  const [s, setS] = useState(() => newMetro(level?.seed, level?.id));
  const pulses = useGameFeedback(s);
  const awarded = useRef(false);
  useEffect(() => {
    if (s.phase === "complete" && level && !awarded.current) {
      awarded.current = true;
      onComplete?.(level.id, missionStars(level, s.delivered, s.gold));
    }
  }, [s.phase, s.delivered, s.gold, level, onComplete]);
  const best = useRef(0);
  best.current = Math.max(best.current, s.delivered);
  const [buildKind, setBuildKind] = useState<TransitKind>(3);
  const spec = TRANSIT[buildKind];
  const [draft, setDraft] = useState<{
    x: number;
    y: number;
    moveId?: number;
  } | null>(null);
  const placing = draft !== null;
  const [sale, setSale] = useState<number | null>(null);
  const renderNodes = s.nodes.map((n, i) =>
    draft?.moveId === i ? { ...n, x: draft.x, y: draft.y } : n,
  );
  const draftError = draft
    ? routerError(s, draft.x, draft.y, buildKind, draft.moveId)
    : null;
  const placement = useRef<{ id: number; x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<CableKind>(0);
  const [tray, setTray] = useState<"cables" | "nodes" | null>(null);
  const [gamePanel, setGamePanel] = useState<
    "stats" | "menu" | "inventory" | null
  >(null);
  const [inventoryNode, setInventoryNode] = useState<number>(-1);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const hasOverload = s.overload.some((seconds) => seconds > 0);
  const effectiveSpeed = hasOverload ? 1 : speed;
  useEffect(() => {
    if (hasOverload) setSpeed(1);
  }, [hasOverload]);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [help, setHelp] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [showNodes, setShowNodes] = useState(false);
  const [detailNode, setDetailNode] = useState<number | null>(null);
  const [tip, setTip] = useState(
    "Drag between devices to connect them. Tap a node for details.",
  );
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const gesture = useRef<{
    pointer: number;
    start: number;
    x: number;
    y: number;
  } | null>(null);
  const frozen =
    help ||
    gamePanel !== null ||
    confirm ||
    showNodes ||
    sale !== null ||
    s.phase !== "running";
  const stopped = paused || frozen || placing || tray !== null;
  useEffect(() => {
    const hide = () => {
      if (document.hidden) setPaused(true);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target as Element).closest("dialog")) {
        gesture.current = null;
        setPointer(null);
        if (placing) setDraft(null);
        else setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("keydown", key);
    };
  }, [placing]);
  useEffect(() => {
    if (stopped) {
      gesture.current = null;
      setPointer(null);
      return;
    }
    let last = performance.now(),
      accumulator = 0;
    const timer = window.setInterval(() => {
      const now = performance.now();
      accumulator += Math.min(0.5, (now - last) / 1000) * effectiveSpeed;
      last = now;
      if (document.hidden) {
        accumulator = 0;
        return;
      }
      const steps = Math.floor((accumulator + 1e-9) / 0.1);
      accumulator -= steps * 0.1;
      if (steps)
        setS((v) => {
          for (let i = 0; i < steps; i++) {
            v = metroTick(v);
            if (effectiveSpeed > 1 && v.overload.some((seconds) => seconds > 0))
              break;
          }
          return v;
        });
    }, 50);
    return () => clearInterval(timer);
  }, [stopped, effectiveSpeed]);
  const build = (a: number, b: number) => {
    const error = connectionError(s, selected, a, b);
    if (error) {
      setTip(error);
      setBuildError(error);
      playCue("error");
      return;
    }
    setBuildError(null);
    setS((v) => connectCable(v, selected, a, b));
    playCue("link");
    setTip(
      `${CABLE_TYPES[s.nodes[a].shape === 11 && s.nodes[b].shape === 11 ? 3 : selected].name} connected. Its carrier is ready.`,
    );
  };
  const inspect = (id: number) => {
    if (frozen || placing) return;
    setDetailNode(id);
    setShowNodes(true);
  };
  const position = (x: number, y: number) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(x, y).matrixTransform(matrix.inverse())
      : { x: 0, y: 0 };
  };
  const previewTarget = pointer
    ? s.nodes.findIndex(
        (n) => Math.hypot(n.x - pointer.x, n.y - pointer.y) < 34,
      )
    : -1;
  const previewError =
    gesture.current && previewTarget >= 0
      ? connectionError(s, selected, gesture.current.start, previewTarget)
      : null;
  const danger = s.overload.indexOf(Math.max(...s.overload));
  const camera = useMapCamera(
    svg,
    { x: 0, y: 20, width: 400, height: 520 },
    frozen || tray !== null,
  );
  const restart = () => {
    camera.reset();
    setS(newMetro(level?.seed, level?.id));
    awarded.current = false;
    setDraft(null);
    setSelected(0);
    setPaused(false);
    setSpeed(1);
    setBuildError(null);
    setConfirm(false);
    setTip("Drag between devices to connect them. Tap a node for details.");
  };
  return (
    <main
      className={`metro-game ${stopped ? "effects-paused" : ""}`}
      style={
        { "--map-accent": level?.color ?? "#9fe8ba" } as React.CSSProperties
      }
    >
      <header className="metro-header">
        <button
          className="hud-menu"
          aria-label="Game menu"
          onClick={() => setGamePanel("menu")}
        >
          <Menu size={20} />
        </button>
        <button
          className="hud-wallet"
          aria-label="View finances and goals"
          onClick={() => setGamePanel("stats")}
        >
          <strong data-testid="gold">
            <Gold amount={s.gold} />
          </strong>
        </button>
        <span className="hud-month">
          Month {s.month}
          <progress aria-label="Month progress" value={s.time % 60} max={60} />
        </span>
        <div className="simulation-controls" aria-label="Simulation speed">
          <button
            aria-label={paused ? "Resume Flow" : "Pause Flow"}
            aria-pressed={paused}
            onClick={() => setPaused((v) => !v)}
            disabled={frozen || placing}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button
            aria-label="Simulation speed"
            title={
              hasOverload
                ? "Clear overloaded nodes to speed up"
                : "Change simulation speed"
            }
            onClick={() => setSpeed((v) => (v === 1 ? 2 : v === 2 ? 3 : 1))}
            disabled={frozen || placing || hasOverload}
          >
            {effectiveSpeed}x
          </button>
        </div>
      </header>
      <span
        className="sr-only"
        data-testid="flow-clock"
        aria-label="Elapsed time"
      >
        {String(Math.floor(s.time / 60)).padStart(2, "0")}:
        {String(Math.floor(s.time % 60)).padStart(2, "0")}
      </span>
      <span className="sr-only" data-testid="cable-count">
        {s.cables.length} active cables
      </span>
      <span className="sr-only" data-testid="delivered">
        {s.delivered}
      </span>
      <div className="metro-map-wrap">
        {terrainNotice(s) && (
          <button
            className="environment-badge"
            onClick={() => setGamePanel("stats")}
          >
            {s.levelId === "downtown"
              ? s.month % 4 === 2
                ? "Road works next month"
                : s.month % 4 === 3 || s.month % 4 === 0
                  ? "Road works active"
                  : "Road works schedule"
              : s.month % 4 === 3
                ? "Flood next month"
                : s.month % 4 === 0
                  ? "Flood active"
                  : "Flood schedule"}
          </button>
        )}
        {paused && !help && s.phase === "running" && (
          <div className="planning-banner" role="status">
            <Pause size={12} /> Design mode
          </div>
        )}
        {(buildError || previewError) && (
          <div className="connection-error" role="alert">
            <span>
              <b>Could not connect cable.</b> {buildError ?? previewError}
            </span>
            <button
              aria-label="Dismiss error"
              onClick={() => setBuildError(null)}
            >
              Close
            </button>
          </div>
        )}

        <svg
          ref={svg}
          viewBox={`${camera.view.x} ${camera.view.y} ${camera.view.width} ${camera.view.height}`}
          className="metro-map"
          role="group"
          aria-label="Interactive Flow map"
          onPointerDown={(e) => {
            if (camera.down(e)) {
              placement.current = null;
              gesture.current = null;
              setPointer(null);
            }
          }}
          onPointerMove={(e) => {
            if (camera.move(e)) {
              gesture.current = null;
              setPointer(null);
              return;
            }
            if (draft && placement.current?.id === e.pointerId) {
              const p = position(e.clientX, e.clientY);
              setDraft({
                ...draft,
                x: Math.max(40, Math.min(960, p.x - placement.current.x)),
                y: Math.max(40, Math.min(1160, p.y - placement.current.y)),
              });
              return;
            }
            const g = gesture.current;
            if (g?.pointer === e.pointerId)
              setPointer(position(e.clientX, e.clientY));
          }}
          onPointerUp={(e) => {
            placement.current = null;
            const consumed = camera.end(e);
            const g = gesture.current;
            gesture.current = null;
            setPointer(null);
            if (
              placing ||
              consumed ||
              !g ||
              g.pointer !== e.pointerId ||
              frozen
            )
              return;
            if (Math.hypot(e.clientX - g.x, e.clientY - g.y) < 10) {
              inspect(g.start);
              return;
            }
            const p = position(e.clientX, e.clientY);
            const target = s.nodes.findIndex(
              (n, id) =>
                id < s.queues.length && Math.hypot(n.x - p.x, n.y - p.y) < 30,
            );
            if (target < 0 || target === g.start) {
              setTip("Release over the destination device to connect it.");
              return;
            }
            build(g.start, target);
          }}
          onPointerCancel={() => {
            placement.current = null;
            camera.clear();
            gesture.current = null;
            setPointer(null);
          }}
          onLostPointerCapture={(e) => {
            placement.current = null;
            camera.end(e);
            gesture.current = null;
            setPointer(null);
          }}
        >
          <rect
            className="blank-map-land"
            width={MAP_BOUNDS.width}
            height={MAP_BOUNDS.height}
            fill="#173039"
          />
          <EnvironmentArt state={s} />
          {s.cables.map((_, i) => (
            <g key={i} className="route-layer" aria-hidden="true">
              <path
                className="metro-route route-casing"
                d={linePath(s.cables, i, renderNodes)}
                stroke="#173039"
                strokeWidth="9"
              />
              <path
                className="metro-route"
                data-route={i}
                d={linePath(s.cables, i, renderNodes)}
                stroke={CABLE_TYPES[s.cables[i].kind].color}
                strokeDasharray={s.cables[i].kind === 3 ? "6 5" : undefined}
                strokeWidth={selected === s.cables[i].kind ? 6 : 5}
              />
            </g>
          ))}
          <g className="feedback-layer" pointerEvents="none" aria-hidden="true">
            {pulses.map((p) => {
              const n = s.nodes.find((n) => n.serial === p.serial);
              return n ? (
                <circle
                  key={p.key}
                  cx={n.x}
                  cy={n.y}
                  r="32"
                  className={`node-feedback ${p.kind}`}
                />
              ) : null;
            })}
          </g>
          {pointer && (
            <line
              className="metro-preview"
              x1={s.nodes[gesture.current?.start ?? 0].x}
              y1={s.nodes[gesture.current?.start ?? 0].y}
              x2={pointer.x}
              y2={pointer.y}
              stroke={
                previewTarget >= 0
                  ? previewError
                    ? "#ff7777"
                    : "#b9f595"
                  : CABLE_TYPES[selected].color
              }
            />
          )}
          <g pointerEvents="none" aria-hidden="true">
            {s.nodes.map((n, id) =>
              draft?.moveId === id ? null : (
                <g key={id} transform={`translate(${n.x},${n.y})`}>
                  {!isTransit(n.shape) && (
                    <g className="automatic-node-pulse">
                      <circle r="30" />
                      <circle r="30" />
                    </g>
                  )}
                  {s.overload[id] > 0 && (
                    <circle r="33" className="overload-pulse" />
                  )}
                </g>
              ),
            )}
          </g>
          {s.queues.map((q, id) => {
            if (draft?.moveId === id) return null;
            const n = s.nodes[id];
            return (
              <g
                key={id}
                data-node-id={id}
                data-client-variant={
                  n.shape === 0 ? (n.clientVariant ?? 0) : undefined
                }
                transform={`translate(${n.x},${n.y})`}
                role="button"
                aria-label={nodeName(id, s.nodes)}
                tabIndex={frozen ? -1 : 0}
                className="metro-node"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inspect(id);
                  }
                }}
                onPointerDown={(e) => {
                  if (placing || frozen || !e.isPrimary || e.button !== 0)
                    return;
                  e.preventDefault();
                  svg.current?.setPointerCapture(e.pointerId);
                  gesture.current = {
                    pointer: e.pointerId,
                    start: id,
                    x: e.clientX,
                    y: e.clientY,
                  };
                }}
              >
                <circle r="30" fill="transparent" />
                {s.overload[id] > 0 && (
                  <circle
                    r="32"
                    className="metro-danger-ring"
                    strokeDasharray={`${(s.overload[id] / OVERLOAD_SECONDS) * 201} 201`}
                    transform="rotate(-90)"
                  />
                )}
                <DeviceGlyph kind={n.shape} variant={n.clientVariant} />
                {[12, 14].includes(n.shape) && (
                  <g transform="translate(22,-20) scale(.42)">
                    <DeviceGlyph kind={n.service ?? 1} />
                  </g>
                )}
                {!!n.items?.length && (
                  <text x="-25" y="-25" fill="#ffd47f" fontSize="9">
                    {n.items.length}★
                  </text>
                )}
                <text y="-34" className="metro-node-id">
                  {nodeCode(id, s.nodes)}
                </text>
                <g aria-hidden="true" transform="translate(-24, 35)">
                  {q.slice(0, 6).map((packet, index) => (
                    <g
                      key={index}
                      transform={`translate(${(index % 3) * 17},${Math.floor(index / 3) * 15})`}
                    >
                      <rect
                        x="-7"
                        y="-7"
                        width="14"
                        height="13"
                        rx="3"
                        fill="#142c29"
                        stroke={DEVICE_COLORS[packetKind(packet.service)]}
                        strokeWidth=".6"
                      />
                      <g transform="scale(.29)">
                        <DeviceGlyph
                          kind={packetKind(packet.service)}
                          variant={packetVariant(packet.service)}
                          compact
                        />
                      </g>
                    </g>
                  ))}
                  {q.length > 6 && (
                    <text x="50" y="17" className="metro-queue">
                      +{q.length - 6}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
          {draft && (
            <g
              data-router-draft="true"
              role="button"
              aria-label={`Move preview ${spec.name.toLowerCase()}`}
              tabIndex={0}
              transform={`translate(${draft.x},${draft.y})`}
              className="router-draft"
              onKeyDown={(e) => {
                const delta: Record<string, [number, number]> = {
                  ArrowLeft: [-10, 0],
                  ArrowRight: [10, 0],
                  ArrowUp: [0, -10],
                  ArrowDown: [0, 10],
                };
                if (delta[e.key]) {
                  e.preventDefault();
                  setDraft({
                    ...draft,
                    x: Math.max(40, Math.min(960, draft.x + delta[e.key][0])),
                    y: Math.max(40, Math.min(1160, draft.y + delta[e.key][1])),
                  });
                }
              }}
              onPointerDown={(e) => {
                if (frozen || !e.isPrimary || e.button !== 0) return;
                e.preventDefault();
                const p = position(e.clientX, e.clientY);
                placement.current = {
                  id: e.pointerId,
                  x: p.x - draft.x,
                  y: p.y - draft.y,
                };
                svg.current?.setPointerCapture(e.pointerId);
              }}
            >
              <circle
                r="37"
                fill="#25362bcc"
                stroke={draftError ? "#f48b73" : "#f2d779"}
                strokeDasharray="5 4"
              />
              <DeviceGlyph kind={buildKind} />
              <text y="-45" className="metro-node-id">
                DRAG {spec.name.toUpperCase()}
              </text>
            </g>
          )}
          {s.cables.map((l, i) => {
            if (l.stops.length < 2) return null;
            const from = l.stops[l.at],
              to = l.stops[l.at === 0 ? 1 : 0];
            if (to === undefined) return null;
            const [a, b] = laneSegment(s.cables, i, from, to, renderNodes);
            const x = a.x + (b.x - a.x) * l.progress,
              y = a.y + (b.y - a.y) * l.progress;
            return (
              <g
                key={l.id}
                data-carrier={l.id}
                className="packet-marker"
                transform={`translate(${x},${y}) rotate(${(((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 270) % 180) - 90})`}
                aria-hidden="true"
              >
                <rect
                  x="-19"
                  y="-6"
                  width="38"
                  height="12"
                  rx="3"
                  fill={CABLE_TYPES[l.kind].color}
                  stroke="#173039"
                  strokeWidth="2"
                />
                <text className="metro-car-count" y="3" style={{ fontSize: 8 }}>
                  {l.cargo.length}/{cableCapacity(s, l.kind, l)}
                </text>
              </g>
            );
          })}
        </svg>
        <OffscreenNodes
          state={s}
          view={camera.view}
          svg={svg}
          disabled={frozen || placing || pointer !== null}
          onFocus={(n) => camera.focus(n)}
        />
        <button
          className="camera-toggle"
          aria-label="Map controls"
          aria-expanded={cameraOpen}
          onClick={() => setCameraOpen((v) => !v)}
        >
          <Maximize size={18} />
        </button>
        <div
          hidden={!cameraOpen}
          className="map-camera-controls"
          aria-label="Map view controls"
        >
          <button
            aria-label="Show whole map"
            disabled={frozen}
            onClick={camera.overview}
          >
            Map
          </button>
          <span>Drag to pan · Pinch to zoom</span>
          <button
            aria-label="Zoom out"
            disabled={frozen || camera.view.width >= MAP_BOUNDS.width}
            onClick={() => camera.zoom(1 / 1.25)}
          >
            −
          </button>
          <button
            aria-label="Reset map view"
            disabled={frozen}
            onClick={camera.reset}
          >
            {Math.round((400 / camera.view.width) * 100)}%
          </button>
          <button
            aria-label="Zoom in"
            disabled={frozen || camera.view.width <= 400 / 3}
            onClick={() => camera.zoom(1.25)}
          >
            +
          </button>
        </div>
        <div
          className={`metro-notice ${s.overload[danger] > 0 ? "is-danger" : ""}`}
          role="status"
        >
          {s.overload[danger] > 0
            ? `Device ${danger + 1} full · ${Math.max(0, Math.ceil(OVERLOAD_SECONDS - s.overload[danger]))} seconds to clear the queue`
            : "Deliver packets to nodes with matching service icons"}
        </div>
      </div>
      <section className="metro-controls" aria-label="Cable controls">
        {!draft && (
          <nav className="play-dock" aria-label="Network tools">
            <button
              aria-label="Choose cable"
              aria-haspopup="dialog"
              aria-expanded={tray === "cables"}
              onClick={() => setTray((v) => (v === "cables" ? null : "cables"))}
              style={
                {
                  "--route": CABLE_TYPES[selected].color,
                } as React.CSSProperties
              }
            >
              <Cable size={23} />
              <span>{CABLE_TYPES[selected].name}</span>
              <i />
            </button>
            <button
              aria-label="Build device"
              aria-haspopup="dialog"
              aria-expanded={tray === "nodes"}
              onClick={() => setTray((v) => (v === "nodes" ? null : "nodes"))}
            >
              <Plus size={24} />
              <span>Build</span>
            </button>
            <button
              aria-label="View mission and statistics"
              onClick={() => setGamePanel("stats")}
            >
              <Target size={23} />
              <span>{level ? "Mission" : "Statistics"}</span>
            </button>
          </nav>
        )}
        {draft && (
          <div className="router-confirm">
            <p role="status">
              {draftError ??
                (draft.moveId !== undefined
                  ? `Move ${spec.name}. Free move; cables stay connected. Choose OK to save or Cancel to go back.`
                  : `Drag ${spec.name} to your preferred position. Price: ${spec.cost} gold. Simulation paused.`)}
            </p>
            <button
              disabled={frozen || !!draftError}
              onClick={() => {
                setS((v) =>
                  draft.moveId !== undefined
                    ? moveTransit(v, draft.moveId, draft.x, draft.y)
                    : placeRouter(v, draft.x, draft.y, buildKind),
                );
                setDraft(null);
                setTip(
                  draft.moveId !== undefined
                    ? `${spec.name} moved. Cables remain connected.`
                    : `${spec.name} placed. Drag a cable to connect it.`,
                );
              }}
            >
              OK
            </button>
            <button onClick={() => setDraft(null)}>Cancel</button>
          </div>
        )}
        <span className="sr-only" role="status">
          {tip}
        </span>
      </section>
      {tray && !draft && (
        <Dialog
          title={tray === "nodes" ? "Build a device" : "Choose a cable"}
          onClose={() => setTray(null)}
        >
          <div className="build-modal">
            {tray === "nodes" ? (
              <>
                <p>Choose a device, then drag it into position on the map.</p>
                <div className="transit-choice">
                  {TRANSIT_KINDS.filter((kind) => transitUnlocked(s, kind)).map(
                    (kind) => (
                      <button
                        key={kind}
                        disabled={frozen || s.gold < TRANSIT[kind].cost}
                        onClick={() => {
                          setTray(null);
                          setBuildKind(kind);
                          setDraft({
                            x: Math.max(
                              40,
                              Math.min(
                                960,
                                camera.view.x + camera.view.width / 2,
                              ),
                            ),
                            y: Math.max(
                              40,
                              Math.min(
                                1160,
                                camera.view.y + camera.view.height / 2,
                              ),
                            ),
                          });
                        }}
                      >
                        <svg viewBox="-30 -30 60 60" aria-hidden="true">
                          <DeviceGlyph kind={kind} />
                        </svg>
                        <span>
                          + Place {TRANSIT[kind].name.toLowerCase()}
                          <small>
                            {TRANSIT[kind].ports} ports · {TRANSIT[kind].buffer}{" "}
                            packet buffer
                          </small>
                        </span>
                        <small>
                          <Gold amount={TRANSIT[kind].cost} />
                        </small>
                      </button>
                    ),
                  )}
                </div>
              </>
            ) : (
              <>
                <p>Choose a cable type, then drag between two nodes.</p>
                <div className="metro-line-buttons cable-type-buttons">
                  {CABLE_TYPES.slice(0, 3).map((type, i) => (
                    <button
                      key={type.name}
                      aria-label={`Cable ${type.name}`}
                      aria-pressed={selected === i}
                      disabled={frozen || placing}
                      style={{ "--route": type.color } as React.CSSProperties}
                      onClick={() => {
                        setSelected(i as CableKind);
                        setTray(null);
                        setTip(
                          `${type.name}: ${cableCapacity(s, i as CableKind)} packets/carrier · price ${type.cost} gold. ${type.note}.`,
                        );
                      }}
                    >
                      <span>{type.name}</span>
                      <small>
                        {cableCapacity(s, i as CableKind)} packets ·{" "}
                        <Gold amount={type.cost} />
                      </small>
                    </button>
                  ))}
                  <button
                    className="metro-clear"
                    aria-label="Manage cables"
                    disabled={frozen || placing || !s.cables.length}
                    onClick={() => {
                      setTray(null);
                      setConfirm(true);
                    }}
                  >
                    <Settings2 size={18} />
                    <span>Manage cables</span>
                  </button>
                </div>
              </>
            )}
            <button
              className="secondary"
              onClick={() => {
                setTray(null);
                setGamePanel("inventory");
              }}
            >
              Inventory · {s.inventory.length} items
            </button>
          </div>
        </Dialog>
      )}
      {gamePanel && (
        <Dialog
          title={
            gamePanel === "stats"
              ? "Your network"
              : gamePanel === "inventory"
                ? "Inventory"
                : "Game menu"
          }
          onClose={() => setGamePanel(null)}
        >
          <h2>{level?.name ?? "Endless Mode"}</h2>
          {gamePanel === "inventory" ? (
            <>
              <p>
                Equip or move items while the simulation is paused. Items are
                purchased only at month end.
              </p>
              <label>
                Target device
                <select
                  aria-label="Target device"
                  value={inventoryNode}
                  onChange={(e) => setInventoryNode(Number(e.target.value))}
                >
                  <option value={-1}>Choose a device</option>
                  {s.nodes.map((n, id) =>
                    itemSlots(n) > 0 ? (
                      <option key={n.serial} value={id}>
                        {nodeName(id, s.nodes)}
                      </option>
                    ) : null,
                  )}
                </select>
              </label>
              {inventoryNode >= 0 && s.nodes[inventoryNode] ? (
                <ItemPanel state={s} node={inventoryNode} onUpdate={setS} />
              ) : (
                <>
                  <p>
                    {s.inventory.length} items in storage. Choose a device to
                    equip them.
                  </p>
                  <div className="inventory-overview">
                    {[...new Set(s.inventory)].map((key) => (
                      <div key={key} className="item-heading">
                        <ItemIcon kind={key} />
                        <strong>
                          {ITEMS[key].name} ×
                          {s.inventory.filter((item) => item === key).length}
                        </strong>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : gamePanel === "stats" ? (
            <>
              {!!terrainFor(s.levelId).length && (
                <section className="environment-help">
                  <h3>Environment</h3>
                  <p>{terrainNotice(s)}</p>
                  <p>
                    Buildings allow endpoint connections, but cannot be crossed
                    as shortcuts. Transit devices must stay outside. Rocky
                    ridges block all links. Rivers require a bridge crossing (2
                    cables per bridge) or a Wireless Bridge pair.
                  </p>
                  <p>
                    Map obstacles also apply when moving connected devices.
                    Existing links survive road works. Floods slow exposed
                    cables, but do not destroy equipment.
                  </p>
                </section>
              )}
              <section className="metro-score" aria-label="Flow statistics">
                <div>
                  <small>PACKETS DELIVERED</small>
                  <strong>{s.delivered}</strong>
                </div>
                <div className="metro-calendar">
                  <small>MONTH {s.month}</small>
                  <strong>
                    {String(Math.floor(s.time / 60)).padStart(2, "0")}:
                    {String(Math.floor(s.time % 60)).padStart(2, "0")}
                  </strong>
                </div>
              </section>
              <div className="economy-bar" aria-label="This month finances">
                <strong>
                  Balance: <Gold amount={s.gold} />
                </strong>
                <span>
                  Profit: <Gold amount={s.profit} />
                </span>
                <span>
                  Maintenance: <Gold amount={maintenanceDue(s)} />
                </span>
                <span>
                  Net: <Gold amount={s.profit - maintenanceDue(s)} />
                </span>
              </div>
              {level && (
                <p className="mission-brief">
                  Target: {level.months} months · {s.delivered}/{level.packets}{" "}
                  packets
                </p>
              )}
              <div className="cable-inventory">
                <span>{s.cables.length} active cables</span>
                <span>Full maintenance: {maintenanceRate(s)} / month</span>
                <button
                  aria-label="Node details"
                  disabled={s.phase !== "running"}
                  onClick={() => {
                    setGamePanel(null);
                    setDetailNode(null);
                    setShowNodes(true);
                  }}
                >
                  Node details
                </button>
                <button
                  onClick={() => {
                    setGamePanel(null);
                    setHelp(true);
                  }}
                >
                  Guide
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                className="secondary"
                onClick={() => {
                  setGamePanel(null);
                  setHelp(true);
                }}
              >
                How to play
              </button>
              <button
                className="secondary"
                onClick={() => setGamePanel("inventory")}
              >
                Inventory · {s.inventory.length} items
              </button>
              <GameSettings
                {...displaySettings}
                music={music}
                sound={sound}
                onToggleMusic={onToggleMusic}
                onToggleSound={onToggleSound}
              />
              <button
                className="secondary"
                onClick={() => onMenu(best.current)}
              >
                End session &amp; exit
              </button>
            </>
          )}
          <button className="primary" onClick={() => setGamePanel(null)}>
            Resume game
          </button>
        </Dialog>
      )}
      {help && (
        <Dialog
          title="Small network, big possibilities"
          onClose={() => setHelp(false)}
        >
          {level && (
            <div className="guide-mission">
              <b>{level.name}</b>
              <span>
                {level.months} months · {level.packets} packets ·{" "}
                <Gold amount={level.gold} />
              </span>
              <span className="sr-only">
                Target: survive {level.months} months and deliver{" "}
                {level.packets} packets
              </span>
            </div>
          )}
          <VisualGuide />
          <small className="guide-save-note">
            Active runs reset when you reload.
          </small>
          <button className="primary" onClick={() => setHelp(false)}>
            Start connecting
          </button>
        </Dialog>
      )}
      {showNodes && (
        <Dialog
          title={
            detailNode === null
              ? "Node details"
              : `Details: ${nodeName(detailNode, s.nodes)}`
          }
          onClose={() => setShowNodes(false)}
        >
          {detailNode !== null && (
            <button
              className="secondary"
              onClick={() => {
                camera.focus(s.nodes[detailNode]);
                setShowNodes(false);
              }}
            >
              Locate node on map
            </button>
          )}
          {detailNode !== null && isTransit(s.nodes[detailNode].shape) && (
            <div className="node-actions">
              <button
                className="secondary"
                onClick={() => {
                  const node = s.nodes[detailNode];
                  if (!isTransit(node.shape)) return;
                  setBuildKind(node.shape);
                  camera.focus(node);
                  setDraft({ x: node.x, y: node.y, moveId: detailNode });
                  setShowNodes(false);
                }}
              >
                Move
              </button>
              <button
                className="secondary"
                onClick={() => {
                  setSale(detailNode);
                  setShowNodes(false);
                }}
              >
                Sell node
              </button>
            </div>
          )}
          <NodeDetails
            state={s}
            onUpdate={setS}
            node={detailNode}
            onSelect={setDetailNode}
            onChangeCable={(id, kind) => {
              setS((v) => changeCable(v, id, kind));
              setTip(
                "Cable type changed. The price difference has been applied.",
              );
            }}
            onRemoveCable={(id) => {
              setS((v) => removeCable(v, id));
              setBuildError(null);
              setTip("Cable removed. The full purchase price was refunded.");
            }}
          />
          {detailNode !== null && itemSlots(s.nodes[detailNode]) > 0 && (
            <ItemPanel state={s} node={detailNode} onUpdate={setS} />
          )}
          <button className="primary" onClick={() => setShowNodes(false)}>
            Back to map
          </button>
        </Dialog>
      )}
      {sale !== null && (
        <Dialog
          title={`Sell ${nodeName(sale, s.nodes)}?`}
          onClose={() => setSale(null)}
        >
          <p>
            50% of the device price plus a full refund for{" "}
            {s.cables.filter((c) => c.stops.includes(sale)).length} connected
            cables:{" "}
            <b>
              <Gold amount={nodeRefund(s, sale)} />
            </b>
            .
          </p>
          <p>
            Waiting and carried packets are reassigned to remaining nodes.
            Accrued maintenance is still charged.
          </p>
          <button
            className="primary"
            onClick={() => {
              setS((v) => sellTransit(v, sale));
              setSale(null);
              setDetailNode(null);
              setTip(
                "Device sold for 50% of its price. Connected cables were fully refunded.",
              );
            }}
          >
            Sell node
          </button>
          <button className="secondary" onClick={() => setSale(null)}>
            Cancel
          </button>
        </Dialog>
      )}
      {confirm && (
        <Dialog title="Manage cables" onClose={() => setConfirm(false)}>
          <p>
            Remove a cable for a full refund. Cargo returns to its departure
            node. Other cables stay connected.
          </p>
          <div className="cable-list">
            {s.cables.map((c) => (
              <div key={c.id}>
                <div>
                  <b style={{ color: CABLE_TYPES[c.kind].color }}>
                    {CABLE_TYPES[c.kind].name} #{c.id}
                  </b>
                  <small>
                    {c.stops.map((id) => nodeName(id, s.nodes)).join(" ↔ ")} ·{" "}
                    {c.cargo.length}/{cableCapacity(s, c.kind, c)} packets
                  </small>
                </div>
                <button
                  className="secondary"
                  aria-label={`Remove cable ${c.id}`}
                  onClick={() => {
                    setS((v) => removeCable(v, c.id));
                    setTip(
                      "Cable sold for a full refund. Cargo returned to its departure node.",
                    );
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {!s.cables.length && <p>No cables installed yet.</p>}
          <button className="primary" onClick={() => setConfirm(false)}>
            Done
          </button>
        </Dialog>
      )}
      {s.phase === "reward" && (
        <Dialog title={`Month ${s.month} complete`}>
          <p>
            Profit:{" "}
            <b>
              <Gold amount={s.report?.profit} />
            </b>
            <br />
            Maintenance:{" "}
            <b>
              <Gold amount={s.report?.maintenance} />
            </b>
            <br />
            Net income:{" "}
            <b>
              <Gold amount={s.report?.net} />
            </b>
          </p>
          <p>
            Balance: <Gold amount={s.gold} />. Buy one optional item this month.
            It goes to Inventory, not directly onto your network.
          </p>
          <div className="monthly-items">
            {monthlyItems(s).map((key) => (
              <article key={key}>
                <div className="item-heading">
                  <ItemIcon kind={key} />
                  <strong>{ITEMS[key].name}</strong>
                </div>
                <p>{ITEMS[key].description}</p>
                <button
                  aria-label={`Buy ${ITEMS[key].name}`}
                  disabled={s.purchasedThisMonth || s.gold < ITEMS[key].cost}
                  onClick={() => setS((v) => buyItem(v, key))}
                >
                  <Gold amount={ITEMS[key].cost} /> · Buy item
                </button>
              </article>
            ))}
          </div>
          {!monthlyItems(s).length && <p>Upgrade items unlock in Campus.</p>}
          {s.purchasedThisMonth && (
            <p role="status">
              Item added to Inventory. Equip it from a device's details or the
              game menu.
            </p>
          )}
          <button
            className="primary"
            onClick={() => setS((v) => reward(v, "continue"))}
          >
            Continue to next month
          </button>
        </Dialog>
      )}
      {s.phase === "complete" && level && (
        <Dialog title="Mission complete!">
          <div
            className="victory-emblem"
            aria-label={`${missionStars(level, s.delivered, s.gold)} stars`}
          >
            {"★".repeat(missionStars(level, s.delivered, s.gold))}
            {"☆".repeat(3 - missionStars(level, s.delivered, s.gold))}
          </div>
          <h2 className="victory-title">{level.name}</h2>
          <p>
            {s.month} months completed. {s.delivered} packets delivered.
          </p>
          <p>
            Final balance{" "}
            <b>
              <Gold amount={s.gold} />
            </b>
            . Your level progress has been saved.
          </p>
          <section className="star-breakdown" aria-label="Star requirements">
            <h3>Your stars</h3>
            <ul>
              <li>
                <b>★ Mission complete</b>
                <span>
                  {level.months} months and {level.packets} packets required ·
                  Earned
                </span>
              </li>
              <li>
                <b>
                  {s.delivered >= Math.ceil(level.packets * 1.25) ? "★" : "☆"}{" "}
                  Deliver {Math.ceil(level.packets * 1.25)} packets
                </b>
                <span>
                  {s.delivered} delivered ·{" "}
                  {s.delivered >= Math.ceil(level.packets * 1.25)
                    ? "Earned"
                    : `${Math.ceil(level.packets * 1.25) - s.delivered} more needed`}
                </span>
              </li>
              <li>
                <b>
                  {s.gold >= level.gold / 2 ? "★" : "☆"} Finish with{" "}
                  {Math.ceil(level.gold / 2)} gold
                </b>
                <span>
                  {s.gold} gold remaining ·{" "}
                  {s.gold >= level.gold / 2
                    ? "Earned"
                    : `${Math.ceil(level.gold / 2) - s.gold} more needed`}
                </span>
              </li>
            </ul>
          </section>
          <button className="primary" onClick={() => onMenu(best.current)}>
            Back to mission map
          </button>
          <button className="secondary" onClick={restart}>
            Replay for more stars
          </button>
        </Dialog>
      )}
      {s.phase === "over" && (
        <Dialog
          title={
            s.failure === "deadline"
              ? "Mission time is up"
              : s.gold < 0
                ? "Out of gold"
                : "Network overloaded"
          }
        >
          <p>
            {s.failure === "deadline"
              ? `Month ${level?.months} has ended. You delivered ${s.delivered} of ${level?.packets} required packets. Try again with a faster network.`
              : s.gold < 0
                ? "Your balance could not cover maintenance. Try a more efficient network next time."
                : "A queue stayed full for too long. Try shorter cables or more transfer devices next time."}
          </p>
          <div className="result-score">
            <small>PACKETS DELIVERED</small>
            <strong>{s.delivered}</strong>
          </div>
          <button className="primary" onClick={restart}>
            Play Flow again
          </button>
          <button className="secondary" onClick={() => onMenu(best.current)}>
            Back to menu
          </button>
        </Dialog>
      )}
    </main>
  );
}
