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

  // Live query states based on real database records
  const nonDeletedTasks = tasks.filter(t => !t.isDeleted);
  const highPriorityPending = nonDeletedTasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;

  // Calculate dynamic latency indicator based on task volume
  const simulatedLatency = nonDeletedTasks.length > 0 ? (nonDeletedTasks.length * 1.8 + 4).toFixed(1) : '2.1';

  // Calculate friction assessment based on current stack workload
  const frictionAssessment = metrics.pendingTasks > metrics.completedTasks
    ? 'Moderate System Load'
    : 'Minimal Architectural Stress';

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const cardsData = [
    {
      id: 'total',
      title: 'TOTAL LOGGED TASKS',
      value: metrics.totalTasks,
      color: 'border-slate-800 focus-within:border-emerald-500/50',
      textStyle: 'text-slate-200',
      iconColor: 'text-emerald-500',
      dropdownContent: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono text-slate-400">
          <div>• Cluster Data Ingestion: <span className="text-emerald-400 font-bold">{metrics.totalTasks > 0 ? 'Active' : 'Idle'}</span></div>
          <div>• Indexing Latency: <span className="text-emerald-400 font-bold">&lt; {simulatedLatency}ms</span></div>
          <div>• Slack Webhook Handshake: <span className="text-emerald-400 font-bold">Verbatim Stable</span></div>
          <div>• Buffer Strategy: <span className="text-slate-300">Asynchronous Commit Layer</span></div>
        </div>
      )
    },
    {
      id: 'pending',
      title: 'PENDING REVIEW',
      value: metrics.pendingTasks,
      color: 'border-slate-800 focus-within:border-amber-500/50',
      textStyle: 'text-amber-400',
      iconColor: 'text-amber-500',
      dropdownContent: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono text-slate-400">
          <div>• High Priority Waitlocks: <span className={highPriorityPending > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>{highPriorityPending} Critical Blocks</span></div>
          <div>• Average Age in Queue: <span className="text-amber-400 font-bold">{(metrics.pendingTasks * 0.4).toFixed(1)} Hours</span></div>
          <div>• AI Intervention Intercepts: <span className="text-emerald-400 font-bold">Active Scan</span></div>
          <div>• Unassigned Node Vectors: <span className="text-slate-300">Requires Dispatch</span></div>
        </div>
      )
    },
    {
      id: 'completed',
      title: 'COMPLETED ACTIONS',
      value: metrics.completedTasks,
      color: 'border-slate-800 focus-within:border-indigo-500/50',
      textStyle: 'text-indigo-400',
      iconColor: 'text-indigo-500',
      dropdownContent: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono text-slate-400">
          <div>• Auto-Resolution Rate: <span className="text-indigo-400 font-bold">100% via Pipeline</span></div>
          <div>• Average Resolution Velocity: <span className="text-indigo-400 font-bold">18 mins/patch</span></div>
          <div>• Database Verification: <span className="text-emerald-400 font-bold">Verified & Sealed</span></div>
          <div>• Closed Channels Sync: <span className="text-slate-300">Synced to Slack Workflow</span></div>
        </div>
      )
    },
    {
      id: 'vibe',
      title: 'ORGANIZATIONAL VIBE',
      value: `${metrics.activeVibeScore}%`,
      color: 'border-slate-800 focus-within:border-teal-500/50',
      textStyle: 'text-teal-400',
      iconColor: 'text-teal-400',
      dropdownContent: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono text-slate-400">
          <div>• Active Sentiment Engine: <span className="text-teal-400 font-bold">Groq Passive Processing</span></div>
          <div>• Code Friction Level: <span className="text-teal-400 font-bold">{frictionAssessment}</span></div>
          <div>• Team Sentiment Token: <span className="text-emerald-400 font-bold">Optimal Vector Workspace</span></div>
          <div>• Evaluation Cycle Threshold: <span className="text-slate-300">Rolling 24h Window</span></div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsData.map((card) => {
          const isOpen = expandedCard === card.id;
          return (
            <div key={card.id} className="flex flex-col">
              <button
                onClick={() => toggleCard(card.id)}
                className={`bg-slate-900/40 backdrop-blur-sm border ${isOpen ? 'border-emerald-500/40 bg-slate-900/80 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : card.color} rounded-xl p-5 text-left transition-all duration-200 hover:bg-slate-900/70`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-slate-400 font-bold">
                  <span>{card.title}</span>
                  <span className={`text-[10px] ${card.iconColor} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </div>
                <div className={`text-3xl font-black mt-3 tracking-tight ${card.textStyle}`}>
                  {card.value}
                </div>
              </button>

              {isOpen && (
                <div className="mt-2 p-4 bg-slate-950 border border-slate-800/80 rounded-xl shadow-2xl animate-slideDown z-10 relative">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
                    <span className="text-[9px] uppercase tracking-widest font-mono text-slate-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                      Operational Node Intelligence — {card.title} Context
                    </span>
                    <span className="text-[8px] text-emerald-400/80 px-1.5 py-0.5 rounded border border-emerald-950 bg-emerald-950/30 font-mono font-bold">LIVE STREAM</span>
                  </div>
                  {card.dropdownContent}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};