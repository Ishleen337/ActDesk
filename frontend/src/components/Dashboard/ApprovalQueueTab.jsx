import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Clock, CheckCircle, XCircle, Edit3, MessageSquare, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function ApprovalQueueTab() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionInProgress, setActionInProgress] = useState(null);

  const [editingItem, setEditingItem] = useState(null);
  const [editedAmount, setEditedAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await api.getApprovals(statusFilter);
      setApprovals(data.items || []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch approval queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const handleApprove = async (item) => {
    setActionInProgress(item.id);
    try {
      await api.decideApproval(item.id, 'approved', `Approved by ${user?.username || 'Staff'} under discretionary authority.`);
      addToast(`Action '${item.tool}' successfully approved & executed!`, 'success');
      fetchApprovals();
    } catch (err) {
      addToast(err.message || 'Approval execution failed', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingItem) return;
    setActionInProgress(rejectingItem.id);
    try {
      await api.decideApproval(rejectingItem.id, 'rejected', rejectReason || 'Does not qualify under store guidelines.');
      addToast(`Action rejected and customer notified.`, 'info');
      setRejectingItem(null);
      setRejectReason('');
      fetchApprovals();
    } catch (err) {
      addToast(err.message || 'Failed to record rejection', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setActionInProgress(editingItem.id);
    try {
      const updatedArgs = { ...editingItem.args };
      if (editedAmount && editingItem.tool === 'issue_refund') {
        updatedArgs.amount_paise = Number(editedAmount) * 100;
      }
      await api.decideApproval(editingItem.id, 'edited', editNotes || `Adjusted refund amount to ₹${editedAmount}`, updatedArgs);
      addToast(`Action adjusted & executed successfully!`, 'success');
      setEditingItem(null);
      fetchApprovals();
    } catch (err) {
      addToast(err.message || 'Failed to execute edited action', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Manager Approval Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              PRD FR-5
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Actions flagged by server-side policy exceeding automatic dials. Review context, approve, adjust, or reject.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {['pending', 'approved', 'rejected', 'edited'].map((st) => (
              <button
                key={st} onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <button onClick={fetchApprovals} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" title="Refresh queue">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No {statusFilter} approval requests</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter === 'pending' ? "All customer requests are currently within auto-approval boundaries or resolved." : `No items found with status '${statusFilter}'.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((item) => {
            const isProcessing = actionInProgress === item.id;
            const amountInr = item.args?.amount_paise ? (item.args.amount_paise / 100).toFixed(2) : null;

            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{item.tool}</span>
                      <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">({item.order_id || 'No Order ID'})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        item.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        item.status === 'edited' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.reason_for_queue}</span>
                    </div>

                    {amountInr && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                        Requested Amount: <strong className="text-slate-900 dark:text-white">₹{amountInr}</strong>
                      </p>
                    )}
                  </div>

                  {item.status === 'pending' && (
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button onClick={() => handleApprove(item)} disabled={isProcessing} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button onClick={() => { setEditingItem(item); setEditedAmount(amountInr ? String(Math.min(Number(amountInr), 500)) : '500'); }} disabled={isProcessing} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit & Approve</span>
                      </button>
                      <button onClick={() => setRejectingItem(item)} disabled={isProcessing} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {item.status !== 'pending' && item.decided_by && (
                    <div className="text-right text-xs text-slate-400">
                      <p>Decided by <strong className="text-slate-700 dark:text-slate-200">{item.decided_by}</strong></p>
                      <p className="text-[10px]">{item.decided_at ? new Date(item.decided_at).toLocaleString() : ''}</p>
                    </div>
                  )}
                </div>

                {item.conversation_snippet && item.conversation_snippet.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-xs space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> <span>Recent Conversation Context</span>
                    </p>
                    {item.conversation_snippet.map((msg, idx) => (
                      <div key={idx} className="flex gap-2 text-[11px]">
                        <span className="font-bold capitalize text-slate-500 w-12 shrink-0">{msg.sender}:</span>
                        <span className="text-slate-700 dark:text-slate-300 line-clamp-1">{msg.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit & Approve Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-500" />
              <span>Edit Arguments & Approve</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Adjust parameters (e.g. adjust refund amount) to satisfy store guidelines before execution.</p>
            <form onSubmit={handleConfirmEdit} className="space-y-4">
              {editingItem.tool === 'issue_refund' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Adjusted Refund Amount (INR ₹)</label>
                  <input type="number" required min="1" max="10000" value={editedAmount} onChange={(e) => setEditedAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                  <span className="text-[10px] text-slate-400">Original requested: ₹{editingItem.args?.amount_paise ? (editingItem.args.amount_paise / 100).toFixed(2) : ''}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Manager Decision Note</label>
                <textarea rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Reason for adjustment..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm">Execute with Adjusted Params</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Reject Request</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Enter reason for rejection. This notice will be posted to the customer's chat session.</p>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rejection Reason</label>
                <textarea required rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Exceeded return period, package already delivered without defects..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRejectingItem(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm">Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}