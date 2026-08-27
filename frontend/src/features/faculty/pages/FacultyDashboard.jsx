import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, TrendingUp, Plus, CalendarSearch, Images, AlertCircle,
  Users, CheckCircle2, UserCheck, ArrowRight, Clock, Award, Sparkles
} from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    completedEvents: 0,
  });
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
    <div className="space-y-6">
      {/* Header Profile & Welcome Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Faculty Dashboard</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Welcome back, {user?.full_name || 'Professor'}! Manage your campus events, registrations, and student feedback.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-[11px] font-semibold text-primary-700">
              Department: {user?.department || 'Academic Affairs'}
            </span>
            {user?.designation && (
              <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">
                {user.designation}
              </span>
            )}
            <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              Faculty ID: {user?.faculty_id_code || 'FAC-USER'}
            </span>
            <span className="rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-[11px] font-semibold capitalize text-violet-700">
              Status: {user?.approval_status || 'Approved'}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/faculty/create-event')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] shrink-0"
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            {error}
          </span>
          <button onClick={loadDashboard} className="font-semibold underline shrink-0 hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {/* 4-KPI Metric Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Total Events</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : stats.totalEvents}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Upcoming Events</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : stats.upcomingEvents}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Registrations</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : stats.totalRegistrations}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Completed Events</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : stats.completedEvents}</p>
          </div>
        </div>
      </div>

      {/* Main Section: Recent Events & Quick Actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Events Card */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Recent Events</h2>
                <p className="text-xs text-slate-400">Events organized by you</p>
              </div>
              {events.length > 0 && (
                <button
                  onClick={() => navigate('/faculty/my-events')}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition"
                >
                  View All ({events.length}) <ArrowRight size={13} />
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : events.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-2 border border-slate-100">
                  <CalendarDays size={22} />
                </div>
                <p className="text-sm font-semibold text-slate-700">No events yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Start by organizing your first campus workshop or competition.</p>
                <button
                  onClick={() => navigate('/faculty/create-event')}
                  className="mt-3 text-xs font-bold text-primary-600 hover:underline"
                >
                  + Create your first event
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.slice(0, 4).map((ev) => {
                  const isPast = isEventPast(ev.event_date);
                  const liveStatus = getEventStatus(ev.event_date, ev.event_time);
                  const catStyle = getCategoryStyle(ev.category);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all duration-150 hover:bg-white hover:border-primary-200 hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${catStyle.bg} ${catStyle.text}`}>
                            {ev.category}
                          </span>
                          {ev.is_team_event ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                              <Users size={9} /> Team
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary-700 transition">
                          {ev.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{new Date(ev.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {ev.registration_count !== undefined && (
                            <>
                              <span>•</span>
                              <span>{ev.registration_count} registered</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold capitalize ${
                          liveStatus === 'ended'
                            ? 'bg-slate-200/80 text-slate-600'
                            : liveStatus === 'ongoing'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {liveStatus === 'ongoing' ? 'Ongoing' : isPast ? 'Ended' : 'Upcoming'}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition border border-slate-200/80">
                          <ArrowRight size={13} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {events.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {Math.min(4, events.length)} of {events.length} events</span>
              <button
                onClick={() => navigate('/faculty/my-events')}
                className="font-bold text-primary-600 hover:underline"
              >
                Manage All Events →
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
          <p className="text-xs text-slate-400 mb-4">Fast shortcuts for common faculty tasks</p>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/faculty/create-event')}
              className="flex w-full items-center gap-3.5 rounded-2xl bg-primary-600 p-4 text-left text-white shadow-sm transition hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                <Plus size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Create New Event</p>
                <p className="text-[11.5px] text-white/80">Publish workshops, hackathons, seminars, or competitions</p>
              </div>
              <ArrowRight size={16} className="text-white/60" />
            </button>

            <button
              onClick={() => navigate('/faculty/my-events')}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50 hover:border-slate-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
                <CalendarDays size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Manage My Events</p>
                <p className="text-[11.5px] text-slate-500">Edit event details, feedback forms, and download PDF reports</p>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
            </button>

            <button
              onClick={() => navigate('/events')}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50 hover:border-slate-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <CalendarSearch size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Browse All Campus Events</p>
                <p className="text-[11.5px] text-slate-500">Explore college calendar, student festivals, and activities</p>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
            </button>

            <button
              onClick={() => navigate('/faculty/gallery')}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50 hover:border-slate-300"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Images size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Event Photo Gallery</p>
                <p className="text-[11.5px] text-slate-500">Browse and manage event albums and uploaded pictures</p>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}