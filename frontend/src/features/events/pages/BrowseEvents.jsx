import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, AlertCircle, SearchX, CheckCircle2, List, CalendarDays, X, Users } from 'lucide-react';
import api from '../../../shared/services/api';
import EventCalendar from '../../../shared/components/EventCalendar';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { isEventPast } from '../../../shared/utils/eventStatus';
import { useAuth } from '../../../shared/context/AuthContext';
import { ACADEMIC_STRUCTURE } from '../../../shared/utils/academicCascade';
import { DEPARTMENT_DESIGNATIONS, COMMUNITIES } from '../../../shared/utils/facultyStructure';


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
    list = [...list].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    return list;
  }, [events, search, activeDepartment, dateFilter]);

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
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">All Events</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Browse and participate in exciting college events</p>
        </div>
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
              Department
            </label>
            <select
              value={activeDepartment}
              onChange={(e) => setActiveDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {dateFilter && viewMode === 'list' && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-xs text-primary-700">
          <Calendar size={13} />
          <span>Showing events on {new Date(dateFilter).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <button onClick={() => setDateFilter(null)} className="ml-auto flex items-center gap-1 font-semibold hover:underline">
            <X size={12} /> Clear
          </button>
        </div>
      )}

      {viewMode === 'list' && (
        <p className="text-xs text-slate-400 mb-3">
          {loading ? '' : `${filteredSorted.length} event${filteredSorted.length === 1 ? '' : 's'} found`}
        </p>
      )}

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
      ) : viewMode === 'calendar' ? (
        <EventCalendar
          events={calendarFiltered}
          onDayClick={handleDayClick}
          onEventClick={(id) => navigate(`/events/${id}`)}
        />
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
            const isPast = isEventPast(ev.event_date);
            const statusText = isPast ? 'ended' : (ev.status || 'upcoming').toLowerCase();

            return (
              <article
                key={ev.id}
                className="flex flex-col overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`relative flex h-40 w-full shrink-0 items-start justify-between overflow-hidden p-4 ${
                    ev.banner_image ? '' : headerTone
                  }`}
                >
                  {ev.banner_image && (
                    <>
                      <img
                        src={`${ASSET_BASE_URL}${ev.banner_image}`}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: 'center 32%' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/30" />
                    </>
                  )}
                  <div className="relative flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">
                      {ev.category}
                    </span>
                    {ev.is_team_event ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-600/95 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-sm">
                        <Users size={11} /> Team
                      </span>
                    ) : null}
                  </div>
                  <span className={`relative inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase shadow-sm ${
                    isPast ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-800'
                  }`}>
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
                      ) : isPast ? (
                        <span className="flex w-full items-center justify-center rounded-lg bg-slate-100 px-3 py-2.5 text-[13px] font-semibold text-slate-500">
                          Event Ended
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