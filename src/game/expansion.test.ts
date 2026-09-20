import { describe, it, expect } from "vitest";
import {
  newMetro,
  placeRouter,
  connectCable,
  connectionError,
  moveTransit,
  removeCable,
  buyItem,
  reward,
  installItem,
  uninstallItem,
  removeItemError,
  sellTransit,
  nodePorts,
  nodeBuffer,
  cableCapacity,
  cableSpeed,
  cableMaintenance,
  maintenanceRate,
  metroTick,
  routeCable,
  configureService,
  changeCable,
  type Metro,
  type Shape,
} from "./metro";
import {
  terrainFor,
  placementTerrainError,
  linkTerrainError,
  bridgeUse,
  terrainNotice,
} from "./environment";
function world(levelId?: string): Metro {
  return {
    ...newMetro(42, levelId),
    gold: 20000,
    nodes: [],
    queues: [],
    overload: [],
    spawned: 36,
  };
}
function node(s: Metro, shape: Shape, x: number, y: number) {
  return {
    ...s,
    nodes: [...s.nodes, { shape, x, y, serial: s.nodes.length + 1 }],
    queues: [...s.queues, []],
    overload: [...s.overload, 0],
  };
}
describe("environment rules", () => {
  it("leaves level one clear and keeps transit devices outside campus buildings", () => {
    const s = world("campus");
    expect(terrainFor("neighborhood")).toEqual([]);
    expect(placementTerrainError(s, { x: 100, y: 100 })).toMatch(/outside/);
    expect(placementTerrainError(s, { x: 100, y: 100 }, true)).toBeNull();
    expect(
      linkTerrainError(
        s,
        { x: 100, y: 100, shape: 0 },
        { x: 250, y: 100, shape: 3 },
      ),
    ).toBeNull();
    expect(
      linkTerrainError(
        s,
        { x: 40, y: 120, shape: 3 },
        { x: 250, y: 120, shape: 3 },
      ),
    ).toMatch(/building/);
  });
  it("requires bridge crossings, enforces two slots, frees slots, and validates moves", () => {
    let s = node(node(world("harbor"), 3, 350, 250), 3, 650, 250);
    s = connectCable(connectCable(s, 0, 0, 1), 0, 0, 1);
    expect(bridgeUse(s, "north")).toBe(2);
    expect(connectionError(s, 0, 0, 1)).toMatch(/slots/);
    expect(moveTransit(s, 0, 350, 650)).toBe(s);
    s = removeCable(s, 1);
    expect(bridgeUse(s, "north")).toBe(1);
    expect(connectionError(s, 0, 0, 1)).toBeNull();
    expect(
      linkTerrainError(
        s,
        { x: 350, y: 500, shape: 3 },
        { x: 650, y: 500, shape: 3 },
      ),
    ).toMatch(/bridge/);
  });
  it("blocks mountain shortcuts and gives advance notice of temporary restrictions", () => {
    const s = world("highlands");
    expect(
      linkTerrainError(
        s,
        { x: 300, y: 400, shape: 3 },
        { x: 650, y: 400, shape: 3 },
      ),
    ).toMatch(/ridge/);
    const city = { ...world("downtown"), month: 2 };
    expect(terrainNotice(city)).toMatch(/Next month/);
    expect(placementTerrainError(city, { x: 530, y: 500 })).toBeNull();
    expect(
      placementTerrainError({ ...city, month: 3 }, { x: 530, y: 500 }),
    ).toMatch(/road works/);
    const connected = connectCable(
      node(node(city, 3, 430, 500), 3, 650, 500),
      0,
      0,
      1,
    );
    expect(metroTick({ ...connected, month: 3 }).cables).toHaveLength(1);
  });
  it("slows flooded links and applies the strongest endpoint protection once", () => {
    let s = connectCable(
      node(node(world("metropolis"), 3, 600, 790), 3, 600, 1120),
      0,
      0,
      1,
    );
    const c = s.cables[0];
    expect(terrainNotice({ ...s, month: 3 })).toMatch(/Next month/);
    s = { ...s, month: 4 };
    expect(cableSpeed(s, 0, c)).toBe(30);
    s.nodes[0].items = ["weather"];
    expect(cableSpeed(s, 0, c)).toBe(54);
    s.nodes[1].items = ["weather"];
    expect(cableSpeed(s, 0, c)).toBe(54);
  });
});
describe("portable monthly items", () => {
  it("buys one item only at month end without applying a global bonus", () => {
    let s = newMetro(42);
    expect(buyItem(s, "buffer")).toBe(s);
    s = { ...s, phase: "reward" };
    const bought = buyItem(s, "buffer");
    expect(bought.gold).toBe(s.gold - 180);
    expect(bought.inventory).toEqual(["buffer"]);
    expect(buyItem(bought, "ports")).toBe(bought);
    expect(buyItem({ ...s, gold: 1 }, "buffer")).toEqual({ ...s, gold: 1 });
    expect(
      buyItem({ ...s, levelId: "neighborhood" }, "buffer").inventory,
    ).toEqual([]);
    expect(reward(bought).inventory).toEqual(["buffer"]);
    expect(reward(bought).purchasedThisMonth).toBe(false);
  });
  it("limits slots, prevents duplicate items and refunds inventory on sale", () => {
    let s = placeRouter(newMetro(42), 150, 280, 4);
    s = { ...s, inventory: ["buffer", "ports"] };
    s = installItem(s, 3, "buffer");
    expect(nodeBuffer(s.nodes[3])).toBe(24);
    expect(installItem(s, 3, "ports")).toBe(s);
    s = uninstallItem(s, 3, "buffer");
    expect(nodeBuffer(s.nodes[3])).toBe(16);
    s = installItem(s, 3, "ports");
    expect(nodePorts(s.nodes[3])).toBe(6);
    const sold = sellTransit(s, 3);
    expect(sold.inventory.sort()).toEqual(["buffer", "ports"]);
    expect(sold.gold).toBe(s.gold + 40);
  });
  it("refuses to remove ports in use and preserves cargo when bandwidth is removed", () => {
    let s = node(node(node(world(), 4, 100, 100), 3, 300, 100), 3, 100, 300);
    s.nodes[0].items = ["ports"];
    for (let i = 0; i < 5; i++) s = connectCable(s, 0, 0, 1);
    expect(removeItemError(s, 0, "ports")).toMatch(/Disconnect/);
    expect(uninstallItem(s, 0, "ports")).toBe(s);
    s.nodes[1].items = ["bandwidth"];
    const c = s.cables[0];
    c.cargo = Array.from({ length: 6 }, () => ({ service: 1 }));
    expect(cableCapacity(s, 0, c)).toBe(6);
    expect(cableMaintenance(s, 0, c)).toBe(24);
    const next = uninstallItem(s, 1, "bandwidth");
    expect(next.cables[0].cargo).toHaveLength(4);
    expect(next.queues[0]).toHaveLength(2);
    expect(s.cables[0].cargo).toHaveLength(6);
  });
  it("applies local bonuses once and reduces only device maintenance", () => {
    let s = connectCable(
      connectCable(
        node(node(node(world(), 3, 100, 100), 3, 300, 100), 3, 500, 100),
        0,
        0,
        1,
      ),
      0,
      1,
      2,
    );
    s.nodes[0].items = ["bandwidth", "efficiency"];
    expect(cableCapacity(s, 0, s.cables[0])).toBe(6);
    expect(cableCapacity(s, 0, s.cables[1])).toBe(4);
    expect(maintenanceRate(s)).toBe(125);
    s.nodes[1].items = ["bandwidth"];
    expect(cableCapacity(s, 0, s.cables[0])).toBe(6);
  });
});
describe("special devices", () => {
  it("creates a radio carrier across water and limits range, pairing, and upgrades", () => {
    let s = node(
      node(node(world("harbor"), 11, 350, 500), 11, 650, 500),
      11,
      650,
      700,
    );
    s = connectCable(s, 0, 0, 1);
    expect(s.cables[0].kind).toBe(3);
    expect(cableCapacity(s, 3, s.cables[0])).toBe(2);
    expect(bridgeUse(s, "north")).toBe(0);
    expect(connectionError(s, 0, 0, 2)).toMatch(/one radio/);
    expect(changeCable(s, 1, 0)).toBe(s);
    const far = node(node(world(), 11, 100, 100), 11, 900, 100);
    expect(connectionError(far, 0, 0, 1)).toMatch(/range/);
  });
  it("lets gateways change service without changing packet icons or erasing traffic", () => {
    let s = node(node(world(), 0, 100, 100), 14, 200, 100);
    s = connectCable(s, 0, 0, 1);
    s.queues[0] = [{ service: 1 }];
    expect(routeCable(s, 0, 1)).toBe(1);
    const next = configureService(s, 1, 2);
    expect(next.queues[0]).toEqual([{ service: 1 }]);
    expect(routeCable(next, 0, 1)).toBeNull();
    expect(routeCable(next, 0, 2)).toBe(1);
    expect(configureService(next, 0, 2)).toBe(next);
    expect(configureService(next, 1, 4)).toBe(next);
  });
  it("fills caches via real carriers without profit, then consumes limited charges", () => {
    let s = node(node(node(world(), 1, 100, 100), 12, 180, 100), 0, 260, 100);
    s.nodes[1].service = 1;
    s = connectCable(connectCable(s, 0, 0, 1), 0, 1, 2);
    expect(routeCable(s, 2, 1)).toBe(2);
    s.time = 14.9;
    s = metroTick(s);
    expect(
      [...s.queues.flat(), ...s.cables.flatMap((c) => c.cargo)].some(
        (p) => p.refillTarget === 2,
      ),
    ).toBe(true);
    // Deliver the actual refill to isolate its accounting from random normal traffic.
    s.queues = s.queues.map((q) =>
      q.filter((p) => p.refillTarget === undefined),
    );
    s.cables[0].cargo = [{ service: 1, refillTarget: 2 }];
    s.cables[0].progress = 0.99;
    s.cables[0].wait = 0;
    s.cables[0].at = 0;
    const delivered = s.delivered;
    s = metroTick(s);
    expect(s.nodes[1].cacheCharges).toBe(5);
    expect(s.delivered).toBe(delivered);
    s.queues[1] = [{ service: 1 }, { service: 1 }];
    s = metroTick(s);
    expect(s.nodes[1].cacheCharges).toBe(3);
    expect(s.delivered).toBe(delivered + 2);
    const changed = configureService(s, 1, 2);
    expect(changed.nodes[1].cacheCharges).toBe(0);
    expect(changed.queues.flat().filter((p) => p.refillTarget === 2)).toEqual(
      [],
    );
  });
});

describe("routing and loading equipment", () => {
  it("routes around mixed-service congestion only when a controller is equipped", () => {
    let s = world();
    for (const [shape, x, y] of [
      [3, 100, 100],
      [3, 250, 100],
      [3, 250, 300],
      [1, 400, 100],
      [1, 400, 300],
    ] as const)
      s = node(s, shape, x, y);
    for (const [a, b] of [
      [0, 1],
      [1, 3],
      [0, 2],
      [2, 4],
    ])
      s = connectCable(s, 0, a, b);
    s.queues[1] = Array.from({ length: 20 }, () => ({ service: 2 }));
    expect(routeCable(s, 0, 1)).toBe(1);
    s.nodes[0].items = ["traffic"];
    expect(routeCable(s, 0, 1)).toBe(3);
  });
  it("loads the selected service first without deleting lower-priority packets", () => {
    let s = world();
    for (const [shape, x, y] of [
      [3, 100, 100],
      [3, 300, 100],
      [1, 500, 100],
      [2, 300, 300],
    ] as const)
      s = node(s, shape, x, y);
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [1, 3],
    ])
      s = connectCable(s, 0, a, b);
    s.nodes[0].items = ["priority"];
    s.nodes[0].priority = 2;
    s.queues[0] = [
      { service: 1 },
      { service: 1 },
      { service: 1 },
      { service: 1 },
      { service: 2 },
    ];
    s.cables[0].wait = 0.1;
    s = metroTick(s);
    expect(s.cables[0].cargo.map((p) => p.service)).toEqual([2, 1, 1, 1]);
    expect(s.queues[0]).toEqual([{ service: 1 }]);
  });
  it("halves dwell only at the equipped arrival node", () => {
    let s = connectCable(
      node(node(world(), 3, 100, 100), 3, 200, 100),
      0,
      0,
      1,
    );
    s.nodes[1].items = ["transfer"];
    s.cables[0].wait = 0;
    s.cables[0].progress = 0.999;
    s = metroTick(s);
    expect(s.cables[0].wait).toBe(0.2);
    s.cables[0].wait = 0;
    s.cables[0].progress = 0.999;
    s = metroTick(s);
    expect(s.cables[0].wait).toBe(0.4);
  });
});
