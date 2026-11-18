import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './Sheet.module.css';

/** Open with the focus on the field marked `data-autofocus`, not on the Close button. */
function focusFirstField(event: Event) {
  const field = (event.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-autofocus]');
  if (!field) return;
  event.preventDefault();
  field.focus();
}

/** A side sheet from the right, for forms (TBL-3, FORM-1). */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.sheet} onOpenAutoFocus={focusFirstField}>
          <div className={styles.head}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Close className={styles.close} aria-label="Close">
              <X aria-hidden />
            </Dialog.Close>
          </div>
          {description ? (
            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="visually-hidden">{title}</Dialog.Description>
          )}
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
