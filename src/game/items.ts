export const ITEMS = {
  buffer: {
    name: "Buffer Module",
    cost: 180,
    maintenance: 3,
    level: 2,
    description: "Adds 8 queue spaces to this device.",
  },
  ports: {
    name: "Port Expansion",
    cost: 220,
    maintenance: 5,
    level: 2,
    description: "Adds 2 cable ports. Free those ports before removing.",
  },
  bandwidth: {
    name: "Bandwidth Module",
    cost: 300,
    maintenance: 0,
    level: 3,
    description:
      "Adds 2 cargo spaces to connected cables; +4 maintenance per affected cable.",
  },
  transfer: {
    name: "Transfer Accelerator",
    cost: 220,
    maintenance: 4,
    level: 4,
    description: "Halves loading and unloading time at this device.",
  },
  traffic: {
    name: "Traffic Controller",
    cost: 260,
    maintenance: 5,
    level: 5,
    description:
      "Router or Distribution Hub. Distributes departures across available routes using live queue load.",
  },
  priority: {
    name: "Priority Module",
    cost: 160,
    maintenance: 3,
    level: 4,
    description: "Loads your chosen service icon before other packets.",
  },
  weather: {
    name: "Weatherproof Kit",
    cost: 240,
    maintenance: 4,
    level: 6,
    description:
      "Connected links retain 90% speed during floods instead of 50%.",
  },
  efficiency: {
    name: "Efficiency Module",
    cost: 240,
    maintenance: 0,
    level: 3,
    description: "Reduces this device's base maintenance by 30%.",
  },
} as const;
export type ItemKind = keyof typeof ITEMS;
export const ITEM_KEYS = Object.keys(ITEMS) as ItemKind[];
