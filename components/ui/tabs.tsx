'use client';

import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTabId, onChange, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTabId || (tabs[0] ? tabs[0].id : ''));

  const handleSelect = (id: string) => {
    setActiveTab(id);
    if (onChange) onChange(id);
  };

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-b border-surface-200 dark:border-surface-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-surface-500 hover:text-surface-900 dark:hover:text-surface-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-mono ${
                    isActive
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                      : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div>{currentTab?.content}</div>
    </div>
  );
}
