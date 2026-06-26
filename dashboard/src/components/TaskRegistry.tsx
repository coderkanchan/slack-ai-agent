'use client';
import React, { useState } from 'react';
import { dashboardService } from '@/services/api';

interface Task {
  _id: string;
  title: string;
  status: string;
  assignedTo?: string;
}

interface RegistryProps {
  tasks: Task[];
}

export const TaskRegistry: React.FC<RegistryProps> = ({ tasks }) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleActionTrigger = async (taskId: string) => {
    setResolvingId(taskId);
    try {
      const response = await dashboardService.resolveTask(taskId);
      if (response.success) {
        console.log(`⚡ Orchestration Matrix: Task ID ${taskId} resolved securely.`);
      }
    } catch (err) {
      console.error('Action pipeline resolution failure:', err);
      alert('Failed to transmit telemetry resolution signal.');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
        <h2 className="text-lg font-bold tracking-wide text-slate-200">Slack Workflow Task Registry</h2>
        <span className="text-xs font-mono text-slate-500">Live Database Buffering</span>
      </div>
      <div className="divide-y divide-slate-800 font-mono text-sm max-h-100 overflow-y-auto">
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task._id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition duration-150">
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-100 font-medium tracking-tight text-sm">{task.title}</span>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>Assignee Node: <span className="text-slate-400">{task.assignedTo || 'Unassigned'}</span></span>
                </div>
              </div>

              {task.status === 'COMPLETED' ? (
                <span className="px-2.5 py-1 rounded text-xs font-black tracking-wider border bg-indigo-950/40 border-indigo-800 text-indigo-400">
                  {task.status}
                </span>
              ) : (
                <button
                  onClick={() => handleActionTrigger(task._id)}
                  disabled={resolvingId === task._id}
                  className={`px-3 py-1.5 rounded text-xs font-black tracking-wider border border-amber-500 text-amber-400 bg-amber-950/20 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400 transition-all duration-200 shadow-md cursor-pointer ${resolvingId === task._id ? 'opacity-50 cursor-wait animate-pulse' : ''
                    }`}
                >
                  {resolvingId === task._id ? 'RESOLVING ENGINE...' : 'MARK RESOLVED'}
                </button>
              )}

            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-500 text-sm">
            No dynamic tasks caught inside cluster nodes. Trigger bot tracking over Slack.
          </div>
        )}
      </div>
    </div>
  );
};