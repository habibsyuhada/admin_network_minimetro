import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Network,
  Server,
  Building2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from "lucide-react";
import Dialog from "./Dialog";
import FullscreenButton from "./FullscreenButton";
import {
  MAP,
  nodes,
  offices,
  active,
  broken,
  capacity,
  connect,
  demand,
  disconnect,
  has,
  legal,
  linkKey,
  objective,
  repair,
  route,
  routerLoad,
  stage,
  tick,
  upgrade,
  type NodeId,
  type RouterId,
  type State,
} from "./game/engine";
import { score } from "./game/storage";
import { playCue, unlockAudio } from "./game/audio";
const clock = (time: number) =>
  `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(Math.floor(time % 60)).padStart(2, "0")}`;
const name = (id: NodeId) => nodes.find((n) => n.id === id)!.name;
export default function App({
  saved,
  onStateChange,
  onMenu,
  onRestart,
  sound,
  onSound,
}: {
  saved: State;
  onStateChange: (s: State) => void;
  onMenu: () => void;
  onRestart: () => void;
  sound: boolean;
  onSound: () => void;
}) {
  const [s, setS] = useState(saved),
    [paused, setPaused] = useState(false),
    [intro, setIntro] = useState(saved.tutorial && saved.time === 0);
  const [selected, setSelected] = useState<NodeId | null>(null),
    [from, setFrom] = useState<NodeId | null>(null),
    [restart, setRestart] = useState(false);
  const [drag, setDrag] = useState<{ id: NodeId; x: number; y: number } | null>(
    null,
  );
  const svg = useRef<SVGSVGElement>(null),
    origin = useRef<{
      id: NodeId;
      x: number;
      y: number;
      pointer: number;
    } | null>(null);
  const blocked = paused || intro || restart || s.phase !== "running";
  const previous = useRef(s);
  useEffect(() => {
    onStateChange(s);
    const before = previous.current;
    previous.current = s;
    if (s.phase === "complete" && before.phase !== "complete") playCue("win");
    else if (
      stage(before) !== stage(s) ||
      (s.phase === "failed" && before.phase !== "failed")
    )
      playCue("rush");
    else if (s.links.length > before.links.length) playCue("link");
    else if (
      s.upgraded.router !== before.upgraded.router ||
      s.upgraded.backup !== before.upgraded.backup
    )
      playCue("upgrade");
  }, [s, onStateChange]);
  useEffect(() => {
    const background = () => {
      if (document.hidden) {
        setPaused(true);
        origin.current = null;
        setDrag(null);
        setFrom(null);
      }
    };
    document.addEventListener("visibilitychange", background);
    return () => document.removeEventListener("visibilitychange", background);
  }, []);
  useEffect(() => {
    if (blocked) {
      origin.current = null;
      setDrag(null);
      setFrom(null);
      return;
    }
    let last = performance.now(),
      accumulator = 0;
    const timer = window.setInterval(() => {
      const now = performance.now();
      accumulator += Math.min((now - last) / 1000, 0.5);
      last = now;
      if (document.hidden) {
        accumulator = 0;
        return;
      }
      const steps = Math.floor((accumulator + 1e-9) / MAP.step);
      accumulator -= steps * MAP.step;
      if (steps)
        setS((v) => {
          for (let i = 0; i < steps; i++) v = tick(v);
          return v;
        });
    }, 50);
    return () => clearInterval(timer);
  }, [blocked]);
  useEffect(() => {
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !blocked) {
        if (from || selected) {
          setFrom(null);
          setSelected(null);
        } else setPaused(true);
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [blocked, from, selected]);
  const choose = (id: NodeId) => {
    if (blocked) return;
    unlockAudio();
    if (from) {
      setS((v) => connect(v, from, id));
      setFrom(null);
    } else setSelected(id);
  };
  const point = (x: number, y: number) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(x, y).matrixTransform(matrix.inverse())
      : { x: 0, y: 0 };
  };
  const online = offices.filter(
    (id) => active(s, id) && route(s, id).length,
  ).length;
  const officeCount = offices.filter((id) => active(s, id)).length;
  const detail = nodes.find((n) => n.id === selected);
  const stressed = s.badTime > 0 || s.loss > 1;
  const failureRemaining = Math.ceil(MAP.failureAfter - s.badTime);
  const rates = demand(s);
  const act = (action: (v: State) => State) => {
    if (!blocked) setS(action);
  };
  return (
    <main className={`game ${stressed ? "stressed" : ""}`}>
      <header className="game-header">
        <div className="brand">
          <Network size={22} /> NOC<span>SHIFT</span>
        </div>
        <span className="district-label">01 / HQ DISTRICT</span>
        <button
          className="icon-button"
          aria-label="Jeda permainan"
          onClick={() => setPaused(true)}
          disabled={blocked}
        >
          <Pause size={20} />
        </button>
      </header>
      <div className="shift-line">
        <span>
          <i className="status-dot" /> {stage(s)}
        </span>
        <span className="time" data-testid="clock">
          {clock(s.time)} <small>/ 10:00</small>
        </span>
      </div>
      <progress
        className="shift-progress"
        aria-label="Progres shift"
        value={s.time}
        max={600}
      />
      <section className="hud" aria-label="Kualitas layanan">
        <div>
          <small>KANTOR ONLINE</small>
          <strong>
            {online}
            <em>/{officeCount}</em>
          </strong>
        </div>
        <div className={s.latency >= 50 ? "warning" : ""}>
          <small>LATENCY</small>
          <strong>
            {Math.round(s.latency)}
            <em>ms</em>
          </strong>
        </div>
        <div className={s.loss > 1 ? "warning" : ""}>
          <small>LOSS</small>
          <strong>
            {s.loss.toFixed(1)}
            <em>%</em>
          </strong>
        </div>
        <div>
          <small>BUDGET</small>
          <strong>
            {s.budget}
            <em>kr</em>
          </strong>
        </div>
      </section>
      <div className="play-area">
        <section className="arena" aria-label="Peta HQ District">
          <div className="arena-top">
            <span>
              HQ DISTRICT <small>/ PRIVATE NETWORK</small>
            </span>
            <span className={stressed ? "warning" : "healthy"}>
              {stressed ? "▲ PERLU TINDAKAN" : "● SISTEM AKTIF"}
            </span>
          </div>
          <svg
            ref={svg}
            viewBox="0 0 500 440"
            className={`network-map ${blocked ? "frozen" : ""}`}
            role="group"
            aria-label="Peta jaringan interaktif"
            onPointerMove={(e) => {
              const start = origin.current;
              if (
                start &&
                start.pointer === e.pointerId &&
                Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10
              ) {
                const p = point(e.clientX, e.clientY);
                setDrag({ id: start.id, x: p.x, y: p.y });
              }
            }}
            onPointerUp={(e) => {
              const start = origin.current;
              origin.current = null;
              setDrag(null);
              if (!start || blocked || start.pointer !== e.pointerId) return;
              if (Math.hypot(e.clientX - start.x, e.clientY - start.y) <= 10) {
                choose(start.id);
                return;
              }
              const p = point(e.clientX, e.clientY);
              const target = nodes.find(
                (n) => active(s, n.id) && Math.hypot(n.x - p.x, n.y - p.y) < 40,
              );
              if (target) {
                setS((v) => connect(v, start.id, target.id));
                setSelected(null);
                setFrom(null);
              } else
                setS((v) => ({
                  ...v,
                  message: "Koneksi dibatalkan. Lepaskan pada node tujuan.",
                }));
            }}
            onPointerCancel={() => {
              origin.current = null;
              setDrag(null);
            }}
            onLostPointerCapture={() => {
              origin.current = null;
              setDrag(null);
            }}
          >
            <defs>
              <pattern
                id="grid"
                width="22"
                height="22"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="0.8" fill="#30423d" />
              </pattern>
            </defs>
            <rect width="500" height="440" fill="url(#grid)" />
            <g className="map-district" aria-hidden="true">
              <path d="M10 40H170V410H10Z M185 25H310V415H185Z M330 55H485V380H330Z" />
              <text x="22" y="24">
                KAWASAN KANTOR
              </text>
              <text x="195" y="24">
                CORE NETWORK
              </text>
              <text x="345" y="40">
                LAYANAN
              </text>
            </g>
            {s.links.map(([a, b]) => {
              const n = nodes.find((v) => v.id === a)!,
                m = nodes.find((v) => v.id === b)!;
              const failed = broken(s, a, b);
              const flowing = offices.some((id) => {
                const p = route(s, id);
                return p.some(
                  (v, i) =>
                    i < p.length - 1 && linkKey(v, p[i + 1]) === linkKey(a, b),
                );
              });
              return (
                <g
                  key={linkKey(a, b)}
                  className={`map-link ${failed ? "broken" : flowing ? "flowing" : ""}`}
                  aria-hidden="true"
                >
                  <line x1={n.x} y1={n.y} x2={m.x} y2={m.y} />
                  {failed && (
                    <text x={(n.x + m.x) / 2} y={(n.y + m.y) / 2 - 9}>
                      ×
                    </text>
                  )}
                </g>
              );
            })}
            {drag && (
              <line
                className="drag-line"
                x1={nodes.find((n) => n.id === drag.id)!.x}
                y1={nodes.find((n) => n.id === drag.id)!.y}
                x2={drag.x}
                y2={drag.y}
              />
            )}
            {nodes.map((n) => {
              const enabled = active(s, n.id),
                connected = enabled && route(s, n.id).length > 0;
              const Icon =
                n.kind === "office"
                  ? Building2
                  : n.kind === "router"
                    ? Network
                    : Server;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  className={`map-node ${enabled ? "" : "locked"} ${selected === n.id || from === n.id ? "selected" : ""} ${from && legal(from, n.id) && !has(s, from, n.id) ? "target" : ""}`}
                  role={enabled ? "button" : "img"}
                  tabIndex={enabled && !blocked ? 0 : -1}
                  aria-label={`${n.name}${enabled ? "" : `, aktif ${clock(n.unlock)}`}`}
                  aria-pressed={enabled ? selected === n.id : undefined}
                  onKeyDown={(e) => {
                    if (enabled && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      choose(n.id);
                    }
                  }}
                  onPointerDown={(e) => {
                    if (!enabled || blocked || !e.isPrimary || e.button !== 0)
                      return;
                    e.preventDefault();
                    unlockAudio();
                    svg.current?.setPointerCapture(e.pointerId);
                    origin.current = {
                      id: n.id,
                      x: e.clientX,
                      y: e.clientY,
                      pointer: e.pointerId,
                    };
                  }}
                >
                  <rect
                    className="node-hit"
                    x="-39"
                    y="-39"
                    width="78"
                    height="100"
                    rx="18"
                  />
                  <rect
                    className="node-box"
                    x="-28"
                    y="-28"
                    width="56"
                    height="56"
                    rx="16"
                  />
                  <Icon x={-13} y={-13} width={26} height={26} />
                  <circle
                    cx={24}
                    cy={-24}
                    r={5}
                    className={connected ? "online" : "offline"}
                  />
                  <text y="48" className="node-name">
                    {n.name}
                  </text>
                  <text y="64" className="node-caption">
                    {!enabled
                      ? `AKTIF ${clock(n.unlock)}`
                      : n.kind === "router"
                        ? `${Math.round(routerLoad(s, n.id as RouterId))}% / ${capacity(s, n.id as RouterId)} req/s`
                        : n.kind === "office"
                          ? `${Math.round(rates[n.id as keyof typeof rates])} req/s`
                          : "LOGIN SERVICE"}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="arena-bottom">
            <span>
              <i className="status-dot" /> Jalur aktif{" "}
              <b className="warning">× Gangguan</b>
            </span>
            <span>{s.links.length} koneksi</span>
          </div>
          <div className="map-tip">
            {from
              ? `Pilih tujuan dari ${name(from)} · 40 kredit`
              : "Tarik untuk koneksi · Pilih node untuk detail"}
            {from && (
              <button className="text-button" onClick={() => setFrom(null)}>
                Batal
              </button>
            )}
          </div>
        </section>
        <aside className="operator-panel">
          <div className="eyebrow">CATATAN OPERATOR</div>
          <h2>{stage(s)}</h2>
          <p className="objective" aria-live="polite">
            {objective(s)}
          </p>
          {s.badTime > 0 && (
            <div className="failure-alert" role="status">
              <AlertTriangle size={18} />
              <span>
                Pulihkan layanan dalam <b>{failureRemaining} detik</b>.
              </span>
            </div>
          )}
          <div className="service-stats">
            <span>
              Uptime shift <b>{s.uptime.toFixed(1)}%</b>
            </span>
            <span>
              Stabil <b>{Math.min(20, Math.floor(s.stable))} / 20 dtk</b>
            </span>
          </div>
          <ol className="timeline">
            {[
              [0, "Hubungkan HQ"],
              [90, "Cabang bergabung"],
              [180, "Studio bergabung"],
              [240, "Jam sibuk"],
              [390, "Gangguan jalur"],
              [480, "Lonjakan akhir"],
              [600, "Evaluasi shift"],
            ].map(([t, label]) => (
              <li key={t} className={s.time >= Number(t) ? "reached" : ""}>
                <span>{clock(Number(t))}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="event-message" role="status">
            {s.message ||
              "Setiap koneksi: 40 kredit. Siapkan ruang untuk pertumbuhan."}
          </div>
          {s.time >= MAP.outageAt && !s.repaired && (
            <button
              className="secondary"
              disabled={blocked || s.budget < MAP.repairCost}
              onClick={() => act(repair)}
            >
              Perbaiki jalur A–Server · 120
            </button>
          )}
        </aside>
      </div>
      {detail && !blocked && (
        <Dialog
          title={detail.name}
          onClose={() => {
            setSelected(null);
            setFrom(null);
          }}
        >
          <div className="detail-status">
            {route(s, detail.id).length
              ? "● Terhubung ke layanan"
              : "○ Belum terhubung ke layanan"}
          </div>
          <p className="muted">Simulasi tetap berjalan saat detail terbuka.</p>
          {detail.kind === "router" && (
            <>
              <p>
                Beban {Math.round(routerLoad(s, detail.id as RouterId))}% ·
                Kapasitas {capacity(s, detail.id as RouterId)} req/s
              </p>
              <button
                className="primary"
                disabled={
                  s.upgraded[detail.id as RouterId] ||
                  s.budget < MAP.upgradeCost
                }
                onClick={() => act((v) => upgrade(v, detail.id as RouterId))}
              >
                <Zap size={16} />
                {s.upgraded[detail.id as RouterId]
                  ? "Sudah ditingkatkan"
                  : "Upgrade ke 260 req/s · 260 kredit"}
              </button>
            </>
          )}
          {detail.kind === "office" && (
            <p>
              Demand {Math.round(rates[detail.id as keyof typeof rates])} req/s
              · Antrean{" "}
              {Math.round(s.sources[detail.id as keyof typeof s.sources].queue)}{" "}
              request
            </p>
          )}
          <button
            className="primary"
            disabled={s.budget < MAP.linkCost}
            onClick={() => {
              setFrom(detail.id);
              setSelected(null);
            }}
          >
            Sambungkan ke node lain · 40 kredit <ArrowRight size={16} />
          </button>
          <div className="connection-list">
            <small>KONEKSI TERPASANG</small>
            {s.links
              .filter((l) => l.includes(detail.id))
              .map((l) => {
                const other = l[0] === detail.id ? l[1] : l[0];
                return (
                  <div key={linkKey(...l)}>
                    <span>
                      {name(other)}
                      {broken(s, ...l) ? " · rusak" : ""}
                    </span>
                    <button
                      className="text-button"
                      onClick={() => act((v) => disconnect(v, ...l))}
                    >
                      Lepas · +20
                    </button>
                  </div>
                );
              })}
            {!s.links.some((l) => l.includes(detail.id)) && (
              <p>Belum ada koneksi.</p>
            )}
          </div>
          <button className="secondary" onClick={() => setSelected(null)}>
            Tutup detail
          </button>
        </Dialog>
      )}
      {intro && (
        <Dialog
          title="Selamat datang, operator."
          onClose={() => {
            setIntro(false);
            setS((v) => ({ ...v, tutorial: false }));
          }}
        >
          <div className="intro-icon">
            <Network size={38} />
          </div>
          <p>
            Mulai dengan Kantor HQ → Router A → App Server. Tarik antarnode,
            atau pilih node lalu gunakan tombol Sambungkan.
          </p>
          <p>
            Budget awal <b>1.000 kredit</b>. Koneksi 40, upgrade 260, perbaikan
            120. Kantor baru muncul bertahap; jadwal tersedia di menu jeda.
          </p>
          <p>
            Persiapan awal 75 detik. Setelah itu, gangguan berkepanjangan bisa
            mengakhiri shift. Gunakan jeda kapan saja untuk berpikir.
          </p>
          <button
            className="primary"
            onClick={() => {
              setIntro(false);
              setS((v) => ({ ...v, tutorial: false }));
            }}
          >
            Mulai bertugas <Play size={16} />
          </button>
        </Dialog>
      )}
      {paused && !intro && !restart && s.phase === "running" && (
        <Dialog title="Shift dijeda" onClose={() => setPaused(false)}>
          <p>Jaringan menunggu. Waktu permainan berhenti.</p>
          <p className="muted">
            01:30 Cabang · 03:00 Studio · 04:00 Jam sibuk · 06:30 Gangguan
            A–Server · 08:00 Lonjakan akhir · 10:00 Evaluasi. Target: uptime
            ≥90%, loss ≤1%, latency &lt;50 ms, stabil 20 detik terakhir.
          </p>
          <button className="primary" onClick={() => setPaused(false)}>
            <Play size={16} /> Lanjutkan
          </button>
          <button className="secondary" onClick={() => setRestart(true)}>
            Ulangi shift
          </button>
          <button className="secondary" onClick={onSound}>
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />} Suara{" "}
            {sound ? "aktif" : "nonaktif"}
          </button>
          <button className="text-button" onClick={onMenu}>
            Simpan & kembali ke menu
          </button>
          <FullscreenButton />
        </Dialog>
      )}
      {restart && (
        <Dialog title="Ulangi shift ini?" onClose={() => setRestart(false)}>
          <p>Progres shift ini akan diganti. Rekor tetap tersimpan.</p>
          <button className="primary" onClick={onRestart}>
            Ya, ulangi shift
          </button>
          <button
            className="secondary"
            autoFocus
            onClick={() => setRestart(false)}
          >
            Batal
          </button>
        </Dialog>
      )}
      {s.phase !== "running" && (
        <Dialog
          title={
            s.phase === "complete"
              ? "Distrik tetap online."
              : "Shift perlu diulang."
          }
        >
          <div className="result-icon">
            {s.phase === "complete" ? (
              <ShieldCheck size={42} />
            ) : (
              <Activity size={42} />
            )}
          </div>
          <p>
            {s.phase === "complete"
              ? "Sepuluh menit. Tiga kantor. Kamu menjaga semuanya terhubung."
              : s.message}
          </p>
          <div className="result-score">
            <small>NILAI SHIFT</small>
            <strong>{score(s).toLocaleString("id-ID")}</strong>
          </div>
          <div className="service-stats">
            <span>
              Uptime <b>{s.uptime.toFixed(1)}%</b>
            </span>
            <span>
              Sisa budget <b>{s.budget}</b>
            </span>
            <span>
              Request dilayani{" "}
              <b>{Math.round(s.served).toLocaleString("id-ID")}</b>
            </span>
            <span>
              Gangguan pascainsiden <b>{s.incidentSeconds.toFixed(1)} dtk</b>
            </span>
          </div>
          <p className="muted">
            {s.incidentSeconds > 5
              ? "Percobaan berikutnya: siapkan jalur Router B sebelum 06:30 atau sisakan 120 kredit untuk perbaikan."
              : s.dropped > s.total * 0.02
                ? "Percobaan berikutnya: sambungkan kantor lebih cepat dan tambah kapasitas sebelum jam sibuk."
                : "Jaringan tertangani dengan baik. Coba strategi lain untuk menghemat budget."}
          </p>
          <button className="primary" onClick={onRestart}>
            Main lagi
          </button>
          <button className="secondary" onClick={onMenu}>
            Kembali ke menu
          </button>
        </Dialog>
      )}
    </main>
  );
}
