import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { Check, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cx } from '../lib/cx';
import styles from './Picker.module.css';

export interface PickerOption {
  value: number;
  label: string;
  hint?: string | null;
  /** Options with a group are listed under its heading, groups in the order they first appear. */
  group?: string;
}

/** A searchable select for organizations, contacts and deals (FORM-2). */
export function Picker({
  id,
  value,
  options,
  onChange,
  placeholder,
  noneLabel,
  invalid,
  describedBy,
}: {
  id: string;
  value: number | null | undefined;
  options: PickerOption[];
  onChange: (value: number | null) => void;
  placeholder: string;
  /** If set, the list starts with this option to clear the choice. */
  noneLabel?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const groups = useMemo(() => {
    const map = new Map<string, PickerOption[]>();
    for (const option of options) {
      const key = option.group ?? '';
      map.set(key, [...(map.get(key) ?? []), option]);
    }
    return [...map];
  }, [options]);

  function choose(next: number | null) {
    onChange(next);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cx(styles.trigger, !selected && styles.placeholder)}
        >
          <span className={styles.value}>{selected ? selected.label : placeholder}</span>
          <ChevronDown aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={styles.content} align="start" sideOffset={6}>
          <Command label={placeholder} className={styles.command}>
            <Command.Input className={styles.search} placeholder="Type to search" autoFocus />
            <Command.List className={styles.list}>
              <Command.Empty className={styles.empty}>Nothing matches</Command.Empty>
              {noneLabel && (
                <Command.Item className={styles.item} value={`__none ${noneLabel}`} onSelect={() => choose(null)}>
                  <span className={styles.none}>{noneLabel}</span>
                </Command.Item>
              )}
              {groups.map(([heading, items]) => (
                <Command.Group key={heading} heading={heading || undefined} className={styles.group}>
                  {items.map((option) => (
                    <Command.Item
                      key={option.value}
                      className={styles.item}
                      value={`${option.label} ${option.hint ?? ''} #${option.value}`}
                      onSelect={() => choose(option.value)}
                    >
                      <span>
                        {option.label}
                        {option.hint && <span className={styles.hint}> · {option.hint}</span>}
                      </span>
                      {option.value === value && <Check aria-hidden className={styles.check} />}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
