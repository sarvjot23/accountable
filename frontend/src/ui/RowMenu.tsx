import * as Menu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import styles from './RowMenu.module.css';

/** The small Edit / Delete menu at the end of a row or timeline entry (TBL-4, REC-8). */
export function RowMenu({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>
        <button
          type="button"
          className={styles.trigger}
          aria-label={`Actions for ${label}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <MoreHorizontal aria-hidden />
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          className={styles.menu}
          align="end"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
        >
          <Menu.Item className={styles.item} onSelect={onEdit}>
            <Pencil aria-hidden /> Edit
          </Menu.Item>
          <Menu.Item className={`${styles.item} ${styles.danger}`} onSelect={onDelete}>
            <Trash2 aria-hidden /> Delete
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
