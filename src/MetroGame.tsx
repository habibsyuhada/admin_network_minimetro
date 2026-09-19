import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw, Network } from "lucide-react";
import Dialog from "./Dialog";
import {
  COLORS,
  SHAPES,
  SITES,
  clearLine,
  extendLine,
  metroTick,
  newMetro,
  reward,
} from "./game/metro";
import "./metro.css";

export default function MetroGame({ onMenu }: { onMenu: () => void }) {
  const [s, setS] = useState(newMetro);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [tip, setTip] = useState(
    "Pilih jalur, lalu sentuh simpul berurutan untuk menghubungkannya.",
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
        "Simpul sudah ada di jalur ini. Lanjutkan ke simpul lain atau atur ulang jalur.",
      );
      return;
    }
    setS((v) => extendLine(v, selected, id));
    setTip(
      `Jalur ${selected + 1} diperpanjang. Hubungkan simbol tujuan yang berbeda.`,
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
  const restart = () => {
    setS(newMetro());
    setSelected(0);
    setPaused(false);
    setConfirm(false);
    setTip("Pilih jalur, lalu hubungkan simpul dengan simbol berbeda.");
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
          <span>01 — DISTRIK KONEKSI</span>
          <span>{s.queues.length} simpul</span>
        </div>
        <svg
          ref={svg}
          viewBox="0 0 400 600"
          className="metro-map"
          role="group"
          aria-label="Peta Flow interaktif"
          onPointerMove={(e) => {
            const g = gesture.current;
            if (g?.pointer === e.pointerId)
              setPointer(position(e.clientX, e.clientY));
          }}
          onPointerUp={(e) => {
            const g = gesture.current;
            gesture.current = null;
            setPointer(null);
            if (!g || g.pointer !== e.pointerId || frozen) return;
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
              setTip("Lepaskan di simpul tujuan untuk membuat jalur.");
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
              "Tarik dari ujung jalur untuk memperpanjang. Sentuh simpul juga bisa.",
            );
          }}
          onPointerCancel={() => {
            gesture.current = null;
            setPointer(null);
          }}
          onLostPointerCapture={() => {
            gesture.current = null;
            setPointer(null);
          }}
        >
          <path
            className="metro-river"
            d="M-30 355 C60 335 85 160 180 260 S280 460 440 400"
          />
          <text
            className="metro-water-label"
            x="145"
            y="290"
            transform="rotate(30 145 290)"
          >
            ALIRAN DATA
          </text>
          {s.lines.map((l, i) => (
            <polyline
              key={i}
              className="metro-route"
              points={l.stops
                .map((id) => `${SITES[id].x},${SITES[id].y}`)
                .join(" ")}
              stroke={COLORS[i]}
              strokeWidth={selected === i ? 7 : 5}
              opacity={selected === i ? 1 : 0.65}
            />
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
                transform={`translate(${n.x},${n.y})`}
                role="button"
                aria-label={`Simpul ${id + 1} ${SHAPES[n.shape]}`}
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
                    r="25"
                    className="metro-danger-ring"
                    strokeDasharray={`${(s.overload[id] / 20) * 157} 157`}
                    transform="rotate(-90)"
                  />
                )}
                {n.shape === 0 ? (
                  <circle r="12" className="metro-symbol" />
                ) : n.shape === 1 ? (
                  <path d="M0 -14L14 12H-14Z" className="metro-symbol" />
                ) : (
                  <rect
                    x="-12"
                    y="-12"
                    width="24"
                    height="24"
                    rx="2"
                    className="metro-symbol"
                  />
                )}
                <text y="-33" className="metro-node-id">
                  {String(id + 1).padStart(2, "0")}
                </text>
                <text
                  x={n.x > 275 ? -20 : 20}
                  textAnchor={n.x > 275 ? "end" : "start"}
                  y="5"
                  className="metro-queue"
                >
                  {q
                    .slice(0, 4)
                    .map((p) => SHAPES[p])
                    .join(" ")}
                </text>
                <text
                  x={n.x > 275 ? -20 : 20}
                  textAnchor={n.x > 275 ? "end" : "start"}
                  y="19"
                  className="metro-queue"
                >
                  {q.length > 4
                    ? `${q
                        .slice(4, 7)
                        .map((p) => SHAPES[p])
                        .join(" ")}${q.length > 7 ? ` +${q.length - 7}` : ""}`
                    : ""}
                </text>
              </g>
            );
          })}
          {s.lines.map((l, i) => {
            if (l.stops.length < 2) return null;
            const a = SITES[l.stops[l.at]],
              b = SITES[l.stops[l.at + l.direction]];
            if (!b) return null;
            const x = a.x + (b.x - a.x) * l.progress,
              y = a.y + (b.y - a.y) * l.progress;
            return (
              <g key={i} transform={`translate(${x},${y})`} aria-hidden="true">
                <rect
                  x="-13"
                  y="-9"
                  width="26"
                  height="18"
                  rx="5"
                  fill={COLORS[i]}
                  stroke="#faf8f1"
                  strokeWidth="2"
                />
                <text className="metro-car-count" y="4">
                  {l.cargo.length}
                </text>
              </g>
            );
          })}
        </svg>
        <div
          className={`metro-notice ${s.overload[danger] > 0 ? "is-danger" : ""}`}
          role="status"
        >
          {s.overload[danger] > 0
            ? `Simpul ${danger + 1} penuh · ${Math.max(0, Math.ceil(20 - s.overload[danger]))} detik untuk mengurangi antrean`
            : "Paket menuju simpul dengan simbol yang sama."}
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
                  `Jalur ${i + 1} dipilih. Sentuh simpul untuk memperpanjang.`,
                );
              }}
            >
              <span>{i + 1}</span>
              <small>{l.stops.length} simpul</small>
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
        <div className="metro-capacity">
          <span>{s.capacity} paket / pengangkut</span>
          <button onClick={() => setHelp(true)}>Cara bermain</button>
        </div>
      </section>
      {help && (
        <Dialog
          title="Jaringan kecil, terus tumbuh"
          onClose={() => setHelp(false)}
        >
          <p>
            Bangun jalur berwarna dan antar paket ke simpul dengan simbol tujuan
            yang sama: ● ▲ ■.
          </p>
          <ol className="handbook">
            <li>
              Pilih warna, lalu sentuh simpul satu per satu. Atau tarik dari
              simpul awal ke tujuan, lalu lanjutkan dari ujung jalur.
            </li>
            <li>
              Satu pengangkut bolak-balik di setiap jalur. Paket bisa pindah
              jalur di simpul bersama.
            </li>
            <li>
              Simpul baru muncul setiap 35 detik. Setiap 60 detik, pilih satu
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
          <button className="secondary" onClick={onMenu}>
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
            Paket di pengangkut dikembalikan ke simpul terakhir. Gambar ulang
            jalur setelah ini.
          </p>
          <button
            className="primary"
            onClick={() => {
              setS((v) => clearLine(v, selected));
              setTip(
                "Jalur diatur ulang. Sentuh simpul untuk menggambar rute baru.",
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
            +1 jalur & pengangkut
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
            +15 kecepatan semua pengangkut
          </button>
        </Dialog>
      )}
      {s.phase === "over" && (
        <Dialog title="Jaringan kewalahan">
          <p>
            Antrean terlalu lama penuh. Coba jalur lebih pendek atau simpul
            transfer pada sesi berikutnya.
          </p>
          <div className="result-score">
            <small>PAKET TERKIRIM</small>
            <strong>{s.delivered}</strong>
          </div>
          <button className="primary" onClick={restart}>
            Main Flow lagi
          </button>
          <button className="secondary" onClick={onMenu}>
            Kembali ke menu
          </button>
        </Dialog>
      )}
    </main>
  );
}
