import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Check, X, Loader2, AlertCircle, Inbox, CalendarDays, Users, GraduationCap, BarChart3, TrendingUp } from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
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

  async function loadStats() {
    setStatsLoading(true);
    try {
      const res = await api.get('/events/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
    loadStats();
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
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Admin Dashboard</h1>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Platform overview and faculty approvals</p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
            <CalendarDays className="text-primary-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Total Events</p>
            <p className="text-xl font-bold text-slate-900">{statsLoading ? '—' : stats?.totalEvents}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <Users className="text-emerald-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Total Students</p>
            <p className="text-xl font-bold text-slate-900">{statsLoading ? '—' : stats?.totalStudents}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50">
            <GraduationCap className="text-violet-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Total Faculty</p>
            <p className="text-xl font-bold text-slate-900">
              {statsLoading ? '—' : stats?.totalFaculty}
              {!statsLoading && stats?.pendingFaculty > 0 && (
                <span className="ml-1.5 text-xs font-medium text-amber-600">({stats.pendingFaculty} pending)</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <BarChart3 className="text-amber-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Total Participants</p>
            <p className="text-xl font-bold text-slate-900">{statsLoading ? '—' : stats?.totalParticipants}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <TrendingUp className="text-slate-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Upcoming Events</p>
            <p className="text-xl font-bold text-slate-900">{statsLoading ? '—' : stats?.upcomingEvents}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center gap-3 rounded-[18px] border border-primary-200 bg-primary-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <CalendarDays className="text-primary-700" size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-700">Manage All Events</p>
            <p className="text-[11px] text-primary-600">View, create, and delete events</p>
          </div>
        </button>
      </div>

      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Pending Faculty Approvals</h2>
        <p className="mt-0.5 text-xs text-slate-500">
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
            <div key={i} className="h-20 rounded-[20px] bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-[20px] border border-slate-100">
          <Inbox className="text-slate-300 mb-3" size={32} />
          <p className="text-sm font-medium text-slate-700">No pending faculty approvals</p>
          <p className="text-xs text-slate-400 mt-1">New faculty signups will show up here for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-900">{f.full_name}</p>
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} /> Pending
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {f.email}{f.phone ? ` · ${f.phone}` : ''}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {f.faculty_id_code} · {f.department} · {f.designation}
                  {f.community && f.community !== 'N/A' ? ` · ${f.community}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={actioningId === f.id}
                  onClick={() => handleDecision(f.id, 'rejected')}
                  className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium py-2 px-3.5 rounded-lg text-xs transition disabled:opacity-50"
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