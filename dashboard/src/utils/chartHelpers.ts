import { DashboardData } from '@/services/api';

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export interface BarChartData {
  status: string;
  count: number;
}

export const prepareChartData = (data: DashboardData | null) => {
  const metrics = data?.metrics || { totalTasks: 0, completedTasks: 1, pendingTasks: 0 };

  const pieData: PieChartData[] = [
    { name: 'Pending', value: metrics.pendingTasks, color: '#fbbf24' }, 
    { name: 'Completed', value: metrics.completedTasks, color: '#818cf8' }, 
  ];

  const barData: BarChartData[] = [
    { status: 'Total Logged', count: metrics.totalTasks },
    { status: 'Pending Review', count: metrics.pendingTasks },
    { status: 'Completed', count: metrics.completedTasks },
  ];

  return { pieData, barData };
};