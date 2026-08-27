import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Inbox } from 'lucide-react';
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

  // "Live" = the event has actually started (date + time), regardless of
  // which tab it's sorted into by date alone. An event starting 9am today
  // is feedback-eligible even though it's still listed under "Upcoming"
  // until midnight - so we check every registration, not just past ones.
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
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">My Registrations</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          {loading ? 'Loading...' : `${registrations.length} event${registrations.length === 1 ? '' : 's'} registered`}
        </p>
      </div>

      <div className="mb-5 flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          onClick={() => setSearchParams({ tab: 'upcoming' })}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            activeTab === 'upcoming' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Upcoming ({loading ? '—' : upcoming.length})
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'past' })}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            activeTab === 'past' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Past ({loading ? '—' : past.length})
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{error}</span>
          <button onClick={load} className="font-medium underline shrink-0">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-[20px] border border-slate-200 bg-slate-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white py-16 text-center">
          <Inbox className="mb-3 text-slate-300" size={32} />
          <p className="text-sm font-medium text-slate-700">
            {activeTab === 'upcoming' ? "You have no upcoming registrations" : "You have no past events yet"}
          </p>
          {activeTab === 'upcoming' && (
            <button onClick={() => navigate('/events')} className="mt-2 text-xs font-medium text-primary-600 hover:underline">
              Browse Events
            </button>
          )}
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
                    <span className="text-[11px] text-slate-400">Feedback opens once event starts</span>
                  ) : feedbackStatus[ev.id] === 'submitted' ? (
                    <span className="text-[11px] font-semibold text-emerald-600">Feedback Submitted ✓</span>
                  ) : feedbackStatus[ev.id] === 'open' ? (
                    <button
                      onClick={() => navigate(`/events/${ev.id}/feedback`)}
                      className="rounded-full bg-primary-50 px-3 py-1.5 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100"
                    >
                      Give Feedback
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">No feedback form yet</span>
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