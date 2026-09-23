import {
  Music2,
  Volume2,
  Smartphone,
  RectangleHorizontal,
  RotateCw,
  Check,
} from "lucide-react";
import FullscreenButton from "./FullscreenButton";
import type { GameOrientation } from "./useGameOrientation";
export type GameSettingsProps = {
  music: boolean;
  sound: boolean;
  onToggleMusic?: () => void;
  onToggleSound?: () => void;
  orientation: GameOrientation;
  orientationNote: string;
  onOrientation: (value: GameOrientation) => void;
};
export default function GameSettings({
  music,
  sound,
  onToggleMusic,
  onToggleSound,
  orientation,
  orientationNote,
  onOrientation,
}: GameSettingsProps) {
  return (
    <div className="game-settings">
      <section aria-label="Audio settings" className="settings-section">
        <h3>Audio</h3>
        {[
          { name: "Music", value: music, Icon: Music2, action: onToggleMusic },
          { name: "Sound", value: sound, Icon: Volume2, action: onToggleSound },
        ].map(({ name, value, Icon, action }) => (
          <button
            key={name}
            className="setting-toggle"
            aria-pressed={value}
            aria-label={`${value ? "Mute" : "Enable"} ${name.toLowerCase()}`}
            onClick={action}
          >
            <span className="setting-symbol">
              <Icon size={23} />
            </span>
            <strong>{name}</strong>
            <span className="setting-state">{value ? "On" : "Off"}</span>
            <span className="toggle-track" aria-hidden="true">
              <span />
            </span>
          </button>
        ))}
      </section>
      <section aria-label="Display settings" className="settings-section">
        <h3>Screen orientation</h3>
        <div
          className="orientation-options"
          role="radiogroup"
          aria-label="Screen orientation"
        >
          {(
            [
              { value: "auto", name: "Auto", Icon: RotateCw },
              { value: "portrait", name: "Portrait", Icon: Smartphone },
              {
                value: "landscape",
                name: "Landscape",
                Icon: RectangleHorizontal,
              },
            ] as const
          ).map(({ value, name, Icon }) => (
            <button
              key={value}
              role="radio"
              aria-checked={orientation === value}
              onClick={() => onOrientation(value)}
            >
              <Icon size={29} />
              <span>{name}</span>
              {orientation === value && (
                <Check className="orientation-check" size={14} />
              )}
            </button>
          ))}
        </div>
        <p className="orientation-hint" role="status">
          {orientation === "auto"
            ? "Follows your device rotation."
            : orientationNote || "Applying screen orientation…"}
        </p>
        <div className="settings-fullscreen">
          <span>Fullscreen</span>
          <FullscreenButton />
        </div>
      </section>
    </div>
  );
}
