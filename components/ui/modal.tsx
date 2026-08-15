'use client';

import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/50 backdrop-blur-sm animate-fade-in">
      <div
        className={twMerge(
          clsx(
            'bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-800 w-full max-w-lg overflow-hidden transform transition-all',
            className
          )
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
