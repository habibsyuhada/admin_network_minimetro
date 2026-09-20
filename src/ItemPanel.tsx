import { ITEMS, ITEM_KEYS, type ItemKind } from "./game/items";
import {
  type Metro,
  installItem,
  uninstallItem,
  itemSlots,
  itemAllowed,
  removeItemError,
} from "./game/metro";
import { nodeName } from "./NodeDetails";
export default function ItemPanel({
  state,
  node,
  onUpdate,
}: {
  state: Metro;
  node: number;
  onUpdate: (fn: (s: Metro) => Metro) => void;
}) {
  const n = state.nodes[node];
  if (!n) return null;
  return (
    <section className="item-panel" aria-label="Device upgrades">
      <h3>
        {nodeName(node, state.nodes)} · {n.items?.length ?? 0}/{itemSlots(n)}{" "}
        slots
      </h3>
      {(n.items ?? []).map((key) => (
        <article key={key}>
          <strong>{ITEMS[key].name}</strong>
          <p>{ITEMS[key].description}</p>
          <button
            disabled={
              state.phase !== "running" || !!removeItemError(state, node, key)
            }
            onClick={() => onUpdate((s) => uninstallItem(s, node, key))}
          >
            Unequip {ITEMS[key].name}
          </button>
          {removeItemError(state, node, key) && (
            <small>{removeItemError(state, node, key)}</small>
          )}
        </article>
      ))}
      {ITEM_KEYS.filter((key) => state.inventory.includes(key)).map((key) => {
        const count = state.inventory.filter((k) => k === key).length,
          disabled =
            !itemAllowed(n, key) ||
            (n.items ?? []).includes(key) ||
            (n.items?.length ?? 0) >= itemSlots(n);
        return (
          <article key={key}>
            <strong>
              {ITEMS[key].name} ×{count}
            </strong>
            <p>{ITEMS[key].description}</p>
            <small>
              Upkeep: {ITEMS[key].maintenance} gold/month{" "}
              {key === "bandwidth" ? "+ 4 per affected cable" : ""}
            </small>
            <button
              disabled={disabled || state.phase !== "running"}
              onClick={() =>
                onUpdate((s) => installItem(s, node, key as ItemKind))
              }
            >
              Equip {ITEMS[key].name}
            </button>
            {disabled && (
              <small>
                {!itemAllowed(n, key)
                  ? "Not compatible with this device."
                  : (n.items ?? []).includes(key)
                    ? "Already installed."
                    : "All item slots are occupied."}
              </small>
            )}
          </article>
        );
      })}
      {!state.inventory.length && (
        <p>Your inventory is empty. Buy an item at the end of a month.</p>
      )}
    </section>
  );
}
