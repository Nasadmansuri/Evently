import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, TrendingUp, Plus, CalendarSearch, Images, AlertCircle } from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, upcomingEvents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const [eventsRes, statsRes] = await Promise.all([
        api.get('/events/my-events'),
        api.get('/events/my-stats'),
      ]);
      setEvents(eventsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Faculty Dashboard</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Welcome back, {user?.full_name}! Manage your events and track participation.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700">
            Department: {user?.department}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            Faculty ID: {user?.faculty_id_code}
          </span>
          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium capitalize text-violet-700">
            Status: {user?.approval_status}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </span>
          <button onClick={loadDashboard} className="font-medium underline shrink-0">Retry</button>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
            <CalendarDays className="text-primary-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">My Events</p>
            <p className="text-xl font-bold text-slate-900">{loading ? '—' : stats.totalEvents}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <TrendingUp className="text-amber-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Upcoming Events</p>
            <p className="text-xl font-bold text-slate-900">{loading ? '—' : stats.upcomingEvents}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">My Recent Events</h2>
            {events.length > 0 && (
              <button onClick={() => navigate('/faculty/my-events')} className="text-xs font-medium text-primary-600 hover:underline">
                View All →
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : events.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No events yet — create your first one.</p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 3).map((ev) => (
                <div key={ev.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{ev.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(ev.event_date).toLocaleDateString()} · {ev.category}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium capitalize text-emerald-700">
                    {ev.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick Actions</h2>
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/faculty/create-event')}
              className="inline-flex w-full items-center gap-3 rounded-xl bg-primary-600 px-4 py-3 text-left text-white transition hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98]"
            >
              <Plus size={18} className="shrink-0" />
              <div>
                <p className="text-sm font-medium">Create New Event</p>
                <p className="text-[11px] text-white/80">Organize a new campus event</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/events')}
              className="w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
            >
              <CalendarSearch size={18} className="text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">Browse All Events</p>
                <p className="text-[11px] text-slate-500">View all college events</p>
              </div>
            </button>
            <button
              disabled
              className="w-full cursor-not-allowed items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left opacity-50"
            >
              <Images size={18} className="text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">Event Gallery</p>
                <p className="text-[11px] text-slate-400">Coming soon</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}