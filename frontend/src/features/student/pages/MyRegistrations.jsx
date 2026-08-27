import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, AlertCircle, Inbox, ArrowRight,
  Sparkles, CheckCircle2, Award, CalendarDays, History
} from 'lucide-react';
import api from '../../../shared/services/api';
import { isEventPast } from '../../../shared/utils/eventStatus';
import EventCard from '../../../shared/components/EventCard';

export default function MyRegistrations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState({}); // { eventId: 'none' | 'open' | 'submitted' }

  const activeTab = searchParams.get('tab') === 'past' ? 'past' : 'upcoming';

  async function load() {
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

  useEffect(() => { load(); }, []);

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      upcoming: registrations.filter((r) => new Date(r.event_date) >= today),
      past: registrations.filter((r) => new Date(r.event_date) < today),
    };
  }, [registrations]);

  function hasStarted(ev) {
    return new Date() >= new Date(`${String(ev.event_date).slice(0, 10)}T${ev.event_time}`);
  }

  useEffect(() => {
    const liveEvents = registrations.filter(hasStarted);
    if (liveEvents.length === 0) return;
    let cancelled = false;
    async function loadStatuses() {
      const entries = await Promise.all(
        liveEvents.map(async (ev) => {
          try {
            const res = await api.get(`/feedback/forms/event/${ev.id}`);
            if (!res.data.form) return [ev.id, 'none'];
            return [ev.id, res.data.alreadySubmitted ? 'submitted' : 'open'];
          } catch {
            return [ev.id, 'none'];
          }
        })
      );
      if (!cancelled) setFeedbackStatus(Object.fromEntries(entries));
    }
    loadStatuses();
    return () => { cancelled = true; };
  }, [registrations]);

  const items = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">My Registrations</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Track and manage your registered campus events and participation history
          </p>
        </div>

        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98]"
        >
          Explore All Events <ArrowRight size={13} />
        </button>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
            <p className="text-xl font-black text-slate-900">{loading ? '—' : registrations.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upcoming Events</p>
            <p className="text-xl font-black text-slate-900">{loading ? '—' : upcoming.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <History size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Past Attended</p>
            <p className="text-xl font-black text-slate-900">{loading ? '—' : past.length}</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher Pills */}
      <div className="mb-6 flex w-fit gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-2xs">
        <button
          onClick={() => setSearchParams({ tab: 'upcoming' })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150 ${
            activeTab === 'upcoming'
              ? 'bg-primary-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Upcoming Events ({loading ? '—' : upcoming.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'past' })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150 ${
            activeTab === 'past'
              ? 'bg-primary-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Past Events ({loading ? '—' : past.length})
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600">
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            {error}
          </span>
          <button onClick={load} className="font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white py-16 px-6 text-center shadow-xs">
          <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Inbox size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === 'upcoming' ? 'No Upcoming Registrations' : 'No Past Events Recorded'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            {activeTab === 'upcoming'
              ? "You haven't registered for any upcoming events yet. Check out the latest campus happenings and secure your spot!"
              : "You haven't participated in any past events yet. Once an event concludes, it will be listed here with its feedback history."}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {activeTab === 'upcoming' ? (
              <button
                onClick={() => navigate('/events')}
                className="rounded-xl bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98]"
              >
                Browse Campus Events
              </button>
            ) : (
              <button
                onClick={() => setSearchParams({ tab: 'upcoming' })}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
              >
                View Upcoming Registrations ({upcoming.length})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ev) => {
            const live = hasStarted(ev);
            return (
              <EventCard
                key={ev.registration_id}
                event={{ ...ev, is_team_event: !!ev.team_members }}
                isPast={isEventPast(ev.event_date)}
                onViewDetails={() => navigate(`/events/${ev.id}`)}
                footer={
                  !live ? (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Feedback unlocks when event starts
                    </span>
                  ) : feedbackStatus[ev.id] === 'submitted' ? (
                    <span className="text-[11px] font-bold text-emerald-600">
                      Feedback Submitted ✓
                    </span>
                  ) : feedbackStatus[ev.id] === 'open' ? (
                    <button
                      onClick={() => navigate(`/events/${ev.id}/feedback`)}
                      className="rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-[11px] font-bold text-primary-700 transition hover:bg-primary-100"
                    >
                      Give Feedback
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      No feedback form yet
                    </span>
                  )
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}