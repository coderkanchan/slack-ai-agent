const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface DashboardData {
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

export const dashboardService = {

  getAnalytics: async (): Promise<DashboardData> => {

    const response = await fetch(`${API_BASE_URL}/api/dashboard/analytics`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    if (data.hasOwnProperty('success') && !data.success) {
      throw new Error(data.message || 'Failed to fetch metrics');
    }

    return data.data ? data.data : data;
  },

  resolveTask: async (taskId: string, payload: { action: string }): Promise<{ success: boolean; message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/resolve/${taskId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to synchronize status alteration over telemetry stream');
    }

    return response.json();
  }
};