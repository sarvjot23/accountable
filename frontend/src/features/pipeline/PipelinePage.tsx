import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, refreshAll } from '../../lib/api';
import { cx } from '../../lib/cx';
import { money, plural, todayIso } from '../../lib/format';
import { STAGES, stage as stageOf, type StageKey } from '../../lib/stages';
import { Button } from '../../ui/Button';
import { Chips } from '../../ui/Chips';
import { PageHeader } from '../../ui/PageHeader';
import { PageState } from '../../ui/PageState';
import { useToast } from '../../ui/Toast';
import { moveDeal, useDeals, type Deal } from '../deals/api';
import { DealSheet } from '../deals/DealForm';
import { applyMove, boardTotals, sortClosed, toColumns, type Columns } from './boardTotals';
import { Column } from './Column';
import { CardBody } from './DealCard';
import styles from './Pipeline.module.css';
import { neighbours } from './positions';

/**
 * The board's state: columns of cards, shown at once when a card moves and saved with
 * one `move` call; if the save fails, the card goes back and a message explains (PIPE-11, PIPE-12).
 */
export function useBoard(deals: Deal[] | undefined) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const today = todayIso();
  const [columns, setColumns] = useState<Columns>(() => toColumns(deals ?? [], today));
  const busy = useRef(false);

  useEffect(() => {
    if (deals && !busy.current) setColumns(toColumns(deals, today));
  }, [deals, today]);

  const hold = useCallback(() => {
    busy.current = true;
  }, []);

  /** Show `next` now and save the move of `id`; on failure go back to `before`. */
  const commit = useCallback(
    async (id: number, before: Columns, next: Columns) => {
      const to = (Object.keys(next) as StageKey[]).find((key) => next[key].some((d) => d.id === id))!;
      busy.current = true;
      setColumns(next);
      const column = next[to].map((d) => d.id);
      const index = column.indexOf(id);
      const move = stageOf(to).open ? neighbours(column, index, id) : { before_id: null, after_id: null };
      try {
        await moveDeal(id, { stage: to, ...move });
        busy.current = false;
        await refreshAll(queryClient);
      } catch (error) {
        busy.current = false;
        setColumns(before);
        toast(`That move wasn't saved, so the card went back. ${errorMessage(error)}`, 'error');
      }
    },
    [queryClient, toast],
  );

  const release = useCallback((before: Columns) => {
    busy.current = false;
    setColumns(before);
  }, []);

  return { columns, setColumns, commit, hold, release, today };
}

/**
 * PIPE-10: Left and Right move a picked-up card to the next column; Up and Down move it
 * within its column. (The default getter can pick a card in the same column for Left and
 * Right, because the lifted card is tilted.)
 */
const boardKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  if (event.code !== 'ArrowLeft' && event.code !== 'ArrowRight') return sortableKeyboardCoordinates(event, args);
  const { collisionRect, droppableRects, droppableContainers } = args.context;
  if (!collisionRect) return undefined;
  const columns = droppableContainers
    .getEnabled()
    .filter((c) => typeof c.id === 'string')
    .map((c) => ({ id: c.id, rect: droppableRects.get(c.id) }))
    .filter((c): c is { id: UniqueIdentifier; rect: NonNullable<typeof c.rect> } => Boolean(c.rect))
    .sort((a, b) => a.rect.left - b.rect.left);
  const center = collisionRect.left + collisionRect.width / 2;
  const distance = (c: (typeof columns)[number]) => Math.abs(c.rect.left + c.rect.width / 2 - center);
  const current = columns.reduce((best, c, i) => (distance(c) < distance(columns[best]!) ? i : best), 0);
  const target = columns[current + (event.code === 'ArrowRight' ? 1 : -1)];
  if (!target) return undefined;
  event.preventDefault();
  return { x: target.rect.left + (target.rect.width - collisionRect.width) / 2, y: target.rect.top };
};

type View = 'open' | 'all';

export function PipelinePage() {
  const query = useDeals();
  const { columns, setColumns, commit, hold, release, today } = useBoard(query.data);
  const [view, setView] = useState<View>('all');
  const [adding, setAdding] = useState<StageKey | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const snapshot = useRef<Columns | null>(null);
  const totals = boardTotals(columns);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: boardKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const stages = STAGES.filter((s) => view === 'all' || s.open);
  const containerOf = (id: UniqueIdentifier): StageKey | undefined => {
    if (typeof id === 'string' && id in columns) return id as StageKey;
    return (Object.keys(columns) as StageKey[]).find((key) => columns[key].some((d) => d.id === id));
  };
  const activeDeal =
    activeId === null
      ? null
      : Object.values(columns)
          .flat()
          .find((d) => d.id === activeId);
  const dealName = (id: UniqueIdentifier) =>
    Object.values(columns)
      .flat()
      .find((d) => d.id === id)?.name ?? 'The card';
  const placeName = (id: UniqueIdentifier) => {
    const key = containerOf(id);
    return key ? stageOf(key).label : 'the board';
  };

  function onDragStart({ active }: DragStartEvent) {
    snapshot.current = columns;
    hold();
    setActiveId(active.id);
  }

  // Moving into another column shows the card there at once, with the new stage's figures.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = containerOf(active.id);
    const to = containerOf(over.id);
    if (!from || !to || from === to) return;
    setColumns((prev) => {
      const moving = prev[from].find((d) => d.id === active.id);
      if (!moving) return prev;
      const target = prev[to];
      const overIndex = target.findIndex((d) => d.id === over.id);
      const below =
        over.rect &&
        active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
      const index = overIndex >= 0 ? overIndex + (below ? 1 : 0) : target.length;
      const moved = applyMove(moving, to, today);
      return {
        ...prev,
        [from]: prev[from].filter((d) => d.id !== active.id),
        [to]: [...target.slice(0, index), moved, ...target.slice(index)],
      };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const before = snapshot.current ?? columns;
    snapshot.current = null;
    const to = over ? containerOf(over.id) : undefined;
    if (!to) {
      release(before);
      return;
    }
    let items = columns[to];
    const from = items.findIndex((d) => d.id === active.id);
    const overIndex = items.findIndex((d) => d.id === over!.id);
    if (from >= 0 && overIndex >= 0 && from !== overIndex) items = arrayMove(items, from, overIndex);
    if (!stageOf(to).open) items = sortClosed(items);
    const next = { ...columns, [to]: items };
    const id = Number(active.id);
    const fromStage = (Object.keys(before) as StageKey[]).find((key) => before[key].some((d) => d.id === id));
    const unchanged = fromStage === to && before[to].map((d) => d.id).join() === next[to].map((d) => d.id).join();
    if (unchanged) {
      release(before);
      return;
    }
    void commit(id, before, next);
  }

  return (
    <>
      <PageHeader
        title="Pipeline"
        summary={
          <span data-testid="pipeline-summary">
            <b>{money(totals.value)}</b> open across {plural(totals.count, 'deal')} · <b>{money(totals.expected)}</b>{' '}
            expected
          </span>
        }
        actions={
          <>
            <Chips
              label="Columns"
              value={view}
              onChange={setView}
              options={[
                { value: 'open', label: 'Open only' },
                { value: 'all', label: 'All stages' },
              ]}
            />
            <Button variant="primary" onClick={() => setAdding('new')}>
              <Plus aria-hidden /> Add deal
            </Button>
          </>
        }
      />
      <PageState query={query}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => {
            setActiveId(null);
            release(snapshot.current ?? columns);
            snapshot.current = null;
          }}
          accessibility={{
            announcements: {
              onDragStart: ({ active }) => `Picked up ${dealName(active.id)}.`,
              onDragOver: ({ active, over }) =>
                over
                  ? `${dealName(active.id)} is over ${placeName(over.id)}.`
                  : `${dealName(active.id)} is not over a column.`,
              onDragEnd: ({ active, over }) =>
                over ? `${dealName(active.id)} dropped in ${placeName(over.id)}.` : `${dealName(active.id)} put back.`,
              onDragCancel: ({ active }) => `Move cancelled. ${dealName(active.id)} put back.`,
            },
            screenReaderInstructions: {
              draggable:
                'Press Space to pick up a card, the arrow keys to move it, Space again to drop it, or Escape to cancel.',
            },
          }}
        >
          <div className={cx(styles.board, view === 'open' && styles.openOnly)}>
            {stages.map((s) => (
              <Column key={s.key} stageKey={s.key} deals={columns[s.key]} onAdd={setAdding} />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
            {activeDeal ? (
              <div className={cx(styles.card, styles.lifted, activeDeal.is_late && styles.late)}>
                <CardBody deal={activeDeal} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </PageState>
      <DealSheet
        open={adding !== null}
        onOpenChange={(open) => !open && setAdding(null)}
        preset={adding ? { stage: adding } : undefined}
      />
    </>
  );
}
