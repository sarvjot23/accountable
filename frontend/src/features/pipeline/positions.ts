// Card positions (PIPE-15). The backend decides positions; this mirrors its rule so the
// board can show a dropped card in place at once, and names the neighbours the move sends.

export const MIN_GAP = 1e-6;

export interface Positioned {
  id: number;
  position: number;
}

/** The cards just above (before) and below (after) the card at `index`, for PATCH /deals/:id/move. */
export function neighbours(columnIds: number[], index: number, movedId: number) {
  const others = columnIds.filter((id) => id !== movedId);
  const at = Math.min(index, others.length);
  return {
    before_id: at > 0 ? others[at - 1]! : null,
    after_id: at < others.length ? others[at]! : null,
  };
}

/**
 * Where a dropped card goes, exactly as backend/accountable/deals/rules.py drop_position:
 * the midpoint of its neighbours, or one past the end card; if the gap is too small, the
 * column is renumbered 1, 2, 3… leaving a slot for the card.
 */
export function dropPosition(
  column: Positioned[],
  beforeId: number | null,
  afterId: number | null,
): { position: number; renumbered: Map<number, number> } {
  const ids = column.map((c) => c.id);
  let index: number;
  if (beforeId !== null) {
    index = ids.indexOf(beforeId);
    if (index < 0) throw new Error("That card isn't in this column");
    index += 1;
  } else if (afterId !== null) {
    index = ids.indexOf(afterId);
    if (index < 0) throw new Error("That card isn't in this column");
  } else {
    index = ids.length;
  }
  const above = index > 0 ? column[index - 1]!.position : null;
  const below = index < column.length ? column[index]!.position : null;
  if (above === null && below === null) return { position: 1, renumbered: new Map() };
  if (above === null) return { position: below! - 1, renumbered: new Map() };
  if (below === null) return { position: above + 1, renumbered: new Map() };
  if (below - above > MIN_GAP) return { position: (above + below) / 2, renumbered: new Map() };
  const renumbered = new Map(column.map((c, i) => [c.id, i < index ? i + 1 : i + 2]));
  return { position: index + 1, renumbered };
}
