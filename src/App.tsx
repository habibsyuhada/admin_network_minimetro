import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Building2,
  Check,
  GitBranch,
  Network,
  Pause,
  Play,
  RotateCcw,
  Server,
  Zap,
  X,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { playCue, unlockAudio } from "./game/audio";
import { score } from "./game/storage";
import FullscreenButton from "./FullscreenButton";
import {
  connect,
  demand,
  initial,
  LEVEL,
  nodes,
  nodeStats,
  route,
  tick,
  upgrade,
  type NodeId,
} from "./game/engine";
const copy = {
  hq: [
    "Get the office online.",
    "Drag dari Office HQ ke Router-A untuk membuat link. Tap node untuk melihat detail.",
  ],
  server: [
    "Give traffic a destination.",
    "Drag Router-A ke App Server untuk mulai melayani request.",
  ],
  observe: [
    "A little traffic. A good start.",
    "Titik bergerak mewakili traffic. Pantau jaringan sebelum branch baru bergabung.",
  ],
  branch: [
    "Your network is growing.",
    "Drag Branch Office ke Router-A atau Office HQ.",
  ],
  normal: [
    "All offices, one network.",
    "Traffic bertambah. Perhatikan kapasitas router saat jam kerja dimulai.",
  ],
  rush: [
    "Morning Login Rush",
    "Antrean meningkat. Pilih Router-A, lalu upgrade untuk memulihkan jaringan.",
  ],
  recover: [
    "Room to breathe.",
    "Pertahankan latency <50 ms dan packet loss ≤1% selama 20 detik.",
  ],
  complete: [
    "First shift, well handled.",
    "Kedua office online. Morning Login Rush berhasil ditangani.",
  ],
};
export default function App({
  saved,
  onStateChange,
  onMenu,
  sound,
  onSound,
}: {
  saved: ReturnType<typeof initial>;
  onStateChange: (state: ReturnType<typeof initial>) => void;
  onMenu: () => void;
  sound: boolean;
  onSound: () => void;
}) {
  const [s, setS] = useState(() => saved),
    [paused, setPaused] = useState(false),
    [selected, setSelected] = useState<NodeId | null>(null),
    [drag, setDrag] = useState<{ id: NodeId; x: number; y: number } | null>(
      null,
    );
  const svg = useRef<SVGSVGElement>(null);
  const start = useRef<{ id: NodeId; x: number; y: number } | null>(null);
  const previous = useRef(s);
  useEffect(() => {
    onStateChange(s);
    const before = previous.current;
    previous.current = s;
    if (s.phase === "complete" && before.phase !== "complete") playCue("win");
    else if (s.upgraded && !before.upgraded) playCue("upgrade");
    else if (s.phase === "rush" && before.phase !== "rush") playCue("rush");
    else if (s.links.length > before.links.length) playCue("link");
  }, [s, onStateChange]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        setPaused(true);
        start.current = null;
        setDrag(null);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  useEffect(() => {
    if (paused || s.phase === "complete") svg.current?.pauseAnimations();
    else svg.current?.unpauseAnimations();
  }, [paused, s.phase]);
  useEffect(() => {
    let prev = performance.now();
    const id = setInterval(() => {
      const now = performance.now(),
        dt = Math.min((now - prev) / 1000, 0.25);
      prev = now;
      if (!paused && !document.hidden) setS((v) => tick(v, dt));
    }, 100);
    return () => clearInterval(id);
  }, [paused]);
  const active = nodes.filter(
    (n) => n.id !== "branch" || !["hq", "server", "observe"].includes(s.phase),
  );
  const choose = (id: NodeId) => {
    if (paused || s.phase === "complete") return;
    unlockAudio();
    playCue("tap");
    setSelected(id);
  };
  const point = (x: number, y: number) => {
    const p = new DOMPoint(x, y);
    return p.matrixTransform(svg.current!.getScreenCTM()!.inverse());
  };
  const congested = s.queue > 0,
    running = !paused && s.phase !== "complete";
  const steps = [
    "Connect HQ",
    "Add branch",
    "Handle the rush",
    "Restore service",
  ];
  const step = ["hq", "server", "observe"].includes(s.phase)
    ? 0
    : s.phase === "branch" || s.phase === "normal"
      ? 1
      : s.phase === "rush"
        ? 2
        : 3;
  const reset = () => {
    setS(initial());
    setPaused(false);
    setSelected(null);
  };
  return (
    <main className={congested ? "app stressed" : "app"}>
      <header>
        <div className="brand">
          <span className="brand-icon">
            <Network size={23} />
          </span>
          NOC<span>SHIFT</span>
        </div>
        <div className="session">
          <span>◎</span> {s.budget.toLocaleString()}
        </div>
        <button
          className="icon-button"
          aria-label={paused ? "Resume simulation" : "Pause simulation"}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
        </button>
      </header>
      <div className="heading">
        <div>
          <p className="eyebrow">
            LEVEL 01 <span>•</span> FIRST DAY AT NOC
          </p>
        </div>
        <div className="stage-track" aria-label={`Mission ${step + 1} of 4`}>
          {steps.map((v, i) => (
            <span key={v} title={v} className={i <= step ? "reached" : ""}>
              {i < step || s.phase === "complete" ? <Check size={12} /> : i + 1}
            </span>
          ))}
        </div>
      </div>
      <div className="workspace">
        <section className="map-panel">
          <div className="panel-top">
            <span>
              <span className="live-dot" /> HQ DISTRICT
            </span>
            <span className={congested ? "warning" : ""}>
              {congested
                ? "CONGESTED"
                : s.latency
                  ? "OPERATIONAL"
                  : "BUILD YOUR NETWORK"}
            </span>
          </div>
          <div className="map">
            <div className="map-caption">
              HQ CAMPUS <span> / PRIVATE NETWORK</span>
            </div>
            <svg
              ref={svg}
              viewBox="0 0 480 350"
              role="group"
              aria-label="Interactive network map"
              onPointerMove={(e) => {
                if (start.current) {
                  const p = point(e.clientX, e.clientY);
                  if (
                    Math.hypot(
                      e.clientX - start.current.x,
                      e.clientY - start.current.y,
                    ) > 10
                  )
                    setDrag({ id: start.current.id, x: p.x, y: p.y });
                }
              }}
              onPointerUp={(e) => {
                if (!start.current) {
                  setSelected(null);
                  return;
                }
                const origin = start.current;
                start.current = null;
                setDrag(null);
                if (!running) return;
                const p = point(e.clientX, e.clientY);
                const target = active.find(
                  (n) => Math.hypot(n.x - p.x, n.y - p.y) < 38,
                );
                if (
                  Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 10
                ) {
                  if (target && target.id !== origin.id) {
                    setS((v) => connect(v, origin.id, target.id));
                    setSelected(null);
                  }
                } else choose(origin.id);
              }}
              onPointerCancel={() => {
                start.current = null;
                setDrag(null);
              }}
            >
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r=".7" fill="#304348" />
                </pattern>
              </defs>
              <rect width="480" height="350" fill="url(#grid)" />
              <g className="district-art" aria-hidden="true">
                <path d="M15 100 135 30 220 79 99 149Z M273 45 393 112 472 66 352 0Z M22 265 132 202 211 247 101 311Z M296 264 396 206 477 253 376 311Z" />
                <path
                  className="district-road"
                  d="M-20 192 240 40 500 192 M-20 210 240 362 500 210"
                />
                <circle cx="240" cy="210" r="105" className="radar" />
                <circle cx="240" cy="210" r="145" className="radar" />
              </g>
              {s.links.map(([a, b]) => {
                const n = nodes.find((n) => n.id === a)!,
                  m = nodes.find((n) => n.id === b)!;
                let from = n,
                  to = m,
                  flow = 0;
                for (const office of ["hq", "branch"] as const) {
                  const path = route(s, office);
                  for (let i = 0; i < path.length - 1; i++)
                    if (
                      [a, b].includes(path[i]) &&
                      [a, b].includes(path[i + 1])
                    ) {
                      from = nodes.find((n) => n.id === path[i])!;
                      to = nodes.find((n) => n.id === path[i + 1])!;
                      flow += demand(s)[office];
                    }
                }
                return (
                  <g key={a + b} className={congested ? "link hot" : "link"}>
                    <line x1={n.x} y1={n.y} x2={m.x} y2={m.y} />
                    {flow > 0 &&
                      Array.from(
                        { length: Math.min(7, Math.ceil(flow / 24)) },
                        (_, i) => {
                          return (
                            <circle key={i} cx={from.x} cy={from.y} r="3">
                              {!window.matchMedia(
                                "(prefers-reduced-motion: reduce)",
                              ).matches && (
                                <animateMotion
                                  path={`M 0 0 L ${to.x - from.x} ${to.y - from.y}`}
                                  dur={`${congested ? 3 : 1.8}s`}
                                  begin={`${-i * 0.35}s`}
                                  repeatCount="indefinite"
                                />
                              )}
                            </circle>
                          );
                        },
                      )}
                  </g>
                );
              })}
              {drag && (
                <line
                  x1={nodes.find((n) => n.id === drag.id)!.x}
                  y1={nodes.find((n) => n.id === drag.id)!.y}
                  x2={drag.x}
                  y2={drag.y}
                  stroke="#c8f58b"
                  strokeDasharray="5 5"
                />
              )}
              {active.map((n) => {
                const Icon =
                  n.id === "router"
                    ? Network
                    : n.id === "server"
                      ? Server
                      : Building2;
                const online = route(s, n.id).length > 0;
                return (
                  <g
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={n.name}
                    aria-pressed={selected === n.id}
                    className={`node node-${n.id} ${selected === n.id ? "selected" : ""} ${n.id === "router" && congested ? "hot" : ""}`}
                    transform={`translate(${n.x},${n.y})`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        choose(n.id);
                      }
                    }}
                    onPointerDown={(e) => {
                      if (!running || !e.isPrimary || e.button !== 0) return;
                      e.preventDefault();
                      unlockAudio();
                      svg.current!.setPointerCapture(e.pointerId);
                      start.current = { id: n.id, x: e.clientX, y: e.clientY };
                    }}
                  >
                    <circle className="halo" r="39" />
                    <ellipse className="node-ground" cy="32" rx="43" ry="13" />
                    <rect
                      className="node-depth"
                      x="-29"
                      y="-20"
                      width="58"
                      height="58"
                      rx="16"
                    />
                    <rect x="-29" y="-29" width="58" height="58" rx="16" />
                    <Icon x={-16} y={-18} width={32} height={32} />
                    <circle
                      className={online ? "status online" : "status"}
                      cx="24"
                      cy="-24"
                      r="4"
                    />
                    <text y="49" className="node-name">
                      {n.name}
                    </text>
                    <text y="65" className="node-type">
                      {n.id === "router"
                        ? `LV.${s.upgraded ? 2 : 1} · ${Math.round(s.load)}% LOAD`
                        : n.type}
                    </text>
                    {n.id === "router" && congested && (
                      <text y="-49" className="alert-label">
                        ! QUEUE {Math.round(s.queue)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <div className="map-legend">
              <span>
                <i /> Healthy traffic
              </span>
              <span>
                <i className="amber" /> Congestion
              </span>
              <span className="packet-note">1 dot ≈ multiple requests</span>
            </div>
          </div>
          <div className="map-toolbar">
            <span>
              <GitBranch size={16} />
              {s.links.length} links <span className="divider" />
              {active.length} nodes
            </span>
            <div>
              <span className="clock">
                {String(Math.floor(s.time / 60)).padStart(2, "0")}:
                {String(Math.floor(s.time % 60)).padStart(2, "0")}
              </span>
              <button
                className="icon-button"
                aria-label={paused ? "Resume simulation" : "Pause simulation"}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={17} /> : <Pause size={17} />}
              </button>
            </div>
          </div>
        </section>
        {selected && (
          <NodeDetails
            state={s}
            id={selected}
            paused={paused}
            onClose={() => setSelected(null)}
            onUpgrade={() => setS(upgrade)}
          />
        )}
        {!selected && (
          <p className="map-help">
            Drag untuk membuat link · Tap node untuk detail
          </p>
        )}
      </div>
      <section
        className={`tutorial ${s.phase === "rush" ? "incident" : ""}`}
        aria-live="polite"
      >
        <span className="tutorial-icon">
          {s.phase === "rush" ? <Zap /> : <Activity />}
        </span>
        <div>
          <p className="eyebrow">
            {paused
              ? "SIMULATION PAUSED"
              : s.phase === "rush"
                ? "INCIDENT / 01"
                : `MISSION ${step + 1} / 4`}
          </p>
          <h3>{copy[s.phase][0]}</h3>
          <p>{s.message || copy[s.phase][1]}</p>
          {s.phase === "recover" && (
            <progress value={s.stable} max={LEVEL.stable} />
          )}
        </div>
        <span className="tutorial-count">{step + 1} / 4</span>
      </section>
      {paused && s.phase !== "complete" && (
        <div className="overlay">
          <section
            className="result pause-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-title"
          >
            <span className="result-icon">
              <Pause size={34} />
            </span>
            <p className="eyebrow">TAKE A BREATHER</p>
            <h1 id="pause-title">Shift paused</h1>
            <p>Your network can wait.</p>
            <button
              className="upgrade"
              autoFocus
              onClick={() => setPaused(false)}
            >
              <Play size={18} />
              Back to the shift
            </button>
            <button className="secondary" onClick={reset}>
              <RotateCcw size={18} />
              Restart level
            </button>
            <button className="text-button" onClick={onSound}>
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}Suara{" "}
              {sound ? "aktif" : "nonaktif"}
            </button>
            <button className="text-button" onClick={onMenu}>
              Simpan & kembali ke menu
            </button>
            <FullscreenButton />
          </section>
        </div>
      )}
      {s.phase === "complete" && (
        <div className="overlay">
          <section
            className="result"
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-title"
          >
            <span className="result-icon">
              <Trophy size={42} />
            </span>
            <p className="eyebrow">LEVEL 01 COMPLETE</p>
            <h1 id="result-title">You're on top of it.</h1>
            <div className="final-score">
              <small>SHIFT SCORE</small>
              <strong>{score(s).toLocaleString()}</strong>
            </div>
            <p>
              Morning rush handled. Your network has been stable for 20 seconds.
            </p>
            <div className="result-stats">
              <Metric
                label="REQUESTS SERVED"
                value={Math.floor(s.served).toLocaleString()}
                unit=""
              />
              <Metric label="PEAK DEMAND" value={Math.round(s.peak)} unit="%" />
              <Metric label="FINAL LOSS" value={s.loss.toFixed(1)} unit="%" />
              <Metric label="INCIDENTS FIXED" value="1" unit="" />
            </div>
            <button className="upgrade" autoFocus onClick={reset}>
              Play this shift again <RotateCcw size={18} />
            </button>
            <button className="text-button" onClick={onMenu}>
              Kembali ke menu
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
function Metric({
  label,
  value,
  unit,
  warning = false,
}: {
  label: string;
  value: string | number;
  unit: string;
  warning?: boolean;
}) {
  return (
    <div className="metric">
      <small>{label}</small>
      <strong className={warning ? "warning" : ""}>
        {value}
        <span>{unit}</span>
      </strong>
    </div>
  );
}

function NodeDetails({
  state: s,
  id,
  paused,
  onClose,
  onUpgrade,
}: {
  state: ReturnType<typeof initial>;
  id: NodeId;
  paused: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const node = nodes.find((n) => n.id === id)!;
  const stats = nodeStats(s, id);
  const Icon = id === "router" ? Network : id === "server" ? Server : Building2;
  return (
    <aside className="node-details" aria-label={`${node.name} details`}>
      <div className="detail-heading">
        <Icon size={24} />
        <div>
          <h3>{node.name}</h3>
          <small>
            {id === "router"
              ? `CORE ROUTER · LV. ${s.upgraded ? 2 : 1}`
              : id === "server"
                ? "APPLICATION SERVER"
                : "TRAFFIC SOURCE"}
          </small>
        </div>
        <button
          className="close-panel"
          aria-label="Close node details"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <p className="detail-status">
        {stats.connected ? "● Connected" : "○ Disconnected"}{" "}
        <span>
          {id === "router"
            ? "Routes office requests"
            : id === "server"
              ? "Receives office requests"
              : "Sends requests to App Server"}
        </span>
      </p>
      <div className="metrics" aria-label={`${node.name} metrics`}>
        <Metric label="UPTIME" value={stats.uptime} unit="%" />
        <Metric
          label="LATENCY"
          value={stats.latency === null ? "—" : Math.round(stats.latency)}
          unit="ms"
          warning={(stats.latency ?? 0) >= 50}
        />
        <Metric
          label="LOSS"
          value={stats.loss === null ? "—" : stats.loss.toFixed(1)}
          unit="%"
          warning={(stats.loss ?? 0) > 1}
        />
        <Metric
          label="SERVED"
          value={new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.floor(stats.served))}
          unit="req"
        />
      </div>
      <p className="detail-scope">{stats.scope}</p>
      {id === "router" ? (
        <>
          <div className="detail-row">
            <span>
              Load <b>{Math.round(s.load)}%</b>
            </span>
            <span>
              Capacity{" "}
              <b>{s.upgraded ? LEVEL.upgradeCapacity : LEVEL.capacity} req/s</b>
            </span>
            <span>
              Queue <b>{Math.round(s.queue)}</b>
            </span>
          </div>
          <div className="meter">
            <i style={{ width: `${Math.min(s.load, 100)}%` }} />
          </div>
          <button
            className="upgrade"
            disabled={s.phase !== "rush" || paused}
            onClick={onUpgrade}
          >
            <Zap size={17} />
            {s.upgraded ? "Upgraded" : "Upgrade router"}
            <span>{s.upgraded ? <Check size={17} /> : "◎ 300"}</span>
          </button>
          <p className="detail-scope">
            {s.upgraded
              ? "Kapasitas bertambah, antrean diproses otomatis."
              : s.phase === "rush"
                ? "Tambah kapasitas untuk mengatasi antrean."
                : "Upgrade tersedia saat Morning Login Rush."}
          </p>
        </>
      ) : (
        <div className="detail-row">
          <span>
            {id === "server" ? "Incoming traffic" : "Request demand"}{" "}
            <b>{stats.rate} req/s</b>
          </span>
          <span>
            {id === "server" ? "Service" : "Destination"}{" "}
            <b>{id === "server" ? "Login app" : "App Server"}</b>
          </span>
        </div>
      )}
    </aside>
  );
}
