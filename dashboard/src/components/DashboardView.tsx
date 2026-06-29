'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { MetricCards } from './MetricCards';
import { TaskRegistry } from './TaskRegistry';
import { AnalyticsCharts } from './AnalyticsCharts';
import { useSocket } from '@/context/SocketContext';
import { dashboardService } from '@/services/api';

interface Task {
  _id: string;
  title: string;
  status: string;
  priority?: string;
  isDeleted?: boolean;
  assignedTo?: string;
}

interface DashboardViewProps {
  data: {
    metrics: {
      totalTasks: number;
      completedTasks: number;
      pendingTasks: number;
      activeVibeScore: number;
    };
    tasks: Task[];
  } | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data: initialData }) => {
  const [liveData, setLiveData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'archive' | 'profile'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    setLiveData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!socket) return;

    socket.on('dashboard_updated', (updatedMatrix: any) => {
      setLiveData(updatedMatrix);
    });

    return () => {
      socket.off('dashboard_updated');
    };
  }, [socket]);

  const refreshMetricsData = async () => {
    try {
      const freshData = await dashboardService.getAnalytics();
      setLiveData(freshData);
    } catch (err) {
      console.error('Failed to pull telemetry updates:', err);
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    setRestoringId(taskId);
    try {
      const response = await dashboardService.resolveTask(taskId, { action: 'PENDING' });
      if (response.success) {
        await refreshMetricsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRestoringId(null);
    }
  };

  const activeTasksArray = liveData?.tasks?.filter((t) =>
    !t.isDeleted && t.status !== 'ARCHIVED' && t.status !== 'DELETE'
  ) || [];

  const liveTotalTasks = activeTasksArray.length;
  const liveCompletedTasks = activeTasksArray.filter((t) => t.status === 'COMPLETED').length;
  const livePendingTasks = liveTotalTasks - liveCompletedTasks;
  const liveVibeScore = liveTotalTasks > 0
    ? Math.round((liveCompletedTasks / liveTotalTasks) * 100)
    : 0;

  const strictLiveMetrics = {
    totalTasks: liveTotalTasks,
    pendingTasks: livePendingTasks,
    completedTasks: liveCompletedTasks,
    activeVibeScore: liveVibeScore
  };

  const archivedTasks = liveData?.tasks?.filter(t => t.status === 'ARCHIVED' || t.status === 'DELETE' || t.isDeleted) || [];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-300">

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        archiveCount={archivedTasks.length}
      />

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 flex justify-between items-center z-50">
        <span className="font-black text-sm tracking-widest text-emerald-400">⚡ VIBEPANEL</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 border border-slate-700 bg-slate-950 rounded text-xs font-mono text-slate-300">
          {isMobileMenuOpen ? '✖ CLOSE' : '☰ MENU'}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-950/95 z-40 p-6 flex flex-col gap-3 font-mono text-xs pt-12">
          <button
            onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }}
            className="p-4 border border-slate-800 rounded bg-slate-900 text-left"
          >
            📊 METRICS OVERVIEW
          </button>
          <button
            onClick={() => { setActiveTab('tasks'); setIsMobileMenuOpen(false); }}
            className="p-4 border border-slate-800 rounded bg-slate-900 text-left"
          >
            📋 SLACK REGISTRY
          </button>
          <button
            onClick={() => { setActiveTab('archive'); setIsMobileMenuOpen(false); }}
            className="p-4 border border-slate-800 rounded bg-slate-900 text-left"
          >
            🗑️ ARCHIVE VAULT ({archivedTasks.length})
          </button>
          <button
            onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
            className="p-4 border border-slate-800 rounded bg-slate-900 text-left"
          >
            👤 SYSTEM OPERATOR
          </button>
        </div>
      )}

      <main className="flex-1 p-6 md:p-8 pt-24 md:pt-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/80 pb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase bg-clip-text text-transparent bg-linear-to-r from-emerald-400 via-teal-400 to-indigo-400">
              {activeTab === 'overview' && 'VibeCheck Enterprise Panel'}
              {activeTab === 'tasks' && 'Slack Integration Terminal'}
              {activeTab === 'archive' && 'Archived State Crypt'}
              {activeTab === 'profile' && 'Operator Credentials Node'}
            </h1>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] font-mono font-black uppercase tracking-wider transition-all duration-300 ${isConnected ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'bg-rose-950/40 border-rose-800/60 text-rose-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-rose-400'}`}></span>
            {isConnected ? 'Telemetry Secure' : 'Matrix Severed'}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <MetricCards
              metrics={strictLiveMetrics}
              tasks={liveData?.tasks || []}
            />
            <AnalyticsCharts
              rawData={{
                metrics: strictLiveMetrics,
                tasks: liveData?.tasks || []
              }}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="animate-fadeIn">
            <TaskRegistry tasks={liveData?.tasks || []} onTaskUpdated={refreshMetricsData} />
          </div>
        )}

        {activeTab === 'archive' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-mono text-sm animate-fadeIn">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-200">Vaulted Crypt Storage</h2>
              <span className="text-[10px] text-rose-400 px-2 py-0.5 rounded border border-rose-950 bg-rose-950/20 font-black">MUTED STATE</span>
            </div>
            <div className="divide-y divide-slate-800">
              {archivedTasks.length > 0 ? (
                archivedTasks.map((task) => (
                  <div key={task._id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-300 font-medium text-xs line-through opacity-60">{task.title}</span>
                    </div>
                    <button onClick={() => handleRestoreTask(task._id)} disabled={restoringId === task._id} className="px-3 py-1.5 border border-emerald-800/80 rounded bg-emerald-950/30 text-emerald-400 text-xs font-black tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all duration-200 uppercase">
                      {restoringId === task._id ? 'Restoring...' : '🔄 Restore Node'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs">Storage clean. No artifacts found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 font-mono text-xs space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-lg bg-linear-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center font-black text-sm text-white">KS</div>
              <div>
                <h3 className="text-sm font-black text-slate-200 tracking-wider">KANCHAN SHARMA</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Role: Core Full Stack Architect</p>
              </div>
            </div>
            <div className="space-y-3 text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/40"><span>SECURITY PRIVILEGE:</span><span className="text-emerald-400 font-bold">LEVEL_5_ROOT</span></div>
              <div className="flex justify-between py-1 border-b border-slate-800/40"><span>PRIMARY ENGINE STACK:</span><span className="text-indigo-400 font-bold">MERN & NEXT.JS</span></div>
              <div className="flex justify-between py-1"><span>ACTIVE STATION NODE:</span><span className="text-slate-200">HISAR_CLUSTER_HARYANA // IN</span></div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};