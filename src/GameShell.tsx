import { useEffect, useState } from "react";
import {
  Settings2,
  Play,
  Volume2,
  VolumeX,
  Download,
  BookOpen,
  Trophy,
  ChevronRight,
  Network,
} from "lucide-react";
import { CLIENT_VARIANTS } from "./game/metro";
import MetroGame from "./MetroGame";
import Dialog from "./Dialog";
import FullscreenButton from "./FullscreenButton";
import { DeviceGlyph, DEVICE_NAMES } from "./NetworkArt";
import { setAudioEnabled, unlockAudio, playCue } from "./game/audio";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const KEY = "noc-flow-profile-v1";
function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      sound: typeof v?.sound === "boolean" ? v.sound : true,
      best:
        Number.isSafeInteger(v?.best) && v.best >= 0 ? (v.best as number) : 0,
    };
  } catch {
    return { sound: true, best: 0 };
  }
}
export default function GameShell() {
  const [flow, setFlow] = useState(false);
  const [profile, setProfile] = useState(load);
  const [panel, setPanel] = useState<"help" | "settings" | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    setAudioEnabled(profile.sound);
    try {
      localStorage.setItem(KEY, JSON.stringify(profile));
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }, [profile]);
  useEffect(() => {
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    const installed = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", prompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", prompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    let disposed = false;
    const timer = window.setInterval(() => {
      void navigator.serviceWorker
        .getRegistration()
        .then((r) => {
          if (!disposed) setUpdateReady(!!r?.waiting);
        })
        .catch(() => {});
    }, 3000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, []);
  if (flow)
    return (
      <MetroGame
        onMenu={(delivered) => {
          setProfile((v) => ({ ...v, best: Math.max(v.best, delivered) }));
          setFlow(false);
        }}
      />
    );
  return (
    <main className="game-home">
      <header className="home-toolbar">
        <span className="operator-tag">
          <i /> OPERATOR / 01
        </span>
        <button
          className="icon-button"
          aria-label="Pengaturan"
          onClick={() => setPanel("settings")}
        >
          <Settings2 size={20} />
        </button>
      </header>
      <section className="home-title">
        <span className="overline">NETWORK OPERATIONS CLUB</span>
        <h1>
          NOC
          <span>
            FLOW<span className="title-dot">.</span>
          </span>
        </h1>
        <p>Jaringan di tanganmu.</p>
      </section>
      <div className="home-network" aria-hidden="true">
        <svg viewBox="0 0 360 280">
          <defs>
            <pattern
              id="home-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".8" fill="#28423f" />
            </pattern>
            <radialGradient id="home-glow">
              <stop stopColor="#4cc9a4" stopOpacity=".17" />
              <stop offset="1" stopColor="#4cc9a4" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="360" height="280" fill="url(#home-grid)" />
          <ellipse cx="180" cy="130" rx="165" ry="125" fill="url(#home-glow)" />
          <g className="home-cables">
            <path d="M65 75H135L180 120V150" stroke="#79e2bc" />
            <path d="M295 85H240L180 145" stroke="#eeab68" />
            <path d="M85 224H140L180 184V150" stroke="#9eabfa" />
            <path d="M285 223H230L180 173V150" stroke="#79e2bc" />
          </g>
          <g className="home-cable-pulses">
            <path d="M65 75H135L180 120V150" />
            <path d="M285 223H230L180 173V150" />
          </g>
          <g transform="translate(65 75)">
            <DeviceGlyph kind={0} />
            <text className="art-label" y="42">
              CLIENT / 01
            </text>
          </g>
          <g transform="translate(295 85)">
            <DeviceGlyph kind={2} />
            <text className="art-label" y="42">
              FACEBOOK
            </text>
          </g>
          <g transform="translate(85 224)">
            <DeviceGlyph kind={0} />
            <text className="art-label" y="39">
              CLIENT / 02
            </text>
          </g>
          <g transform="translate(285 223)">
            <DeviceGlyph kind={1} />
            <text className="art-label" y="39">
              YOUTUBE
            </text>
          </g>
          <g transform="translate(180 146)">
            <circle
              r="49"
              fill="#112e28"
              stroke="#3e6e5e"
              strokeDasharray="3 6"
            />
            <rect
              x="-33"
              y="-30"
              width="66"
              height="54"
              rx="12"
              fill="#213d34"
              stroke="#83e6b9"
            />
            <path d="M-20 -10H20M-20 5H20" stroke="#83e6b9" strokeWidth="3" />
            <g fill="#83e6b9">
              <circle cx="-18" cy="15" r="2" />
              <circle cx="-10" cy="15" r="2" />
              <circle cx="-2" cy="15" r="2" />
            </g>
            <text className="art-label" y="-58">
              CORE ROUTER
            </text>
          </g>
        </svg>
        <div className="network-caption">
          <span className="live-led" /> KONEKSI KECIL. TANTANGAN BESAR.
        </div>
      </div>
      <section className="home-play">
        <div className="district-select">
          <span className="district-icon">
            <Network size={22} />
          </span>
          <div>
            <small>DISTRIK 01</small>
            <strong>Local Area Network</strong>
          </div>
          <span className="endless-tag">ENDLESS</span>
        </div>
        <button
          className="play-button"
          aria-label="Main NOC Flow"
          onClick={() => {
            unlockAudio();
            playCue("tap");
            setFlow(true);
          }}
        >
          <Play size={22} fill="currentColor" />
          <span>MULAI BERMAIN</span>
          <ChevronRight size={21} />
        </button>
        <div className="home-record">
          <Trophy size={15} />
          <span>REKOR PAKET</span>
          <strong>{profile.best.toLocaleString("id-ID")}</strong>
        </div>
      </section>
      <nav className="home-bottom-bar" aria-label="Menu game">
        <button onClick={() => setPanel("help")}>
          <BookOpen size={18} /> Panduan
        </button>
        <span>NOC FLOW / 02</span>
        <button
          aria-label={profile.sound ? "Matikan suara" : "Aktifkan suara"}
          onClick={() => {
            setAudioEnabled(!profile.sound);
            unlockAudio();
            playCue("tap");
            setProfile((v) => ({ ...v, sound: !v.sound }));
          }}
        >
          {profile.sound ? <Volume2 size={18} /> : <VolumeX size={18} />} Suara
        </button>
      </nav>
      {saveFailed && (
        <p className="notice" role="status">
          Rekor dan pengaturan belum bisa disimpan di perangkat ini.
        </p>
      )}
      {updateReady && (
        <p className="notice">
          Pembaruan tersedia. Tutup semua tab NOC Flow lalu buka kembali.
        </p>
      )}
      {panel === "help" && (
        <Dialog title="Panduan operator" onClose={() => setPanel(null)}>
          <p>
            Hubungkan perangkat dengan kabel berwarna. Antar paket ke perangkat
            berdasarkan ikon layanan. Paket YouTube dapat diterima node YouTube
            mana pun. Buka Detail node untuk melihat antrean per ikon.
          </p>
          <div className="device-legend">
            {DEVICE_NAMES.map((name, i) => (
              <div key={name}>
                <svg viewBox="-30 -30 60 60">
                  <DeviceGlyph kind={i} />
                </svg>
                <span>{name}</span>
              </div>
            ))}
          </div>
          <details className="client-catalog">
            <summary>16 variasi client</summary>
            <div className="client-gallery">
              {CLIENT_VARIANTS.map((name, variant) => (
                <div key={name}>
                  <svg viewBox="-30 -30 60 60">
                    <DeviceGlyph kind={0} variant={variant} />
                  </svg>
                  <span>{name}</span>
                </div>
              ))}
            </div>
            <p>Semua variasi tetap menerima paket berikon PC.</p>
          </details>
          <ol className="handbook">
            <li>
              Pilih Ethernet, Fiber, atau Backbone. Tarik satu kabel antara dua
              perangkat. Ketuk node untuk membuka detailnya. Setiap kabel
              memiliki pengangkut sendiri.
            </li>
            <li>
              Pengangkut bolak-balik hanya di kabelnya. Kapasitas muatannya
              menunjukkan bandwidth; paket transit harus menunggu pengangkut
              berikutnya. Rute dipilih otomatis.
            </li>
            <li>
              Modal awal 1.000 gold. Kabel berharga 100/200/250 gold; router 150
              gold. Router muncul sebagai pratinjau: geser, lalu OK atau Cancel.
              Setiap paket terkirim memberi profit 25 gold. Tiap menit, profit
              dikurangi maintenance masuk ke saldo. Penjualan kabel
              mengembalikan 100% harganya.
            </li>
            <li>
              Antrean penuh memicu peringatan: PC/layanan 8, switch 10, router
              16 paket. Kurangi dalam 20 detik sebelum jaringan kewalahan.
            </li>
          </ol>
          <button className="primary" onClick={() => setPanel(null)}>
            Siap menghubungkan
          </button>
        </Dialog>
      )}
      {panel === "settings" && (
        <Dialog title="Pengaturan" onClose={() => setPanel(null)}>
          <p className="muted">
            Sesi aktif berakhir saat halaman dimuat ulang. Rekor paket tersimpan
            di perangkat setelah kembali ke menu.
          </p>
          <FullscreenButton />
          {install && (
            <button
              className="primary"
              onClick={async () => {
                try {
                  await install.prompt();
                  await install.userChoice;
                } finally {
                  setInstall(null);
                }
              }}
            >
              <Download size={18} /> Pasang di layar utama
            </button>
          )}
          <p className="muted">
            iPhone: Safari → Bagikan → Tambah ke Layar Utama.
          </p>
          <a
            className="license-link"
            href="./THIRD_PARTY_NOTICES.txt"
            target="_blank"
            rel="noreferrer"
          >
            Lisensi komponen ↗
          </a>
        </Dialog>
      )}
    </main>
  );
}
