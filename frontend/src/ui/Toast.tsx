import * as RadixToast from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cx } from '../lib/cx';
import styles from './Toast.module.css';

type Tone = 'info' | 'error';
type ShowToast = (message: string, tone?: Tone) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** Short toasts such as "Deal saved" (FORM-5), and messages when something fails. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; tone: Tone }>>([]);
  const show = useCallback<ShowToast>((message, tone = 'info') => {
    setToasts((current) => [...current, { id: Date.now() + Math.random(), message, tone }]);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      <RadixToast.Provider swipeDirection="right" duration={4000} label="Notification">
        {children}
        {toasts.map((toast) => (
          <RadixToast.Root
            key={toast.id}
            className={cx(styles.toast, toast.tone === 'error' && styles.error)}
            type={toast.tone === 'error' ? 'foreground' : 'background'}
            onOpenChange={(open) => {
              if (!open) setToasts((current) => current.filter((t) => t.id !== toast.id));
            }}
          >
            <RadixToast.Title>{toast.message}</RadixToast.Title>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className={styles.viewport} />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
