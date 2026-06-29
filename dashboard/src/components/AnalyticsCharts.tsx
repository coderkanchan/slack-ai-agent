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

  const totalVal = metrics.totalTasks || 0;
  const pendingVal = metrics.pendingTasks || 0;
  const completedVal = metrics.completedTasks || 0;

  const maxVal = Math.max(totalVal, pendingVal, completedVal, 1);

  const hTotal = `${Math.max((totalVal / maxVal) * 100, 8)}%`;
  const hPending = `${Math.max((pendingVal / maxVal) * 100, 8)}%`;
  const hCompleted = `${Math.max((completedVal / maxVal) * 100, 8)}%`;

  const completedDeg = totalVal > 0 ? (completedVal / totalVal) * 360 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-6 font-mono flex flex-col justify-between">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-8 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> TASK VOLUME METRICS
        </h3>

        <div className="h-44 flex items-end justify-around gap-6 border-b border-slate-800/60 pb-2 px-6">
         
          <div className="flex flex-col items-center gap-2 w-16 h-full justify-end group">
            <span className="text-[10px] text-emerald-400 font-bold transition-all duration-200">{totalVal}</span>
            <div
              style={{ height: hTotal }}
              className="w-full bg-linear-to-t from-emerald-500/10 to-emerald-400/90 border-t border-emerald-400 rounded-t-[3px] transition-all duration-500 min-h-2.5"
            ></div>
            <span className="text-[10px] text-slate-500 mt-1 font-bold">Total</span>
          </div>

          <div className="flex flex-col items-center gap-2 w-16 h-full justify-end group">
            <span className="text-[10px] text-amber-400 font-bold transition-all duration-200">{pendingVal}</span>
            <div
              style={{ height: hPending }}
              className="w-full bg-linear-to-t from-amber-500/10 to-amber-400/90 border-t border-amber-400 rounded-t-[3px] transition-all duration-500 min-h-2.5"
            ></div>
            <span className="text-[10px] text-slate-500 mt-1 font-bold">Pending</span>
          </div>

          <div className="flex flex-col items-center gap-2 w-16 h-full justify-end group">
            <span className="text-[10px] text-indigo-400 font-bold transition-all duration-200">{completedVal}</span>
            <div
              style={{ height: hCompleted }}
              className="w-full bg-gradient-to-t from-indigo-500/10 to-indigo-400/90 border-t border-indigo-400 rounded-t-[3px] transition-all duration-500 min-h-[10px]"
            ></div>
            <span className="text-[10px] text-slate-500 mt-1 font-bold">Completed</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-6 font-mono">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-8 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> WORKFLOW MATRIX BREAKDOWN
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-44">
          <div
            style={{ background: `conic-gradient(#6366f1 0deg ${completedDeg}deg, #f59e0b ${completedDeg}deg 360deg)` }}
            className="w-28 h-28 rounded-full flex items-center justify-center relative shadow-2xl border border-slate-950"
          >
            <div className="w-[86px] h-[86px] bg-slate-950 rounded-full flex flex-col items-center justify-center border border-slate-900/80">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ratio</span>
              <span className="text-sm font-black text-slate-200 mt-0.5">{completedVal}/{totalVal}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-slate-400">Completed Actions:</span>
              <span className="text-indigo-400 font-bold">{completedVal}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-400">Pending Operations:</span>
              <span className="text-amber-400 font-bold">{pendingVal}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};