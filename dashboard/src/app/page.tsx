import { dashboardService } from '@/services/api';
import { DashboardView } from '../components/DashboardView';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let data = null;
  let error = false;

  try {
    data = await dashboardService.getAnalytics();
  } catch (err) {
    console.error('Server-side telemetry validation exception:', err);
    error = true;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-rose-400 font-mono text-xs">
        ❌ CRITICAL_ERROR: FAIL_TO_SYNC_TELEMETRY_PIPELINE
      </div>
    );
  }

  return <DashboardView data={data} />;
}