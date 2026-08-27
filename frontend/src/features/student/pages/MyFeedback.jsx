import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, Inbox, MessageSquare, CheckCircle2, Star, Clock,
  CalendarDays, ArrowRight, Sparkles, Award, FileQuestion
} from 'lucide-react';
import api from '../../../shared/services/api';
import EventCard from '../../../shared/components/EventCard';
import { isEventPast } from '../../../shared/utils/eventStatus';

export default function MyFeedback() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pastEvents, setPastEvents] = useState([]);
  const [feedbackStatus, setFeedbackStatus] = useState({}); // { eventId: 'none' | 'open' | 'submitted' }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeTab = searchParams.get('tab') || 'all'; // 'all' | 'submitted' | 'pending' | 'unavailable'

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/registrations/my');
      // "Started" = event has actually begun (date + time)
      const started = res.data.filter(
        (r) => new Date() >= new Date(`${String(r.event_date).slice(0, 10)}T${r.event_time}`)
      );
      setPastEvents(started);

      const statusEntries = await Promise.all(
        started.map(async (ev) => {
          try {
            const formRes = await api.get(`/feedback/forms/event/${ev.id}`);
            if (!formRes.data.form) return [ev.id, 'none'];
            return [ev.id, formRes.data.alreadySubmitted ? 'submitted' : 'open'];
          } catch {
            return [ev.id, 'none'];
          }
        })
      );
      setFeedbackStatus(Object.fromEntries(statusEntries));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your feedback history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const { pending, submitted, unavailable } = useMemo(() => {
    const groups = { pending: [], submitted: [], unavailable: [] };
    for (const ev of pastEvents) {
      const status = feedbackStatus[ev.id] || 'none';
      if (status === 'open') groups.pending.push(ev);
      else if (status === 'submitted') groups.submitted.push(ev);
      else groups.unavailable.push(ev);
    }
    return groups;
  }, [pastEvents, feedbackStatus]);

  const displayedEvents = useMemo(() => {
    if (activeTab === 'submitted') return submitted;
    if (activeTab === 'pending') return pending;
    if (activeTab === 'unavailable') return unavailable;
    return pastEvents;
  }, [activeTab, pastEvents, submitted, pending, unavailable]);

  function feedbackFooter(ev) {
    const status = feedbackStatus[ev.id] || 'none';
    if (status === 'open') {
      return (
        <button
          onClick={() => navigate(`/events/${ev.id}/feedback`)}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-amber-600 active:scale-[0.97]"
        >
          <Star size={12} className="fill-white" /> Give Feedback
        </button>
      );
    }
    if (status === 'submitted') {
      return (
        <button
          onClick={() => navigate(`/events/${ev.id}/feedback`)}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          <CheckCircle2 size={13} /> View Response →
        </button>
      );
    }
    return (
      <span className="text-[11px] font-semibold text-slate-400">
        No form published yet
      </span>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">My Event Feedback</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Review your ratings, complete pending evaluations, and share suggestions for campus events
          </p>
        </div>

        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98]"
        >
          Explore All Events <ArrowRight size={13} />
        </button>
      </div>

      {/* 4-KPI Metric Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
            <CalendarDays size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Eligible Events</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : pastEvents.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Submitted</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : submitted.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Star size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Pending Feedback</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : pending.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <FileQuestion size={20} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Form Not Published</p>
            <p className="text-2xl font-black text-slate-900">{loading ? '—' : unavailable.length}</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher Filter Pills */}
      <div className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-2xs w-fit">
        <button
          onClick={() => setSearchParams({ tab: 'all' })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150 ${
            activeTab === 'all'
              ? 'bg-primary-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({loading ? '—' : pastEvents.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'submitted' })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150 ${
            activeTab === 'submitted'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Submitted ({loading ? '—' : submitted.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'pending' })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150 ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending Feedback ({loading ? '—' : pending.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'unavailable' })}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150 ${
            activeTab === 'unavailable'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          No Form Yet ({loading ? '—' : unavailable.length})
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600">
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
      ) : displayedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white py-16 px-6 text-center shadow-xs">
          <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Inbox size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === 'submitted'
              ? 'No Submitted Feedback Yet'
              : activeTab === 'pending'
              ? 'No Pending Feedback'
              : 'No Attended Events Recorded'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            {activeTab === 'submitted'
              ? 'Once you submit feedback for past events, your answers and ratings will be recorded here.'
              : activeTab === 'pending'
              ? 'You have completed feedback for all attended events with active forms.'
              : 'Events unlock for feedback as soon as their start time is reached.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="rounded-xl bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98]"
            >
              Explore Campus Events
            </button>
            {activeTab !== 'all' && (
              <button
                onClick={() => setSearchParams({ tab: 'all' })}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
              >
                View All Events ({pastEvents.length})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedEvents.map((ev) => (
            <EventCard
              key={ev.registration_id || ev.id}
              event={{ ...ev, is_team_event: !!ev.team_members }}
              isPast={isEventPast(ev.event_date)}
              onViewDetails={() => navigate(`/events/${ev.id}`)}
              footer={feedbackFooter(ev)}
            />
          ))}
        </div>
      )}
    </div>
  );
}