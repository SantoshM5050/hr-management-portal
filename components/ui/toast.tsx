'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ type, title, description }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 text-xs bg-white dark:bg-surface-900 transition-all ${
              t.type === 'success'
                ? 'border-emerald-500 text-emerald-900 dark:text-emerald-100'
                : t.type === 'error'
                ? 'border-red-500 text-red-900 dark:text-red-100'
                : 'border-blue-500 text-blue-900 dark:text-blue-100'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
            <div className="flex-1 space-y-0.5">
              <p className="font-bold">{t.title}</p>
              {t.description && <p className="text-surface-500">{t.description}</p>}
            </div>
            <button onClick={() => removeToast(t.id)} className="text-surface-400 hover:text-surface-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: (msg: any) => console.log('Toast:', msg),
    };
  }
  return context;
}
