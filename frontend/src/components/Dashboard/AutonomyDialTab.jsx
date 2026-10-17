import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  History, Lock, Check, Ban, Clock, Layers, Save, Sparkles
} from 'lucide-react';

const TOOL_DESCRIPTIONS = {
  issue_refund: "Issues customer refunds up to configured paise threshold and evaluates 30-day customer frequency.",
  cancel_order: "Cancels orders prior to fulfillment dispatch. Blocks cancellation on in-transit or delivered orders.",
  reschedule_delivery: "Allows customer to choose alternative delivery date and 3-hour time slot window.",
  update_address: "Changes shipping destination address with automatic pre-dispatch validation and 1-click undo.",
  get_order_status: "Fetches live order and courier tracking info with 60-second Redis cache-aside.",
  list_orders: "Returns verified order history associated with customer's verified phone number.",
  escalate: "Transfers customer query directly to priority human agent support queue."
};

export default function AutonomyDialTab() {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTool, setSavingTool] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRules();
      setRules(data);
    } catch (err) {
      addToast(err.message || 'Failed to load autonomy rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleModeChange = (toolName, newMode) => {
    if (!isAdmin) {
      addToast('Only Store Administrators can modify autonomy rules.', 'warning');
      return;
    }
    setRules(prev => prev.map(r => r.tool === toolName ? { ...r, mode: newMode } : r));
  };

  const handleConditionChange = (toolName, key, value) => {
    if (!isAdmin) {
      addToast('Only Store Administrators can modify autonomy rules.', 'warning');
      return;
    }
    setRules(prev => prev.map(r => {
      if (r.tool === toolName) {
        return {
          ...r,
          conditions: {
            ...(r.conditions || {}),
            [key]: value
          }
        };
      }
      return r;
    }));
  };

  const saveRule = async (rule) => {
    if (!isAdmin) return;
    setSavingTool(rule.tool);
    try {
      const updated = await api.updateRule(rule.tool, rule.mode, rule.conditions);
      addToast(`Rule for '${rule.tool}' updated to Version v${updated.version}!`, 'success');
      setRules(prev => prev.map(r => r.tool === rule.tool ? updated : r));
    } catch (err) {
      addToast(err.message || 'Failed to save rule', 'error');
    } finally {
      setSavingTool(null);
    }
  };

  const viewHistory = async (tool) => {
    setSelectedHistory(tool);
    try {
      const res = await fetch(`/api/v1/autonomy-rules/history/${tool}`);
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      addToast('Failed to fetch version history', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              The Autonomy Dial
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              PRD FR-4
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Set execution autonomy per tool: <strong>Auto</strong>, <strong>Needs Approval</strong>, or <strong>Never</strong>. 
            Every change generates an immutable version record.
          </p>
        </div>

        {/* RBAC Indicator for Agents */}
        {!isAdmin && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold w-fit">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only (Store Admin Login Required)</span>
          </div>
        )}
      </div>

      {/* Dial Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {rules.map((rule) => {
          const isSaving = savingTool === rule.tool;
          const maxAmtInr = ((rule.conditions?.max_amount_paise || 50000) / 100);
          const maxRefundsMonth = rule.conditions?.max_refunds_per_month ?? 2;
          const maxDaysDelivery = rule.conditions?.max_days_since_delivery ?? 7;

          return (
            <div key={rule.id || rule.tool} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {rule.tool}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {TOOL_DESCRIPTIONS[rule.tool] || "Agent tool handler"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      v{rule.version}
                    </span>
                    <button onClick={() => viewHistory(rule.tool)} title="View version history" className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3-Position Autonomy Dial Selector */}
                <div className="my-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Autonomy Mode
                  </label>
                  <div className={`grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <button
                      type="button" disabled={!isAdmin} onClick={() => handleModeChange(rule.tool, 'auto')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        rule.mode === 'auto' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Auto</span>
                    </button>

                    <button
                      type="button" disabled={!isAdmin} onClick={() => handleModeChange(rule.tool, 'approval')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        rule.mode === 'approval' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Approval</span>
                    </button>

                    <button
                      type="button" disabled={!isAdmin} onClick={() => handleModeChange(rule.tool, 'never')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        rule.mode === 'never' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Never</span>
                    </button>
                  </div>
                </div>

                {/* Conditions for issue_refund */}
                {rule.tool === 'issue_refund' && (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Auto-Approval Amount Ceiling
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{maxAmtInr.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <input
                        type="range" min="100" max="2500" step="50" value={maxAmtInr} disabled={!isAdmin}
                        onChange={(e) => handleConditionChange(rule.tool, 'max_amount_paise', Number(e.target.value) * 100)}
                        className={`w-full ${isAdmin ? 'accent-emerald-600' : 'opacity-50 cursor-not-allowed'}`}
                      />
                      <span className="text-[10px] text-slate-400">Refunds above ₹{maxAmtInr} automatically route to Approval Queue.</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Max Refunds / Month</label>
                        <input
                          type="number" min="1" max="10" value={maxRefundsMonth} disabled={!isAdmin}
                          onChange={(e) => handleConditionChange(rule.tool, 'max_refunds_per_month', Number(e.target.value))}
                          className={`w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${!isAdmin ? 'opacity-60' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Max Days Post-Delivery</label>
                        <input
                          type="number" min="1" max="30" value={maxDaysDelivery} disabled={!isAdmin}
                          onChange={(e) => handleConditionChange(rule.tool, 'max_days_since_delivery', Number(e.target.value))}
                          className={`w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs ${!isAdmin ? 'opacity-60' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Updated by: <strong className="text-slate-600 dark:text-slate-300">{rule.updated_by}</strong>
                </span>

                {/* ONLY ADMIN CAN SAVE */}
                {isAdmin ? (
                  <button
                    type="button" onClick={() => saveRule(rule)} disabled={isSaving}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving v+1...' : 'Save Rule (v+1)'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Locked</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* History Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Version History: {selectedHistory}</span>
              </h3>
              <button onClick={() => setSelectedHistory(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              {historyData.map((h) => (
                <div key={h.id} className="pt-2.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">v{h.version}</span>
                    <span className="ml-2 font-semibold uppercase text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{h.mode}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Updated by {h.updated_by}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}