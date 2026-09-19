import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw, Network } from "lucide-react";
import Dialog from "./Dialog";
import {
  COLORS,
  SITES,
  clearLine,
  extendLine,
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
import { laneSegment, linePath } from "./game/mapView";

export default function MetroGame({
  onMenu,
}: {
  onMenu: (delivered: number) => void;
}) {
  const [s, setS] = useState(newMetro);
  const best = useRef(0);
  best.current = Math.max(best.current, s.delivered);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [tip, setTip] = useState(
    "Pilih jalur, lalu sentuh perangkat berurutan untuk menghubungkannya.",
  );
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const gesture = useRef<{
    pointer: number;
    start: number;
    x: number;
    y: number;
  } | null>(null);
  const frozen = paused || help || confirm || s.phase !== "running";
  useEffect(() => {
    const hide = () => {
      if (document.hidden) setPaused(true);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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
  const add = (id: number) => {
    if (frozen) return;
    if (s.lines[selected].stops.includes(id)) {
      setTip(
        "Perangkat sudah ada di jalur ini. Lanjutkan ke perangkat lain atau atur ulang jalur.",
      );
      return;
    }
    setS((v) => extendLine(v, selected, id));
    playCue("link");
    setTip(
      `Jalur ${selected + 1} diperpanjang. Hubungkan jenis perangkat yang berbeda.`,
    );
  };
  const position = (x: number, y: number) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(x, y).matrixTransform(matrix.inverse())
      : { x: 0, y: 0 };
  };
  const line = s.lines[selected];
  const end = line.stops.length
    ? SITES[line.stops[line.stops.length - 1]]
    : null;
  const danger = s.overload.indexOf(Math.max(...s.overload));
  const activeSites = SITES.slice(0, s.queues.length);
  const mapTop = Math.max(0, Math.min(...activeSites.map((n) => n.y)) - 65);
  const mapHeight = Math.max(
    400,
    Math.max(...activeSites.map((n) => n.y)) + 75 - mapTop,
  );
  const camera = useMapCamera(
    svg,
    { x: 0, y: mapTop, width: 400, height: mapHeight },
    frozen,
  );
  const restart = () => {
    camera.reset();
    setS(newMetro());
    setSelected(0);
    setPaused(false);
    setConfirm(false);
    setTip("Pilih jalur, lalu hubungkan perangkat dengan jenis berbeda.");
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
            const consumed = camera.end(e);
            const g = gesture.current;
            gesture.current = null;
            setPointer(null);
            if (consumed || !g || g.pointer !== e.pointerId || frozen) return;
            if (Math.hypot(e.clientX - g.x, e.clientY - g.y) < 10) {
              add(g.start);
              return;
            }
            const p = position(e.clientX, e.clientY);
            const target = SITES.findIndex(
              (n, id) =>
                id < s.queues.length && Math.hypot(n.x - p.x, n.y - p.y) < 30,
            );
            if (target < 0 || target === g.start) {
              setTip("Lepaskan di perangkat tujuan untuk membuat jalur.");
              return;
            }
            setS((v) => {
              const current = v.lines[selected];
              if (!current.stops.length)
                return extendLine(
                  extendLine(v, selected, g.start),
                  selected,
                  target,
                );
              if (current.stops[current.stops.length - 1] === g.start)
                return extendLine(v, selected, target);
              return v;
            });
            setTip(
              "Tarik dari ujung jalur untuk memperpanjang. Sentuh perangkat juga bisa.",
            );
          }}
          onPointerCancel={() => {
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
          <rect width="400" height="600" fill="url(#network-grid)" />
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
          {s.lines.map((_, i) => (
            <g key={i} className="route-layer" aria-hidden="true">
              <path
                className="metro-route route-casing"
                d={linePath(s.lines, i)}
                stroke="#101f20"
                strokeWidth="9"
              />
              <path
                className="metro-route"
                data-route={i}
                d={linePath(s.lines, i)}
                stroke={COLORS[i]}
                strokeWidth={selected === i ? 6 : 5}
              />
            </g>
          ))}
          {pointer && (
            <line
              className="metro-preview"
              x1={(end || SITES[gesture.current?.start ?? 0]).x}
              y1={(end || SITES[gesture.current?.start ?? 0]).y}
              x2={pointer.x}
              y2={pointer.y}
              stroke={COLORS[selected]}
            />
          )}
          {s.queues.map((q, id) => {
            const n = SITES[id];
            return (
              <g
                key={id}
                data-node-id={id}
                transform={`translate(${n.x},${n.y})`}
                role="button"
                aria-label={`${DEVICE_NAMES[n.shape]} ${id + 1}`}
                tabIndex={frozen ? -1 : 0}
                aria-pressed={line.stops.includes(id)}
                className="metro-node"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    add(id);
                  }
                }}
                onPointerDown={(e) => {
                  if (frozen || !e.isPrimary || e.button !== 0) return;
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
                        stroke={DEVICE_COLORS[packet]}
                        strokeWidth=".6"
                      />
                      <g transform="scale(.29)">
                        <DeviceGlyph kind={packet} compact />
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
          {s.lines.map((l, i) => {
            if (l.stops.length < 2) return null;
            const from = l.stops[l.at],
              to = l.stops[l.at + l.direction];
            if (to === undefined) return null;
            const [a, b] = laneSegment(s.lines, i, from, to);
            const x = a.x + (b.x - a.x) * l.progress,
              y = a.y + (b.y - a.y) * l.progress;
            return (
              <g
                key={i}
                className="packet-marker"
                transform={`translate(${x},${y}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI})`}
                aria-hidden="true"
              >
                <rect
                  x="-13"
                  y="-4"
                  width="26"
                  height="8"
                  rx="3"
                  fill={COLORS[i]}
                  stroke="#101f20"
                  strokeWidth="2"
                />
                <text className="metro-car-count" y="3" style={{ fontSize: 8 }}>
                  {l.cargo.length}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="map-camera-controls" aria-label="Kontrol tampilan peta">
          <span>Geser area kosong · Cubit untuk zoom</span>
          <button
            aria-label="Perkecil peta"
            disabled={frozen || camera.view.width >= 400 / 0.65}
            onClick={() => camera.zoom(1 / 1.25)}
          >
            −
          </button>
          <button
            aria-label="Tampilkan seluruh peta"
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
            : "Ikon pada paket menunjukkan perangkat tujuan."}
        </div>
      </div>
      <section className="metro-controls" aria-label="Kontrol jalur">
        <div className="metro-line-buttons">
          {s.lines.map((l, i) => (
            <button
              key={i}
              aria-label={`Jalur ${i + 1}`}
              aria-pressed={selected === i}
              disabled={frozen}
              style={{ "--route": COLORS[i] } as React.CSSProperties}
              onClick={() => {
                setSelected(i);
                setTip(
                  `Jalur ${i + 1} dipilih. Sentuh perangkat untuk memperpanjang.`,
                );
              }}
            >
              <span>{i + 1}</span>
              <small>{l.stops.length} perangkat</small>
            </button>
          ))}
          <button
            className="metro-clear"
            aria-label="Atur ulang jalur terpilih"
            disabled={frozen || !line.stops.length}
            onClick={() => setConfirm(true)}
          >
            <RotateCcw size={19} />
          </button>
        </div>
        <p role="status">{tip}</p>
        <div className="network-legend">
          {DEVICE_NAMES.map((name, i) => (
            <span key={name}>
              <svg viewBox="-19 -20 38 40">
                <DeviceGlyph kind={i} compact />
              </svg>
              {name}
            </span>
          ))}
        </div>
        <div className="metro-capacity">
          <span>{s.capacity} paket / transfer</span>
          <button onClick={() => setHelp(true)}>Cara bermain</button>
        </div>
      </section>
      {help && (
        <Dialog
          title="Jaringan kecil, terus tumbuh"
          onClose={() => setHelp(false)}
        >
          <p>
            Bangun jalur berwarna dan antar paket ke perangkat dengan jenis
            perangkat tujuan: Client, Server, atau Database.
          </p>
          <ol className="handbook">
            <li>
              Geser area kosong untuk menggerakkan peta. Cubit dengan dua jari
              atau gunakan tombol − / + untuk zoom. Tekan persentase untuk
              melihat seluruh jaringan.
            </li>
            <li>
              Pilih warna, lalu sentuh perangkat satu per satu. Atau tarik dari
              perangkat awal ke tujuan, lalu lanjutkan dari ujung jalur.
            </li>
            <li>
              Paket mengalir bolak-balik di setiap jalur dan bisa pindah jalur
              di perangkat bersama.
            </li>
            <li>
              Perangkat baru muncul setiap 35 detik. Setiap 60 detik, pilih satu
              peningkatan.
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
      {confirm && (
        <Dialog
          title={`Atur ulang jalur ${selected + 1}?`}
          onClose={() => setConfirm(false)}
        >
          <p>
            Paket dalam perjalanan dikembalikan ke perangkat terakhir. Gambar
            ulang jalur setelah ini.
          </p>
          <button
            className="primary"
            onClick={() => {
              setS((v) => clearLine(v, selected));
              setTip(
                "Jalur diatur ulang. Sentuh perangkat untuk menggambar rute baru.",
              );
              setConfirm(false);
            }}
          >
            Atur ulang jalur
          </button>
          <button className="secondary" onClick={() => setConfirm(false)}>
            Batal
          </button>
        </Dialog>
      )}
      {s.phase === "reward" && (
        <Dialog title={`Minggu ${s.week} selesai`}>
          <p>
            {s.delivered} paket terkirim. Pilih bekal untuk jaringan yang makin
            sibuk.
          </p>
          <button
            className="primary"
            disabled={s.lines.length >= COLORS.length}
            onClick={() => setS((v) => reward(v, "line"))}
          >
            +1 jalur transfer
          </button>
          <button
            className="secondary"
            onClick={() => setS((v) => reward(v, "capacity"))}
          >
            +2 kapasitas paket per transfer
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
