import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, AlertCircle, Inbox, CheckCircle2, MessageSquare } from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const past = res.data.filter((r) => new Date(r.event_date) < today);
      setPastEvents(past);

      const statusEntries = await Promise.all(
        past.map(async (ev) => {
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

  function EventCard({ ev, status }) {
    const style = getCategoryStyle(ev.category);
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <button onClick={() => navigate(`/events/${ev.id}`)} className="block w-full text-left">
          <div className="mb-3 flex items-center justify-between">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>{ev.category}</span>
            {status === 'submitted' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 size={11} /> Submitted
              </span>
            )}
            {status === 'open' && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                Pending
              </span>
            )}
          </div>
          <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-slate-900">{ev.title}</h3>
          <div className="space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5"><Calendar size={12} className="shrink-0" />{new Date(ev.event_date).toLocaleDateString()}</div>
            <div className="flex items-center gap-1.5"><MapPin size={12} className="shrink-0" />{ev.location}</div>
          </div>
        </button>
        {status === 'open' && (
          <button
            onClick={() => navigate(`/events/${ev.id}/feedback`)}
            className="mt-3 w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
          >
            Give Feedback
          </button>
        )}
      </div>
    );
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
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-[20px] border border-slate-200 bg-slate-100" />)}
        </div>
      ) : pastEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white py-16 text-center">
          <Inbox className="mb-3 text-slate-300" size={32} />
          <p className="text-sm font-medium text-slate-700">No past events yet</p>
          <p className="mt-1 text-xs text-slate-400">Feedback becomes available after you attend an event.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Pending Feedback ({pending.length})</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((ev) => <EventCard key={ev.registration_id} ev={ev} status="open" />)}
              </div>
            </div>
          )}
          {submitted.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Submitted ({submitted.length})</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {submitted.map((ev) => <EventCard key={ev.registration_id} ev={ev} status="submitted" />)}
              </div>
            </div>
          )}
          {unavailable.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <MessageSquare size={14} className="text-slate-400" /> No Feedback Form Yet ({unavailable.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unavailable.map((ev) => <EventCard key={ev.registration_id} ev={ev} status="none" />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}