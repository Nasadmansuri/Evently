import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, AlertCircle, Inbox, Plus, Trash2, Users, Search, List, CalendarDays, X } from 'lucide-react';
import api from '../../../shared/services/api';
import EventCalendar from '../../../shared/components/EventCalendar';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
import { useAuth } from '../../../shared/context/AuthContext';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { isEventPast } from '../../../shared/utils/eventStatus';
import { showToast } from '../../../shared/utils/toast';
import { ACADEMIC_STRUCTURE } from '../../../shared/utils/academicCascade';
import { DEPARTMENT_DESIGNATIONS, COMMUNITIES } from '../../../shared/utils/facultyStructure';

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Workshop', 'Competition', 'Seminar', 'Sports', 'Conference'];
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

export default function ManageEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDepartment, setActiveDepartment] = useState('All');
  const [viewMode, setViewMode] = useState('list');
  const [dateFilter, setDateFilter] = useState(null);

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/events/admin/all');
      setEvents(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEvents(); }, []);

   const filteredSorted = useMemo(() => {
    let list = events.filter((ev) => ev.title.toLowerCase().includes(search.toLowerCase()));
    if (activeCategory !== 'All') list = list.filter((ev) => ev.category === activeCategory);
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
  }, [events, search, activeCategory, activeDepartment, dateFilter]);

  const calendarFiltered = useMemo(() => {
    let list = events.filter((ev) => ev.title.toLowerCase().includes(search.toLowerCase()));
    if (activeCategory !== 'All') list = list.filter((ev) => ev.category === activeCategory);
    if (activeDepartment !== 'All') {
      if (activeDepartment.startsWith('community:')) {
        const community = activeDepartment.slice('community:'.length);
        list = list.filter((ev) => ev.organizing_community === community);
      } else {
        list = list.filter((ev) => ev.organizing_department === activeDepartment);
      }
    }
    return list;
  }, [events, search, activeCategory, activeDepartment]);

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

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      showToast.success('Event deleted');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Manage All Events</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            {loading ? 'Loading...' : `${events.length} event${events.length === 1 ? '' : 's'} across all faculty`}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => navigate('/admin/create-event')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition active:scale-[0.98] hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200"
          >
            <Plus size={16} /> Create Event
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
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
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Category</label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Department</label>
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
        <p className="mb-3 text-xs text-slate-400">
          {loading ? '' : `${filteredSorted.length} event${filteredSorted.length === 1 ? '' : 's'} found`}
        </p>
      )}

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{error}</span>
          <button onClick={loadEvents} className="shrink-0 font-medium underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-[20px] border border-slate-200 bg-slate-100" />)}
        </div>
      ) : viewMode === 'calendar' ? (
        <EventCalendar
          events={calendarFiltered}
          onDayClick={handleDayClick}
          onEventClick={(id) => navigate(`/events/${id}`)}
        />
      ) : filteredSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white py-16 text-center">
          <Inbox className="mb-3 text-slate-300" size={32} />
          <p className="text-sm font-medium text-slate-700">
            {events.length === 0 ? 'No events on the platform yet' : 'No events match your filters'}
          </p>
          {events.length > 0 && (
            <button onClick={resetFilters} className="mt-2 text-xs font-medium text-primary-600 hover:underline">
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSorted.map((ev) => {
            const style = getCategoryStyle(ev.category);
            const isOwn = ev.created_by === user?.id;
            const isPast = isEventPast(ev.event_date);
            return (
              <div key={ev.id} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`relative flex h-40 items-start justify-between overflow-hidden px-3 pt-3 ${ev.banner_image ? '' : ''}`}>
                  {ev.banner_image ? (
                    <>
                      <img
                        src={`${ASSET_BASE_URL}${ev.banner_image}`}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: 'center 32%' }}
                      />
                      <div className="absolute inset-0 bg-black/25" />
                    </>
                  ) : (
                    <div className={`absolute inset-0 ${style.bg}`} />
                  )}
                  <div className="relative flex items-center gap-1.5">
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm">{ev.category}</span>
                    {ev.is_team_event ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-600/90 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm">
                        <Users size={11} /> Team
                      </span>
                    ) : null}
                  </div>
                  <span className={`relative rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                    isPast ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {isPast ? 'Ended' : ev.status}
                  </span>
                </div>
                <div className="p-5">
                <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-slate-900">{ev.title}</h3>
                <p className="mb-2 text-[11px] text-slate-500">
                  {isOwn ? 'Created by you' : `By ${ev.organizer_name}`}
                </p>
                <div className="mb-3 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5"><Calendar size={12} />{new Date(ev.event_date).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1.5"><MapPin size={12} />{ev.location}</div>
                  <div className="flex items-center gap-1.5"><Users size={12} />{ev.registration_count} registered</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/events/${ev.id}`)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/admin/events/${ev.id}/edit`)}
                    className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    Edit
                  </button>
                </div>

                {confirmId === ev.id ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(ev.id)}
                      disabled={deletingId === ev.id}
                      className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === ev.id ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(ev.id)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 size={13} /> Delete Event
                  </button>
                )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}