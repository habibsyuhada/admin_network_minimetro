# NOC Flow validation — point-to-point cable gameplay

The previous multi-stop route model is replaced by independent two-node cables. Each cable owns one bidirectional carrier and retains its cargo until arrival; intermediate packets unload into node queues and wait for the next cable's carrier. Packet routing uses positive travel-time costs with queue/capacity pressure and stable cable order. Capacity is shown as load/maximum on every carrier.

Ethernet (4 packets, speed 60, 1 stock), Fiber (3, speed 100, 2 stock) and Backbone (8, speed 45, 2 stock) use fixed type colors. Initial stock is 6; weekly rewards grant 2 stock plus a chosen upgrade. Removing one cable refunds its cost and returns cargo to its departure endpoint. Other cables continue unchanged. Distinct cable types sharing endpoints remain in parallel lanes.

Validation completed: 21 unit tests, 30 browser scenarios passed; three platform-specific scenarios skipped (native pinch injection outside Chromium mobile and the existing WebKit service-worker update case). Tests cover independent carriers, capacity, transit waiting, bidirectional delivery, alternate routing, stock restrictions/refunds, payload conservation, cable creation/deletion, type colors, camera bounds, pinch, mobile layouts, preferences, offline and updates. Production build and TypeScript/Prettier checks pass.

A visual check found cramped cable type labels in landscape; the controls column was widened. Device emulation is not physical-device certification. Active sessions remain memory-only and end on reload. No branch has been pushed and no public deployment or PR has been created.

## Specific destinations and larger map

Packets now retain an exact active destination node ID through loading, transit, rerouting and cable removal. Delivery to another node with the same icon is forbidden. Tests cover transit through matching icons, unreachable exact destinations, and generation to distinct active nodes including matching types. The node inspector groups waiting packets by exact destination and shows counts and route availability; opening it pauses simulation. Browser tests cover direct inspection, the node directory, route status, and pause/resume in Chromium desktop/mobile and WebKit.

The compact HUD and controls give more space to the playable map. Desktop uses the full width with a side panel. Portrait 360x640 and landscape 844x390 layouts were visually reviewed. Emulated WebKit may offset its visual viewport, so the camera test starts within the visible map intersection. The inspector test freezes its clock between interactions to avoid loading cargo during assertions.

## Expanded world and drag-only construction

World bounds are now 1000x1200 (5x the original area). The initial three devices remain near the starting camera; later devices occupy distant regions. Camera stays fixed when nodes appear, with whole-world overview and per-node focus. Click/tap/keyboard activation opens details; only pointer drag creates a cable. PC-to-PC generated traffic is excluded. Tests use real drag gestures for construction and cover exact world area, full-map bounds, distant node focus and inspection without cable creation.

## Player-built routers

The simulation now owns dynamic node positions and stable IDs. Player routers append to the network independently of scheduled endpoint spawns. Router stock starts at 2, with +1 each week. Placement validates world bounds, finite coordinates and minimum spacing. Routers cannot generate packets or be selected as traffic destinations; exact-target routing and carrier transfers include them normally. Initial endpoints are spaced farther apart, and later automatic nodes receive seeded position variation with collision avoidance.

Router unit tests cover stock/invalid placement, transit, absence of router-generated traffic, and independent automatic growth. Browser checks exercise placement, overlap rejection, dragging two cables through a router, node detail, cancellation, and mobile layouts.
