import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, TrendingUp, Plus, CalendarSearch, Images, AlertCircle,
  Users, CheckCircle2, UserCheck, ArrowRight, Clock, Award, Sparkles,
  Building2, Landmark, ShieldCheck, FileSpreadsheet, ChevronRight, PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
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
      setEvents(eventsRes.data || []);
      setStats(statsRes.data || { totalEvents: 0, upcomingEvents: 0, totalRegistrations: 0, completedEvents: 0 });
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
    <div className="space-y-6 pb-12">
      {/* 1. Header Profile & Welcome Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-800 border border-primary-100/80">
                Faculty Portal
              </span>
              <span className="text-xs font-semibold text-slate-300">·</span>
              <span className="text-xs font-medium text-slate-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Welcome back, {user?.full_name || 'Professor'}! 👋
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Oversee campus activities, monitor student registrations, and manage event feedback forms.
              </p>
            </div>

            {/* Clean Academic Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <Landmark size={13} className="text-slate-500 shrink-0" />
                {user?.department || 'Academic Department'}
              </span>
              {user?.designation && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50/80 border border-primary-100 px-2.5 py-1 text-xs font-bold text-primary-800">
                  <Award size={13} className="text-primary-700 shrink-0" />
                  {user.designation}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs font-medium text-slate-600">
                <ShieldCheck size={13} className="text-slate-400 shrink-0" />
                ID: {user?.faculty_id_code || 'FAC-CAMPUS'}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/faculty/create-event')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-3 text-xs font-bold text-white shadow-xs hover:shadow-md active:scale-95 transition-all shrink-0 self-start sm:self-center"
          >
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-xs">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            {error}
          </span>
          <button onClick={loadDashboard} className="font-bold underline shrink-0 hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* 2. 4-KPI Metric Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Events */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Events</p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-100/80">
              <CalendarDays size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : stats.totalEvents}</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">Organized by you</p>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Upcoming Events</p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : stats.upcomingEvents}</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">Scheduled & active</p>
        </div>

        {/* Total Registrations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Registrations</p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : stats.totalRegistrations}</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">Student campus entries</p>
        </div>

        {/* Completed Events */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Events</p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : stats.completedEvents}</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">Concluded successfully</p>
        </div>
      </div>

      {/* 3. Main Split Section: Recent Events & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Events Card (2 Cols on Desktop) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Recent Events</h2>
                <p className="text-xs text-slate-500">Live and upcoming campus activities organized by you</p>
              </div>
              {events.length > 0 && (
                <button
                  onClick={() => navigate('/faculty/my-events')}
                  className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1 transition"
                >
                  View All ({events.length}) <ArrowRight size={13} />
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-18 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-700 mb-2 border border-primary-100">
                  <CalendarDays size={22} />
                </div>
                <p className="text-sm font-bold text-slate-800">No events published yet</p>
                <p className="text-xs text-slate-500 mt-0.5">Start by organizing your first campus workshop or competition.</p>
                <button
                  onClick={() => navigate('/faculty/create-event')}
                  className="mt-3 text-xs font-bold text-primary-700 hover:underline"
                >
                  + Create your first event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 4).map((ev, idx) => {
                  const isPast = isEventPast(ev.event_date, ev.event_time);
                  const liveStatus = getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at);
                  const catStyle = getCategoryStyle(ev.category);
                  const dateObj = new Date(ev.event_date);
                  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });

                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 transition-all duration-150 hover:bg-white hover:border-primary-200 hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                        {/* Ticket Date Badge */}
                        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-800 shadow-2xs group-hover:border-primary-200 transition">
                          <span className="text-[9px] font-black uppercase tracking-wider text-primary-700">
                            {month}
                          </span>
                          <span className="text-sm font-black leading-none text-slate-900">
                            {day}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`rounded-md px-2 py-0.5 text-[9.5px] font-bold ${catStyle.bg} ${catStyle.text}`}>
                              {ev.category}
                            </span>
                            {ev.is_team_event ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 border border-primary-100 px-1.5 py-0.5 text-[9.5px] font-bold text-primary-700">
                                <Users size={9} /> Team
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-primary-700 transition">
                            {ev.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{ev.location || 'Biratnagar International College'}</span>
                            {ev.registration_count !== undefined && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">{ev.registration_count} registered</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          liveStatus === 'ended'
                            ? 'bg-slate-200 text-slate-700'
                            : liveStatus === 'ongoing'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-primary-100 text-primary-800'
                        }`}>
                          {liveStatus === 'ongoing' ? '● Live' : isPast ? 'Ended' : 'Upcoming'}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-primary-700 group-hover:bg-primary-50 transition border border-slate-200">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {events.length > 0 && (
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {Math.min(4, events.length)} of {events.length} events</span>
              <button
                onClick={() => navigate('/faculty/my-events')}
                className="font-bold text-primary-700 hover:underline"
              >
                Manage All Events →
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions Card (1 Col on Desktop) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Faculty Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Fast shortcuts for common academic operations</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/faculty/create-event')}
                className="flex w-full items-center gap-3.5 rounded-xl bg-primary-700 hover:bg-primary-800 p-4 text-left text-white shadow-xs hover:shadow-md transition active:scale-95"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                  <Plus size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">Create New Event</p>
                  <p className="text-[11px] text-white/80 truncate">Publish workshops & hackathons</p>
                </div>
                <ArrowRight size={15} className="text-white/70 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/faculty/my-events')}
                className="flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white p-3.5 text-left transition hover:border-primary-200 hover:shadow-xs active:scale-95"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 border border-primary-100">
                  <CalendarDays size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900">Manage My Events</p>
                  <p className="text-[11px] text-slate-500 truncate">Feedback, editing, & PDF reports</p>
                </div>
                <ArrowRight size={14} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/events')}
                className="flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white p-3.5 text-left transition hover:border-primary-200 hover:shadow-xs active:scale-95"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                  <CalendarSearch size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900">All Campus Events</p>
                  <p className="text-[11px] text-slate-500 truncate">Explore student calendar & feed</p>
                </div>
                <ArrowRight size={14} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/faculty/gallery')}
                className="flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white p-3.5 text-left transition hover:border-primary-200 hover:shadow-xs active:scale-95"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Images size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900">Event Photo Gallery</p>
                  <p className="text-[11px] text-slate-500 truncate">Upload & organize event photos</p>
                </div>
                <ArrowRight size={14} className="text-slate-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}