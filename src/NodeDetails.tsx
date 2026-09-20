import { type Metro, SITES, routeCable, CABLE_TYPES } from "./game/metro";
import { DeviceGlyph, DEVICE_NAMES, DEVICE_CODES } from "./NetworkArt";

export const nodeName = (id: number) =>
  `${DEVICE_NAMES[SITES[id].shape]} ${id + 1}`;
export const nodeCode = (id: number) =>
  `${DEVICE_CODES[SITES[id].shape]}-${String(id + 1).padStart(2, "0")}`;

export default function NodeDetails({
  state,
  node,
  onSelect,
}: {
  state: Metro;
  node: number | null;
  onSelect: (id: number | null) => void;
}) {
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
                <DeviceGlyph kind={SITES[id].shape} />
              </svg>
              <span>
                <b>{nodeName(id)}</b>
                <small>{nodeCode(id)}</small>
              </span>
              <strong>{queue.length} paket</strong>
            </button>
          ))}
        </div>
      </>
    );
  const destinations = new Map<number, number>();
  for (const packet of state.queues[node])
    destinations.set(
      packet.destination,
      (destinations.get(packet.destination) ?? 0) + 1,
    );
  const incoming = state.cables
    .flatMap((c) => c.cargo)
    .filter((p) => p.destination === node).length;
  return (
    <>
      <button className="secondary" onClick={() => onSelect(null)}>
        Semua node
      </button>
      <p>
        <b>{nodeCode(node)}</b> · {state.queues[node].length} paket menunggu ·{" "}
        {incoming} paket menuju ke sini dalam pengangkut.
      </p>
      <h3>Tujuan paket dari node ini</h3>
      <p className="muted">
        Ikon menunjukkan jenis perangkat. Nama dan nomor menentukan tujuan
        tepatnya.
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
                  <DeviceGlyph kind={SITES[destination].shape} />
                </svg>
                <div>
                  <b>Ke {nodeName(destination)}</b>
                  <small>{nodeCode(destination)}</small>
                  <small className={!cable ? "missing-route" : ""}>
                    {cable && next !== undefined
                      ? `Via ${nodeName(next)} · ${CABLE_TYPES[cable.kind].name} #${cable.id}`
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
