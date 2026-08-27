import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, AlertCircle, Inbox, Plus, Users } from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

export default function MyEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/events/my-events');
      setEvents(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">My Events</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            {loading ? 'Loading...' : `${events.length} event${events.length === 1 ? '' : 's'} created`}
          </p>
        </div>
        <button
          onClick={() => navigate('/faculty/create-event')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition active:scale-[0.98] hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200"
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{error}</span>
          <button onClick={loadEvents} className="shrink-0 font-medium underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-[20px] border border-slate-200 bg-slate-100" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white py-16 text-center">
          <Inbox className="mb-3 text-slate-300" size={32} />
          <p className="text-sm font-medium text-slate-700">You haven't created any events yet</p>
          <button
            onClick={() => navigate('/faculty/create-event')}
            className="text-xs text-primary-600 font-medium hover:underline mt-2"
          >
            Create your first event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const style = getCategoryStyle(ev.category);
            const isPast = isEventPast(ev.event_date);
            const liveStatus = getEventStatus(ev.event_date, ev.event_time);
            return (
              <div
                key={ev.id}
                className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  {ev.banner_image ? (
                    <img
                      src={`${ASSET_BASE_URL}${ev.banner_image}`}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="h-full w-full object-cover"
                      style={{ objectPosition: 'center 32%' }}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-primary-950 to-primary-900 p-4 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-xs mb-1 border border-white/10">
                        <Calendar size={18} className="text-emerald-300" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80 line-clamp-1">
                        {ev.category || 'Event'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                <button onClick={() => navigate(`/events/${ev.id}`)} className="block w-full text-left">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>{ev.category}</span>
                      {ev.is_team_event ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-[11px] font-medium text-white">
                          <Users size={11} /> Team
                        </span>
                      ) : null}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                      liveStatus === 'ended'
                        ? 'bg-slate-100 text-slate-500'
                        : liveStatus === 'ongoing'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {liveStatus === 'ongoing' ? 'Ongoing' : isPast ? 'Ended' : ev.status}
                    </span>
                  </div>
                  <h3 className="mb-2 line-clamp-1 text-sm font-semibold text-slate-900">{ev.title}</h3>
                  <div className="space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5"><Calendar size={12} />{new Date(ev.event_date).toLocaleDateString()}</div>
                  </div>
                </button>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => navigate(`/faculty/events/${ev.id}/edit`)}
                    className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/faculty/events/${ev.id}/feedback`)}
                    className="flex-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
                  >
                    Feedback
                  </button>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}