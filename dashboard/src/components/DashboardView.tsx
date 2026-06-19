'use client'; 

import React, { useEffect, useState } from 'react';
import { MetricCards } from './MetricCards';
import { TaskRegistry } from './TaskRegistry';
import { AnalyticsCharts } from './AnalyticsCharts';
import { useSocket } from '@/context/SocketContext'; 

interface DashboardViewProps {
  data: {
    metrics: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      activeVibeScore: number;
    };
    tasks: Array<{
      _id: string;
      title: string;
      status: string;
      assignedTo?: string;
    }>;
  } | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data: initialData }) => {
  const [liveData, setLiveData] = useState(initialData);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    setLiveData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!socket) return;

    socket.on('dashboard_updated', (updatedMatrix: any) => {
      console.log('🔄 Telemetry Stream Synced: Refreshing Dashboard State Live');
      setLiveData(updatedMatrix);
    });

    return () => {
      socket.off('dashboard_updated');
    };
  }, [socket]);

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100 p-8 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      <div className="max-w-7xl w-full mx-auto space-y-8">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-linear-to-r from-emerald-400 via-teal-400 to-indigo-400">
              VibeCheck Enterprise Panel
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              Synchronized Orchestration Matrix Node Framework logs.
            </p>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-black uppercase tracking-wider transition-all duration-300 ${isConnected
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full shadow-lg transition-all duration-300 ${isConnected ? 'bg-emerald-400 shadow-emerald-400 animate-ping' : 'bg-rose-400 shadow-rose-400'
              }`}></span>
            {isConnected ? 'Telemetry Pipeline Secure' : 'Matrix Stream Severed'}
          </div>
        </div>

        <MetricCards metrics={liveData?.metrics || { totalTasks: 0, completedTasks: 0, pendingTasks: 0, activeVibeScore: 100 }} />

        <AnalyticsCharts rawData={liveData} />

        <TaskRegistry tasks={liveData?.tasks || []} />

      </div>
    </main>
  );
};