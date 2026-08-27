import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, AlertCircle, SearchX, CheckCircle2, List, CalendarDays, X, Users } from 'lucide-react';
import api from '../../../shared/services/api';
import EventCalendar from '../../../shared/components/EventCalendar';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';
import { useAuth } from '../../../shared/context/AuthContext';
import { ACADEMIC_STRUCTURE } from '../../../shared/utils/academicCascade';
import { DEPARTMENT_DESIGNATIONS, COMMUNITIES } from '../../../shared/utils/facultyStructure';
import EventCard from '../../../shared/components/EventCard';


const CATEGORIES = ['All', 'Technical', 'Cultural', 'Workshop', 'Competition', 'Seminar', 'Sports', 'Conference'];
const ORGANIZING_DEPARTMENTS = [
  'All',
  ...Object.keys(ACADEMIC_STRUCTURE),
  ...Object.keys(DEPARTMENT_DESIGNATIONS),
  'DevCorps',
];
const HEADER_TONE = {
  Technical: 'bg-primary-600',
  Cultural: 'bg-slate-300',
  Workshop: 'bg-orange-500',
  Competition: 'bg-violet-600',
  Seminar: 'bg-amber-700',
  Sports: 'bg-pink-500',
  Conference: 'bg-slate-600',
};
function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function BrowseEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDepartment, setActiveDepartment] = useState('All');
  const [viewMode, setViewMode] = useState('list');
  const [dateFilter, setDateFilter] = useState(null);
  const [ongoingOnly, setOngoingOnly] = useState(false);
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
    if (activeDepartment !== 'All') {
      if (activeDepartment.startsWith('community:')) {
        const community = activeDepartment.slice('community:'.length);
        list = list.filter((ev) => ev.organizing_community === community);
      } else {
        list = list.filter((ev) => ev.organizing_department === activeDepartment);
      }
    }
    if (dateFilter) list = list.filter((ev) => dateKey(ev.event_date) === dateFilter);
    if (ongoingOnly) list = list.filter((ev) => getEventStatus(ev.event_date, ev.event_time) === 'ongoing');
    list = [...list].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    return list;
  }, [events, search, activeDepartment, dateFilter, ongoingOnly]);

  const calendarFiltered = useMemo(() => {
    let list = events.filter((ev) => ev.title.toLowerCase().includes(search.toLowerCase()));
    if (activeDepartment !== 'All') {
      if (activeDepartment.startsWith('community:')) {
        const community = activeDepartment.slice('community:'.length);
        list = list.filter((ev) => ev.organizing_community === community);
      } else {
        list = list.filter((ev) => ev.organizing_department === activeDepartment);
      }
    }
    return list;
  }, [events, search, activeDepartment]);

  function resetFilters() {
    setSearch('');
    setActiveCategory('All');
    setActiveDepartment('All');
    setDateFilter(null);
  }

  function handleDayClick(key) {
    setDateFilter(key);
    setViewMode('list');
  }

  function formatEventDate(value) {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">All Campus Events</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Browse and participate in exciting college workshops, hackathons, and festivals</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOngoingOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              ongoingOnly
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              {ongoingOnly && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${ongoingOnly ? 'bg-amber-600' : 'bg-slate-300'}`} />
            </span>
            Ongoing Only
          </button>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'calendar' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays size={14} /> Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Quick Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                isActive
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat === 'All' ? '🌟 All Events' : cat}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, keywords..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-700 transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Category
            </label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Department
            </label>
            <select
              value={activeDepartment}
              onChange={(e) => setActiveDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="All">All Departments</option>
              {ORGANIZING_DEPARTMENTS.filter((dept) => dept !== 'All').map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
              <optgroup label="DevCorps Communities">
                {COMMUNITIES.filter((c) => c !== 'N/A').map((c) => (
                  <option key={c} value={`community:${c}`}>{c}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {dateFilter && viewMode === 'list' && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50/80 px-4 py-2.5 text-xs font-medium text-primary-800 animate-in fade-in duration-150">
          <Calendar size={14} className="text-primary-600" />
          <span>Showing events on <strong>{new Date(dateFilter).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
          <button onClick={() => setDateFilter(null)} className="ml-auto flex items-center gap-1 font-bold hover:underline">
            <X size={13} /> Clear
          </button>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2 px-1">
          <span>{loading ? 'Finding events...' : `${filteredSorted.length} campus event${filteredSorted.length === 1 ? '' : 's'} available`}</span>
          {activeCategory !== 'All' && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
              Filter: {activeCategory}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            Couldn't load events. Try again.
          </span>
          <button onClick={loadEvents} className="font-bold underline shrink-0">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-[24px] bg-slate-100/90 animate-pulse border border-slate-200/60 p-4" />
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        <EventCalendar
          events={calendarFiltered}
          onDayClick={handleDayClick}
          onEventClick={(id) => navigate(`/events/${id}`)}
        />
      ) : filteredSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-[26px] border border-slate-200/80 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mb-3 shadow-xs border border-primary-100/80">
            <SearchX size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No events match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            We couldn't find any events matching your search or filters. Try adjusting your search term or clearing filters.
          </p>
          <button
            onClick={resetFilters}
            className="rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs px-4 py-2.5 shadow-xs active:scale-95 transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSorted.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              isPast={isEventPast(ev.event_date)}
              onViewDetails={() => navigate(`/events/${ev.id}`)}
              onRegister={() => navigate(`/events/${ev.id}/register`)}
              showRegisterAction={user?.role === 'student'}
            />
          ))}
        </div>
      )}
    </div>
  );
}