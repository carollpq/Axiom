'use client';

import {
  createContext,
  use,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { ReactNode } from 'react';

type ToastVariant = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(
  null as ToastContextValue | null,
);

export function useToast() {
  const ctx = use(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const variantStyles: Record<
  ToastVariant,
  { bg: string; border: string; color: string }
> = {
  success: {
    bg: 'rgba(120,180,120,0.15)',
    border: '1px solid rgba(120,180,120,0.4)',
    color: '#8fbc8f',
  },
  error: {
    bg: 'rgba(200,100,90,0.15)',
    border: '1px solid rgba(200,100,90,0.4)',
    color: '#d4645a',
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: number) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onRemove]);

  const s = variantStyles[toast.variant];
  return (
    <div
      className="px-4 py-3 rounded text-[13px] font-serif shadow-lg"
      style={{ background: s.bg, border: s.border, color: s.color }}
    >
      {toast.message}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
