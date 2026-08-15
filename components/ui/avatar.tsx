import React from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
  }[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover border border-surface-200 dark:border-surface-800 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center border border-brand-200 dark:border-brand-800 shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
