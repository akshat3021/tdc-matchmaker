'use client';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ToastItem { id: number; title: string; body?: string; tone: 'success' | 'error' }
interface ToastApi { push: (t: Omit<ToastItem, 'id' | 'tone'> & { tone?: ToastItem['tone'] }) => void }

const ToastContext = createContext<ToastApi>({ push: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback<ToastApi['push']>((t) => {
    const id = Date.now() + Math.random();
    setItems((cur) => [...cur, { id, tone: 'success', ...t }]);
    window.setTimeout(() => setItems((cur) => cur.filter((i) => i.id !== id)), 5200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <strong>{t.title}</strong>
            {t.body && <span>{t.body}</span>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
