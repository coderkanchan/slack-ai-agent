'use client';
import React from 'react';

interface SidebarNavProps {
  activeTab: 'overview' | 'tasks' | 'archive' | 'profile';
  setActiveTab: (tab: 'overview' | 'tasks' | 'archive' | 'profile') => void;
  archiveCount: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, setActiveTab, archiveCount }) => {
  const navItems = [
    { id: 'overview', label: '📊 METRICS OVERVIEW', color: 'emerald' },
    { id: 'tasks', label: '📋 SLACK REGISTRY', color: 'indigo' },
    { id: 'archive', label: `🗑️ ARCHIVE VAULT (${archiveCount})`, color: 'rose' },
    { id: 'profile', label: '👤 SYSTEM OPERATOR', color: 'amber' },
  ] as const;

  return (
    <nav className="space-y-1.5 font-mono text-xs">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        let activeStyles = '';

        if (isActive) {
          if (item.id === 'overview') activeStyles = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold';
          if (item.id === 'tasks') activeStyles = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold';
          if (item.id === 'archive') activeStyles = 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold';
          if (item.id === 'profile') activeStyles = 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold';
        }

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 border ${isActive
                ? activeStyles
                : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
              }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};