export type NodeId =
  "hq" | "branch" | "studio" | "router" | "backup" | "server";
export const offices = ["hq", "branch", "studio"] as const;
export type OfficeId = (typeof offices)[number];
export const routers = ["router", "backup"] as const;
export type RouterId = (typeof routers)[number];
export const MAP = {
  id: "hq-district",
  duration: 600,
  step: 0.1,
  budget: 1000,
  linkCost: 40,
  refund: 20,
  upgradeCost: 260,
  repairCost: 120,
  capacity: 120,
  upgradedCapacity: 260,
  queueMax: 80,
  rushAt: 240,
  warningAt: 360,
  outageAt: 390,
  finalRushAt: 480,
  grace: 30,
  failureAfter: 45,
} as const;
export const nodes: {
  id: NodeId;
  name: string;
  kind: "office" | "router" | "server";
  x: number;
  y: number;
  unlock: number;
}[] = [
  { id: "hq", name: "Kantor HQ", kind: "office", x: 70, y: 90, unlock: 0 },
  {
    id: "branch",
    name: "Kantor Cabang",
    kind: "office",
    x: 70,
    y: 225,
    unlock: 90,
  },
  { id: "studio", name: "Studio", kind: "office", x: 70, y: 360, unlock: 180 },
  { id: "router", name: "Router A", kind: "router", x: 245, y: 130, unlock: 0 },
  {
    id: "backup",
    name: "Router B",
    kind: "router",
    x: 245,
    y: 315,
    unlock: 90,
  },
  {
    id: "server",
    name: "App Server",
    kind: "server",
    x: 425,
    y: 225,
    unlock: 0,
  },
];
