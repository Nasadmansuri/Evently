import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, AlertCircle, Inbox, Plus } from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

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
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading...' : `${events.length} event${events.length === 1 ? '' : 's'} created`}
          </p>
        </div>
        <button
          onClick={() => navigate('/faculty/create-event')}
          className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] text-white font-medium py-2 px-4 rounded-lg text-sm transition-all"
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{error}</span>
          <button onClick={loadEvents} className="font-medium underline shrink-0">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Inbox className="text-gray-300 mb-3" size={32} />
          <p className="text-sm font-medium text-gray-700">You haven't created any events yet</p>
          <button
            onClick={() => navigate('/faculty/create-event')}
            className="text-xs text-primary-600 font-medium hover:underline mt-2"
          >
            Create your first event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => {
            const style = getCategoryStyle(ev.category);
            return (
              <button
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{ev.category}</span>
                  <span className="text-[11px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize">{ev.status}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-1">{ev.title}</h3>
                <div className="space-y-1 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5"><Calendar size={12} />{new Date(ev.event_date).toLocaleDateString()}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}