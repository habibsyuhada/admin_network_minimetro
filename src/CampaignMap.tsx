import { useState } from "react";
import Dialog from "./Dialog";
import { Lock, Play, Star, Flag, ChevronRight, Info } from "lucide-react";
import { LEVELS, levelUnlocked, type CampaignProgress } from "./game/levels";
import { DeviceGlyph } from "./NetworkArt";
const positions = [
  { x: 19, y: 76 },
  { x: 49, y: 61 },
  { x: 80, y: 76 },
  { x: 79, y: 34 },
  { x: 46, y: 22 },
  { x: 18, y: 36 },
];
export default function CampaignMap({
  selected,
  onSelect,
  progress,
  onPlay,
}: {
  selected: string;
  onSelect: (id: string) => void;
  progress: CampaignProgress;
  onPlay: (id: string) => void;
}) {
  const [details, setDetails] = useState(false);
  const level = LEVELS.find((l) => l.id === selected)!;
  const open = levelUnlocked(selected, progress);
  return (
    <>
      <section className="campaign-world" aria-label="Journey map">
        <svg
          className="world-water"
          viewBox="0 0 400 280"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="waves"
              width="38"
              height="35"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M5 20q6 5 12 0"
                fill="none"
                stroke="#244950"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="400" height="280" fill="url(#waves)" />
          <path
            className="world-trail"
            d="M76 213Q130 205 196 171T320 213V95L184 62 72 101"
          />
        </svg>

        {LEVELS.map((l, i) => {
          const unlocked = levelUnlocked(l.id, progress),
            stars = progress[l.id] ?? 0;
          return (
            <button
              key={l.id}
              className={`island-button ${selected === l.id ? "selected" : ""} ${unlocked ? "unlocked" : "locked"}`}
              style={
                {
                  left: `${positions[i].x}%`,
                  top: `${positions[i].y}%`,
                  "--island": l.color,
                } as React.CSSProperties
              }
              onClick={() => {
                onSelect(l.id);
                setDetails(true);
              }}
              aria-label={`Level ${i + 1}: ${l.name}${unlocked ? "" : ", locked"}`}
              aria-pressed={selected === l.id}
            >
              <span className="island-land">
                <svg viewBox="-35 -35 70 70" aria-hidden="true">
                  <DeviceGlyph
                    kind={i === 0 ? 0 : i === 1 ? 4 : 3}
                    variant={i === 0 ? 1 : 0}
                  />
                </svg>
              </span>
              <span className="island-number">
                {unlocked ? i + 1 : <Lock size={12} />}
              </span>
              <span className="island-stars" aria-label={`${stars} stars`}>
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    size={11}
                    fill={stars >= n ? "currentColor" : "none"}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </section>
      <div className="home-launch" aria-hidden={details || undefined}>
        <div className="home-current-level">
          <span>
            LEVEL {LEVELS.indexOf(level) + 1} <b>{level.name}</b>
          </span>
          <button
            className="icon-button"
            aria-label="Mission details"
            onClick={() => setDetails(true)}
          >
            <Info size={20} />
          </button>
        </div>
        <button
          className="play-button home-play"
          disabled={!open}
          aria-label={`Play level ${LEVELS.indexOf(level) + 1}`}
          onClick={() => onPlay(level.id)}
        >
          {open ? <Play size={23} fill="currentColor" /> : <Lock size={23} />}
          {open ? "PLAY" : "LOCKED"}
          <ChevronRight size={23} />
        </button>
      </div>
      {details && (
        <Dialog title="Mission details" onClose={() => setDetails(false)}>
          <section
            className="mission-card"
            style={{ "--island": level.color } as React.CSSProperties}
            aria-label="Selected mission"
          >
            <div className="mission-heading">
              <div>
                <small>{level.subtitle}</small>
                <h2>{level.name}</h2>
              </div>
              <Flag size={26} />
            </div>
            <p>{level.description}</p>
            <div className="mission-goals">
              <span>
                <b>{level.months}</b> months
              </span>
              <span>
                <b>{level.packets}</b> packets
              </span>
              <span>
                <b>{level.gold.toLocaleString("en-US")}</b> gold
              </span>
            </div>

            <small className="mission-stars-hint">
              ★ Complete mission · ★ +25% packets · ★ Keep 50% of starting gold
            </small>
          </section>
          <button
            className="play-button"
            disabled={!open}
            onClick={() => onPlay(level.id)}
            aria-label={`Play level ${LEVELS.indexOf(level) + 1}`}
          >
            <Play size={19} fill="currentColor" />
            {open
              ? progress[level.id]
                ? "PLAY AGAIN"
                : "START MISSION"
              : "COMPLETE THE PREVIOUS LEVEL"}
            <ChevronRight size={20} />
          </button>
        </Dialog>
      )}
    </>
  );
}
