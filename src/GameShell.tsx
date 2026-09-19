import { useCallback, useEffect, useRef, useState } from "react";
import {
  Network,
  Play,
  Volume2,
  VolumeX,
  Trophy,
  ChevronRight,
  ArrowLeft,
  Download,
  ShieldCheck,
} from "lucide-react";
import App from "./App";
import FullscreenButton from "./FullscreenButton";
import { initial, type State } from "./game/engine";
import { loadProfile, saveProfile, score, type Profile } from "./game/storage";
import { playCue, setAudioEnabled, unlockAudio } from "./game/audio";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export default function GameShell() {
  const [profile, setProfile] = useState(loadProfile),
    [screen, setScreen] = useState<"home" | "game" | "help">("home"),
    [run, setRun] = useState<State | null>(null),
    [saveFailed, setSaveFailed] = useState(false),
    [install, setInstall] = useState<InstallPrompt | null>(null),
    [confirmNew, setConfirmNew] = useState(false);
  const live = useRef(profile),
    lastSave = useRef(0),
    won = useRef(false);
  const persist = useCallback((next: Profile) => {
    live.current = next;
    setSaveFailed(!saveProfile(next));
  }, []);
  useEffect(() => {
    setAudioEnabled(profile.sound);
  }, [profile.sound]);
  useEffect(() => {
    const background = () => {
      if (document.hidden) persist(live.current);
    };
    const leave = () => persist(live.current);
    const prompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    document.addEventListener("visibilitychange", background);
    window.addEventListener("pagehide", leave);
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      document.removeEventListener("visibilitychange", background);
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, [persist]);
  const update = useCallback(
    (state: State) => {
      let next = { ...live.current, run: state };
      if (state.phase === "complete" && !won.current) {
        won.current = true;
        next = {
          ...next,
          wins: next.wins + 1,
          best: Math.max(next.best, score(state)),
        };
      }
      if (state.phase !== "complete") won.current = false;
      live.current = next;
      if (Date.now() - lastSave.current > 1000 || state.phase === "complete") {
        lastSave.current = Date.now();
        persist(next);
      }
    },
    [persist],
  );
  const start = (resume: boolean) => {
    unlockAudio();
    playCue("tap");
    const state = resume && live.current.run ? live.current.run : initial();
    won.current = state.phase === "complete";
    setRun(state);
    persist({ ...live.current, run: state });
    setConfirmNew(false);
    setScreen("game");
  };
  const home = () => {
    persist(live.current);
    setProfile(live.current);
    setScreen("home");
  };
  const toggleSound = () => {
    const next = { ...live.current, sound: !live.current.sound };
    setAudioEnabled(next.sound);
    unlockAudio();
    playCue("tap");
    persist(next);
    setProfile(next);
  };
  if (screen === "game" && run)
    return (
      <>
        <App
          saved={run}
          onStateChange={update}
          onMenu={home}
          sound={profile.sound}
          onSound={toggleSound}
        />
        {saveFailed && (
          <div className="save-warning" role="status">
            Penyimpanan tidak tersedia. Progres hanya bertahan selama tab ini
            terbuka.
          </div>
        )}
      </>
    );
  return (
    <main className="shell">
      <div className="shell-top">
        <span className="edition">A NETWORK STRATEGY GAME</span>
        <FullscreenButton />
        <button
          className="icon-button"
          aria-label={profile.sound ? "Mute sound" : "Enable sound"}
          onClick={toggleSound}
        >
          {profile.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
      {screen === "help" ? (
        <section className="how-to">
          <button className="text-button" onClick={() => setScreen("home")}>
            <ArrowLeft size={16} />
            Kembali
          </button>
          <p className="eyebrow">OPERATOR HANDBOOK</p>
          <h1>Your shift starts here.</h1>
          <ol>
            <li>
              <strong>Drag to connect</strong>
              <p>
                Tarik dari satu node ke node lain. Office mengirim request
                melalui Router-A menuju App Server.
              </p>
            </li>
            <li>
              <strong>Tap to inspect</strong>
              <p>
                Tap node untuk melihat statistiknya. Tap tidak membuat koneksi.
                Tombol × menutup detail.
              </p>
            </li>
            <li>
              <strong>Watch the rush</strong>
              <p>
                Sambungkan branch baru. Saat antrean meningkat, tap Router-A dan
                upgrade memakai budget.
              </p>
            </li>
            <li>
              <strong>Restore the network</strong>
              <p>
                Pertahankan latency di bawah 50 ms dan loss maksimal 1% selama
                20 detik. Respons lebih cepat menghasilkan skor lebih tinggi.
              </p>
            </li>
          </ol>
          <div className="install-tip">
            <Download size={20} />
            <p>
              Untuk layar penuh: Android gunakan “Install app” di menu browser.
              iPhone: Safari → Bagikan → Tambah ke Layar Utama.
            </p>
          </div>
          <button className="upgrade" onClick={() => setScreen("home")}>
            Siap bertugas <ChevronRight size={18} />
          </button>
        </section>
      ) : (
        <div className="home-screen">
          <section className="hero">
            <div className="hero-network" aria-hidden="true">
              <span />
              <span />
              <span />
              <Network size={70} />
            </div>
            <p className="eyebrow">CONNECT · MONITOR · RESTORE</p>
            <h1>
              NOC<span>SHIFT</span>
            </h1>
            <p>
              A small network.
              <br />
              <b>A whole morning counting on you.</b>
            </p>
          </section>
          <section className="level-tile">
            <div className="level-number">01</div>
            <div>
              <small>FIRST DAY AT NOC</small>
              <h2>Morning Login Rush</h2>
              <p>4 nodes · 1 incident · Your first shift</p>
            </div>
            <ShieldCheck size={24} />
          </section>
          <div className="home-actions">
            {profile.run && profile.run.phase !== "complete" && (
              <button className="upgrade" onClick={() => start(true)}>
                <Play size={18} />
                Lanjutkan shift
                <ChevronRight size={18} />
              </button>
            )}
            <button
              className={
                profile.run && profile.run.phase !== "complete"
                  ? "secondary"
                  : "upgrade"
              }
              onClick={() =>
                profile.run && profile.run.phase !== "complete"
                  ? setConfirmNew(true)
                  : start(false)
              }
            >
              <Play size={18} />
              {profile.wins ? "Main lagi" : "Mulai shift baru"}
              <ChevronRight size={18} />
            </button>
            <button className="text-button" onClick={() => setScreen("help")}>
              Cara bermain <ChevronRight size={16} />
            </button>
          </div>
          <div className="career">
            <Trophy size={21} />
            <div>
              <small>BEST SCORE</small>
              <strong>{profile.best.toLocaleString()}</strong>
            </div>
            <div>
              <small>SHIFTS COMPLETED</small>
              <strong>{profile.wins}</strong>
            </div>
          </div>
          {install && (
            <button
              className="text-button install-button"
              onClick={async () => {
                await install.prompt();
                await install.userChoice;
                setInstall(null);
              }}
            >
              <Download size={17} />
              Pasang di layar utama
            </button>
          )}
          <p className="local-note">
            Progres tersimpan di perangkat ini.{" "}
            {saveFailed
              ? "Penyimpanan browser tidak tersedia."
              : "Bisa dilanjutkan kapan saja."}
          </p>
        </div>
      )}
      {confirmNew && (
        <div className="overlay">
          <section
            className="result"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-title"
          >
            <h1 id="new-title">Mulai dari awal?</h1>
            <p>
              Shift yang belum selesai akan diganti. Rekor dan jumlah kemenangan
              tetap tersimpan.
            </p>
            <button className="upgrade" onClick={() => start(false)}>
              Mulai shift baru
            </button>
            <button
              className="text-button"
              autoFocus
              onClick={() => setConfirmNew(false)}
            >
              Kembali
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
