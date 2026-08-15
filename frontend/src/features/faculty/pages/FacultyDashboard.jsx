import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, TrendingUp, Plus, CalendarSearch, Images, AlertCircle } from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, upcomingEvents: 0 });
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
      setEvents(eventsRes.data);
      setStats(statsRes.data);
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
    <div>
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Welcome back, {user?.full_name}! Manage your events and track participation.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
            Department: {user?.department}
          </span>
          <span className="bg-green-50 text-green-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
            Faculty ID: {user?.faculty_id_code}
          </span>
          <span className="bg-purple-50 text-purple-700 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize">
            Status: {user?.approval_status}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </span>
          <button onClick={loadDashboard} className="font-medium underline shrink-0">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <CalendarDays className="text-blue-600" size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">My Events</p>
            <p className="text-xl font-bold text-gray-900">{loading ? '—' : stats.totalEvents}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <TrendingUp className="text-amber-600" size={18} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Upcoming Events</p>
            <p className="text-xl font-bold text-gray-900">{loading ? '—' : stats.upcomingEvents}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">My Recent Events</h2>
            {events.length > 0 && (
              <button onClick={() => navigate('/faculty/my-events')} className="text-xs text-primary-600 font-medium hover:underline">
                View All →
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />)}
            </div>
          ) : events.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No events yet — create your first one.</p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 3).map((ev) => (
                <div key={ev.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(ev.event_date).toLocaleDateString()} · {ev.category}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize">
                    {ev.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/faculty/create-event')}
              className="w-full flex items-center gap-3 bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] text-white rounded-xl px-4 py-3 text-left transition-all"
            >
              <Plus size={18} />
              <div>
                <p className="text-sm font-medium">Create New Event</p>
                <p className="text-[11px] text-white/80">Organize a new campus event</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/events')}
              className="w-full flex items-center gap-3 border border-gray-200 hover:bg-gray-50 rounded-xl px-4 py-3 text-left transition"
            >
              <CalendarSearch size={18} className="text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Browse All Events</p>
                <p className="text-[11px] text-gray-400">View all college events</p>
              </div>
            </button>
            <button
              disabled
              className="w-full flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-left opacity-50 cursor-not-allowed"
            >
              <Images size={18} className="text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Event Gallery</p>
                <p className="text-[11px] text-gray-400">Coming soon</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}