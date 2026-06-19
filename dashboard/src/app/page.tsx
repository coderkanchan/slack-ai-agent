'use client';
import { useEffect, useState } from 'react';
import { MetricCards } from './components/MetricCards';
import { TaskRegistry } from './components/TaskRegistry';

interface DashboardData {
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
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch('http://localhost:5001/api/dashboard/analytics') 
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/dashboard/analytics`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error connecting core telemetry system metrics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-emerald-400 font-mono tracking-widest text-xs animate-pulse">
        ⚡ COUPLING COMPUTE TELEMETRY ENGINES...
      </div>
    );
  }

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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-xs font-black uppercase text-emerald-400 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400 animate-ping"></span>
            Telemetry Pipeline Secure
          </div>
        </div>

        <MetricCards metrics={data?.metrics || { totalTasks: 0, completedTasks: 0, pendingTasks: 0, activeVibeScore: 100 }} />

        <TaskRegistry tasks={data?.tasks || []} />

      </div>
    </main>
  );
}