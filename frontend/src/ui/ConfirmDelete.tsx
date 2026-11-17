import * as Dialog from '@radix-ui/react-dialog';
import { useRef, useState } from 'react';
import { errorMessage } from '../lib/api';
import { Button } from './Button';
import styles from './ConfirmDelete.module.css';

/**
 * The delete dialog (DEL-1): the record's name, what happens to linked records, and
 * Cancel (focused first) and Delete (Raspberry).
 */
export function ConfirmDelete({
  open,
  onOpenChange,
  name,
  consequences,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  /** What will happen to linked records; undefined while it's being worked out. */
  consequences: string | undefined;
  onConfirm: () => Promise<unknown>;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.dialog}
          role="alertdialog"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancel.current?.focus();
          }}
        >
          <Dialog.Title className={styles.title}>Delete {name}?</Dialog.Title>
          <Dialog.Description className={styles.text}>
            {consequences ?? 'Checking what else this affects…'}
          </Dialog.Description>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.buttons}>
            <Dialog.Close asChild>
              <Button ref={cancel} variant="light" className={styles.cancel}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button variant="danger" onClick={confirm} disabled={pending || consequences === undefined}>
              {pending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
