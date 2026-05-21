import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastVariant = 'warning' | 'info' | 'success';

export interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

export function useToast(duration = 3500) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'warning') => {
      const id = Date.now() + Math.random();
      setToast({ id, message, variant });
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setToast((prev) => (prev && prev.id === id ? null : prev));
        timeoutRef.current = null;
      }, duration);
    },
    [duration],
  );

  const dismiss = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { toast, showToast, dismiss };
}
