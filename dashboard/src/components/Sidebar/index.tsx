'use client';
import React from 'react';
import { SidebarNav } from './SidebarNav';
import { ProfileBadge } from './ProfileBadge';

interface SidebarProps {
  activeTab: 'overview' | 'tasks' | 'archive' | 'profile';
  setActiveTab: (tab: 'overview' | 'tasks' | 'archive' | 'profile') => void;
  archiveCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, archiveCount }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900/60 border-r border-slate-800/80 backdrop-blur-md p-6 justify-between shrink-0 h-screen sticky top-0">
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-black text-xl tracking-wider uppercase">
            <span>⚡ VibePanel</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">v2.4.0 // ARCHITECTURE SECURE</p>
        </div>

        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          archiveCount={archiveCount}
        />
      </div>

      <ProfileBadge />
    </aside>
  );
};