# Release runbook — v1.0.0 candidate

## Automated gates

1. `npm ci`, `npm run check`, `npm test`, `npm run build`.
2. `npx playwright install chromium webkit`; `npm run test:e2e`.
3. Inspect screenshots and failure traces in `test-results/`; CI uploads the HTML report and test evidence.
4. Verify offline after one successful online install, reload, save/resume, and service-worker update with an old tab open. WebKit's automation runtime does not cover Safari PWA service workers; real iPhone validation is required.
5. Responsive CSS is tested in fixed small portrait/landscape viewports. The Windows WebKit mobile emulator exhibited viewport zoom/clipping during resize; these layout assertions use a desktop layout viewport at mobile dimensions. Separate iPhone-emulated tests cover gameplay/input. Physical iPhone rotation and zoom are still unverified.
6. Review dependency audit and asset attribution. Dependency versions are locked. Runtime has no third-party network requests.

## Physical-device release gate (not represented by emulation)

Record device model, OS/browser versions, build commit, and result for:

- Android Chrome on a midrange phone, portrait and landscape: tap, drag cancel, node details, keyboard where available, sound activation, fullscreen/install, complete a shift with each strategy.
- iPhone Safari and installed PWA: safe areas, browser chrome resize, background/foreground, audio lifecycle, cache after restart, offline resume, and version update.
- Desktop Chrome and Safari: keyboard-only full shift, reduced motion, focus containment/restoration, network disconnect, save failure.
- Target 60 FPS on chosen reference devices. Capture frame pacing during final rush; desktop automation is not evidence for physical-device FPS or battery use.
- Have fresh players try the tutorial without coaching. Check they understand cost/refund, outage warning, 45-second tolerance, and why they won/lost. Balance timings remain provisional until this playtest.

A passing automated suite produces a release candidate. Do not claim the physical-device, accessibility audit, or unassisted human-playtest gates passed without recording evidence.

## Publish

GitHub Pages source must be GitHub Actions. Review/merge the candidate PR into main after release gates are accepted. The workflow tests and uploads `dist/`, then deploys only main. PRs never deploy to the live site. Tag the tested commit `v1.0.0` and use CHANGELOG.md as release notes. There are no server-side migrations or secrets.

Smoke-check the actual subpath `https://habibsyuhada.github.io/admin_network_minimetro/`: asset paths, new shift, save/reload, offline, version notice. A successful local build is not a deployment confirmation.

## Rollback

Revert the release commit through a reviewed PR, or redeploy the last known-good build via main. Retain save schema support in a rollback build: a v1 tutorial binary cannot load a v2 ten-minute run. Prefer a forward fix using the v2 schema. Both v1 and v2 keys are retained; never clear site data as an automatic rollback action.

Existing PWA clients receive a new version only after their old tabs close. Inform testers to save, close all NOC Shift tabs, and reopen; avoid skipWaiting/client reload during an active shift. Scoped caches are garbage-collected when the replacement worker activates. The legacy unscoped prototype cache is left untouched to avoid deleting another app's cache on the same origin.

## Assets and licensing

No remote fonts, new photo assets, or analytics were added. UI artwork consists of CSS/SVG plus Lucide icons. Existing PWA PNG icons were retained from the repository; repository owner should confirm rights before a public branded release. Dependency license notices are generated in public/THIRD_PARTY_NOTICES.txt from the installed production dependency packages. The repository itself has no explicit distribution license; this change does not choose one on the owner's behalf.
