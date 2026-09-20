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
