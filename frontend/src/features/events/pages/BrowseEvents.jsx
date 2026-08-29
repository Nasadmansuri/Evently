import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Calendar, MapPin, AlertCircle, SearchX, CheckCircle2, List, CalendarDays, X, Users, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/services/api';
import EventCalendar from '../../../shared/components/EventCalendar';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';
import { useAuth } from '../../../shared/context/AuthContext';
import { ACADEMIC_STRUCTURE } from '../../../shared/utils/academicCascade';
import { DEPARTMENT_DESIGNATIONS, COMMUNITIES } from '../../../shared/utils/facultyStructure';
import EventCard from '../../../shared/components/EventCard';
import { ALL_CATEGORIES } from '../../../shared/utils/categoryColors';

const CATEGORIES = ['All', ...ALL_CATEGORIES];
const ORGANIZING_DEPARTMENTS = [
  'All',
  ...Object.keys(ACADEMIC_STRUCTURE),
  ...Object.keys(DEPARTMENT_DESIGNATIONS),
  'DevCorps',
];

function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function BrowseEvents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDepartment, setActiveDepartment] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [dateFilter, setDateFilter] = useState(null);
  const [statusTab, setStatusTab] = useState('upcoming'); // 'upcoming' | 'ongoing' | 'concluded' | 'all'
  const { user } = useAuth();

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const params = activeCategory !== 'All' ? { category: activeCategory } : {};
      const res = await api.get('/events', { params });
      setEvents(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [activeCategory]);

  const ongoingEventsCount = useMemo(() => {
    return events.filter((ev) => getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at) === 'ongoing').length;
  }, [events]);

  const filteredSorted = useMemo(() => {
    let list = events.filter((ev) =>
      ev.title?.toLowerCase().includes(search.toLowerCase()) ||
      ev.description?.toLowerCase().includes(search.toLowerCase()) ||
      ev.location?.toLowerCase().includes(search.toLowerCase())
    );
    if (activeDepartment !== 'All') {
      if (activeDepartment.startsWith('community:')) {
        const community = activeDepartment.slice('community:'.length);
        list = list.filter((ev) => ev.organizing_community === community);
      } else {
        list = list.filter((ev) => ev.organizing_department === activeDepartment);
      }
    }
    if (dateFilter) list = list.filter((ev) => dateKey(ev.event_date) === dateFilter);

    if (statusTab === 'upcoming') {
      list = list.filter((ev) => {
        const st = getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at);
        return st === 'upcoming' || st === 'ongoing';
      });
      list = [...list].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    } else if (statusTab === 'ongoing') {
      list = list.filter((ev) => getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at) === 'ongoing');
      list = [...list].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    } else if (statusTab === 'concluded') {
      list = list.filter((ev) => {
        const st = getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at);
        return st === 'ended';
      });
      list = [...list].sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    } else {
      list = [...list].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    }

    return list;
  }, [events, search, activeDepartment, dateFilter, statusTab]);

  const calendarFiltered = useMemo(() => {
    let list = events.filter((ev) =>
      ev.title?.toLowerCase().includes(search.toLowerCase()) ||
      ev.description?.toLowerCase().includes(search.toLowerCase())
    );
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
    setStatusTab('upcoming');
  }

  function handleDayClick(key) {
    setDateFilter(key);
    setViewMode('list');
    setStatusTab('all');
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & View Toggle Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-800 border border-primary-100/80">
              Campus Feed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            All Campus Events
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Browse and participate in exciting college hackathons, technical workshops, cultural fests, and seminars.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* List vs Calendar Toggle in a Recessed Tray */}
          <div className="skeuo-tray flex rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {viewMode === 'list' && (
                <motion.div
                  layoutId="viewModePill"
                  className="absolute inset-0 rounded-lg skeuo-pill-active"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5"><List size={14} /> List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calendar' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {viewMode === 'calendar' && (
                <motion.div
                  layoutId="viewModePill"
                  className="absolute inset-0 rounded-lg skeuo-pill-active"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5"><CalendarDays size={14} /> Calendar View</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar with Tactile Bevel */}
      <div className="skeuo-card rounded-2xl p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, venue, topic..."
                className="skeuo-input w-full rounded-xl py-2.5 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Event Category
            </label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="skeuo-input w-full rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Department / DevCorps
            </label>
            <select
              value={activeDepartment}
              onChange={(e) => setActiveDepartment(e.target.value)}
              className="skeuo-input w-full rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700"
            >
              <option value="All">All Departments & Communities</option>
              {ORGANIZING_DEPARTMENTS.filter((dept) => dept !== 'All').map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
              <optgroup label="DevCorps Student Communities">
                {COMMUNITIES.filter((c) => c !== 'N/A').map((c) => (
                  <option key={c} value={`community:${c}`}>{c}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="skeuo-btn-secondary w-full rounded-xl px-3 py-2.5 text-xs"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {dateFilter && viewMode === 'list' && (
        <div className="flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-2.5 text-xs font-medium text-primary-800 shadow-2xs animate-in fade-in duration-150">
          <Calendar size={14} className="text-primary-600 shrink-0" />
          <span>Showing events on <strong>{new Date(dateFilter).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
          <button onClick={() => setDateFilter(null)} className="ml-auto flex items-center gap-1 font-bold hover:underline">
            <X size={13} /> Clear
          </button>
        </div>
      )}

      {/* 3. Event Status Tabs (Skeuomorphic Segmented Tray with Tactile Active Pill) */}
      {viewMode === 'list' && (
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200/80 pb-3">
          <div className="skeuo-tray flex items-center gap-1 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusTab('upcoming')}
              className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusTab === 'upcoming' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {statusTab === 'upcoming' && (
                <motion.div
                  layoutId="browseEventsStatusPill"
                  className="absolute inset-0 rounded-lg skeuo-pill-active"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">Upcoming & Live</span>
            </button>

            {ongoingEventsCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusTab('ongoing')}
                className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  statusTab === 'ongoing' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {statusTab === 'ongoing' && (
                  <motion.div
                    layoutId="browseEventsStatusPill"
                    className="absolute inset-0 rounded-lg skeuo-pill-active !bg-emerald-600 !border-emerald-800"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${statusTab === 'ongoing' ? 'bg-white' : 'bg-emerald-500'}`} />
                  </span>
                  <span>Live Now ({ongoingEventsCount})</span>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setStatusTab('concluded')}
              className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusTab === 'concluded' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {statusTab === 'concluded' && (
                <motion.div
                  layoutId="browseEventsStatusPill"
                  className="absolute inset-0 rounded-lg skeuo-pill-active"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">Past & Concluded</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('all')}
              className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusTab === 'all' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {statusTab === 'all' && (
                <motion.div
                  layoutId="browseEventsStatusPill"
                  className="absolute inset-0 rounded-lg skeuo-pill-active"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">All Events</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{loading ? 'Finding events...' : `${filteredSorted.length} campus event${filteredSorted.length === 1 ? '' : 's'} found`}</span>
            {activeCategory !== 'All' && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                {activeCategory}
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 shadow-xs">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            Couldn't load events. Try again.
          </span>
          <button onClick={loadEvents} className="font-bold underline shrink-0 hover:text-rose-900">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60 p-4" />
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        <EventCalendar
          events={calendarFiltered}
          onDayClick={handleDayClick}
          onEventClick={(id) => navigate(`/events/${id}`)}
        />
      ) : filteredSorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs"
        >
          <div className="h-14 w-14 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center mb-3 shadow-2xs border border-primary-100">
            <SearchX size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No events match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
            We couldn't find any events matching your search or filters. Try adjusting your search keywords or clearing active filters.
          </p>
          <button
            onClick={resetFilters}
            className="rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs px-5 py-2.5 shadow-xs active:scale-95 transition-all"
          >
            Clear All Filters
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSorted.map((ev, idx) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
            >
              <EventCard
                event={ev}
                isPast={isEventPast(ev.event_date, ev.event_time)}
                onViewDetails={() => navigate(`/events/${ev.id}`)}
                onRegister={() => navigate(`/events/${ev.id}/register`)}
                showRegisterAction={user?.role === 'student'}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}