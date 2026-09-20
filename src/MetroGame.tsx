import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, Settings2, Network } from "lucide-react";
import Dialog from "./Dialog";
import NodeDetails, { nodeName } from "./NodeDetails";
import {
  CABLE_TYPES,
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
import {
  DeviceGlyph,
  DEVICE_NAMES,
  DEVICE_CODES,
  DEVICE_COLORS,
} from "./NetworkArt";
import { playCue } from "./game/audio";
import useMapCamera from "./useMapCamera";
import { laneSegment, linePath, MAP_BOUNDS } from "./game/mapView";

export default function MetroGame({
  onMenu,
}: {
  onMenu: (delivered: number) => void;
}) {
  const [s, setS] = useState(newMetro);
  const best = useRef(0);
  best.current = Math.max(best.current, s.delivered);
  const [placing, setPlacing] = useState(false);
  const placement = useRef<{ id: number; x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<CableKind>(0);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [showNodes, setShowNodes] = useState(false);
  const [detailNode, setDetailNode] = useState<number | null>(null);
  const [tip, setTip] = useState(
    "Tarik kabel antar perangkat. Ketuk node untuk detail.",
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
    paused || help || confirm || showNodes || s.phase !== "running";
  useEffect(() => {
    const hide = () => {
      if (document.hidden) setPaused(true);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target as Element).closest("dialog")) {
        gesture.current = null;
        setPointer(null);
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (frozen) {
      gesture.current = null;
      setPointer(null);
      return;
    }
    let last = performance.now(),
      accumulator = 0;
    const timer = window.setInterval(() => {
      const now = performance.now();
      accumulator += Math.min(0.5, (now - last) / 1000);
      last = now;
      if (document.hidden) {
        accumulator = 0;
        return;
      }
      const steps = Math.floor((accumulator + 1e-9) / 0.1);
      accumulator -= steps * 0.1;
      if (steps)
        setS((v) => {
          for (let i = 0; i < steps; i++) v = metroTick(v);
          return v;
        });
    }, 50);
    return () => clearInterval(timer);
  }, [frozen]);
  const build = (a: number, b: number) => {
    const error = connectionError(s, selected, a, b);
    if (error) {
      setTip(error);
      return;
    }
    setS((v) => connectCable(v, selected, a, b));
    playCue("link");
    setTip(
      `${CABLE_TYPES[selected].name} terpasang. Pengangkut khusus siap bolak-balik.`,
    );
  };
  const inspect = (id: number) => {
    if (frozen) return;
    setDetailNode(id);
    setShowNodes(true);
  };
  const position = (x: number, y: number) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(x, y).matrixTransform(matrix.inverse())
      : { x: 0, y: 0 };
  };
  const danger = s.overload.indexOf(Math.max(...s.overload));
  const camera = useMapCamera(
    svg,
    { x: 0, y: 20, width: 400, height: 520 },
    frozen,
  );
  const restart = () => {
    camera.reset();
    setS(newMetro());
    setPlacing(false);
    setSelected(0);
    setPaused(false);
    setConfirm(false);
    setTip("Tarik kabel antar perangkat. Ketuk node untuk detail.");
  };
  return (
    <main className="metro-game">
      <header className="metro-header">
        <span className="metro-wordmark">
          <Network size={20} /> NOC / FLOW
        </span>
        <button
          aria-label="Jeda mode Flow"
          onClick={() => setPaused(true)}
          disabled={frozen}
        >
          <Pause size={20} />
        </button>
      </header>
      <section className="metro-score" aria-label="Statistik Flow">
        <div>
          <small>PAKET TERKIRIM</small>
          <strong data-testid="delivered">{s.delivered}</strong>
        </div>
        <div className="metro-calendar">
          <small>MINGGU {s.week}</small>
          <strong data-testid="flow-clock">
            {String(Math.floor(s.time / 60)).padStart(2, "0")}:
            {String(Math.floor(s.time % 60)).padStart(2, "0")}
          </strong>
          <progress aria-label="Progres minggu" value={s.time % 60} max={60} />
        </div>
      </section>
      <div className="metro-map-wrap">
        <div className="metro-map-title">
          <span>01 — LOCAL AREA NETWORK</span>
          <span>{s.queues.length} perangkat</span>
        </div>
        <svg
          ref={svg}
          viewBox={`${camera.view.x} ${camera.view.y} ${camera.view.width} ${camera.view.height}`}
          className="metro-map"
          role="group"
          aria-label="Peta Flow interaktif"
          onPointerDown={(e) => {
            if (placing && !frozen) {
              if (e.isPrimary && e.button === 0)
                placement.current = {
                  id: e.pointerId,
                  x: e.clientX,
                  y: e.clientY,
                };
              else placement.current = null;
            }
            if (camera.down(e)) {
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
            const g = gesture.current;
            if (g?.pointer === e.pointerId)
              setPointer(position(e.clientX, e.clientY));
          }}
          onPointerUp={(e) => {
            const pending = placement.current;
            placement.current = null;
            if (
              placing &&
              pending?.id === e.pointerId &&
              !frozen &&
              Math.hypot(e.clientX - pending.x, e.clientY - pending.y) < 10
            ) {
              camera.end(e);
              const p = position(e.clientX, e.clientY);
              const error = routerError(s, p.x, p.y);
              if (error) setTip(error);
              else {
                setS((v) => placeRouter(v, p.x, p.y));
                setPlacing(false);
                setTip(
                  "Router terpasang. Tarik kabel ke router untuk membuat titik transit.",
                );
              }
              return;
            }
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
              setTip("Lepaskan di perangkat tujuan untuk membuat jalur.");
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
            camera.end(e);
            gesture.current = null;
            setPointer(null);
          }}
        >
          <defs>
            <pattern
              id="network-grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".8" fill="#29413d" />
            </pattern>
          </defs>
          <rect
            width={MAP_BOUNDS.width}
            height={MAP_BOUNDS.height}
            fill="url(#network-grid)"
          />
          <g className="network-zones" aria-hidden="true">
            <rect x="30" y="36" width="135" height="170" rx="16" />
            <rect x="195" y="150" width="170" height="290" rx="16" />
            <rect x="35" y="345" width="140" height="210" rx="16" />
            <text x="42" y="55">
              ACCESS / A
            </text>
            <text x="205" y="162">
              DATA CENTER
            </text>
            <text x="47" y="538">
              ACCESS / B
            </text>
            <path d="M15 300H155L185 330H390M180 15V120L155 145" />
          </g>
          {s.cables.map((_, i) => (
            <g key={i} className="route-layer" aria-hidden="true">
              <path
                className="metro-route route-casing"
                d={linePath(s.cables, i, s.nodes)}
                stroke="#101f20"
                strokeWidth="9"
              />
              <path
                className="metro-route"
                data-route={i}
                d={linePath(s.cables, i, s.nodes)}
                stroke={CABLE_TYPES[s.cables[i].kind].color}
                strokeWidth={selected === s.cables[i].kind ? 6 : 5}
              />
            </g>
          ))}
          {pointer && (
            <line
              className="metro-preview"
              x1={s.nodes[gesture.current?.start ?? 0].x}
              y1={s.nodes[gesture.current?.start ?? 0].y}
              x2={pointer.x}
              y2={pointer.y}
              stroke={CABLE_TYPES[selected].color}
            />
          )}
          {s.queues.map((q, id) => {
            const n = s.nodes[id];
            return (
              <g
                key={id}
                data-node-id={id}
                transform={`translate(${n.x},${n.y})`}
                role="button"
                aria-label={`${DEVICE_NAMES[n.shape]} ${id + 1}`}
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
                    strokeDasharray={`${(s.overload[id] / 20) * 201} 201`}
                    transform="rotate(-90)"
                  />
                )}
                <DeviceGlyph kind={n.shape} />
                <text y="-34" className="metro-node-id">
                  {DEVICE_CODES[n.shape]}-{String(id + 1).padStart(2, "0")}
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
                        stroke={
                          DEVICE_COLORS[s.nodes[packet.destination].shape]
                        }
                        strokeWidth=".6"
                      />
                      <g transform="scale(.29)">
                        <DeviceGlyph
                          kind={s.nodes[packet.destination].shape}
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
          {s.cables.map((l, i) => {
            if (l.stops.length < 2) return null;
            const from = l.stops[l.at],
              to = l.stops[l.at === 0 ? 1 : 0];
            if (to === undefined) return null;
            const [a, b] = laneSegment(s.cables, i, from, to, s.nodes);
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
                  stroke="#101f20"
                  strokeWidth="2"
                />
                <text className="metro-car-count" y="3" style={{ fontSize: 8 }}>
                  {l.cargo.length}/{cableCapacity(s, l.kind)}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="map-camera-controls" aria-label="Kontrol tampilan peta">
          <button
            aria-label="Lihat seluruh area"
            disabled={frozen}
            onClick={camera.overview}
          >
            Peta
          </button>
          <span>Geser area kosong · Cubit untuk zoom</span>
          <button
            aria-label="Perkecil peta"
            disabled={frozen || camera.view.width >= MAP_BOUNDS.width}
            onClick={() => camera.zoom(1 / 1.25)}
          >
            −
          </button>
          <button
            aria-label="Kembali ke area awal"
            disabled={frozen}
            onClick={camera.reset}
          >
            {Math.round((400 / camera.view.width) * 100)}%
          </button>
          <button
            aria-label="Perbesar peta"
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
            ? `Perangkat ${danger + 1} penuh · ${Math.max(0, Math.ceil(20 - s.overload[danger]))} detik untuk mengurangi antrean`
            : "Paket punya tujuan spesifik. Buka Detail node"}
        </div>
      </div>
      <section className="metro-controls" aria-label="Kontrol jalur">
        <button
          className="router-build"
          aria-pressed={placing}
          disabled={frozen || (!placing && s.routerStock === 0)}
          onClick={() => {
            setPlacing(!placing);
            setTip(
              !placing
                ? "Ketuk area kosong untuk menempatkan router. Geser peta untuk mencari lokasi."
                : "Penempatan dibatalkan.",
            );
          }}
        >
          {placing
            ? "Batal pasang router"
            : `+ Pasang router (${s.routerStock})`}
        </button>
        <div className="metro-line-buttons cable-type-buttons">
          {CABLE_TYPES.map((type, i) => (
            <button
              key={type.name}
              aria-label={`Kabel ${type.name}`}
              aria-pressed={selected === i}
              disabled={frozen}
              style={{ "--route": type.color } as React.CSSProperties}
              onClick={() => {
                setSelected(i as CableKind);
                setTip(
                  `${type.name}: ${cableCapacity(s, i as CableKind)} paket/pengangkut · biaya ${type.cost} stok. ${type.note}.`,
                );
              }}
            >
              <span>{type.name}</span>
              <small>
                {cableCapacity(s, i as CableKind)} paket · {type.cost} stok
              </small>
            </button>
          ))}
          <button
            className="metro-clear"
            aria-label="Kelola kabel"
            disabled={frozen || !s.cables.length}
            onClick={() => setConfirm(true)}
          >
            <Settings2 size={18} />
          </button>
        </div>
        <div className="cable-inventory">
          <span data-testid="cable-count">{s.cables.length} kabel aktif</span>
          <strong>Stok: {s.stock}</strong>
          <button
            aria-label="Detail node"
            disabled={frozen}
            onClick={() => {
              setDetailNode(null);
              setShowNodes(true);
            }}
          >
            Detail node
          </button>
          <button onClick={() => setHelp(true)}>Panduan</button>
        </div>
        <p role="status">{tip}</p>
      </section>
      {help && (
        <Dialog
          title="Jaringan kecil, terus tumbuh"
          onClose={() => setHelp(false)}
        >
          <p>
            Setiap kabel menghubungkan dua perangkat dan memiliki satu
            pengangkut sendiri. Setiap paket menuju satu perangkat tertentu,
            misalnya Server 2. PC mengirim ke Server atau Database, bukan PC
            lain. Ikon tetap menunjukkan jenis perangkatnya.
          </p>
          <ol className="handbook">
            <li>
              Geser area kosong untuk menggerakkan peta. Cubit dengan dua jari
              atau gunakan tombol − / + untuk zoom. Tekan persentase untuk
              kembali ke area awal. Tombol Peta menampilkan seluruh area.
            </li>
            <li>
              Pilih jenis kabel lalu tarik dari satu perangkat ke perangkat
              lain. Klik atau sentuh satu perangkat untuk melihat detailnya.
              Untuk cabang baru, mulai lagi dari perangkat mana pun.
            </li>
            <li>
              Pengangkut hanya bolak-balik pada kabelnya. Angka muatan/kapasitas
              menunjukkan bandwidth. Paket transit menunggu pengangkut kabel
              berikutnya; rute dipilih otomatis berdasarkan waktu tempuh dan
              antrean.
            </li>
            <li>
              Buka Detail node untuk melihat jumlah paket per tujuan dan apakah
              jalurnya sudah tersambung.
            </li>
            <li>
              Ethernet: 4 paket, seimbang. Fiber: 3 paket, lebih cepat.
              Backbone: 8 paket, lebih lambat. Angka ini bertambah saat upgrade.
              Mulai dengan 2 router. Tekan Pasang router lalu ketuk area kosong.
              Router hanya untuk transit. Setiap menit kamu mendapat 1 router, 2
              stok kabel, dan memilih bonus.
            </li>
            <li>
              Antrean 8 paket memulai hitung mundur. Kurangi antrean sebelum 20
              detik habis!
            </li>
          </ol>
          <p className="muted">
            Sesi Flow berlangsung selama halaman terbuka; belum disimpan setelah
            reload. Jeda otomatis saat aplikasi berada di latar belakang.
          </p>
          <button className="primary" onClick={() => setHelp(false)}>
            Ayo hubungkan
          </button>
        </Dialog>
      )}
      {paused && !help && s.phase === "running" && (
        <Dialog title="Flow dijeda" onClose={() => setPaused(false)}>
          <button className="primary" onClick={() => setPaused(false)}>
            <Play size={18} /> Lanjutkan Flow
          </button>
          <button className="secondary" onClick={() => onMenu(best.current)}>
            <ArrowLeft size={18} /> Akhiri sesi & ke menu
          </button>
        </Dialog>
      )}
      {showNodes && (
        <Dialog
          title={
            detailNode === null
              ? "Detail node"
              : `Detail ${nodeName(detailNode, s.nodes)}`
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
              Lihat node di peta
            </button>
          )}
          <NodeDetails state={s} node={detailNode} onSelect={setDetailNode} />
          <button className="primary" onClick={() => setShowNodes(false)}>
            Kembali ke peta
          </button>
        </Dialog>
      )}
      {confirm && (
        <Dialog title="Kelola kabel" onClose={() => setConfirm(false)}>
          <p>
            Hapus kabel untuk mengembalikan stok. Muatan dikembalikan ke
            perangkat asal perjalanan; kabel lainnya tetap terpasang.
          </p>
          <div className="cable-list">
            {s.cables.map((c) => (
              <div key={c.id}>
                <div>
                  <b style={{ color: CABLE_TYPES[c.kind].color }}>
                    {CABLE_TYPES[c.kind].name} #{c.id}
                  </b>
                  <small>
                    {c.stops
                      .map(
                        (id) => `${DEVICE_NAMES[s.nodes[id].shape]} ${id + 1}`,
                      )
                      .join(" ↔ ")}{" "}
                    · {c.cargo.length}/{cableCapacity(s, c.kind)} paket
                  </small>
                </div>
                <button
                  className="secondary"
                  aria-label={`Hapus kabel ${c.id}`}
                  onClick={() => {
                    setS((v) => removeCable(v, c.id));
                    setTip("Kabel dilepas. Stok dan muatan dikembalikan.");
                  }}
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
          {!s.cables.length && <p>Belum ada kabel terpasang.</p>}
          <button className="primary" onClick={() => setConfirm(false)}>
            Selesai
          </button>
        </Dialog>
      )}
      {s.phase === "reward" && (
        <Dialog title={`Minggu ${s.week} selesai`}>
          <p>
            {s.delivered} paket terkirim. Pilih bekal untuk jaringan yang makin
            sibuk. Bekal +2 stok kabel tersedia bersama bonus pilihanmu.
          </p>
          <button
            className="primary"
            onClick={() => setS((v) => reward(v, "stock"))}
          >
            +4 stok kabel tambahan
          </button>
          <button
            className="secondary"
            onClick={() => setS((v) => reward(v, "capacity"))}
          >
            +2 kapasitas semua pengangkut
          </button>
          <button
            className="secondary"
            onClick={() => setS((v) => reward(v, "speed"))}
          >
            Tingkatkan kecepatan transfer
          </button>
        </Dialog>
      )}
      {s.phase === "over" && (
        <Dialog title="Jaringan kewalahan">
          <p>
            Antrean terlalu lama penuh. Coba jalur lebih pendek atau perangkat
            transfer pada sesi berikutnya.
          </p>
          <div className="result-score">
            <small>PAKET TERKIRIM</small>
            <strong>{s.delivered}</strong>
          </div>
          <button className="primary" onClick={restart}>
            Main Flow lagi
          </button>
          <button className="secondary" onClick={() => onMenu(best.current)}>
            Kembali ke menu
          </button>
        </Dialog>
      )}
    </main>
  );
}
