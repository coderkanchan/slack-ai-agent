import { useState, useEffect } from 'react';
import { dashboardService, DashboardData } from '@/services/api';

export function useDashboard() {
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService.getAnalytics()
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Core telemetry exception:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}