import { useCallback, useEffect, useRef, useState } from "react";
export type GameOrientation = "auto" | "portrait" | "landscape";
const KEY = "noc-flow-orientation-v1";
type LockableOrientation = ScreenOrientation & {
  lock?: (mode: "portrait" | "landscape") => Promise<void>;
};
export default function useGameOrientation() {
  const [orientation, setOrientation] = useState<GameOrientation>(() => {
    try {
      const saved = localStorage.getItem(KEY);
      return saved === "portrait" || saved === "landscape" ? saved : "auto";
    } catch {
      return "auto";
    }
  });
  const [orientationNote, setNote] = useState("");
  const request = useRef(0);
  const apply = useCallback(async (mode: GameOrientation, gesture = false) => {
    const ticket = ++request.current;
    const screenMode = screen.orientation as LockableOrientation | undefined;
    if (mode === "auto") {
      try {
        screenMode?.unlock?.();
      } catch {
        /* Unsupported browser. */
      }
      setNote("");
      return;
    }
    try {
      if (!screenMode?.lock) throw new Error("Unsupported");
      if (gesture && !document.fullscreenElement && document.fullscreenEnabled)
        await document.documentElement.requestFullscreen();
      if (ticket !== request.current) return;
      await screenMode.lock(mode);
      if (ticket === request.current)
        setNote(`${mode === "portrait" ? "Portrait" : "Landscape"} locked.`);
    } catch {
      if (ticket !== request.current) return;
      const matches = matchMedia(`(orientation: ${mode})`).matches;
      setNote(
        matches
          ? "Orientation lock is unavailable. Keep your device in this position."
          : `Rotate your device to ${mode}. This browser cannot lock rotation.`,
      );
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, orientation);
    } catch {
      /* Session preference still works. */
    }
    const refresh = () => {
      void apply(orientation);
    };
    refresh();
    window.addEventListener("orientationchange", refresh);
    window.addEventListener("resize", refresh);
    document.addEventListener("fullscreenchange", refresh);
    return () => {
      window.removeEventListener("orientationchange", refresh);
      window.removeEventListener("resize", refresh);
      document.removeEventListener("fullscreenchange", refresh);
    };
  }, [orientation, apply]);
  return {
    orientation,
    orientationNote,
    onOrientation: (mode: GameOrientation) => {
      setOrientation(mode);
      void apply(mode, true);
    },
  };
}
