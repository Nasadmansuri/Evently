import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, AlertCircle, SearchX } from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Workshop', 'Competition', 'Seminar', 'Sports', 'Conference'];

export default function BrowseEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date-asc');

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

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Events</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Browse and participate in exciting college events</p>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="w-full border border-gray-200 bg-gray-50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
              activeCategory === cat
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-gray-200 bg-gray-50 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="date-asc">Date: Soonest</option>
            <option value="date-desc">Date: Latest</option>
            <option value="title">Title: A–Z</option>
          </select>
          <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Reset Filters
          </button>
        </div>
        <p className="text-xs text-gray-400">
          {loading ? '' : `${filteredSorted.length} event${filteredSorted.length === 1 ? '' : 's'} found`}
        </p>
      </div>

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
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : filteredSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-2xl border border-gray-100">
          <SearchX className="text-gray-300 mb-3" size={32} />
          <p className="text-sm font-medium text-gray-700">No events match your filters</p>
          <button onClick={resetFilters} className="text-xs text-primary-600 font-medium hover:underline mt-2">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSorted.map((ev) => {
            const style = getCategoryStyle(ev.category);
            return (
              <button
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    {ev.category}
                  </span>
                  <span className="text-[11px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize">
                    {ev.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{ev.title}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{ev.description}</p>
                <div className="space-y-1 text-[11px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(ev.event_date).toLocaleDateString()} · {ev.event_time?.slice(0, 5)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    {ev.location}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}