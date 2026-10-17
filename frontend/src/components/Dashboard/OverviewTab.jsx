import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import KpiCard from './KpiCard';
import { 
  Users, CheckCircle2, Clock, RotateCcw, ThumbsUp, Activity, ShieldAlert, RefreshCw, Sparkles
} from 'lucide-react';

export default function OverviewTab({ onSwitchTab }) {
  const [metrics, setMetrics] = useState({
    total_conversations: 0,
    resolution_rate_percent: 0,
    pending_approvals_count: 0,
    auto_refund_value_inr: 0,
    total_refund_value_inr: 0,
    csat_score: 0,
    thumbs_up_count: 0,
    thumbs_down_count: 0,
    policy_blocks_count: 0,
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      if (api && api.getAnalytics) {
        const data = await api.getAnalytics();
        if (data) setMetrics((prev) => ({ ...prev, ...data }));
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn("Backend API not reachable, using safe defaults.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  const spark = (base, jitter = 2) => {
    const safeBase = typeof base === 'number' && !isNaN(base) ? base : 0;
    return Array.from({ length: 7 }, () => Math.max(0, safeBase + (Math.random() - 0.5) * jitter));
  };

  const totalConvs = metrics?.total_conversations || 0;
  const resRate = metrics?.resolution_rate_percent || 0;
  const pending = metrics?.pending_approvals_count || 0;
  const autoRefund = metrics?.auto_refund_value_inr || 0;
  const csat = metrics?.csat_score || 0;
  const policyBlocks = metrics?.policy_blocks_count || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Operations & Autonomy Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time customer resolution rate · <span className="text-emerald-600 dark:text-emerald-400 font-medium">Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-500/50 transition w-fit shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh KPIs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <KpiCard
          label="Total Conversations"
          value={totalConvs}
          description="Verified D2C customer sessions"
          icon={Users}
          iconGradient="from-emerald-500 to-teal-500"
          trend={{ direction: 'up', value: 12, suffix: '%' }}
          sparkline={spark(totalConvs, 3)}
        />

        <KpiCard
          label="Resolution Rate"
          value={resRate}
          suffix="%"
          decimals={1}
          description="Resolved without human intervention"
          icon={CheckCircle2}
          iconGradient="from-emerald-500 to-green-500"
          trend={{ direction: 'up', value: 4.2, suffix: '%' }}
          sparkline={spark(resRate, 6)}
        />

        <KpiCard
          label="Pending Approvals"
          value={pending}
          description="Awaiting staff review"
          icon={Clock}
          iconGradient="from-amber-500 to-orange-500"
          trend={{ direction: pending === 0 ? 'flat' : 'up', value: pending, suffix: '' }}
          sparkline={[0, 0, 1, 0, pending, pending, pending]}
          onClick={() => onSwitchTab && onSwitchTab('approvals')}
        />

        <KpiCard
          label="Auto-Refund Value"
          value={autoRefund}
          prefix="₹"
          description={`Total Refunds: ₹${(metrics?.total_refund_value_inr || 0).toLocaleString('en-IN')}`}
          icon={RotateCcw}
          iconGradient="from-teal-500 to-cyan-500"
          sparkline={[1200, 800, 600, 400, 200, 100, autoRefund]}
        />

        <KpiCard
          label="Customer CSAT Score"
          value={csat}
          suffix="%"
          decimals={1}
          description={`👍 ${metrics?.thumbs_up_count || 0} up · 👎 ${metrics?.thumbs_down_count || 0} down`}
          icon={ThumbsUp}
          iconGradient="from-fuchsia-500 to-purple-500"
          trend={{ direction: 'up', value: 3, suffix: '%' }}
          sparkline={spark(csat, 4)}
        />

        <KpiCard
          label="Policy Blocks"
          value={policyBlocks}
          description="Adversarial attempts blocked"
          icon={ShieldAlert}
          iconGradient="from-rose-500 to-red-500"
          trend={{ direction: policyBlocks > 0 ? 'down' : 'flat', value: policyBlocks, suffix: '' }}
          sparkline={[0, 1, 0, 0, 1, 0, policyBlocks]}
          onClick={() => onSwitchTab && onSwitchTab('redteam')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Recent Action Audit Trail
              </h3>
            </div>
            <button
              onClick={() => onSwitchTab('audit')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              View Full Audit Log →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {metrics?.recent_activity && Array.isArray(metrics.recent_activity) && metrics.recent_activity.length > 0 ? (
              metrics.recent_activity.map((act) => (
                <div key={act.id || Math.random()} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {act.tool}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      by {act.actor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      act.result_summary === 'Success' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {act.result_summary}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] tabular-nums">
                      {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                No recent actions recorded yet. Trigger actions via chat or approvals.
              </p>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-6 border border-emerald-800/40 shadow-sm flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-4">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>THE AUTONOMY DIAL</span>
            </div>

            <h3 className="text-base font-bold text-white mb-2 leading-snug">
              Granular Control Over AI Money & Actions
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              For each tool, store admins configure <strong>Auto</strong>, <strong>Needs Approval</strong>, 
              or <strong>Never</strong> with custom limits (₹500 threshold, 30-day refund counts, delivery eligibility).
            </p>
          </div>

          <button
            onClick={() => onSwitchTab('dial')}
            className="relative w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/40 hover:shadow-emerald-500/60"
          >
            Adjust Autonomy Dials →
          </button>
        </div>
      </div>
    </div>
  );
}