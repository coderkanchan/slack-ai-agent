'use client';

import React from 'react';

interface Task {
  _id: string;
  title: string;
  status: string;
  isDeleted?: boolean;
}

interface AnalyticsChartsProps {
  rawData: {
    metrics: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      activeVibeScore: number;
    };
    tasks: Task[];
  } | null;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ rawData }) => {
  const metrics = rawData?.metrics || { totalTasks: 0, completedTasks: 0, pendingTasks: 0, activeVibeScore: 0 };

  const maxTasks = Math.max(metrics.totalTasks, 1);
  const totalHeightPercent = (metrics.totalTasks / maxTasks) * 100;
  const pendingHeightPercent = (metrics.pendingTasks / maxTasks) * 100;
  const completedHeightPercent = (metrics.completedTasks / maxTasks) * 100;

  const completedDeg = (metrics.completedTasks / maxTasks) * 360;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-6 font-mono">
        <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase mb-8 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> TASK VOLUME METRICS
        </h3>

        <div className="h-48 flex items-end justify-around gap-4 border-b border-slate-800 pb-2 px-4">
          <div className="flex flex-col items-center gap-2 w-12 group">
            <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{metrics.totalTasks}</span>
            <div
              style={{ height: `${totalHeightPercent}%` }}
              className="w-full bg-linear-to-t from-emerald-600/20 to-emerald-400 border-t-2 border-emerald-400 rounded-t-sm transition-all duration-500"
            ></div>
            <span className="text-[9px] text-slate-500 text-center truncate w-16 mt-1">Total</span>
          </div>

          <div className="flex flex-col items-center gap-2 w-12 group">
            <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{metrics.pendingTasks}</span>
            <div
              style={{ height: `${pendingHeightPercent}%` }}
              className="w-full bg-linear-to-t from-amber-600/20 to-amber-400 border-t-2 border-amber-400 rounded-t-sm transition-all duration-500"
            ></div>
            <span className="text-[9px] text-slate-500 text-center truncate w-16 mt-1">Pending</span>
          </div>

          <div className="flex flex-col items-center gap-2 w-12 group">
            <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">{metrics.completedTasks}</span>
            <div
              style={{ height: `${completedHeightPercent}%` }}
              className="w-full bg-linear-to-t from-indigo-600/20 to-indigo-400 border-t-2 border-indigo-400 rounded-t-sm transition-all duration-500"
            ></div>
            <span className="text-[9px] text-slate-500 text-center truncate w-16 mt-1">Completed</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-6 font-mono">
        <h3 className="text-xs font-black tracking-wider text-slate-400 uppercase mb-8 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> WORKFLOW MATRIX BREAKDOWN
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-48">
          <div
            style={{
              background: `conic-gradient(#6366f1 0deg ${completedDeg}deg, #f59e0b ${completedDeg}deg 360deg)`
            }}
            className="w-32 h-32 rounded-full flex items-center justify-center relative shadow-lg"
          >
            <div className="w-24 h-24 bg-slate-950 rounded-full flex flex-col items-center justify-center border border-slate-900/60">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ratio</span>
              <span className="text-lg font-black text-slate-200 mt-0.5">{metrics.completedTasks}/{metrics.totalTasks}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-slate-400">Completed Actions:</span>
              <span className="text-indigo-400 font-bold">{metrics.completedTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-400">Pending Operations:</span>
              <span className="text-amber-400 font-bold">{metrics.pendingTasks}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};