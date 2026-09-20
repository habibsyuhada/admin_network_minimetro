# NOC Flow level and map schema

Campaign contains six sequential missions in a 1000 x 1200 world. Terrain is gameplay geometry, not just decoration. Level 1 has no environment restrictions. Existing level IDs remain unchanged for saved progress.

| Level | ID | Name | Minimum months | Packets | Starting gold | Traffic multiplier |
|---|---|---|---:|---:|---:|---:|
| 1 | neighborhood | Home Lab | 3 | 60 | 1800 | 0.8 |
| 2 | campus | Campus | 4 | 120 | 1700 | 0.9 |
| 3 | harbor | Riverside | 6 | 250 | 1900 | 0.9 |
| 4 | downtown | Downtown | 8 | 450 | 1900 | 0.9 |
| 5 | highlands | Highlands | 10 | 700 | 1800 | 0.8 |
| 6 | metropolis | Metro Region | 12 | 1100 | 1600 | 1.0 |

## Environment rules

| Level | Environment | Effect |
|---|---|---|
| 1 | Clear neighborhood | Learn cables, carriers, and economy without terrain restrictions. |
| 2 | Campus buildings | Automatic endpoints can occupy buildings. Player devices stay outside. Links can enter their endpoint's building but cannot cut through an unrelated building. |
| 3 | River and two bridges | Wired crossings must follow a bridge. Each bridge has two cable slots; parallel cables each consume one. Wireless Bridge pairs can cross away from bridges. |
| 4 | Buildings and road works | Construction area blocks new placements/cables in months 3-4 of each four-month cycle. Month 2 warns in advance. Existing links keep operating. Automatic endpoints never spawn in the reserved works area. |
| 5 | Rocky ridges | Ridges block device placement and all links, including radio. Route through gaps, using relays or other transit devices. |
| 6 | River, buildings, ridge, floodplain | Same permanent constraints. Floods occur every fourth month, with a warning one month ahead. Intersecting links run at 50% speed, or 90% with a Weatherproof Kit at either endpoint. |

Environment checks apply to cable creation and moving connected devices. Selling cables releases bridge slots. Placement previews and failed connections explain the restriction. Mission details show rules; temporary-event status is available on the map.

## Configuration and progression

`src/game/levels.ts` defines id, name/subtitle/description/color, seed, months, packets, gold, spawnEvery, traffic, maxNodes, zones, and start nodes. `src/game/environment.ts` defines terrain rectangles, bridge geometry, schedules, placement checks, and link checks. Rendering is in `src/EnvironmentArt.tsx`; gameplay does not rely on the drawn pixels.

Automatic spawn candidates avoid water, rocks, reserved construction areas, and other nodes. Client bursts remain clustered. Automatic clients and services have one port; player devices follow their own specs. Terrain does not replace the icon-destination and carrier mechanics.

Victory is checked at month end after settlement and loss checks; both month and packet goals must be reached. Missing the packet goal continues the session into another month. Stars: one for completion, one for delivering 125% of target, one for retaining at least half the starting gold. Best stars persist and unlock the next mission. Active sessions and their inventory are memory-only and reset on reload or a new mission. Endless mode has all devices/items unlocked and no terrain.

## Validation and initial balance

`node scripts/play-environment.mjs` runs an adaptive topology strategy through the public simulation rules, respecting terrain, ports, gold, and item limits. It uses routers, parallel links, cable replacements, and local items; it does not bypass obstacles or grant resources. Results: `docs/balance/environment-routes.json`.

| Map | Completion month | Delivered | Final gold |
|---|---:|---:|---:|
| Home Lab | 3 | 66 | 1241 |
| Campus | 4 | 121 | 740 |
| Riverside | 6 | 259 | 847 |
| Downtown | 8 | 549 | 1866 |
| Highlands | 11 | 830 | 4009 |
| Metro Region | 12 | 1253 | 5229 |

These are single-seed campaign solvability checks, not a claim of final human difficulty. Downtown starting gold was raised to 1900 and its traffic reduced to 0.9; Highlands traffic was reduced to 0.8 after adding constraints. Earlier `campaign-results.json` and `environment-baseline.json` are historical, not current balance results. Browser tests separately exercise real month-end purchase/equip/unequip, radio construction across the river, and editable gateway service on desktop and phone emulation.
