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
  onTaskUpdated?: () => void;
}

export const TaskRegistry: React.FC<RegistryProps> = ({ tasks, onTaskUpdated }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: newStatus })
      }).then(res => res.json());

      if (response.success) {
        console.log(`⚡ Orchestration Matrix: Task ID ${taskId} synchronized to state [${newStatus}]`);
        if (onTaskUpdated) {
          onTaskUpdated(); 
        }
      }
    } catch (err) {
      console.error('Action pipeline resolution failure:', err);
      alert('Failed to transmit telemetry status transformation signal.');
    } finally {
      setUpdatingId(null);
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

              <div className="relative">
                <select
                  value={task.status}
                  disabled={updatingId === task._id}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  className={`bg-slate-950/80 font-black text-xs tracking-wider border rounded px-3 py-1.5 cursor-pointer outline-none transition-all duration-200 uppercase ${task.status === 'COMPLETED'
                    ? 'border-indigo-800 text-indigo-400 bg-indigo-950/20'
                    : 'border-amber-500 text-amber-400 bg-amber-950/20 hover:border-emerald-400 hover:text-emerald-400'
                    } ${updatingId === task._id ? 'opacity-50 cursor-wait animate-pulse' : ''}`}
                >
                  <option value="PENDING" className="bg-slate-950 text-amber-400">PENDING</option>
                  <option value="COMPLETED" className="bg-slate-950 text-indigo-400">COMPLETED</option>
                  <option value="DELETE" className="bg-slate-950 text-rose-500 font-bold">🗑️ ARCHIVE TASK</option>
                </select>
              </div>

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