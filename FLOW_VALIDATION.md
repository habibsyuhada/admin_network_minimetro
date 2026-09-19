# NOC Flow validation — point-to-point cable gameplay

The previous multi-stop route model is replaced by independent two-node cables. Each cable owns one bidirectional carrier and retains its cargo until arrival; intermediate packets unload into node queues and wait for the next cable's carrier. Packet routing uses positive travel-time costs with queue/capacity pressure and stable cable order. Capacity is shown as load/maximum on every carrier.

Ethernet (4 packets, speed 60, 1 stock), Fiber (3, speed 100, 2 stock) and Backbone (8, speed 45, 2 stock) use fixed type colors. Initial stock is 6; weekly rewards grant 2 stock plus a chosen upgrade. Removing one cable refunds its cost and returns cargo to its departure endpoint. Other cables continue unchanged. Distinct cable types sharing endpoints remain in parallel lanes.

Validation completed: 15 unit tests, 21 browser scenarios passed; three platform-specific scenarios skipped (native pinch injection outside Chromium mobile and the existing WebKit service-worker update case). Tests cover independent carriers, capacity, transit waiting, bidirectional delivery, alternate routing, stock restrictions/refunds, payload conservation, cable creation/deletion, type colors, camera bounds, pinch, mobile layouts, preferences, offline and updates. Production build and TypeScript/Prettier checks pass.

A visual check found cramped cable type labels in landscape; the controls column was widened. Device emulation is not physical-device certification. Active sessions remain memory-only and end on reload. No branch has been pushed and no public deployment or PR has been created.
