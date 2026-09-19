# NOC Flow validation — 2026-09-19

- Production build and TypeScript/Prettier checks pass.
- 21 unit tests pass, including five Flow tests covering transfers, conservation on reset, progression, failure/recovery, and invalid edits.
- Both Flow browser scenarios pass on Chromium desktop, Pixel 7 emulation and WebKit iPhone emulation (six project/scenario combinations). Tests cover route input, pause, reset, and responsive portrait/landscape layouts.
- Existing shift browser scenarios: 28 pass, two existing WebKit service-worker scenarios skipped by repository configuration.

Windows WebKit reports different visual and layout viewport sizes even before rendering the home page. Mobile interaction tests check that Flow does not increase that baseline overflow. Dedicated layout contexts use the repository's existing fixed viewport approach at 360×640 and 844×390. The initial 320px emulation case produced an effective viewport below the existing 320px minimum body width on this host. Physical iPhone viewport/safe-area behavior remains unverified; emulator success is not device certification.

This is a playable PWA prototype, not an Android/iOS store build. Flow sessions are memory-only and end on reload or exit; this is disclosed in the in-game guide. Existing shift saves remain unchanged. Difficulty beyond automated deterministic scenarios needs playtesting.

The change is on a local branch. No code has been pushed and no public deployment or pull request has been created.
