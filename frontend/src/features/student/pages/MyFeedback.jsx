import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Inbox } from 'lucide-react';
import api from '../../../shared/services/api';
import EventCard from '../../../shared/components/EventCard';

export default function MyFeedback() {
  const navigate = useNavigate();
  const [pastEvents, setPastEvents] = useState([]);
  const [feedbackStatus, setFeedbackStatus] = useState({}); // { eventId: 'none' | 'open' | 'submitted' }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/registrations/my');
      // "Started" = event has actually begun (date + time), not just a
      // date-only cutoff - an event starting 9am today is feedback-eligible
      // even though it's not "past" by date until midnight.
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

  function feedbackFooter(ev, status) {
    if (status === 'open') {
      return (
        <button
          onClick={() => navigate(`/events/${ev.id}/feedback`)}
          className="rounded-full bg-primary-50 px-3 py-1.5 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          Give Feedback
        </button>
      );
    }
    if (status === 'submitted') {
      return (
        <button
          onClick={() => navigate(`/events/${ev.id}/feedback`)}
          className="text-[11px] font-semibold text-emerald-600 hover:underline"
        >
          View Your Feedback →
        </button>
      );
    }
    return <span className="text-[11px] text-slate-400">No feedback form yet</span>;
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">My Feedback</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Feedback from events you've attended</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{error}</span>
          <button onClick={load} className="shrink-0 font-medium underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-72 animate-pulse rounded-[24px] border border-slate-200 bg-slate-100" />)}
        </div>
      ) : pastEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white py-16 px-6 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mb-3.5">
            <Inbox size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Past Attended Events</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            Feedback forms unlock automatically once events you're registered for begin. Browse campus events to get involved!
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="rounded-xl bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98]"
            >
              Explore Campus Events
            </button>
            <button
              onClick={() => navigate('/student/registrations')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
            >
              My Registrations
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-7">
          {pending.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <h2 className="text-sm font-bold text-slate-800">Pending Feedback</h2>
                <span className="text-xs text-slate-400">({pending.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((ev) => (
                  <EventCard
                    key={ev.registration_id}
                    event={{ ...ev, is_team_event: !!ev.team_members }}
                    isPast
                    onViewDetails={() => navigate(`/events/${ev.id}`)}
                    footer={feedbackFooter(ev, 'open')}
                  />
                ))}
              </div>
            </div>
          )}
          {submitted.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-bold text-slate-800">Submitted</h2>
                <span className="text-xs text-slate-400">({submitted.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {submitted.map((ev) => (
                  <EventCard
                    key={ev.registration_id}
                    event={{ ...ev, is_team_event: !!ev.team_members }}
                    isPast
                    onViewDetails={() => navigate(`/events/${ev.id}`)}
                    footer={feedbackFooter(ev, 'submitted')}
                  />
                ))}
              </div>
            </div>
          )}
          {unavailable.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <h2 className="text-sm font-bold text-slate-800">No Feedback Form Yet</h2>
                <span className="text-xs text-slate-400">({unavailable.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {unavailable.map((ev) => (
                  <EventCard
                    key={ev.registration_id}
                    event={{ ...ev, is_team_event: !!ev.team_members }}
                    isPast
                    onViewDetails={() => navigate(`/events/${ev.id}`)}
                    footer={feedbackFooter(ev, 'none')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}