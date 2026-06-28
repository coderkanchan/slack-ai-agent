'use client';
import React from 'react';

export const ProfileBadge: React.FC = () => {
  return (
    <div className="border-t border-slate-800/80 pt-4 flex items-center gap-3 font-mono">
      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400">
        KS
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-slate-200 truncate">K. Sharma</span>
        <span className="text-[10px] text-slate-500 truncate">Cluster Admin</span>
      </div>
    </div>
  );
};