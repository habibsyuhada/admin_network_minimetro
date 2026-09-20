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
          aria-label="Settings"
          onClick={() => setPanel("settings")}
        >
          <Settings2 size={20} />
        </button>
      </header>
      <section className="home-title">
        <div>
          <span className="overline">BUILD. CONNECT. GROW.</span>
          <h1 aria-label="NOC FLOW.">
            NOC{" "}
            <span>
              FLOW<span className="title-dot">.</span>
            </span>
          </h1>
        </div>
        <span className="season-badge">
          EXPEDITION
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
        aria-label="Play NOC Flow"
        onClick={() => {
          unlockAudio();
          playCue("tap");
          setActiveLevel(undefined);
          setFlow(true);
        }}
      >
        <span>∞</span>
        <div>
          <b>ENDLESS MODE</b>
          <small>
            No goals · best {profile.best.toLocaleString("en-US")} packets
          </small>
        </div>
        <span>›</span>
      </button>
      <nav className="home-bottom-bar" aria-label="Game menu">
        <button onClick={() => setPanel("help")}>
          <BookOpen size={18} /> Guide
        </button>
        <span>MISSION MAP</span>
        <button
          aria-label={profile.sound ? "Mute sound" : "Enable sound"}
          onClick={() => {
            setAudioEnabled(!profile.sound);
            unlockAudio();
            playCue("tap");
            setProfile((v) => ({ ...v, sound: !v.sound }));
          }}
        >
          {profile.sound ? <Volume2 size={18} /> : <VolumeX size={18} />} Sound
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
          <p>
            Meet the month and packet targets to unlock the next map. Earn extra
            stars by delivering 25% more packets and keeping at least 50% of
            your starting gold. Mission progress is saved on this device; active
            sessions are not saved.
          </p>
          <p>
            Connect devices with colored cables. Deliver packets to matching
            service icons. Any YouTube node can receive YouTube packets. Open
            Node details to inspect queues by icon.
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
          <ol className="handbook">
            <li>
              Choose Ethernet, Fiber, or Backbone. Drag a cable between two
              devices. Tap a node to inspect it. Each cable has its own carrier.
            </li>
            <li>
              Carriers travel back and forth along their own cable. Cargo
              capacity represents bandwidth. Transit packets wait for the next
              carrier, and routes are selected automatically.
            </li>
            <li>
              Endless mode starts with 1,600 gold. Cables cost 100/200/250 gold
              and routers cost 150 gold. Drag the device preview, then choose OK
              or Cancel. Each delivered packet earns 18 gold. Every month,
              profit minus maintenance is added to your balance. Selling cables
              refunds their full price.
            </li>
            <li>
              Full queues trigger a warning: 10 packets for clients/services, 16
              for switches, and 24 for routers. Reduce the queue within 25
              seconds to avoid an overload.
            </li>
          </ol>
          <button className="primary" onClick={() => setPanel(null)}>
            Ready to connect
          </button>
        </Dialog>
      )}
      {panel === "settings" && (
        <Dialog title="Settings" onClose={() => setPanel(null)}>
          <p className="muted">
            Reloading ends the active session. Your packet record is saved on
            this device when you return to the menu.
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
              <Download size={18} /> Add to home screen
            </button>
          )}
          <p className="muted">iPhone: Safari → Share → Add to Home Screen.</p>
          <a
            className="license-link"
            href="./THIRD_PARTY_NOTICES.txt"
            target="_blank"
            rel="noreferrer"
          >
            Component licenses ↗
          </a>
        </Dialog>
      )}
    </main>
  );
}
