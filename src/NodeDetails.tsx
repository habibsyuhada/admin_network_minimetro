import { Gold } from "./GameIcons";
import {
  CLIENT_VARIANTS,
  SERVICES,
  configureService,
  setPriority,
  hasItem,
  cableChangeCost,
  cableMaintenance,
  type CableKind,
  cableCapacity,
  cableSpeed,
  nodePorts,
  nodeService,
  packetKind,
  packetVariant,
  type Site,
  type Metro,
  SITES,
  routeCable,
  CABLE_TYPES,
  isTransit,
  TRANSIT,
  nodeBuffer,
} from "./game/metro";
import { DeviceGlyph, DEVICE_NAMES, DEVICE_CODES } from "./NetworkArt";

export const nodeName = (id: number, nodes: Site[] = SITES) =>
  `${DEVICE_NAMES[nodes[id].shape]} ${nodes[id].serial ?? id + 1}`;
export const nodeCode = (id: number, nodes: Site[] = SITES) =>
  `${DEVICE_CODES[nodes[id].shape]}-${String(nodes[id].serial ?? id + 1).padStart(2, "0")}`;

export default function NodeDetails({
  state,
  node,
  onSelect,
  onRemoveCable,
  onChangeCable,
  onUpdate,
}: {
  state: Metro;
  onUpdate: (fn: (s: Metro) => Metro) => void;
  node: number | null;
  onSelect: (id: number | null) => void;
  onRemoveCable: (id: number) => void;
  onChangeCable: (id: number, kind: CableKind) => void;
}) {
  const nodes = state.nodes;
  if (node === null)
    return (
      <>
        <p>
          Choose a device to inspect its packet destinations. The simulation
          pauses while details are open.
        </p>
        <div className="node-directory">
          {state.queues.map((queue, id) => (
            <button key={id} onClick={() => onSelect(id)}>
              <svg viewBox="-30 -30 60 60">
                <DeviceGlyph
                  kind={nodes[id].shape}
                  variant={nodes[id].clientVariant}
                />
              </svg>
              <span>
                <b>{nodeName(id, nodes)}</b>
                <small>{nodeCode(id, nodes)}</small>
              </span>
              <strong>{queue.length} packets</strong>
            </button>
          ))}
        </div>
      </>
    );
  const kind = nodes[node].shape;
  const spec = isTransit(kind) ? TRANSIT[kind] : null;
  const destinations = new Map<number, number>();
  for (const packet of state.queues[node])
    destinations.set(
      packet.service,
      (destinations.get(packet.service) ?? 0) + 1,
    );
  const incoming = state.cables
    .flatMap((c) => c.cargo)
    .filter((p) => p.service === nodeService(nodes[node])).length;
  return (
    <>
      <button className="secondary" onClick={() => onSelect(null)}>
        All nodes
      </button>
      <p>
        <b>{nodeCode(node, nodes)}</b> · {state.queues[node].length} packets
        waiting · {incoming} matching packets in transit across the network.
      </p>
      {kind === 0 && (
        <p>
          Device: {CLIENT_VARIANTS[nodes[node].clientVariant ?? 0]}. Receives
          packets with the matching device icon.
        </p>
      )}
      <p>
        {state.cables.filter((c) => c.stops.includes(node)).length}/
        {nodePorts(nodes[node])} ports used.
      </p>
      {spec && (
        <p>
          {spec.name} built by you.{" "}
          {state.cables.filter((c) => c.stops.includes(node)).length}/
          {spec.ports} ports used. Maintenance{" "}
          <Gold amount={spec.maintenance} />
          /month. Queue capacity: {nodeBuffer(nodes[node])} packets.{" "}
          {kind === 14
            ? "This device is a service destination."
            : "Packets can transfer here."}
        </p>
      )}
      {[12, 14].includes(kind) && (
        <section className="service-config">
          <label>
            Service icon
            <select
              aria-label="Service icon"
              value={nodes[node].service ?? 1}
              onChange={(e) =>
                onUpdate((s) =>
                  configureService(s, node, Number(e.target.value)),
                )
              }
            >
              {SERVICES.map((k) => (
                <option key={k} value={k}>
                  {DEVICE_NAMES[k]}
                </option>
              ))}
            </select>
          </label>
          <svg viewBox="-30 -30 60 60" width="50" height="50">
            <DeviceGlyph kind={nodes[node].service ?? 1} />
          </svg>
          {kind === 12 ? (
            <p>
              Cache: {nodes[node].cacheCharges ?? 0}/5 deliveries available.
              Empty caches request a physical refill from a reachable matching
              service every 15 seconds. Refills earn no gold. Changing service
              empties the cache.
            </p>
          ) : (
            <p>
              This gateway receives packets for the selected icon. Existing
              packets retain their destination when you change it.
            </p>
          )}
        </section>
      )}
      {hasItem(nodes[node], "priority") && (
        <label>
          Priority service
          <select
            aria-label="Priority service"
            value={nodes[node].priority ?? 1}
            onChange={(e) =>
              onUpdate((s) => setPriority(s, node, Number(e.target.value)))
            }
          >
            {SERVICES.map((k) => (
              <option key={k} value={k}>
                {DEVICE_NAMES[k]}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind === 11 && (
        <p>
          Connect two Wireless Bridges to create a radio link automatically.
          Each bridge supports one radio link, up to 650 units. Radio crosses
          rivers, but not rocky ridges.
        </p>
      )}
      <h3>Connected cables</h3>
      <div className="node-cables">
        {state.cables
          .filter((c) => c.stops.includes(node))
          .map((c) => {
            const peer = c.stops.find((id) => id !== node)!;
            return (
              <article
                className="node-cable-card"
                key={c.id}
                data-cable-detail={c.id}
              >
                <div className="cable-peer">
                  <svg
                    viewBox="-30 -30 60 60"
                    role="img"
                    aria-label={nodeName(peer, nodes)}
                  >
                    <DeviceGlyph
                      kind={nodes[peer].shape}
                      variant={nodes[peer].clientVariant}
                    />
                  </svg>
                  <span>
                    <b>
                      {CABLE_TYPES[c.kind].name} #{c.id}
                    </b>
                    <small>To {nodeName(peer, nodes)}</small>
                    <small>
                      {cableCapacity(state, c.kind, c)} packets · speed{" "}
                      {cableSpeed(state, c.kind, c)} · maintenance{" "}
                      {cableMaintenance(state, c.kind, c)}/month
                    </small>
                  </span>
                </div>
                <details className="cable-type-picker" hidden={c.kind === 3}>
                  <summary>Change cable type</summary>
                  <p>
                    Pay the price difference, or receive a refund for a cheaper
                    cable. Excess cargo returns to its departure queue.
                  </p>
                  {CABLE_TYPES.map((type, index) => {
                    const kind = index as CableKind;
                    if (kind === c.kind || kind === 3 || c.kind === 3)
                      return null;
                    const cost = cableChangeCost(state, c.id, kind);
                    return (
                      <button
                        key={kind}
                        disabled={cost > state.gold}
                        onClick={() => onChangeCable(c.id, kind)}
                        aria-label={`Change cable ${c.id} to ${type.name}`}
                      >
                        <b style={{ color: type.color }}>{type.name}</b>
                        <small>
                          {cableCapacity(state, kind, c)} packets · speed{" "}
                          {cableSpeed(state, kind, c)} ·{" "}
                          {cableMaintenance(state, kind, c)}/month
                        </small>
                        <small>
                          {cost > 0 ? "Pay " : "Refund "}
                          <Gold amount={Math.abs(cost)} />
                          {cost > state.gold ? " · Not enough gold" : ""}
                        </small>
                      </button>
                    );
                  })}
                </details>
                <button
                  aria-label={`Remove cable ${c.id}`}
                  onClick={() => onRemoveCable(c.id)}
                >
                  Remove · refund <Gold amount={CABLE_TYPES[c.kind].cost} />
                </button>
              </article>
            );
          })}
        {!state.cables.some((c) => c.stops.includes(node)) && (
          <p>No cables connected yet.</p>
        )}
      </div>
      <h3>Packet destinations</h3>
      <p className="muted">
        Any node with a matching icon can receive these packets. Routing
        automatically selects an available connection.
      </p>
      <div className="node-destinations">
        {[...destinations]
          .sort(([a], [b]) => a - b)
          .map(([destination, count]) => {
            const first = routeCable(state, node, destination);
            const cable = state.cables.find((c) => c.id === first);
            const next = cable?.stops.find((id) => id !== node);
            return (
              <div key={destination} data-destination={destination}>
                <svg viewBox="-30 -30 60 60">
                  <DeviceGlyph
                    kind={packetKind(destination)}
                    variant={packetVariant(destination)}
                  />
                </svg>
                <div>
                  <b>
                    To{" "}
                    {packetKind(destination) === 0
                      ? CLIENT_VARIANTS[packetVariant(destination)]
                      : DEVICE_NAMES[destination]}
                  </b>
                  <small>
                    {nodes.filter((n) => nodeService(n) === destination).length}{" "}
                    available nodes
                  </small>
                  <small className={!cable ? "missing-route" : ""}>
                    {cable && next !== undefined
                      ? `Via ${nodeName(next, nodes)} · ${CABLE_TYPES[cable.kind].name} #${cable.id}`
                      : "No route to destination"}
                  </small>
                </div>
                <strong>{count} packets</strong>
              </div>
            );
          })}
      </div>
      {!destinations.size && (
        <p className="empty-queue">
          The queue is empty. No packets are waiting for delivery.
        </p>
      )}
      <p className="muted">
        Transit packets wait for the next carrier. The simulation is paused
        while you inspect the network.
      </p>
    </>
  );
}
