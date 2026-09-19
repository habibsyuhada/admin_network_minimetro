# Validation record

Local Windows validation for the v1.0.0 candidate:

- TypeScript and formatting checks passed.
- 16 simulation/storage tests passed. Two full-shift strategies were verified across five seeds each, including traffic conservation and save validity.
- 28 production-browser cases passed across Chromium desktop, Chromium mobile emulation and WebKit. Two service-worker cases are intentionally skipped on WebKit and remain physical-Safari gates.
- Offline reload and version update were tested on Chromium, including a real local server under `/game/` to exercise GitHub Pages-style subpaths. Updates wait for existing tabs to close, preserve the save, and remain playable offline afterward.
- Screenshots were inspected for the desktop and Chromium-mobile game. Windows WebKit has viewport/screenshot scaling limitations; its small-screen CSS checks use a fixed desktop layout viewport. This is not physical iPhone certification.
- Dependency installation/audit reported zero known vulnerabilities at validation time.

Not yet verified: physical Android/iPhone behavior, Safari PWA offline/update on device, 60 FPS on a nominated reference phone, unassisted human playtest/balance, and the deployed public URL. See RELEASE.md for the remaining gates and rollback procedure.
