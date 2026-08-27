import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Check, X, Loader2, AlertCircle, Inbox, CalendarDays, Users, GraduationCap, BarChart3, TrendingUp, Images, Plus, Calendar, MapPin } from 'lucide-react';
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
      setRecentEvents(res.data.slice(0, 3));
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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <ShieldCheck className="text-amber-600" size={15} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Pending Faculty Approvals</h2>
              <p className="text-xs text-slate-500">
                {loading ? 'Loading...' : `${pending.length} account${pending.length === 1 ? '' : 's'} awaiting review`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Inbox className="text-slate-300 mb-2" size={26} />
              <p className="text-xs font-medium text-slate-700">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((f) => (
                <div key={f.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-1 flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{f.full_name}</p>
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                      <ShieldCheck size={10} /> Pending
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{f.email}{f.phone ? ` · ${f.phone}` : ''}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {f.faculty_id_code} · {f.department} · {f.designation}
                    {f.community && f.community !== 'N/A' ? ` · ${f.community}` : ''}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={actioningId === f.id}
                      onClick={() => handleDecision(f.id, 'rejected')}
                      className="flex items-center gap-1 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium py-1.5 px-2.5 rounded-lg text-xs transition disabled:opacity-50"
                    >
                      <X size={12} /> Reject
                    </button>
                    <button
                      type="button"
                      disabled={actioningId === f.id}
                      onClick={() => handleDecision(f.id, 'approved')}
                      className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-2.5 rounded-lg text-xs transition disabled:opacity-50"
                    >
                      {actioningId === f.id ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50">
                <CalendarDays className="text-primary-600" size={15} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Recent Events</h2>
                <p className="text-xs text-slate-500">
                  {recentLoading ? 'Loading...' : `${recentEvents.length} shown`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/create-event')}
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              <Plus size={13} /> Create Event
            </button>
          </div>

          {recentLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="text-slate-300 mb-2" size={26} />
              <p className="text-xs font-medium text-slate-700">No events yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((ev) => {
                const isPast = isEventPast(ev.event_date);
                const liveStatus = getEventStatus(ev.event_date, ev.event_time);
                return (
                <button
                  key={ev.id}
                  onClick={() => navigate(`/events/${ev.id}`)}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{ev.title}</p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {ev.is_team_event ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-medium text-white">
                          <Users size={10} /> Team
                        </span>
                      ) : null}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                        liveStatus === 'ended'
                          ? 'bg-slate-100 text-slate-500'
                          : liveStatus === 'ongoing'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {liveStatus === 'ongoing' ? 'Ongoing' : isPast ? 'Ended' : ev.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={11} />{new Date(ev.event_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><MapPin size={11} />{ev.location}</span>
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={() => navigate('/admin/events')}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
              <CalendarDays className="text-primary-600" size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-900">Manage All Events</p>
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50">
              <Users className="text-violet-600" size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-900">User Management</p>
          </button>
          <button
            onClick={() => navigate('/admin/gallery')}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <Images className="text-emerald-600" size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-900">Event Gallery</p>
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <BarChart3 className="text-amber-600" size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-900">View Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
}