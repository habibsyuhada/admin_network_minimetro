import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
export default function FullscreenButton() {
  const [active, setActive] = useState(!!document.fullscreenElement);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const changed = () => setActive(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  if (!document.fullscreenEnabled) return null;
  return (
    <>
      <button
        className="icon-button fullscreen-button"
        aria-label={active ? "Keluar layar penuh" : "Layar penuh"}
        title={active ? "Keluar layar penuh" : "Layar penuh"}
        onClick={async () => {
          try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
      >
        {active ? <Minimize size={19} /> : <Maximize size={19} />}
      </button>
      {failed && (
        <small role="status">Layar penuh tidak tersedia di browser ini.</small>
      )}
    </>
  );
}
