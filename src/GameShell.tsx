import { useEffect, useState } from "react";
import {
  Settings2,
  Volume2,
  VolumeX,
  Download,
  BookOpen,
  Trophy,
} from "lucide-react";
import { CLIENT_VARIANTS } from "./game/metro";
import CampaignMap from "./CampaignMap";
import { LEVELS, readProgress, levelUnlocked } from "./game/levels";
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
      progress: readProgress(v?.progress),
      sound: typeof v?.sound === "boolean" ? v.sound : true,
      best:
        Number.isSafeInteger(v?.best) && v.best >= 0 ? (v.best as number) : 0,
    };
  } catch {
    return { sound: true, best: 0, progress: readProgress(null) };
  }
}
export default function GameShell() {
  const [flow, setFlow] = useState(false);
  const [activeLevel, setActiveLevel] = useState<string | undefined>();
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[0].id);
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
        levelId={activeLevel}
        onComplete={(id, stars) =>
          setProfile((v) => ({
            ...v,
            progress: {
              ...v.progress,
              [id]: Math.max(v.progress[id] ?? 0, stars),
            },
          }))
        }
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
          <i /> OPERATOR <b>{Object.keys(profile.progress).length}/6</b>
        </span>
        <span className="campaign-total">
          <Trophy size={16} />
          {Object.values(profile.progress).reduce((a, b) => a + b, 0)} / 18 ★
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
        <div>
          <span className="overline">BANGUN. HUBUNGKAN. TUMBUH.</span>
          <h1 aria-label="NOC FLOW.">
            NOC{" "}
            <span>
              FLOW<span className="title-dot">.</span>
            </span>
          </h1>
        </div>
        <span className="season-badge">
          EKSPEDISI
          <br />
          <b>01</b>
        </span>
      </section>
      <CampaignMap
        selected={selectedLevel}
        onSelect={setSelectedLevel}
        progress={profile.progress}
        onPlay={(id) => {
          if (!levelUnlocked(id, profile.progress)) return;
          unlockAudio();
          playCue("tap");
          setActiveLevel(id);
          setFlow(true);
        }}
      />
      <button
        className="endless-play"
        aria-label="Main NOC Flow"
        onClick={() => {
          unlockAudio();
          playCue("tap");
          setActiveLevel(undefined);
          setFlow(true);
        }}
      >
        <span>∞</span>
        <div>
          <b>MODE BEBAS</b>
          <small>
            Tanpa target · rekor {profile.best.toLocaleString("id-ID")} paket
          </small>
        </div>
        <span>›</span>
      </button>
      <nav className="home-bottom-bar" aria-label="Menu game">
        <button onClick={() => setPanel("help")}>
          <BookOpen size={18} /> Panduan
        </button>
        <span>PETA MISI</span>
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
          Progres, rekor, dan pengaturan belum bisa disimpan di perangkat ini.
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
            Selesaikan target bulan dan paket untuk membuka map berikutnya.
            Bintang tambahan: kirim 25% lebih banyak paket dan sisakan minimal
            50% modal awal. Progres misi tersimpan di perangkat; sesi yang
            sedang berjalan belum tersimpan.
          </p>
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
            <p>
              Setiap jenis client menerima paket dengan ikon perangkat yang
              sama.
            </p>
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
              Modal awal 1.600 gold. Kabel berharga 100/200/250 gold; router 150
              gold. Router muncul sebagai pratinjau: geser, lalu OK atau Cancel.
              Setiap paket terkirim memberi profit 18 gold. Tiap menit, profit
              dikurangi maintenance masuk ke saldo. Penjualan kabel
              mengembalikan 100% harganya.
            </li>
            <li>
              Antrean penuh memicu peringatan: PC/layanan 10, switch 16, router
              24 paket. Kurangi dalam 25 detik sebelum jaringan kewalahan.
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
