import React from "react";
import { createRoot } from "react-dom/client";
import GameShell from "./GameShell";
import "./style.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GameShell />
  </React.StrictMode>,
);
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js").catch(() => {
      /* Online play remains available. */
    });
  });
}
