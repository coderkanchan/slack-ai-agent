'use client';
import React, { useState } from 'react';

interface MetricProps {
  metrics: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    activeVibeScore: number;
  };
}

export const MetricCards: React.FC<MetricProps> = ({ metrics }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const toggleExpand = (cardName: string) => {
    setExpandedCard(expandedCard === cardName ? null : cardName);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div
          onClick={() => toggleExpand('total')}
          className={`bg-slate-900/60 backdrop-blur-md border rounded-xl p-6 transition-all duration-300 cursor-pointer shadow-lg select-none ${expandedCard === 'total' ? 'border-slate-400 bg-slate-900/90' : 'border-slate-800 hover:border-slate-700'
            }`}
        >
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Total Logged Tasks</h3>
            <span className={`text-slate-500 text-xs transition-transform duration-200 ${expandedCard === 'total' ? 'rotate-180 text-slate-200' : ''}`}>▼</span>
          </div>
          <p className="text-4xl font-extrabold text-slate-100 mt-2 font-mono tracking-tight">{metrics.totalTasks}</p>
        </div>

        <div
          onClick={() => toggleExpand('pending')}
          className={`bg-slate-900/60 backdrop-blur-md border rounded-xl p-6 transition-all duration-300 cursor-pointer shadow-lg select-none ${expandedCard === 'pending' ? 'border-amber-500 bg-slate-900/90' : 'border-slate-800 hover:border-amber-900/40'
            }`}
        >
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold tracking-wide text-amber-400 uppercase">Pending Review</h3>
            <span className={`text-amber-500/50 text-xs transition-transform duration-200 ${expandedCard === 'pending' ? 'rotate-180 text-amber-400' : ''}`}>▼</span>
          </div>
          <p className="text-4xl font-extrabold text-amber-400 mt-2 font-mono tracking-tight">{metrics.pendingTasks}</p>
        </div>

        <div
          onClick={() => toggleExpand('completed')}
          className={`bg-slate-900/60 backdrop-blur-md border rounded-xl p-6 transition-all duration-300 cursor-pointer shadow-lg select-none ${expandedCard === 'completed' ? 'border-indigo-500 bg-slate-900/90' : 'border-slate-800 hover:border-indigo-900/40'
            }`}
        >
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold tracking-wide text-indigo-400 uppercase">Completed Actions</h3>
            <span className={`text-indigo-500/50 text-xs transition-transform duration-200 ${expandedCard === 'completed' ? 'rotate-180 text-indigo-400' : ''}`}>▼</span>
          </div>
          <p className="text-4xl font-extrabold text-indigo-400 mt-2 font-mono tracking-tight">{metrics.completedTasks}</p>
        </div>

        <div
          onClick={() => toggleExpand('vibe')}
          className={`bg-slate-900/60 backdrop-blur-md border rounded-xl p-6 transition-all duration-300 cursor-pointer shadow-lg select-none ${expandedCard === 'vibe' ? 'border-emerald-500 bg-slate-900/90' : 'border-slate-800 hover:border-emerald-900/40'
            }`}
        >
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold tracking-wide text-emerald-400 uppercase">Organizational Vibe</h3>
            <span className={`text-emerald-500/50 text-xs transition-transform duration-200 ${expandedCard === 'vibe' ? 'rotate-180 text-emerald-400' : ''}`}>▼</span>
          </div>
          <p className="text-4xl font-extrabold text-emerald-400 mt-2 font-mono tracking-tight">{metrics.activeVibeScore}%</p>
        </div>

      </div>
      
      {expandedCard && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 font-mono text-xs text-slate-400 animate-fadeIn transition-all duration-300 shadow-inner">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              📡 Operational Node Intelligence — {expandedCard} Context
            </span>
            <span className="text-emerald-500 text-[10px] bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40 uppercase animate-pulse">
              Live Stream
            </span>
          </div>

          {expandedCard === 'total' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
              <div>• Cluster Data Ingestion: <span className="text-slate-200">Active</span></div>
              <div>• Indexing Latency: <span className="text-slate-200">&lt; 14ms</span></div>
              <div>• Slack Webhook Handshake: <span className="text-emerald-400">Verbatim Stable</span></div>
              <div>• Buffer Strategy: <span className="text-slate-200">Asynchronous Commit Layer</span></div>
            </div>
          )}

          {expandedCard === 'pending' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
              <div>• High Priority Waitlocks: <span className="text-amber-400">0 Critical Blocks</span></div>
              <div>• Average Age in Queue: <span className="text-slate-200">2.4 Hours</span></div>
              <div>• AI Intervention Intercepts: <span className="text-amber-400">Active Scan</span></div>
              <div>• Unassigned Node Vectors: <span className="text-slate-200">Requires Dispatch</span></div>
            </div>
          )}

          {expandedCard === 'completed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
              <div>• Auto-Resolution Rate: <span className="text-indigo-400">84.2% via Llama Agent</span></div>
              <div>• Average Resolution Velocity: <span className="text-slate-200">18 mins/patch</span></div>
              <div>• Database Verification: <span className="text-emerald-400">Verified & Sealed</span></div>
              <div>• Closed Channels Sync: <span className="text-slate-200">Synced to Slack Workflow</span></div>
            </div>
          )}

          {expandedCard === 'vibe' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
              <div>• Active Sentiment Engine: <span className="text-slate-200">Groq Passive Processing</span></div>
              <div>• Code Friction Level: <span className="text-emerald-400">Minimal Architectural Stress</span></div>
              <div>• Team Sentiment Token: <span className="text-emerald-400">Optimal Vector Workspace</span></div>
              <div>• Evaluation Cycle Threshold: <span className="text-slate-200">Rolling 24h Window</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};