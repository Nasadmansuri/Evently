import { useEffect, useState } from 'react';
import { ShieldCheck, Check, X, Loader2, AlertCircle, Inbox } from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  async function loadPending() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/pending-faculty');
      setPending(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load pending approvals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleDecision(id, status) {
    setActioningId(id);
    try {
      await api.patch(`/users/${id}/approval`, { status });
      setPending((prev) => prev.filter((f) => f.id !== id));
      if (status === 'approved') {
        showToast.success('Faculty approved');
      } else {
        showToast.error('Faculty rejected');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Action failed, try again');
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pending Faculty Approvals</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {loading ? 'Loading...' : `${pending.length} account${pending.length === 1 ? '' : 's'} awaiting review`}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </span>
          <button onClick={loadPending} className="font-medium underline shrink-0">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Inbox className="text-gray-300 mb-3" size={32} />
          <p className="text-sm font-medium text-gray-700">No pending faculty approvals</p>
          <p className="text-xs text-gray-400 mt-1">New faculty signups will show up here for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{f.full_name}</p>
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} /> Pending
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {f.email}{f.phone ? ` · ${f.phone}` : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {f.faculty_id_code} · {f.department} · {f.designation}
                  {f.community && f.community !== 'N/A' ? ` · ${f.community}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={actioningId === f.id}
                  onClick={() => handleDecision(f.id, 'rejected')}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium py-2 px-3.5 rounded-lg text-xs transition disabled:opacity-50"
                >
                  <X size={14} /> Reject
                </button>
                <button
                  type="button"
                  disabled={actioningId === f.id}
                  onClick={() => handleDecision(f.id, 'approved')}
                  className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] text-white font-medium py-2 px-3.5 rounded-lg text-xs transition-all disabled:opacity-50"
                >
                  {actioningId === f.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}