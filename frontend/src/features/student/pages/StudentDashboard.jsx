import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck, History, AlertCircle, Inbox, Image, ListChecks, MessageSquare,
  Users, CalendarDays, TrendingUp, Sparkles, ArrowRight, PlayCircle, Plus, ChevronRight
} from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { getStudentCourseLabel } from '../../../shared/utils/studentInfo';
import { getEventStatus } from '../../../shared/utils/eventStatus';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  async function loadRegistrations() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/registrations/my');
      setRegistrations(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your registrations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
  }, []);

  const { upcoming, past, ongoing } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const up = registrations.filter((r) => new Date(r.event_date) >= today);
    const pa = registrations.filter((r) => new Date(r.event_date) < today);
    const live = registrations.filter((r) => getEventStatus(r.event_date, r.event_time) === 'ongoing');
    return { upcoming: up, past: pa, ongoing: live };
  }, [registrations]);

  const displayedEvents = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-6">
      {/* Header Profile & Welcome Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Student Dashboard</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Welcome back, {user?.full_name}! Stay updated with upcoming campus events and track your participation.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-[11px] font-semibold text-primary-700">
              College: {user?.college_name || 'Affiliated Campus'}
            </span>
            <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              {getStudentCourseLabel(user)}
            </span>
            <span className="rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98] shrink-0"
        >
          <CalendarDays size={15} /> Explore All Events
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            {error}
          </span>
          <button onClick={loadRegistrations} className="font-semibold underline shrink-0 hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {/* 4-KPI Metric Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Total Registered</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : registrations.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Upcoming Events</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : upcoming.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <PlayCircle size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Live / Ongoing</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : ongoing.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
            <History size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Attended / Past</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : past.length}</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout (Identical to Faculty Dashboard) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Left Column: Registered Events with Tab Controls & Recommendations */}
        <div className="space-y-5">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Registered Events</h2>
                <p className="text-xs text-slate-500">Events you have signed up to participate in</p>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    activeTab === 'upcoming'
                      ? 'bg-white text-primary-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upcoming ({loading ? '—' : upcoming.length})
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    activeTab === 'past'
                      ? 'bg-white text-primary-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Past ({loading ? '—' : past.length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : displayedEvents.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Inbox size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {activeTab === 'upcoming' ? 'No Upcoming Events' : 'No Past Events Yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  {activeTab === 'upcoming'
                    ? 'Explore upcoming campus events and workshops to register.'
                    : 'Attended events will show up here once concluded.'}
                </p>
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => navigate('/events')}
                    className="mt-4 rounded-xl bg-primary-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-600"
                  >
                    Browse Campus Events
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedEvents.slice(0, 4).map((ev) => {
                  const style = getCategoryStyle(ev.category);
                  const status = getEventStatus(ev.event_date, ev.event_time);
                  return (
                    <div
                      key={ev.registration_id || ev.id}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all duration-150 hover:bg-white hover:border-primary-200 hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}>
                            {ev.category}
                          </span>
                          {ev.team_members ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                              <Users size={9} /> Team
                            </span>
                          ) : null}
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            status === 'ongoing' ? 'bg-emerald-100 text-emerald-800' : status === 'ended' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary-700 transition">
                          {ev.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {new Date(ev.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{ev.location ? ` · ${ev.location}` : ''}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition border border-slate-200/80 shrink-0">
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {displayedEvents.length > 4 && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  onClick={() => navigate(`/student/my-registrations?tab=${activeTab}`)}
                  className="text-xs font-bold text-primary-700 hover:underline inline-flex items-center gap-1"
                >
                  View All ({displayedEvents.length}) Registrations <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          <RecommendedEvents />
        </div>

        {/* Right Column: Quick Action Shortcuts (Identical Pattern to Faculty Dashboard) */}
        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Fast shortcuts for student activities</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/events')}
                className="w-full flex items-center justify-between rounded-2xl bg-[#023433] p-4 text-left text-white shadow-sm transition hover:bg-[#034443] hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Browse All Campus Events</p>
                    <p className="text-[11px] text-emerald-200/80">Explore upcoming workshops and activities</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-emerald-300 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/student/my-registrations')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
                    <ListChecks size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Manage My Registrations</p>
                    <p className="text-[11px] text-slate-500">Track event entries and participation</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/student/my-feedback')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">My Feedback & Reviews</p>
                    <p className="text-[11px] text-slate-500">Review and submit feedback for events</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/student/gallery')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Image size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Campus Photo Gallery</p>
                    <p className="text-[11px] text-slate-500">Browse photos from past campus events</p>
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

function RecommendedEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events/recommended')
      .then((res) => setEvents(res.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 mb-3.5">
        <Sparkles size={16} className="text-primary-600" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Recommended For You</h2>
          <p className="text-xs text-slate-500">Personalized events tailored to your course and interests</p>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {events.map((ev) => {
            const style = getCategoryStyle(ev.category);
            return (
              <button
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-left transition hover:bg-white hover:border-primary-200 hover:shadow-sm"
              >
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}>{ev.category}</span>
                <p className="mt-1.5 text-sm font-bold text-slate-900 truncate">{ev.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{new Date(ev.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{ev.location ? ` · ${ev.location}` : ''}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}