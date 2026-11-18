import type { ComponentProps, ReactNode } from 'react';
import { cx } from '../lib/cx';
import styles from './Field.module.css';

/** A labelled form field with its inline message in plain words (FORM-1). */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className={styles.error} id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : (
        hint && <p className={styles.hint}>{hint}</p>
      )}
    </div>
  );
}

export function TextInput({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={cx(styles.input, className)} {...rest} />;
}

export function TextArea({ className, ...rest }: ComponentProps<'textarea'>) {
  return <textarea className={cx(styles.input, styles.textarea, className)} {...rest} />;
}

export function SelectInput({ className, ...rest }: ComponentProps<'select'>) {
  return <select className={cx(styles.input, styles.select, className)} {...rest} />;
}

/** An input with a fixed prefix, such as "US$" for money (FORM-4). */
export function PrefixInput({ prefix, className, ...rest }: ComponentProps<'input'> & { prefix: string }) {
  return (
    <div className={cx(styles.prefixed, className)}>
      <span className={styles.prefix} aria-hidden>
        {prefix}
      </span>
      <input className={cx(styles.input, styles.withPrefix)} {...rest} />
    </div>
  );
}

/** The form's footer: Save and Cancel, Save disabled while saving (FORM-1). */
export function FormButtons({
  saving,
  onCancel,
  saveLabel = 'Save',
}: {
  saving: boolean;
  onCancel: () => void;
  saveLabel?: string;
}) {
  return (
    <div className={styles.buttons}>
      <button type="button" className={styles.cancel} onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className={styles.save} disabled={saving}>
        {saving ? 'Saving…' : saveLabel}
      </button>
    </div>
  );
}

export const formStyles = styles;
