import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Check, X, Loader2, AlertCircle, Inbox, CalendarDays,
  Users, GraduationCap, BarChart3, TrendingUp, Images, Plus, Calendar,
  MapPin, ArrowRight, ChevronRight, UserCheck
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
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

  async function loadRecentEvents() {
    setRecentLoading(true);
    try {
      const res = await api.get('/events/admin/all');
      setRecentEvents(res.data.slice(0, 4));
    } catch (err) {
      console.error('Failed to load recent events:', err);
    } finally {
      setRecentLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
    loadStats();
    loadRecentEvents();
  }, []);

  async function handleDecision(id, status) {
    setActioningId(id);
    try {
      await api.patch(`/users/${id}/approval`, { status });
      setPending((prev) => prev.filter((f) => f.id !== id));
      if (status === 'approved') {
        showToast.success('Faculty approved successfully');
      } else {
        showToast.error('Faculty registration rejected');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Action failed, try again');
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Profile & Welcome Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Admin Dashboard</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Platform governance, faculty onboarding approvals, event monitoring, and analytics
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/create-event')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98] shrink-0"
        >
          <Plus size={15} /> Create Campus Event
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            {error}
          </span>
          <button onClick={loadPending} className="font-semibold underline shrink-0 hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {/* 4-KPI Metric Grid (Consistent with Faculty & Student Dashboards) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Total Events</p>
            <p className="text-2xl font-black text-slate-900">{statsLoading ? '—' : stats?.totalEvents}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Total Students</p>
            <p className="text-2xl font-black text-slate-900">{statsLoading ? '—' : stats?.totalStudents}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Total Faculty</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-900">{statsLoading ? '—' : stats?.totalFaculty}</p>
              {!statsLoading && stats?.pendingFaculty > 0 && (
                <span className="text-xs font-bold text-amber-600">({stats.pendingFaculty} pending)</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Total Registrations</p>
            <p className="text-2xl font-black text-slate-900">{statsLoading ? '—' : stats?.totalParticipants}</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout (Identical to Faculty & Student Dashboards) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Left Column: Pending Faculty Approvals & Recent Events */}
        <div className="space-y-5">
          {/* Pending Faculty Approvals Card */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Pending Faculty Approvals</h2>
                  <p className="text-xs text-slate-500">
                    {loading ? 'Loading...' : `${pending.length} account${pending.length === 1 ? '' : 's'} awaiting review`}
                  </p>
                </div>
              </div>

              {pending.length > 0 && (
                <button
                  onClick={() => navigate('/admin/users?role=faculty')}
                  className="text-xs font-bold text-primary-700 hover:underline"
                >
                  Manage Users →
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <UserCheck size={24} />
                </div>
                <p className="text-sm font-bold text-slate-800">All faculty accounts reviewed</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending registration approvals at this time.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pending.map((f) => (
                  <div key={f.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:bg-white hover:border-slate-200 hover:shadow-xs">
                    <div className="mb-1.5 flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{f.full_name}</p>
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <ShieldCheck size={11} /> Pending Review
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{f.email}{f.phone ? ` · ${f.phone}` : ''}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {f.faculty_id_code} · {f.department} · {f.designation}
                      {f.community && f.community !== 'N/A' ? ` · ${f.community}` : ''}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={actioningId === f.id}
                        onClick={() => handleDecision(f.id, 'rejected')}
                        className="flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold py-1.5 px-3 rounded-xl text-xs transition disabled:opacity-50"
                      >
                        <X size={13} /> Reject
                      </button>
                      <button
                        type="button"
                        disabled={actioningId === f.id}
                        onClick={() => handleDecision(f.id, 'approved')}
                        className="flex items-center gap-1 bg-primary-700 hover:bg-primary-600 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition shadow-xs disabled:opacity-50"
                      >
                        {actioningId === f.id ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />}
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Campus Events Card */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Campus Events</h2>
                  <p className="text-xs text-slate-500">
                    {recentLoading ? 'Loading...' : `${recentEvents.length} events listed`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/events')}
                className="text-xs font-bold text-primary-700 hover:underline"
              >
                View All Events →
              </button>
            </div>

            {recentLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="text-slate-300 mb-2" size={26} />
                <p className="text-xs font-medium text-slate-700">No events yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentEvents.map((ev) => {
                  const isPast = isEventPast(ev.event_date);
                  const liveStatus = getEventStatus(ev.event_date, ev.event_time);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:bg-white hover:border-primary-200 hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary-700 transition">
                            {ev.title}
                          </p>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            liveStatus === 'ended'
                              ? 'bg-slate-200 text-slate-700'
                              : liveStatus === 'ongoing'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {liveStatus === 'ongoing' ? 'Ongoing' : isPast ? 'Ended' : ev.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><Calendar size={11} />{new Date(ev.event_date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} />{ev.location}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition border border-slate-200/80 shrink-0">
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Action Shortcuts (Identical Pattern to Faculty & Student Dashboards) */}
        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Admin Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Fast shortcuts for administrative tools</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/create-event')}
                className="w-full flex items-center justify-between rounded-2xl bg-[#023433] p-4 text-left text-white shadow-sm transition hover:bg-[#034443] hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                    <Plus size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Publish New Event</p>
                    <p className="text-[11px] text-emerald-200/80">Create institutional campus events</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-emerald-300 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/admin/events')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-100">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Manage All Events</p>
                    <p className="text-[11px] text-slate-500">Edit, moderate, or delete campus events</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">User Management</p>
                    <p className="text-[11px] text-slate-500">Student & faculty accounts directory</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/admin/reports')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Analytics & Reports</p>
                    <p className="text-[11px] text-slate-500">Participation data and PDF summaries</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/admin/gallery')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Images size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Campus Photo Gallery</p>
                    <p className="text-[11px] text-slate-500">Manage event photo albums</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}