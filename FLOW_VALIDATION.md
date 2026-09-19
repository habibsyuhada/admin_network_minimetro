# NOC Flow validation — mobile network redesign

- The landing-page layout is replaced with a portrait game menu, one primary play action, device illustration, guide, sound settings and local packet record.
- The old shift screen, simulation, save handlers and obsolete tests are removed. Legacy browser keys are untouched.
- Network devices replace geometric stations: client, server and database. Queue packets use the same device icons, cables retain route colors, and the camera expands as devices join.
- Five simulation tests pass. Production build and TypeScript/Prettier checks pass.
- Browser coverage includes menu navigation, removal of the old mode, settings persistence, blocked storage, route input, pause/reset, portrait/landscape layout, and PWA update/offline behavior.

WebKit Windows has a visual/layout viewport discrepancy already present before gameplay. Mobile input is tested in device emulation; responsive layout uses fixed 360×640 and 844×390 contexts. Physical iPhone verification remains outstanding. Flow sessions still end on reload; best packet count is persisted when returning to the menu.

No remote branch, pull request, or public deployment has been created. Changes are local.
