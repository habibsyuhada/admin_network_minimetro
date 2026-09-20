import {
  CLIENT_VARIANTS,
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
}: {
  state: Metro;
  node: number | null;
  onSelect: (id: number | null) => void;
  onRemoveCable: (id: number) => void;
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
    .filter((p) => p.service === nodes[node].shape).length;
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
          Perangkat: {CLIENT_VARIANTS[nodes[node].clientVariant ?? 0]}. Semua
          variasi client menerima paket berikon PC yang sama.
        </p>
      )}
      {spec && (
        <p>
          {spec.name} buatanmu.{" "}
          {state.cables.filter((c) => c.stops.includes(node)).length}/
          {spec.ports} port terpakai. Maintenance {spec.maintenance}{" "}
          gold/minggu. Kapasitas antrean {nodeBuffer(nodes[node].shape)} paket.
          Paket menunggu pengangkut berikutnya; bukan tujuan akhir.
        </p>
      )}
      <h3>Kabel terhubung</h3>
      <div className="node-cables">
        {state.cables
          .filter((c) => c.stops.includes(node))
          .map((c) => (
            <div key={c.id}>
              <span>
                <b>
                  {CABLE_TYPES[c.kind].name} #{c.id}
                </b>
                <small>
                  Ke{" "}
                  {nodeName(
                    c.stops.find((id) => id !== node)!,
                    nodes,
                  )}
                </small>
                <small>Refund {CABLE_TYPES[c.kind].cost} gold</small>
              </span>
              <button
                aria-label={`Hapus kabel ${c.id}`}
                onClick={() => onRemoveCable(c.id)}
              >
                Hapus
              </button>
            </div>
          ))}
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
                  <DeviceGlyph kind={destination} />
                </svg>
                <div>
                  <b>Ke {DEVICE_NAMES[destination]}</b>
                  <small>
                    {nodes.filter((n) => n.shape === destination).length} node
                    tersedia
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
