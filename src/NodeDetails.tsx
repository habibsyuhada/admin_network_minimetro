import {
  CLIENT_VARIANTS,
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
}: {
  state: Metro;
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
          Pilih perangkat untuk melihat tujuan paketnya. Permainan dijeda selama
          detail terbuka.
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
              <strong>{queue.length} paket</strong>
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
        Semua node
      </button>
      <p>
        <b>{nodeCode(node, nodes)}</b> · {state.queues[node].length} paket
        menunggu · {incoming} paket berikon sama dalam pengangkut jaringan.
      </p>
      {kind === 0 && (
        <p>
          Perangkat: {CLIENT_VARIANTS[nodes[node].clientVariant ?? 0]}. Menerima
          paket dengan ikon perangkat yang sama.
        </p>
      )}
      <p>
        {state.cables.filter((c) => c.stops.includes(node)).length}/
        {nodePorts(kind)} port terpakai.
      </p>
      {spec && (
        <p>
          {spec.name} buatanmu.{" "}
          {state.cables.filter((c) => c.stops.includes(node)).length}/
          {spec.ports} port terpakai. Maintenance {spec.maintenance} gold/bulan.
          Kapasitas antrean {nodeBuffer(nodes[node].shape)} paket. Paket
          menunggu pengangkut berikutnya; bukan tujuan akhir.
        </p>
      )}
      <h3>Kabel terhubung</h3>
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
                    <small>Ke {nodeName(peer, nodes)}</small>
                    <small>
                      {cableCapacity(state, c.kind)} paket · kecepatan{" "}
                      {cableSpeed(state, c.kind)} · maintenance{" "}
                      {cableMaintenance(state, c.kind)}/bulan
                    </small>
                  </span>
                </div>
                <details className="cable-type-picker">
                  <summary>Ganti tipe kabel</summary>
                  <p>
                    Bayar selisih harga; selisih tipe yang lebih murah
                    dikembalikan. Kelebihan muatan kembali ke antrean asal.
                  </p>
                  {CABLE_TYPES.map((type, index) => {
                    const kind = index as CableKind;
                    if (kind === c.kind) return null;
                    const cost = cableChangeCost(state, c.id, kind);
                    return (
                      <button
                        key={kind}
                        disabled={cost > state.gold}
                        onClick={() => onChangeCable(c.id, kind)}
                        aria-label={`Ganti kabel ${c.id} ke ${type.name}`}
                      >
                        <b style={{ color: type.color }}>{type.name}</b>
                        <small>
                          {cableCapacity(state, kind)} paket · kecepatan{" "}
                          {cableSpeed(state, kind)} ·{" "}
                          {cableMaintenance(state, kind)}/bulan
                        </small>
                        <small>
                          {cost > 0
                            ? `Bayar ${cost} gold`
                            : `Kembali ${-cost} gold`}
                          {cost > state.gold ? " · Gold kurang" : ""}
                        </small>
                      </button>
                    );
                  })}
                </details>
                <button
                  aria-label={`Hapus kabel ${c.id}`}
                  onClick={() => onRemoveCable(c.id)}
                >
                  Hapus · refund {CABLE_TYPES[c.kind].cost} gold
                </button>
              </article>
            );
          })}
        {!state.cables.some((c) => c.stops.includes(node)) && (
          <p>Belum ada kabel terhubung.</p>
        )}
      </div>
      <h3>Tujuan paket dari node ini</h3>
      <p className="muted">
        Paket diterima oleh node mana pun dengan ikon yang sama. Rute otomatis
        memilih koneksi yang tersedia.
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
                    Ke{" "}
                    {packetKind(destination) === 0
                      ? CLIENT_VARIANTS[packetVariant(destination)]
                      : DEVICE_NAMES[destination]}
                  </b>
                  <small>
                    {nodes.filter((n) => nodeService(n) === destination).length}{" "}
                    node tersedia
                  </small>
                  <small className={!cable ? "missing-route" : ""}>
                    {cable && next !== undefined
                      ? `Via ${nodeName(next, nodes)} · ${CABLE_TYPES[cable.kind].name} #${cable.id}`
                      : "Belum ada jalur ke tujuan"}
                  </small>
                </div>
                <strong>{count} paket</strong>
              </div>
            );
          })}
      </div>
      {!destinations.size && (
        <p className="empty-queue">
          Antrean kosong. Belum ada paket yang perlu diantar.
        </p>
      )}
      <p className="muted">
        Paket transit tetap menunggu pengangkut berikutnya. Permainan dijeda
        agar kamu bisa memeriksa jaringan.
      </p>
    </>
  );
}
