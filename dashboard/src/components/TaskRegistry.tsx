import React from 'react';

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
              <span className={`px-2.5 py-1 rounded text-xs font-black tracking-wider border ${task.status === 'COMPLETED'
                  ? 'bg-indigo-950/40 border-indigo-800 text-indigo-400'
                  : 'bg-amber-950/40 border-amber-800 text-amber-400'
                }`}>
                {task.status}
              </span>
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