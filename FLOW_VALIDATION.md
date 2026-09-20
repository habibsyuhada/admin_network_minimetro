# NOC Flow validation — point-to-point cable gameplay

The previous multi-stop route model is replaced by independent two-node cables. Each cable owns one bidirectional carrier and retains its cargo until arrival; intermediate packets unload into node queues and wait for the next cable's carrier. Packet routing uses positive travel-time costs with queue/capacity pressure and stable cable order. Capacity is shown as load/maximum on every carrier.

Ethernet (4 packets, speed 60, 100 gold), Fiber (3, speed 100, 200 gold) and Backbone (8, speed 45, 250 gold) use fixed type colors. Initial balance is 1000 gold. Weekly settlement credits delivery profit minus prorated maintenance; upgrades cost gold. Removing one cable refunds its full purchase price and returns cargo to its departure endpoint. Other cables continue unchanged. Distinct cable types sharing endpoints remain in parallel lanes.

Validation completed: 33 unit tests, 45 browser scenarios passed; three platform-specific scenarios skipped (native pinch injection outside Chromium mobile and the existing WebKit service-worker update case). Tests cover independent carriers, capacity, transit waiting, bidirectional delivery, alternate routing, stock restrictions/refunds, payload conservation, cable creation/deletion, type colors, camera bounds, pinch, mobile layouts, preferences, offline and updates. Production build and TypeScript/Prettier checks pass.

A visual check found cramped cable type labels in landscape; the controls column was widened. Device emulation is not physical-device certification. Active sessions remain memory-only and end on reload. No branch has been pushed and no public deployment or PR has been created.

## Specific destinations and larger map

Packets now retain an exact active destination node ID through loading, transit, rerouting and cable removal. Delivery to another node with the same icon is forbidden. Tests cover transit through matching icons, unreachable exact destinations, and generation to distinct active nodes including matching types. The node inspector groups waiting packets by exact destination and shows counts and route availability; opening it pauses simulation. Browser tests cover direct inspection, the node directory, route status, and pause/resume in Chromium desktop/mobile and WebKit.

The compact HUD and controls give more space to the playable map. Desktop uses the full width with a side panel. Portrait 360x640 and landscape 844x390 layouts were visually reviewed. Emulated WebKit may offset its visual viewport, so the camera test starts within the visible map intersection. The inspector test freezes its clock between interactions to avoid loading cargo during assertions.

## Expanded world and drag-only construction

World bounds are now 1000x1200 (5x the original area). The initial three devices remain near the starting camera; later devices occupy distant regions. Camera stays fixed when nodes appear, with whole-world overview and per-node focus. Click/tap/keyboard activation opens details; only pointer drag creates a cable. PC-to-PC generated traffic is excluded. Tests use real drag gestures for construction and cover exact world area, full-map bounds, distant node focus and inspection without cable creation.

## Player-built routers

The simulation now owns dynamic node positions and stable IDs. Player routers append to the network independently of scheduled endpoint spawns. Router purchases cost 150 gold, confirmed after positioning the preview. Placement validates world bounds, finite coordinates and minimum spacing. Routers cannot generate packets or be selected as traffic destinations; exact-target routing and carrier transfers include them normally. Initial endpoints are spaced farther apart, and later automatic nodes receive seeded position variation with collision avoidance.

Router unit tests cover stock/invalid placement, transit, absence of router-generated traffic, and independent automatic growth. Browser checks exercise placement, overlap rejection, dragging two cables through a router, node detail, cancellation, and mobile layouts.

## Gold economy and confirmed router previews

Router placement is a movable preview that does not enter the simulation or charge gold until OK; Cancel/Escape spends nothing. Simulation pauses during placement while camera gestures remain available. Invalid overlap disables confirmation. A single gold balance replaces cable/router stock. Starting balance 1000; cable prices 100/200/250; router 150; final packet delivery earns 25 profit. Weekly maintenance (20/35/40 per cable and 30 per router) accrues in integer tick units and is settled once each 60 seconds. The weekly report credits profit minus accrued maintenance; a negative balance ends the run. Cable sale refunds 100% and retains previously accrued maintenance. Upgrades now cost gold. Automatic demand nodes remain free.

Tests cover exact 500-200=300 settlement, no duplicate payouts, zero/negative balances, partial-period maintenance, sale conservation, affordability, final-delivery-only revenue, preview movement/invalid overlap/OK/Cancel, paused preview time, and the browser weekly ledger.

## Service-icon destinations, switches, and PC bursts (supersedes specific-node routing)

Packets now carry a service type instead of a destination node ID. Any matching service node may deliver a packet, and routing selects the cheapest reachable match. PC requests choose uniformly among distinct active service types; services generate PC-icon replies. Seven service types can spawn repeatedly. Growth uses a 50% PC wave / 50% service split; PC wave size is 1/2/3 with 60/30/10% weights. Automatic population cap is 36, independent of player-built nodes. Random positions enforce endpoint separation and transit clearance.

Switch costs 80 gold, maintenance 15, 4 cable ports, 10-packet overload threshold and 0.2-second arrival dwell. Router costs 150, maintenance 30, 8 ports and 16-packet threshold. Tests cover matching alternate destinations, request/reply icons, fixed-seed growth reproducibility, all seven service outcomes and PC burst sizes, population cap, switch port enforcement/maintenance/transit, and browser switch placement/detail.

## Moving and selling transit nodes, client variants

Existing routers and switches can be repositioned using a paused, free preview with OK/Cancel. Connected cable paths and carriers follow the preview, while cancellation preserves the original network. Sale confirmation refunds the full node and attached cable prices. Waiting and in-flight packets are conserved, remaining endpoints are remapped, and visible node labels stay stable. Previously accrued maintenance is retained. Automatic demand nodes cannot be sold.

Sixteen seeded client icon variants share the same PC service type. The guide includes a complete icon gallery. Unit checks cover free movement, invalid placement, connected and disconnected node sale, cargo preservation, refund totals, endpoint remapping and all variant outcomes. Browser checks cover moving and cancelling both device kinds, cable previews, sale cancellation/confirmation and the client gallery.

Three WebKit scenarios exceeded the initial 30-second suite timeout under concurrent load; focused reruns with a 60-second budget and one worker passed. The longer move/cancel/sale scenarios now explicitly allow 60 seconds.

## Editable pause, simulation speed, and node cable management

Manual pause is separate from modal/input blocking. It freezes simulation ticks while allowing topology edits, node previews and camera controls. Speed cycles through 1x/2x/3x and scales fixed simulation steps, including generation, maintenance and overload. Closing inspectors and purchase previews preserves manual pause. Node details expose connected cables, their peer and full refund, with individual removal. Connection errors display an alert near the map, including the full transit node identity and port usage.

Validation for this change: 33 unit tests pass; 18 targeted browser cases pass across Chromium desktop, Android emulation and WebKit, covering existing menu/cable flows plus frozen carriers, topology edits during pause, clock progression at 2x/3x, node-detail removal/refund, full switch rejection and reuse of freed ports. Build and TypeScript/format checks pass.

## Client-specific packet icons, clustered waves, and physical ports

Client packets now identify the device icon variant. Servers choose uniformly among active client variants; routing, delivery, node inspection, queue glyphs, and sold-node packet recovery use the same identity. Multiple clients of the same variant remain interchangeable destinations. PC bursts anchor subsequent clients 85-130 world units from the first, with 75-unit minimum separation and map bounds enforced; old endpoints retain 130-unit clearance.

All automatic client/service nodes have one cable port. Router/switch limits remain 8/4. Duplicate cable types between a pair are allowed when both endpoints have free ports, with independent gold costs, refunds, carriers and parallel drawing lanes. Routing includes current cargo pressure so two identical waiting carriers can both load a backlog.

36 unit tests pass, including variant-specific replies/delivery, 1,000 seeded growth samples, cluster bounds, identical parallel carrier loading, and endpoint port enforcement. Browser fixtures now build transit-based topologies instead of connecting multiple cables directly to service nodes.

Browser validation: 51 scenarios passed across the full run and focused reruns; 3 platform-specific skips. The refund fixture was corrected to explicitly select Ethernet after Fiber; two WebKit management scenarios timed out under concurrent load and passed with one worker. Production build and type/format checks pass.

## Cable replacement, half-price transit sale, and monthly balance

Node cable cards now show peer icons and allow type replacement at the price difference. IDs, endpoints and carrier position are retained; excess cargo returns to the departure queue if capacity shrinks. Transit node sale refunds 50% of node cost plus 100% of attached cable costs. All player-facing cycles are months, 60 simulation seconds each.

Balance changes and multi-seed findings are documented in BALANCE_REPORT.md. 39 unit tests pass, including replacement conservation, affordability and escalating network upgrade maintenance. Twelve targeted browser cases pass across Chromium desktop/mobile and WebKit (the WebKit monthly ledger was rerun at 2x after timing out under load). A real browser interaction replay completed month 12 with 1,322 delivered packets and 7,365 gold, without state injection. Forty final simulated sessions cover 20 seeds and two strategies; 13/20 adaptive sessions completed month 12.

## Mobile expedition UI and campaign maps

The home screen is now an island mission board with six levels, locked progression, stars, a mission card and a separate endless mode. Gameplay uses a full-height map and compact bottom controls, with a compact side layout only for short landscape screens. Dynamic viewport bounds keep controls inside narrow mobile browsers.

Campaign definitions live in `src/game/levels.ts`; see `MAP_SCHEMA.md`. Completion requires both minimum months and delivered packets, checked after monthly maintenance and loss conditions. Best stars persist in the existing profile key and unlock the next level. Active sessions are not persisted.

Validation: 42 unit tests passed. Campaign/menu and existing cable flows were checked on desktop Chromium, Android emulation and WebKit/iPhone emulation. TypeScript, formatting and production build passed. A real UI replay completed level 1 with 66 packets and 1,490 gold in month 3, then verified level 2 unlocked after reload. Six adaptive simulations completed their maps in months 3, 5, 7, 8, 10 and 12. See `docs/balance/campaign-results.json` and `docs/balance/campaign-browser.json`.

## Quiet gameplay HUD

Removed always-visible economy breakdown, score panel, map subtitle, build catalog, cable catalog and repeated hints. Gameplay now exposes only wallet/month/time controls plus three contextual dock buttons. Cable and build trays reveal prices on request; wallet/mission opens paused statistics, and the menu contains exit/help. Camera controls use a separate toggle. A compact pause badge leaves topology editable. The initial help dialog now collapses the longer rules.

Validated with 42 unit tests, production build and TypeScript/format checks. Thirty targeted browser cases passed across desktop Chromium, Android and iPhone emulation: compact HUD, map taking over 65% of the viewport, tool selection/automatic closing, placement cancellation, statistics, menu, campaign progression, node details, cables, pause and speed. Visual screenshots inspected after fixing the wallet layout.

## English interface and modal tool pickers

Build and cable selection now open native dialogs instead of expanding the bottom dock. Both pause the simulation while open, support Escape/close, and close after selection. Device selection still creates a draggable preview with OK/Cancel; dismissing a picker does not spend gold. Cable selection preserves the chosen type for subsequent drags. Modal rows show prices and capacities.

All player-facing text is now English, including campaign names, help, client names, accessible labels, dynamic errors, device/cable details, monthly reports, installation metadata and update/storage messages. Level IDs and the profile storage key are unchanged, preserving previous progress. The document language is `en`, and formatted numbers use `en-US`.

Validation: 42 unit tests pass; build and TypeScript/format checks pass. Browser checks cover both modal pickers on Chromium, Android and iPhone emulation, including pausing, Escape, cancellation without spending gold, selection, and returning to placement. Existing campaign, cable, economy, move/sale and error flows passed on Chromium. Storage-error and PWA-update tests were updated to English and passed; node-detail labels were updated to match the new English headings. Mobile modal screenshots were visually inspected.


## Terrain, monthly inventory, and special devices (current rules)

Levels 2-6 now enforce buildings, bridge slot limits, rocky ridges, scheduled road works, and floods as described in MAP_SCHEMA.md. Level 1 and Endless remain clear. New cable and connected-node movement checks prevent bypassing terrain, bridge capacity, and radio range. Temporary restrictions are announced one month ahead; road works do not break existing cables.

Global upgrades are replaced by one optional month-end item purchase into a session inventory. Eight local items support equip/unequip, slot compatibility, occupied-port protection, cargo preservation when removing bandwidth, and item recovery when selling a device. Cable Relay, Wireless Bridge, Cache Server, Distribution Hub, and Service Gateway are player-buildable with staged campaign unlocks. Gateway and cache service selection can be changed in node details. Ordinary traffic remains independently generated icon packets, not paired request/response transactions. Cache refill is a distinct physical carrier delivery which grants five local deliveries without earning profit itself.

Validation: 56 unit tests pass, including terrain geometry/schedules, bridge slots and move rejection, flood protection, monthly purchase limits, equipment locality and maintenance, controller routing, priority loading, transfer dwell, radio range, gateway retargeting, and physical cache refill accounting. TypeScript, formatting checks, and production build pass. Nine expansion browser cases pass across desktop Chromium, Android emulation and WebKit/iPhone emulation: month-end purchase/equip/unequip, radio placement across the river, editable gateway service and clear level 1. Four campaign/cable-flow cases and seven cable replacement, movement/sale, placement, monthly ledger and icon gallery cases pass on desktop Chromium. Mobile monthly-item and river/radio screenshots were visually inspected. These are emulated browser checks, not physical-device certification.

The terrain-aware adaptive simulation completed all six campaign seeds in months 3, 4, 6, 8, 11 and 12. Current results are in docs/balance/environment-routes.json; rerun with node scripts/play-environment.mjs. This verifies a valid strategy exists, not final player difficulty. Downtown capital/traffic and Highlands traffic were adjusted after adding terrain. Earlier balance reports in this file describe earlier rules and are historical.

Active sessions and inventory remain memory-only; only profile/progression persists across reloads. No deployment or remote push was performed.


## Simplified mobile home

The initial screen now shows the level board, selected level name, and one large Play action. Mission descriptions, starting gold, goals and star rules are shown only in a dismissible mission dialog. Progress totals and the packet record moved to Settings; Guide, Endless and Sound use a compact bottom menu. The board expands into available portrait space and becomes a two-column landscape layout.

Production build and type/format checks pass. Six campaign browser checks pass on Chromium, Android and WebKit/iPhone emulation, covering locked levels, mission detail dismissal, game entry and saved unlocks. Additional 360x640 and 844x390 browser checks found no horizontal or vertical home overflow and confirmed Endless entry. Portrait and landscape screenshots were visually reviewed.
