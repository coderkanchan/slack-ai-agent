'use client';
import React, { useState, useEffect } from 'react';

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

  const [displayCardData, setDisplayCardData] = useState<string | null>(null);

  const toggleExpand = (cardName: string) => {
    setExpandedCard(expandedCard === cardName ? null : cardName);
  };

  
  useEffect(() => {
    if (expandedCard) {
      setDisplayCardData(expandedCard);
    } else {
      const timer = setTimeout(() => {
        setDisplayCardData(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [expandedCard]);

  const cardConfigs = [
    {
      id: 'total',
      title: 'Total Logged Tasks',
      value: metrics.totalTasks,
      colorClass: 'text-slate-100',
      borderHover: 'hover:border-slate-700',
      activeBorder: 'border-slate-400',
      arrowColor: 'text-slate-500',
      details: [
        { label: 'Cluster Data Ingestion', val: 'Active', isSuccess: true },
        { label: 'Indexing Latency', val: '< 14ms', isSuccess: true },
        { label: 'Slack Webhook Handshake', val: 'Verbatim Stable', isSuccess: true },
        { label: 'Buffer Strategy', val: 'Asynchronous Commit Layer', isSuccess: false }
      ]
    },
    {
      id: 'pending',
      title: 'Pending Review',
      value: metrics.pendingTasks,
      colorClass: 'text-amber-400',
      borderHover: 'hover:border-amber-900/40',
      activeBorder: 'border-amber-500',
      arrowColor: 'text-amber-500/50',
      details: [
        { label: 'High Priority Waitlocks', val: '0 Critical Blocks', isSuccess: true },
        { label: 'Average Age in Queue', val: '2.4 Hours', isSuccess: false },
        { label: 'AI Intervention Intercepts', val: 'Active Scan', isSuccess: true },
        { label: 'Unassigned Node Vectors', val: 'Requires Dispatch', isSuccess: false }
      ]
    },
    {
      id: 'completed',
      title: 'Completed Actions',
      value: metrics.completedTasks,
      colorClass: 'text-indigo-400',
      borderHover: 'hover:border-indigo-900/40',
      activeBorder: 'border-indigo-500',
      arrowColor: 'text-indigo-500/50',
      details: [
        { label: 'Auto-Resolution Rate', val: '84.2% via Llama Agent', isSuccess: true },
        { label: 'Average Resolution Velocity', val: '18 mins/patch', isSuccess: false },
        { label: 'Database Verification', val: 'Verified & Sealed', isSuccess: true },
        { label: 'Closed Channels Sync', val: 'Synced to Slack Workflow', isSuccess: false }
      ]
    },
    {
      id: 'vibe',
      title: 'Organizational Vibe',
      value: `${metrics.activeVibeScore}%`,
      colorClass: 'text-emerald-400',
      borderHover: 'hover:border-emerald-900/40',
      activeBorder: 'border-emerald-500',
      arrowColor: 'text-emerald-500/50',
      details: [
        { label: 'Active Sentiment Engine', val: 'Groq Passive Processing', isSuccess: false },
        { label: 'Code Friction Level', val: 'Minimal Architectural Stress', isSuccess: true },
        { label: 'Team Sentiment Token', val: 'Optimal Vector Workspace', isSuccess: true },
        { label: 'Evaluation Cycle Threshold', val: 'Rolling 24h Window', isSuccess: false }
      ]
    }
  ];

  const activeCardData = cardConfigs.find(c => c.id === displayCardData);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cardConfigs.map((card) => {
          const isExpanded = expandedCard === card.id;
          return (
            <div
              key={card.id}
              onClick={() => toggleExpand(card.id)}
              className={`bg-slate-900/60 backdrop-blur-md border rounded-xl p-6 transition-all duration-300 cursor-pointer shadow-lg select-none ${isExpanded ? `${card.activeBorder} bg-slate-900/90 scale-[1.01]` : `${card.borderHover} border-slate-800`
                }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">{card.title}</h3>
                <span className={`text-xs transition-transform duration-300 ${card.arrowColor} ${isExpanded ? 'rotate-180 text-slate-200' : ''}`}>
                  ▼
                </span>
              </div>
              <p className={`text-4xl font-extrabold mt-2 font-mono tracking-tight ${card.colorClass}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedCard ? 'max-h-60 opacity-100 translate-y-0 visible' : 'max-h-0 opacity-0 -translate-y-2 invisible'
          }`}
      >
        {activeCardData && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 font-mono text-xs text-slate-400 shadow-inner">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
              <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                📡 Operational Node Intelligence — {activeCardData.title} Context
              </span>
              <span className="text-emerald-500 text-[10px] bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40 uppercase animate-pulse">
                Live Stream
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
              {activeCardData.details.map((detail, index) => (
                <div key={index}>
                  • {detail.label}:{' '}
                  <span className={detail.isSuccess ? 'text-emerald-400' : 'text-slate-200'}>
                    {detail.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};