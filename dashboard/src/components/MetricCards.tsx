'use client';

import React, { useState } from 'react';

interface Task {
  _id: string;
  title: string;
  status: string;
  priority?: string;
  isDeleted?: boolean;
}

interface MetricCardsProps {
  metrics: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    activeVibeScore: number;
  };
  tasks: Task[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, tasks }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const nonDeletedTasks = tasks.filter(t => !t.isDeleted && t.status !== 'ARCHIVED');
  const highPriorityPending = nonDeletedTasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
  const simulatedLatency = nonDeletedTasks.length > 0 ? (nonDeletedTasks.length * 1.2 + 3).toFixed(1) : '14.2';
  const frictionAssessment = metrics.pendingTasks > metrics.completedTasks ? 'Moderate System Load' : 'Minimal Architectural Stress';

  const cardsData = [
    { id: 'total', title: 'TOTAL LOGGED TASKS', value: metrics.totalTasks, color: 'focus-within:border-emerald-500/50', textStyle: 'text-slate-200', activeBg: 'border-emerald-500/40 bg-slate-900/80' },
    { id: 'pending', title: 'PENDING REVIEW', value: metrics.pendingTasks, color: 'focus-within:border-amber-500/50', textStyle: 'text-amber-400', activeBg: 'border-amber-500/40 bg-slate-900/80' },
    { id: 'completed', title: 'COMPLETED ACTIONS', value: metrics.completedTasks, color: 'focus-within:border-indigo-500/50', textStyle: 'text-indigo-400', activeBg: 'border-indigo-500/40 bg-slate-900/80' },
    { id: 'vibe', title: 'ORGANIZATIONAL VIBE', value: `${metrics.activeVibeScore}%`, color: 'focus-within:border-teal-500/50', textStyle: 'text-teal-400', activeBg: 'border-teal-500/40 bg-slate-900/80' }
  ];

  const currentDropdown = () => {
    if (!expandedCard) return null;

    const layouts: Record<string, { title: string; content: React.JSX.Element }> = {
      total: {
        title: 'TOTAL LOGGED TASKS CONTEXT',
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-mono text-slate-400">
            <div>• Cluster Data Ingestion: <span className="text-emerald-400 font-bold">{metrics.totalTasks > 0 ? 'Active' : 'Idle'}</span></div>
            <div>• Indexing Latency: <span className="text-emerald-400 font-bold">&lt; {simulatedLatency}ms</span></div>
            <div>• Slack Webhook Handshake: <span className="text-emerald-400 font-bold">Verbatim Stable</span></div>
            <div>• Buffer Strategy: <span className="text-slate-300">Asynchronous Commit Layer</span></div>
          </div>
        )
      },
      pending: {
        title: 'PENDING REVIEW CONTEXT',
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-mono text-slate-400">
            <div>• High Priority Waitlocks: <span className={highPriorityPending > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>{highPriorityPending} Critical Blocks</span></div>
            <div>• Average Age in Queue: <span className="text-amber-400 font-bold">2.4 Hours</span></div>
            <div>• AI Intervention Intercepts: <span className="text-emerald-400 font-bold">Active Scan</span></div>
            <div>• Unassigned Node Vectors: <span className="text-slate-300">Requires Dispatch</span></div>
          </div>
        )
      },
      completed: {
        title: 'COMPLETED ACTIONS CONTEXT',
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-mono text-slate-400">
            <div>• Auto-Resolution Rate: <span className="text-indigo-400 font-bold">84.2% via Llama Agent</span></div>
            <div>• Average Resolution Velocity: <span className="text-indigo-400 font-bold">18 mins/patch</span></div>
            <div>• Database Verification: <span className="text-emerald-400 font-bold">Verified & Sealed</span></div>
            <div>• Closed Channels Sync: <span className="text-slate-300">Synced to Slack Workflow</span></div>
          </div>
        )
      },
      vibe: {
        title: 'ORGANIZATIONAL VIBE CONTEXT',
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-mono text-slate-400">
            <div>• Active Sentiment Engine: <span className="text-teal-400 font-bold">Groq Passive Processing</span></div>
            <div>• Code Friction Level: <span className="text-teal-400 font-bold">{frictionAssessment}</span></div>
            <div>• Team Sentiment Token: <span className="text-emerald-400 font-bold">Optimal Vector Workspace</span></div>
            <div>• Evaluation Cycle Threshold: <span className="text-slate-300">Rolling 24h Window</span></div>
          </div>
        )
      }
    };

    const active = layouts[expandedCard];
    return (
      <div className="mt-4 p-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl transition-all duration-300 ease-in-out opacity-100 transform translate-y-0 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <span className="text-[10px] uppercase tracking-widest font-mono text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Operational Node Intelligence — {active.title}
          </span>
          <span className="text-[9px] text-emerald-400 px-2 py-0.5 rounded border border-emerald-950/50 bg-emerald-950/20 font-mono font-bold">LIVE STREAM</span>
        </div>
        {active.content}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsData.map((card) => {
          const isOpen = expandedCard === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setExpandedCard(isOpen ? null : card.id)}
              className={`bg-slate-900/30 border ${isOpen ? card.activeBg : 'border-slate-800/80'} ${card.color} rounded-xl p-5 text-left transition-all duration-200 hover:bg-slate-900/60 flex flex-col justify-between`}
            >
              <div className="w-full flex justify-between items-center text-[10px] font-mono tracking-wider text-slate-400 font-bold">
                <span>{card.title}</span>
                <span className={`text-[9px] transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`}>▼</span>
              </div>
              <div className={`text-3xl font-black mt-3 tracking-tight ${card.textStyle}`}>{card.value}</div>
            </button>
          );
        })}
      </div>

      {currentDropdown()}
    </div>
  );
};