// Drop positions match the backend's rule (PIPE-15); the same cases as backend/tests/deals/test_rules.py.
import { dropPosition, neighbours } from './positions';

const col = (...pairs: Array<[number, number]>) => pairs.map(([id, position]) => ({ id, position }));

describe('dropPosition (PIPE-15)', () => {
  it('takes the midpoint between two cards', () => {
    expect(dropPosition(col([1, 1], [2, 2], [3, 3]), 1, 2).position).toBe(1.5);
  });
  it('goes one past either end', () => {
    expect(dropPosition(col([1, 1], [2, 2]), null, 1).position).toBe(0);
    expect(dropPosition(col([1, 1], [2, 2]), 2, null).position).toBe(3);
  });
  it('starts an empty column at 1', () => {
    expect(dropPosition([], null, null).position).toBe(1);
  });
  it('uses the column order when one neighbour is named', () => {
    expect(dropPosition(col([1, 1], [2, 2], [3, 3]), 2, null).position).toBe(2.5);
    expect(dropPosition(col([1, 1], [2, 2], [3, 3]), null, 2).position).toBe(1.5);
  });
  it('refuses a neighbour from another column', () => {
    expect(() => dropPosition(col([1, 1]), 9, null)).toThrow();
  });
  it('renumbers the column when positions get too close', () => {
    const { position, renumbered } = dropPosition(col([1, 1], [2, 1 + 1e-9], [3, 2]), 1, 2);
    expect(position).toBe(2);
    expect([...renumbered]).toEqual([
      [1, 1],
      [2, 3],
      [3, 4],
    ]);
  });
});

describe('neighbours (PIPE-15)', () => {
  it('names the cards above and below the dropped card', () => {
    expect(neighbours([1, 9, 2, 3], 1, 9)).toEqual({ before_id: 1, after_id: 2 });
    expect(neighbours([9, 1, 2], 0, 9)).toEqual({ before_id: null, after_id: 1 });
    expect(neighbours([1, 2, 9], 2, 9)).toEqual({ before_id: 2, after_id: null });
    expect(neighbours([9], 0, 9)).toEqual({ before_id: null, after_id: null });
  });
});
