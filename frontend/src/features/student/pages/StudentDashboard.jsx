import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, History, AlertCircle, Inbox, Image, ListChecks, MessageSquare, Users } from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { getStudentCourseLabel } from '../../../shared/utils/studentInfo';


export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const up = registrations.filter((r) => new Date(r.event_date) >= today);
    const pa = registrations.filter((r) => new Date(r.event_date) < today);
    return { upcoming: up, past: pa };
  }, [registrations]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Student Dashboard</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Welcome back, {user?.full_name}! Stay updated with upcoming events and participate in exciting activities.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700">
            College: {user?.college_name}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            {getStudentCourseLabel(user)}
          </span>
          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
            {user?.email}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{error}</span>
          <button onClick={loadRegistrations} className="font-medium underline shrink-0">Retry</button>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50">
            <CalendarCheck className="text-primary-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Total Registrations</p>
            <p className="text-xl font-bold text-slate-900">{loading ? '—' : registrations.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <CalendarCheck className="text-amber-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Upcoming</p>
            <p className="text-xl font-bold text-slate-900">{loading ? '—' : upcoming.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <History className="text-slate-600" size={18} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Past</p>
            <p className="text-xl font-bold text-slate-900">{loading ? '—' : past.length}</p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction icon="calendar" color="primary" label="Browse Events" sub="Find and register for events" onClick={() => navigate('/events')} />
        <QuickAction icon="image" color="green" label="Event Gallery" sub="Browse event photos" onClick={() => navigate('/student/gallery')} />
        <QuickAction icon="check" color="purple" label="My Registrations" sub="Track your participation" onClick={() => navigate('/student/my-registrations')} />
        <QuickAction icon="chat" color="amber" label="My Feedback" sub="Review and submit event feedback" onClick={() => navigate('/student/my-feedback')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <EventListCard
          title="My Upcoming Events"
          items={upcoming}
          loading={loading}
          emptyText="No upcoming events — browse events to get started"
          showRegisterLink
          onViewAll={() => navigate('/student/my-registrations?tab=upcoming')}
        />
        <EventListCard
          title="My Past Events"
          items={past}
          loading={loading}
          emptyText="No past events yet"
          onViewAll={() => navigate('/student/my-registrations?tab=past')}
        />
      </div>

      <RecommendedEvents />

    </div>
  );
}

function QuickAction({ icon, label, sub, onClick, disabled, color = 'blue' }) {
  const icons = {
    calendar: <CalendarCheck size={18} />,
    image: <Image size={18} />,
    check: <ListChecks size={18} />,
    chat: <MessageSquare size={18} />,
  };
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[18px] border border-slate-200 bg-white p-4 text-left shadow-sm transition ${
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
        {icons[icon]}
      </div>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-[11px] text-slate-500">{sub}</p>
    </button>
  );
}

function EventListCard({ title, items, loading, emptyText, showRegisterLink, onViewAll }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {items.length > 0 && (
          <button onClick={onViewAll} className="text-xs font-medium text-primary-600 hover:underline">View All →</button>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-xs text-slate-400">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 3).map((ev) => {
            const style = getCategoryStyle(ev.category);
            return (
              <div key={ev.registration_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{ev.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {ev.team_members ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-medium text-white">
                        <Users size={10} /> Team
                      </span>
                    ) : null}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>{ev.category}</span>
                  </div>
                </div>
                <p className="mb-2 text-[11px] text-slate-500">
                  {new Date(ev.event_date).toLocaleDateString()} · {ev.location}
                </p>
                {showRegisterLink && (
                  <button
                    onClick={() => navigate(`/events/${ev.id}`)}
                    className="text-[11px] font-medium text-primary-600 hover:underline"
                  >
                    View Event →
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
    <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Recommended For You</h2>
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {events.map((ev) => {
            const style = getCategoryStyle(ev.category);
            return (
              <button
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>{ev.category}</span>
                <p className="mt-1.5 text-sm font-medium text-slate-900">{ev.title}</p>
                <p className="text-[11px] text-slate-500">{new Date(ev.event_date).toLocaleDateString()} · {ev.location}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}