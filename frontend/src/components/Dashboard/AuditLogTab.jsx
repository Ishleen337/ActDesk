import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  FileText, RefreshCw, ChevronRight, Undo2
} from 'lucide-react';

export default function AuditLogTab() {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [undoingId, setUndoingId] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getActions();
      setLogs(data.items || []);
    } catch (err) {
      addToast(err.message || 'Failed to load audit log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleUndo = async (logItem) => {
    setUndoingId(logItem.id);
    try {
      const res = await api.undoAction(logItem.id);
      addToast(res.message || `Successfully rolled back ${logItem.tool}!`, 'success');
      fetchLogs();
    } catch (err) {
      addToast(err.message || 'Undo operation failed', 'error');
    } finally {
      setUndoingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Action Audit Log & 1-Click Undo
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              PRD FR-6
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete immutable record of all actions, actors, and rule versions. Reversible mutations feature one-click database rollback.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition w-fit shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">No actions logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Action / Tool</th>
                  <th className="py-3 px-4 font-bold">Actor</th>
                  <th className="py-3 px-4 font-bold">Rule Ver</th>
                  <th className="py-3 px-4 font-bold">Arguments</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Undo Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {logs.map((item) => {
                  const isReversible = item.reversible;
                  const isReverted = item.is_reverted;
                  const isUndoing = undoingId === item.id;
                  const isExpanded = expandedLogId === item.id;
                  
                  // RBAC LOGIC: Admin can undo anything. Agent can only undo their own actions.
                  const actorName = `support_agent:${user?.username}`;
                  const canUndo = isReversible && !isReverted && (isAdmin || item.actor === actorName);

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <button onClick={() => setExpandedLogId(isExpanded ? null : item.id)} className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400">
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            <span>{item.tool}</span>
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            item.actor.includes('store_admin')
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {item.actor}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">v{item.rule_version}</td>
                        <td className="py-3 px-4 max-w-xs truncate text-[11px] font-mono text-slate-500">{JSON.stringify(item.args)}</td>

                        <td className="py-3 px-4">
                          {isReverted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Reverted</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Executed</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {canUndo ? (
                            <button
                              type="button" onClick={() => handleUndo(item)} disabled={isUndoing}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ml-auto shadow-sm disabled:opacity-40"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>{isUndoing ? 'Reverting...' : '1-Click Undo'}</span>
                            </button>
                          ) : isReversible && isReverted ? (
                            <span className="text-[11px] text-slate-400">Undone by {item.reverted_by}</span>
                          ) : isReversible && !isAdmin ? (
                            <span className="text-[11px] text-slate-400 italic">Admin Only</span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Irreversible</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-slate-800/40">
                          <td colSpan={6} className="py-3 px-6 text-xs space-y-2 border-b border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="font-bold text-slate-500 uppercase text-[10px] mb-1">Arguments Payload</p>
                                <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-xl text-[11px] font-mono overflow-x-auto">{JSON.stringify(item.args, null, 2)}</pre>
                              </div>
                              <div>
                                <p className="font-bold text-slate-500 uppercase text-[10px] mb-1">Execution Result</p>
                                <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-xl text-[11px] font-mono overflow-x-auto">{JSON.stringify(item.result, null, 2)}</pre>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400">Logged on {new Date(item.created_at).toLocaleString()}</p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}