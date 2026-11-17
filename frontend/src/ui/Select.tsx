import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: ReactNode;
}

/** A select built on Radix (APP-10), styled like the other fields. */
export function Select({
  id,
  value,
  onChange,
  options,
  label,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  invalid?: boolean;
}) {
  return (
    <RadixSelect.Root value={value} onValueChange={onChange}>
      <RadixSelect.Trigger id={id} className={styles.trigger} aria-label={label} aria-invalid={invalid || undefined}>
        <RadixSelect.Value />
        <RadixSelect.Icon>
          <ChevronDown aria-hidden />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className={styles.content} position="popper" sideOffset={6}>
          <RadixSelect.Viewport className={styles.viewport}>
            {options.map((option) => (
              <RadixSelect.Item key={option.value} value={option.value} className={styles.item}>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check aria-hidden className={styles.check} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
