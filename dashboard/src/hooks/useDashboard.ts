import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardData } from '@/services/api';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetryData = useCallback(() => {
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

  useEffect(() => {
    fetchTelemetryData();
  }, [fetchTelemetryData]);

  return { data, loading, error, refreshData: fetchTelemetryData };
}