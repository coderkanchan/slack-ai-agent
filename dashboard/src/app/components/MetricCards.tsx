import React from 'react';

interface MetricProps {
  metrics: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    activeVibeScore: number;
  };
}

export const MetricCards: React.FC<MetricProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 transition duration-300 hover:border-slate-700 shadow-lg">
        <h3 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Total Logged Tasks</h3>
        <p className="text-4xl font-extrabold text-slate-100 mt-2 font-mono tracking-tight">{metrics.totalTasks}</p>
      </div>
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 transition duration-300 hover:border-amber-900/40 shadow-lg">
        <h3 className="text-sm font-semibold tracking-wide text-amber-400 uppercase">Pending Review</h3>
        <p className="text-4xl font-extrabold text-amber-400 mt-2 font-mono tracking-tight">{metrics.pendingTasks}</p>
      </div>
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 transition duration-300 hover:border-indigo-900/40 shadow-lg">
        <h3 className="text-sm font-semibold tracking-wide text-indigo-400 uppercase">Completed Actions</h3>
        <p className="text-4xl font-extrabold text-indigo-400 mt-2 font-mono tracking-tight">{metrics.completedTasks}</p>
      </div>
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 transition duration-300 hover:border-emerald-900/40 shadow-lg">
        <h3 className="text-sm font-semibold tracking-wide text-emerald-400 uppercase">Organizational Vibe</h3>
        <p className="text-4xl font-extrabold text-emerald-400 mt-2 font-mono tracking-tight">{metrics.activeVibeScore}%</p>
      </div>
    </div>
  );
};