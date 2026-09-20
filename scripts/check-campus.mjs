import fs from "node:fs";
import { play } from "./play-environment.mjs";
const seeds = [123, 42, 987, 2026, 45678, 7, 99, 314, 1024, 65535];
const results = seeds.map((seed) => ({ seed, ...play("campus", seed) }));
console.log(
  results.map(({ seed, phase, month, delivered, gold }) => ({
    seed,
    phase,
    month,
    delivered,
    gold,
  })),
);
fs.writeFileSync(
  process.argv[2] || "docs/balance/campus-large-buildings.json",
  JSON.stringify(results, null, 2),
);
