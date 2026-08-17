import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, AlertCircle, SearchX, CheckCircle2 } from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { useAuth } from '../../../shared/context/AuthContext';


const CATEGORIES = ['All', 'Technical', 'Cultural', 'Workshop', 'Competition', 'Seminar', 'Sports', 'Conference'];

const HEADER_TONE = {
  Technical: 'bg-primary-600',
  Cultural: 'bg-slate-300',
  Workshop: 'bg-orange-500',
  Competition: 'bg-violet-600',
  Seminar: 'bg-amber-700',
  Sports: 'bg-pink-500',
  Conference: 'bg-slate-600',
};

export default function BrowseEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date-asc');
  const { user } = useAuth();

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const params = activeCategory !== 'All' ? { category: activeCategory } : {};
      const res = await api.get('/events', { params });
      setEvents(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [activeCategory]);

  const filteredSorted = useMemo(() => {
    let list = events.filter((ev) => ev.title.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'date-asc') list = [...list].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    if (sortBy === 'date-desc') list = [...list].sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    if (sortBy === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [events, search, sortBy]);

  function resetFilters() {
    setSearch('');
    setActiveCategory('All');
    setSortBy('date-asc');
  }

  function formatEventDate(value) {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">All Events</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Browse and participate in exciting college events</p>
      </div>

      <div className="mb-5 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Category
            </label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="date-asc">Date: Soonest</option>
              <option value="date-desc">Date: Latest</option>
              <option value="title">Title: A–Z</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        {loading ? '' : `${filteredSorted.length} event${filteredSorted.length === 1 ? '' : 's'} found`}
      </p>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            Couldn't load events. Try again.
          </span>
          <button onClick={loadEvents} className="font-medium underline shrink-0">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-44 rounded-[18px] bg-slate-100 animate-pulse" />)}
        </div>
      ) : filteredSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-[18px] border border-slate-100">
          <SearchX className="text-slate-300 mb-3" size={32} />
          <p className="text-sm font-medium text-slate-700">No events match your filters</p>
          <button onClick={resetFilters} className="text-xs text-primary-600 font-medium hover:underline mt-2">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {filteredSorted.map((ev) => {
            const headerTone = HEADER_TONE[ev.category] || 'bg-slate-300';
            const statusText = (ev.status || 'upcoming').toLowerCase();

            return (
              <article
                key={ev.id}
                className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`flex h-12 items-center justify-between px-3 ${headerTone}`}>
                  <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-slate-700 shadow-sm">
                    {ev.category}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 capitalize">
                    {statusText}
                  </span>
                </div>

                <div className="flex flex-col gap-3 p-4">
                  <h3 className="text-[1.5rem] font-bold leading-[1.15] tracking-tight text-slate-800">
                    {ev.title}
                  </h3>

                  <p className="line-clamp-2 text-[12px] leading-[1.6] text-slate-600">{ev.description}</p>

                  <div className="space-y-2 text-[13px] font-medium text-slate-700">
                    <div className="flex items-center gap-3">
                      <Calendar size={15} className="text-slate-500" />
                      <span>{formatEventDate(ev.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={15} className="text-slate-500" />
                      <span>{ev.location}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2.5 pt-1">
                    <button
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="w-full rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-[13px] font-semibold text-primary-700 transition hover:bg-primary-100"
                    >
                      View Details
                    </button>
                    {user?.role === 'student' && (
                      ev.is_registered ? (
                        <span className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold text-emerald-700">
                          <CheckCircle2 size={14} /> Already Registered
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`/events/${ev.id}/register`)}
                          className="w-full rounded-lg bg-primary-600 px-3 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-md"
                        >
                          Register Now
                        </button>
                      )
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}