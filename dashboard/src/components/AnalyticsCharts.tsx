'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { prepareChartData } from '@/utils/chartHelpers';
import { DashboardData } from '@/services/api';

interface AnalyticsChartsProps {
  rawData: DashboardData | null;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ rawData }) => {
  const { pieData, barData } = prepareChartData(rawData);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

      {/* 📊 Bar Chart Matrix */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-sm font-bold tracking-wide text-slate-400 uppercase mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Task Volume Metrics
        </h3>
        <div className="h-64 w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="status" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🎯 Pie Chart Allocation */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-sm font-bold tracking-wide text-slate-400 uppercase mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Workflow Matrix Breakdown
        </h3>
        <div className="h-64 w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};