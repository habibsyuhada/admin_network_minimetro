import GameSettings from "./GameSettings";
import useGameOrientation from "./useGameOrientation";
import VisualGuide from "./VisualGuide";
import { setMusicEnabled, unlockMusic } from "./game/music";
import { useEffect, useState } from "react";
import {
  Settings2,
  Volume2,
  VolumeX,
  Download,
  BookOpen,
  Infinity as InfinityIcon,
} from "lucide-react";
import { CLIENT_VARIANTS } from "./game/metro";
import CampaignMap from "./CampaignMap";
import { LEVELS, readProgress, levelUnlocked } from "./game/levels";
import MetroGame from "./MetroGame";
import Dialog from "./Dialog";
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
      music: typeof v?.music === "boolean" ? v.music : true,
      progress: readProgress(v?.progress),
      sound: typeof v?.sound === "boolean" ? v.sound : true,
      best:
        Number.isSafeInteger(v?.best) && v.best >= 0 ? (v.best as number) : 0,
    };
  } catch {
    return { sound: true, music: true, best: 0, progress: readProgress(null) };
  }
}
export default function GameShell() {
  const displaySettings = useGameOrientation();
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
    setMusicEnabled(profile.music);
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
        displaySettings={displaySettings}
        music={profile.music}
        onToggleMusic={() => {
          setMusicEnabled(!profile.music);
          if (!profile.music) unlockMusic();
          setProfile((v) => ({ ...v, music: !v.music }));
        }}
        sound={profile.sound}
        onToggleSound={() => {
          setAudioEnabled(!profile.sound);
          unlockAudio();
          setProfile((v) => ({ ...v, sound: !v.sound }));
          if (!profile.sound) playCue("tap");
        }}
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
        <span className="home-wordmark">NOC / 01</span>
        <button
          className="icon-button"
          aria-label="Settings"
          onClick={() => setPanel("settings")}
        >
          <Settings2 size={20} />
        </button>
      </header>
      <section className="home-title">
        <div>
          <h1 aria-label="NOC FLOW.">
            NOC{" "}
            <span>
              FLOW<span className="title-dot">.</span>
            </span>
          </h1>
        </div>
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
      <nav className="home-bottom-bar" aria-label="Game menu">
        <button onClick={() => setPanel("help")}>
          <BookOpen size={21} /> Guide
        </button>
        <button
          aria-label="Play NOC Flow"
          onClick={() => {
            unlockAudio();
            playCue("tap");
            setActiveLevel(undefined);
            setFlow(true);
          }}
        >
          <InfinityIcon size={24} /> Endless
        </button>
        <button
          aria-label={profile.sound ? "Mute sound" : "Enable sound"}
          onClick={() => {
            setAudioEnabled(!profile.sound);
            unlockAudio();
            playCue("tap");
            setProfile((v) => ({ ...v, sound: !v.sound }));
          }}
        >
          {profile.sound ? <Volume2 size={21} /> : <VolumeX size={21} />} Sound
        </button>
      </nav>
      {saveFailed && (
        <p className="notice" role="status">
          Progress, records, and settings could not be saved on this device.
        </p>
      )}
      {updateReady && (
        <p className="notice">
          An update is available. Close all NOC Flow tabs, then reopen the game.
        </p>
      )}
      {panel === "help" && (
        <Dialog title="Operator guide" onClose={() => setPanel(null)}>
          <VisualGuide />
          <details>
            <summary>Device icons</summary>
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
              <summary>16 client types</summary>
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
                Each client type receives packets with its matching device icon.
              </p>
            </details>
          </details>

          <button className="primary" onClick={() => setPanel(null)}>
            Ready to connect
          </button>
        </Dialog>
      )}
      {panel === "settings" && (
        <Dialog title="Settings" onClose={() => setPanel(null)}>
          <GameSettings
            {...displaySettings}
            music={profile.music}
            sound={profile.sound}
            onToggleMusic={() => {
              setMusicEnabled(!profile.music);
              if (!profile.music) unlockMusic();
              setProfile((v) => ({ ...v, music: !v.music }));
            }}
            onToggleSound={() => {
              setAudioEnabled(!profile.sound);
              unlockAudio();
              setProfile((v) => ({ ...v, sound: !v.sound }));
            }}
          />
          <details className="settings-extra">
            <summary>Progress & app</summary>
            <div className="settings-records">
              <span>
                <strong>{Object.keys(profile.progress).length}/6</strong> Maps
              </span>
              <span>
                <strong>
                  {Object.values(profile.progress).reduce((a, b) => a + b, 0)}
                  /18
                </strong>{" "}
                Stars
              </span>
              <span>
                <strong>{profile.best.toLocaleString("en-US")}</strong> Best
                packets
              </span>
            </div>
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
                <Download size={18} /> Add to home screen
              </button>
            )}
            <p className="muted">
              iPhone: Safari → Share → Add to Home Screen.
            </p>
            <a
              className="license-link"
              href="./THIRD_PARTY_NOTICES.txt"
              target="_blank"
              rel="noreferrer"
            >
              Component licenses ↗
            </a>
          </details>
        </Dialog>
      )}
    </main>
  );
}
