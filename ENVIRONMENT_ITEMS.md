# Environment, inventory upgrades, and special devices

## Month-end inventory

The profit/maintenance report remains at the end of each 60-second month. Buy at most one optional item there using gold, or continue without buying. There is no anytime shop and no global capacity/speed upgrade. Purchases go into this session's Inventory. Open Inventory from the game menu or build picker, or equip directly in node details. Inspectors pause gameplay.

Equip and unequip are free. Items can move between compatible devices. Each device accepts only one copy of a given item. Router and Distribution Hub have two item slots; Switch, Wireless Bridge, and Cache Server have one. Automatic endpoints, Cable Relay, and Service Gateway have no item slots. Selling a player device returns its installed items to Inventory and refunds half its node price plus full attached cable prices.

| Item | Gold | Maintenance/month | Unlock | Effect |
|---|---:|---:|---|---|
| Buffer Module | 180 | 3 | Campus | +8 queue spaces on equipped device. Removing it can leave a queue above its normal threshold; overload then follows normal rules. |
| Port Expansion | 220 | 5 | Campus | +2 ports. Cannot remove until cables fit the original port count. |
| Bandwidth Module | 300 | +4 per affected cable | Riverside | +2 carrier cargo spaces on every connected cable. Does not stack when both ends have it. Removing it returns excess cargo to the departure queue. |
| Efficiency Module | 240 | 0 | Riverside | Reduces the device's base maintenance by 30%, rounded up. Does not discount cable/item upkeep. |
| Transfer Accelerator | 220 | 4 | Downtown | Halves arrival loading/unloading dwell at this device. |
| Priority Module | 160 | 3 | Downtown | Loads a chosen service icon first, configurable in node details. Does not discard other packets. |
| Traffic Controller | 260 | 5 | Highlands | Router/Hub only: routing also weighs mixed-service queue congestion and carrier load. |
| Weatherproof Kit | 240 | 4 | Metro Region | Connected links retain 90% speed during flood months instead of 50%. Does not stack. |

All unlocked item types are offered each month. Items in Inventory have no upkeep. Installed items and affected cables accrue maintenance from installation onward; previous charges are not recalculated.

## New player devices

| Device | Unlock | Gold | Maintenance/month | Ports | Queue limit | Dwell | Item slots |
|---|---|---:|---:|---:|---:|---:|---:|
| Cable Relay | Highlands | 50 | 5 | 2 | 6 | 0.2s | 0 |
| Wireless Bridge | Riverside | 220 | 25 | 2 | 12 | 0.3s | 1 |
| Cache Server | Downtown | 350 | 35 | 2 | 16 | 0.3s | 1 |
| Distribution Hub | Metro Region | 400 | 65 | 12 | 40 | 0.4s | 2 |
| Service Gateway | Metro Region | 550 | 65 | 1 | 10 | 0.4s | 0 |

All use the existing draggable placement preview with OK/Cancel, move action, and half-price sale. They unlock by campaign level; all are available in Endless.

- **Cable Relay:** an inexpensive two-port transit point to bend a physical route around terrain. Each segment still requires a cable and its own carrier.
- **Wireless Bridge:** connecting two creates a radio link automatically. A bridge can have one radio link; it shares the device's two physical connection slots with wired links. Range is 650 world units. Radio costs 150 gold, maintenance 30/month, speed 90, capacity 2. It crosses water without a bridge slot but cannot cross rocks or unrelated buildings. It cannot be converted to a wired type through the cable replacement picker.
- **Cache Server:** choose its service icon in node details. When empty, every 15 simulation seconds it attempts to request a refill from a reachable matching service node. The refill is a special packet transported by real carriers to this specific cache. Arrival grants five local deliveries, earns no gold itself, and does not increment score. Matching normal packets consume a charge and earn normal delivery profit. Changing service clears stored charges and cancels obsolete refill packets. Ordinary packets remain intact.
- **Distribution Hub:** expensive central transit device with twelve ports, a large queue, and two item slots. It does not create or fulfill normal traffic.
- **Service Gateway:** a player-built matching-service endpoint. Change the icon any time from node details; normal queued/in-flight packets retain their original icon and reroute. Like an automatic service node, it fulfills matching packets and generates client-icon traffic independently.

## Packet semantics

Normal traffic remains icon-based: clients independently generate service-icon packets; services independently generate client-variant packets. These are not correlated request/response transactions. Cache refill is a separate targeted delivery mechanic layered onto this existing model. No ordinary packet teleports: every inter-node trip still uses its cable's bidirectional carrier.

See [map schema](MAP_SCHEMA.md) for terrain and campaign progression.
