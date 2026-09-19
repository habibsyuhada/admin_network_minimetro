import { useCallback, useEffect, useRef, useState } from "react";
import {
  Network,
  ArrowUpRight,
  Play,
  Volume2,
  VolumeX,
  Download,
} from "lucide-react";
import App from "./App";
import MetroGame from "./MetroGame";
import Dialog from "./Dialog";
import FullscreenButton from "./FullscreenButton";
import { type State } from "./game/engine";
import {
  loadProfile,
  saveProfile,
  score,
  newRun,
  type Profile,
} from "./game/storage";
import { setAudioEnabled, unlockAudio, playCue } from "./game/audio";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export default function GameShell() {
  const [flow, setFlow] = useState(false);
  const [profile, setProfile] = useState(loadProfile),
    [run, setRun] = useState<State | null>(null);
  const [help, setHelp] = useState(false),
    [confirm, setConfirm] = useState(false),
    [saveFailed, setSaveFailed] = useState(false);
  const [install, setInstall] = useState<InstallPrompt | null>(null),
    [offlineReady, setOfflineReady] = useState(false),
    [updateReady, setUpdateReady] = useState(false);
  const live = useRef(profile),
    lastSave = useRef(0),
    counted = useRef(false);
  const persist = useCallback((next: Profile) => {
    live.current = next;
    setSaveFailed(!saveProfile(next));
  }, []);
  useEffect(() => {
    setAudioEnabled(profile.sound);
  }, [profile.sound]);
  useEffect(() => {
    const save = () => persist(live.current);
    const hide = () => {
      if (document.hidden) save();
    };
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    const installed = () => setInstall(null);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", save);
    window.addEventListener("beforeinstallprompt", prompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("beforeinstallprompt", prompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, [persist]);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    let disposed = false;
    const timer = window.setInterval(() => {
      void navigator.serviceWorker
        .getRegistration()
        .then((r) => {
          if (disposed) return;
          setOfflineReady(!!r?.active);
          setUpdateReady(!!r?.waiting);
        })
        .catch(() => {
          /* Offline status is optional when the browser blocks SW access. */
        });
    }, 3000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, []);
  const update = useCallback(
    (state: State) => {
      let next = { ...live.current, run: state };
      if (state.phase === "complete" && !counted.current) {
        counted.current = true;
        next = {
          ...next,
          wins: next.wins + 1,
          best: Math.max(next.best, score(state)),
          tutorial: false,
        };
      }
      const terminal =
        state.phase !== "running" && live.current.run?.phase === "running";
      live.current = next;
      if (Date.now() - lastSave.current > 1000 || terminal) {
        lastSave.current = Date.now();
        persist(next);
      }
    },
    [persist],
  );
  const start = (resume: boolean) => {
    unlockAudio();
    playCue("tap");
    const state =
      resume && live.current.run ? live.current.run : newRun(live.current);
    counted.current = state.phase === "complete";
    persist({ ...live.current, notice: "", run: state });
    setRun(state);
    setConfirm(false);
  };
  const home = () => {
    persist(live.current);
    setProfile(live.current);
    setRun(null);
  };
  const sound = () => {
    const next = { ...live.current, sound: !live.current.sound };
    setAudioEnabled(next.sound);
    unlockAudio();
    playCue("tap");
    persist(next);
    setProfile(next);
  };
  const resumable = profile.run?.phase === "running";
  if (flow) return <MetroGame onMenu={() => setFlow(false)} />;
  return (
    <>
      {run ? (
        <App
          key={run.seed}
          saved={run}
          onStateChange={update}
          onMenu={home}
          onRestart={() => start(false)}
          sound={profile.sound}
          onSound={sound}
        />
      ) : (
        <main className="shell">
          <header className="shell-header">
            <a className="brand" href="#" aria-label="NOC Shift beranda">
              <Network size={23} /> NOC<span>SHIFT</span>
            </a>
            <FullscreenButton />
            <button
              className="icon-button"
              onClick={sound}
              aria-label={profile.sound ? "Matikan suara" : "Aktifkan suara"}
            >
              {profile.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
          </header>
          <section className="hero">
            <div className="eyebrow">
              <span className="status-dot" /> RUANG KENDALI JARINGAN
            </div>
            <h1>
              Jaringan kecil.
              <br />
              <span>Tanggung jawab besar.</span>
            </h1>
            <p>
              Hubungkan kantor. Antisipasi lonjakan traffic.
              <br />
              Jaga satu distrik tetap online, sepanjang shift.
            </p>
            <div className="hero-diagram" aria-hidden="true">
              <span>HQ</span>
              <i />
              <span className="router-symbol">
                <Network size={34} />
              </span>
              <i />
              <span>APP</span>
              <div className="diagram-note">
                ● LAYANAN TERHUBUNG <b>18 ms</b>
              </div>
            </div>
          </section>
          <section className="mission-card">
            <div className="flow-entry">
              <span className="eyebrow">MODE BARU / MOBILE</span>
              <h3>NOC Flow</h3>
              <p>
                Gambar jalur. Antar paket. Jaga jaringan yang terus tumbuh.
                Strategi santai sampai antrean mulai penuh.
              </p>
              <button className="primary" onClick={() => setFlow(true)}>
                Main NOC Flow <ArrowUpRight size={18} />
              </button>
            </div>
            <div className="mission-top">
              <span className="eyebrow">MAP 01 / HQ DISTRICT</span>
              <span className="badge">10 MENIT</span>
            </div>
            <h2>Shift pagi pertama</h2>
            <p>
              Tiga kantor. Dua router. Satu gangguan yang menguji persiapanmu.
            </p>
            <div className="mission-tags">
              <span>Strategi jaringan</span>
              <span>Single player</span>
              <span>Rekor lokal</span>
            </div>
            {resumable && (
              <button className="primary" onClick={() => start(true)}>
                <Play size={18} /> Lanjutkan shift <ArrowUpRight size={18} />
              </button>
            )}
            <button
              className={resumable ? "secondary" : "primary"}
              onClick={() => (resumable ? setConfirm(true) : start(false))}
            >
              {profile.wins ? "Main lagi" : "Mulai shift baru"}{" "}
              <ArrowUpRight size={18} />
            </button>
            <label className="check">
              <input
                type="checkbox"
                checked={profile.tutorial}
                onChange={(e) => {
                  const next = { ...live.current, tutorial: e.target.checked };
                  persist(next);
                  setProfile(next);
                }}
              />{" "}
              Tampilkan panduan awal
            </label>
          </section>
          <div className="home-bottom">
            <button className="text-button" onClick={() => setHelp(true)}>
              Cara bermain ↗
            </button>
            <div>
              <small>REKOR TERBAIK</small>
              <strong>{profile.best.toLocaleString("id-ID")}</strong>
            </div>
            <div>
              <small>SHIFT SELESAI</small>
              <strong>{profile.wins}</strong>
            </div>
          </div>
          {profile.legacyBest > 0 && (
            <p className="muted">
              Rekor tutorial versi lama:{" "}
              {profile.legacyBest.toLocaleString("id-ID")}
            </p>
          )}
          {profile.notice && (
            <p role="status" className="notice">
              {profile.notice}
            </p>
          )}
          {install && (
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await install.prompt();
                  await install.userChoice;
                } finally {
                  setInstall(null);
                }
              }}
            >
              <Download size={16} /> Pasang di layar utama
            </button>
          )}
          <footer>
            PROGRES LOKAL <span>•</span>{" "}
            {offlineReady
              ? "SIAP DIMAINKAN OFFLINE"
              : "OFFLINE TERSEDIA SETELAH ASET TERSIMPAN"}
            <br />
            NOC SHIFT / v1.0.0
            <br />
            <a
              href="./THIRD_PARTY_NOTICES.txt"
              target="_blank"
              rel="noreferrer"
            >
              Lisensi komponen
            </a>
          </footer>
        </main>
      )}
      {saveFailed && (
        <div role="status" className="save-warning">
          Penyimpanan gagal. Progres hanya bertahan selama tab terbuka.
        </div>
      )}
      {updateReady && !run && (
        <p className="notice">
          Pembaruan tersedia. Tutup semua tab NOC Shift lalu buka kembali.
          Progres telah disimpan.
        </p>
      )}
      {confirm && (
        <Dialog title="Mulai dari awal?" onClose={() => setConfirm(false)}>
          <p>Shift aktif akan diganti. Rekor tetap tersimpan.</p>
          <button className="primary" onClick={() => start(false)}>
            Ya, mulai baru
          </button>
          <button
            className="secondary"
            autoFocus
            onClick={() => setConfirm(false)}
          >
            Kembali
          </button>
        </Dialog>
      )}
      {help && (
        <Dialog title="Panduan operator" onClose={() => setHelp(false)}>
          <ol className="handbook">
            <li>
              <b>Bangun jalur layanan.</b> Tarik dari kantor ke router, lalu
              router ke server. Atau pilih node, tekan Sambungkan, lalu pilih
              tujuan. Tab dan Enter juga dapat digunakan.
            </li>
            <li>
              <b>Atur budget 1.000 kredit.</b> Koneksi 40, melepas koneksi
              mengembalikan 20, upgrade router 260, perbaikan jalur 120.
              Kapasitas router: 120 → 260 req/s.
            </li>
            <li>
              <b>Antisipasi jadwal.</b> Cabang aktif 01:30, Studio 03:00, jam
              sibuk 04:00, gangguan Router A–Server 06:30, lonjakan akhir 08:00.
              Kantor baru mendapat 30 detik masa persiapan.
            </li>
            <li>
              <b>Jaga kualitas.</b> Setelah masa persiapan, kantor terputus,
              loss &gt;8%, atau latency &gt;250 ms selama 45 detik
              berturut-turut mengakhiri shift. Peringatan menampilkan waktu
              tersisa.
            </li>
            <li>
              <b>Tuntaskan shift 10 menit.</b> Butuh uptime ≥90% dan semua
              kantor stabil selama 20 detik terakhir (loss ≤1%, latency &lt;50
              ms). Uptime mengukur waktu keterjangkauan semua kantor setelah
              masa persiapan.
            </li>
            <li>
              <b>Pilih strategi.</b> Tingkatkan router utama dan perbaiki
              jalurnya, atau bagi beban dan siapkan rute melalui Router B.
              Routing memilih jalur terpendek yang tersedia.
            </li>
          </ol>
          <p className="muted">
            Offline perlu kunjungan online pertama. iPhone: Safari → Bagikan →
            Tambah ke Layar Utama. Tidak ada akun atau pengiriman data
            permainan.
          </p>
          <button className="primary" onClick={() => setHelp(false)}>
            Siap bertugas
          </button>
        </Dialog>
      )}
    </>
  );
}
