import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, AlertCircle, Inbox, Users } from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { isEventPast } from '../../../shared/utils/eventStatus';

export default function MyRegistrations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ev) => {
            const style = getCategoryStyle(ev.category);
            const isPast = isEventPast(ev.event_date);
            return (
              <div
                key={ev.registration_id}
                className="rounded-[20px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <button onClick={() => navigate(`/events/${ev.id}`)} className="block w-full text-left">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>{ev.category}</span>
                      {ev.team_members ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-[11px] font-medium text-white">
                          <Users size={11} /> Team
                        </span>
                      ) : null}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                      isPast ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {isPast ? 'Ended' : ev.status}
                    </span>
                  </div>
                  <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-slate-900">{ev.title}</h3>
                  <div className="space-y-1.5 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5"><Calendar size={12} className="shrink-0" />{new Date(ev.event_date).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1.5"><MapPin size={12} className="shrink-0" />{ev.location}</div>
                  </div>
                </button>
                {activeTab === 'past' && (
                  <button
                    onClick={() => navigate(`/events/${ev.id}?tab=feedback`)}
                    className="mt-3 w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
                  >
                    Give Feedback
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}