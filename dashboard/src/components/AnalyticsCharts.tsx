'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

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

  // 1. Data Structuring for Bar Chart
  const barChartData = [
    { name: 'Total', Count: metrics.totalTasks, fill: 'url(#totalGrad)' },
    { name: 'Pending', Count: metrics.pendingTasks, fill: 'url(#pendingGrad)' },
    { name: 'Completed', Count: metrics.completedTasks, fill: 'url(#completedGrad)' },
  ];

  // 2. Data Structuring for Pie Chart
  const pieChartData = [
    { name: 'Completed Actions', value: metrics.completedTasks, color: '#6366f1' },
    { name: 'Pending Operations', value: metrics.pendingTasks, color: '#f59e0b' },
  ];

  // Fallback state logic check if no records available
  const hasNoData = metrics.totalTasks === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* CARD 1: BAR CHART (TASK VOLUME METRICS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 font-mono flex flex-col justify-between shadow-xl">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
          TASK VOLUME METRICS
        </h3>

        <div className="h-56 w-full flex items-center justify-center">
          {hasNoData ? (
            <span className="text-xs text-slate-500">No core metrics logged to plot grid.</span>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.2 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="Count" radius={[4, 4, 0, 0]} barSize={40}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#6366f1'} strokeWidth={1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* CARD 2: PIE CHART (WORKFLOW MATRIX BREAKDOWN) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 font-mono shadow-xl">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
          WORKFLOW MATRIX BREAKDOWN
        </h3>

        <div className="h-56 w-full flex items-center justify-center">
          {hasNoData ? (
            <span className="text-xs text-slate-500">No operational records ready in memory stream.</span>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value, entry: any) => (
                    <span className="text-[11px] text-slate-400 font-bold tracking-tight uppercase">
                      {value}: <span className="text-slate-200 ml-1">{entry.payload.value}</span>
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};