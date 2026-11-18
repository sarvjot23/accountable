import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import styles from './DataTable.module.css';
import { RowMenu } from './RowMenu';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Right-align numbers. */
    numeric?: boolean;
  }
}

/** Search across the text columns, as you type (TBL-1). */
const containsText: FilterFn<unknown> = (row, columnId, search: string) => {
  const value = row.getValue(columnId);
  return typeof value === 'string' && value.toLowerCase().includes(search.trim().toLowerCase());
};

/**
 * The shared table (TBL-1 to TBL-7): data is loaded once by the page, then searched and
 * sorted here in the browser. Click a heading to sort, again to reverse; click a row to
 * open it; Edit and Delete sit in a menu at the end of each row.
 */
export function DataTable<T>({
  data,
  columns,
  searchLabel,
  rowLabel,
  onOpen,
  onEdit,
  onDelete,
  toolbar,
  empty,
  initialSort = [],
}: {
  data: T[];
  columns: ColumnDef<T, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  searchLabel: string;
  rowLabel: (row: T) => string;
  onOpen: (row: T) => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  toolbar?: ReactNode;
  /** Shown when there's no data at all (TBL-7). */
  empty: ReactNode;
  initialSort?: SortingState;
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSort);
  const [search, setSearch] = useState('');
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    globalFilterFn: containsText as FilterFn<T>,
    getColumnCanGlobalFilter: () => true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const rows = table.getRowModel().rows;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search aria-hidden />
          <span className="visually-hidden">{searchLabel}</span>
          <input type="search" placeholder={searchLabel} value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        {toolbar}
      </div>
      <div className={styles.panel}>
        {data.length === 0 ? (
          empty
        ) : (
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const numeric = header.column.columnDef.meta?.numeric;
                    return (
                      <th
                        key={header.id}
                        className={cx(numeric && styles.numeric)}
                        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                      >
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            className={styles.sort}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' && <ArrowUp aria-hidden />}
                            {sorted === 'desc' && <ArrowDown aria-hidden />}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                  <th>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={styles.row} onClick={() => onOpen(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cx(cell.column.columnDef.meta?.numeric && styles.numeric)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className={styles.menu}>
                    <RowMenu
                      label={rowLabel(row.original)}
                      onEdit={() => onEdit(row.original)}
                      onDelete={() => onDelete(row.original)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data.length > 0 && rows.length === 0 && (
          <p className={styles.noMatch} role="status">
            Nothing matches “{search}”. Try another search.
          </p>
        )}
      </div>
    </div>
  );
}
