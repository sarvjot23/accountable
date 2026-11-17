import type { ComponentProps } from 'react';
import { cx } from '../lib/cx';
import styles from './Button.module.css';

type Variant = 'primary' | 'dark' | 'light' | 'danger' | 'ghost';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: 'normal' | 'small';
}

/** A pill-shaped button (LOOK-2). Primary is Sea Green with Midnight text (LOOK-3). */
export function Button({ variant = 'light', size = 'normal', className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], size === 'small' && styles.small, className)}
      {...rest}
    />
  );
}

/** The same look for a link styled as a button. */
export function buttonClass(variant: Variant = 'light', size: 'normal' | 'small' = 'normal') {
  return cx(styles.button, styles[variant], size === 'small' && styles.small);
}
