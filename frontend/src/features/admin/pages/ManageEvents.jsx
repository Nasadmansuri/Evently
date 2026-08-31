import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, AlertCircle, Inbox, Plus, Trash2, Users,
  Search, List, CalendarDays, X, Edit3, ArrowRight, Loader2,
  AlertTriangle, ShieldAlert, Check
} from 'lucide-react';
import api from '../../../shared/services/api';
import EventCalendar from '../../../shared/components/EventCalendar';
import { useAuth } from '../../../shared/context/AuthContext';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';
import { showToast } from '../../../shared/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ACADEMIC_STRUCTURE } from '../../../shared/utils/academicCascade';
import { DEPARTMENT_DESIGNATIONS, COMMUNITIES } from '../../../shared/utils/facultyStructure';
import { ALL_CATEGORIES } from '../../../shared/utils/categoryColors';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

const CATEGORIES = ['All', ...ALL_CATEGORIES];
const ORGANIZING_DEPARTMENTS = [
  'All',
  ...new Set([
    ...Object.keys(ACADEMIC_STRUCTURE),
    ...Object.keys(DEPARTMENT_DESIGNATIONS),
  ]),
];

function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function ManageEvents() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [statusTab, setStatusTab] = useState('upcoming'); // 'upcoming' | 'ongoing' | 'concluded' | 'deletion_requests' | 'all'

  const [reviewRequestEvent, setReviewRequestEvent] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolvingRequest, setResolvingRequest] = useState(false);
  const [directDeleteEvent, setDirectDeleteEvent] = useState(null);
  const [directDeleteReason, setDirectDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    if (searchParams.get('filter') === 'deletion-requests') {
      setStatusTab('deletion_requests');
    }
  }, [searchParams]);

  const pendingRequests = useMemo(() => {
    return events.filter((e) => e.deletion_request_id);
  }, [events]);

  const ongoingEventsCount = useMemo(() => {
    return events.filter((ev) => getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at) === 'ongoing').length;
  }, [events]);

  const filteredSorted = useMemo(() => {
    let list = events.filter((ev) =>
      ev.title?.toLowerCase().includes(search.toLowerCase()) ||
      ev.description?.toLowerCase().includes(search.toLowerCase())
    );
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

    if (statusTab === 'upcoming') {
      list = list.filter((ev) => {
        const st = getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at);
        return st === 'upcoming' || st === 'ongoing' || st === 'scheduled';
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
    } else if (statusTab === 'deletion_requests') {
      list = list.filter((ev) => ev.deletion_request_id);
      list = [...list].sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    } else {
      list = [...list].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    }

    return list;
  }, [events, search, activeCategory, activeDepartment, dateFilter, statusTab]);

  const calendarFiltered = useMemo(() => {
    let list = events.filter((ev) =>
      ev.title?.toLowerCase().includes(search.toLowerCase()) ||
      ev.description?.toLowerCase().includes(search.toLowerCase())
    );
    if (activeCategory !== 'All') list = list.filter((ev) => ev.category === activeCategory);
    if (activeDepartment !== 'All') {
      if (activeDepartment.startsWith('community:')) {
        const community = activeDepartment.slice('community:'.length);
        list = list.filter((ev) => ev.organizing_community === community);
      } else {
        list = list.filter((ev) => ev.organizing_department === activeDepartment);
      }
    }
    if (statusTab === 'deletion_requests') list = list.filter((ev) => ev.deletion_request_id);
    return list;
  }, [events, search, activeCategory, activeDepartment, statusTab]);

  function resetFilters() {
    setSearch('');
    setActiveCategory('All');
    setActiveDepartment('All');
    setDateFilter(null);
    setStatusTab('upcoming');
    if (searchParams.get('filter')) {
      setSearchParams({});
    }
  }

  function handleDayClick(key) {
    setDateFilter(key);
    setViewMode('list');
    setStatusTab('all');
  }

  async function handleResolveRequest(approved) {
    if (!reviewRequestEvent) return;
    setResolvingRequest(true);
    try {
      await api.post(`/events/admin/deletion-requests/${reviewRequestEvent.deletion_request_id}/resolve`, {
        approved,
        adminNotes,
      });
      if (approved) {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === reviewRequestEvent.id
              ? { ...ev, status: 'cancelled', deletion_request_id: null }
              : ev
          )
        );
        showToast.success(`Deletion request approved. "${reviewRequestEvent.title}" is now marked as Cancelled and will be deleted after 10 minutes.`);
      } else {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === reviewRequestEvent.id
              ? { ...ev, deletion_request_id: null, deletion_reason: null, deletion_problem: null }
              : ev
          )
        );
        showToast.success('Deletion request rejected. Requester notified.');
      }
      setReviewRequestEvent(null);
      setAdminNotes('');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to resolve deletion request');
    } finally {
      setResolvingRequest(false);
    }
  }

  async function handleDirectDelete(e) {
    if (e) e.preventDefault();
    if (!directDeleteEvent) return;
    if (!directDeleteReason.trim()) {
      return showToast.error('Please provide a reason for deleting this event');
    }

    setIsDeleting(true);
    try {
      await api.delete(`/events/${directDeleteEvent.id}`, {
        data: { reason: directDeleteReason.trim() },
      });
      setEvents((prev) => prev.filter((ev) => ev.id !== directDeleteEvent.id));
      showToast.success(`"${directDeleteEvent.title}" deleted and organizer notified.`);
      setDirectDeleteEvent(null);
      setDirectDeleteReason('');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Manage All Events</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {loading ? 'Loading...' : `${events.length} campus event${events.length === 1 ? '' : 's'} across all departments & organizers`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* List vs Calendar Toggle in a Recessed Tray */}
          <div className="skeuo-tray flex rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${viewMode === 'list' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {viewMode === 'list' && (
                <motion.div
                  layoutId="manageEventsViewModePill"
                  className="absolute inset-0 rounded-lg skeuo-pill-active"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5"><List size={14} /> List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${viewMode === 'calendar' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {viewMode === 'calendar' && (
                <motion.div
                  layoutId="manageEventsViewModePill"
                  className="absolute inset-0 rounded-lg skeuo-pill-active"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5"><CalendarDays size={14} /> Calendar View</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/admin/create-event')}
            className="skeuo-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs cursor-pointer"
          >
            <Plus size={15} /> Create Event
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="skeuo-card rounded-[24px] p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event title or keywords..."
                className="skeuo-input w-full rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Category</label>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="skeuo-input w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-wider text-slate-500">Department</label>
            <select
              value={activeDepartment}
              onChange={(e) => setActiveDepartment(e.target.value)}
              className="skeuo-input w-full rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
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
              className="skeuo-btn-secondary w-full rounded-xl px-3 py-2 text-xs"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {dateFilter && viewMode === 'list' && (
        <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-xs text-primary-800">
          <Calendar size={14} className="text-primary-600" />
          <span>Showing events on {new Date(dateFilter).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <button onClick={() => setDateFilter(null)} className="ml-auto flex items-center gap-1 font-bold text-primary-700 hover:underline">
            <X size={13} /> Clear Date Filter
          </button>
        </div>
      )}

      {/* 3. Event Status Tabs (Skeuomorphic Segmented Tray with Tactile Active Pill) */}
      {viewMode === 'list' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="skeuo-tray flex items-center gap-1 p-1 rounded-xl overflow-x-auto scrollbar-none w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusTab('upcoming')}
              className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${statusTab === 'upcoming' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {statusTab === 'upcoming' && (
                <motion.div
                  layoutId="manageEventsStatusPill"
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
                className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${statusTab === 'ongoing' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {statusTab === 'ongoing' && (
                  <motion.div
                    layoutId="manageEventsStatusPill"
                    className="absolute inset-0 rounded-lg skeuo-pill-active !bg-emerald-600 !border-emerald-800"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${statusTab === 'ongoing' ? 'bg-white' : 'bg-emerald-500'}`} />
                  <span>Live Now ({ongoingEventsCount})</span>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setStatusTab('concluded')}
              className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${statusTab === 'concluded' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {statusTab === 'concluded' && (
                <motion.div
                  layoutId="manageEventsStatusPill"
                  className="absolute inset-0 rounded-lg skeuo-pill-active"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">Past & Concluded</span>
            </button>

            {pendingRequests.length > 0 && (
              <button
                type="button"
                onClick={() => setStatusTab('deletion_requests')}
                className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${statusTab === 'deletion_requests' ? 'text-white' : 'text-rose-700 hover:text-rose-900'
                  }`}
              >
                {statusTab === 'deletion_requests' && (
                  <motion.div
                    layoutId="manageEventsStatusPill"
                    className="absolute inset-0 rounded-lg skeuo-pill-active !bg-rose-600 !border-rose-800"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${statusTab === 'deletion_requests' ? 'bg-white' : 'bg-rose-500'}`} />
                  <span>Deletion Requests ({pendingRequests.length})</span>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setStatusTab('all')}
              className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${statusTab === 'all' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {statusTab === 'all' && (
                <motion.div
                  layoutId="manageEventsStatusPill"
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
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600">
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            {error}
          </span>
          <button onClick={loadEvents} className="font-semibold underline cursor-pointer">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100" />
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        <EventCalendar
          events={calendarFiltered}
          onDayClick={handleDayClick}
          onEventClick={(id) => navigate(`/events/${id}`)}
        />
      ) : filteredSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white py-16 text-center shadow-xs">
          <Inbox className="mb-3 text-slate-300" size={32} />
          <p className="text-sm font-bold text-slate-800">
            {events.length === 0 ? 'No events on the platform yet' : 'No events match your search criteria'}
          </p>
          {events.length > 0 && (
            <button onClick={resetFilters} className="mt-2 text-xs font-bold text-primary-700 hover:underline cursor-pointer">
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSorted.map((ev, idx) => {
            const style = getCategoryStyle(ev.category);
            const isPast = isEventPast(ev.event_date);
            const liveStatus = getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at);
            const isDeleting = deletingId === ev.id;
            const isConfirming = confirmId === ev.id;

            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="group flex flex-col cursor-pointer overflow-hidden rounded-[22px] border border-slate-200/85 bg-white p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-md"
              >
                {/* 16:10 Inset Banner Cover */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-slate-100 ring-1 ring-black/5">
                  {ev.banner_image ? (
                    <img
                      src={ev.banner_image}
                      alt={ev.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ objectPosition: 'center 30%' }}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#023433] via-[#035352] to-[#012424] p-4 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md mb-1.5 border border-white/15">
                        <CalendarDays size={18} className="text-emerald-300" />
                      </div>
                      <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-emerald-200/90 line-clamp-1">
                        {ev.category || 'Event'}
                      </span>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-5" />

                  {/* Live Status Badge */}
                  <span className={`absolute right-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${ev.status === 'cancelled'
                      ? 'bg-rose-600 text-white'
                      : liveStatus === 'scheduled'
                        ? 'bg-amber-600 text-white'
                        : liveStatus === 'ended'
                          ? 'bg-slate-800/90 text-white'
                          : liveStatus === 'ongoing'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-primary-700 text-white'
                    }`}>
                    {ev.status === 'cancelled' ? 'Cancelled' : liveStatus === 'scheduled' ? 'Scheduled' : liveStatus === 'ongoing' ? 'Live Now' : liveStatus === 'ended' ? 'Concluded' : 'Upcoming'}
                  </span>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col pt-3.5 px-1">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-md px-2.5 py-0.5 text-[10.5px] font-bold ${style.bg} ${style.text}`}>
                        {ev.category}
                      </span>
                      {ev.is_team_event ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 border border-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">
                          <Users size={10} /> Team
                        </span>
                      ) : null}
                    </div>

                    <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-100">
                      {ev.registration_count || 0} {ev.registration_count === 1 ? 'Registration' : 'Registrations'}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900 group-hover:text-primary-700 transition">
                    {ev.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {ev.description || 'No description provided.'}
                  </p>

                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{new Date(ev.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {ev.event_time && (
                        <>
                          <span>·</span>
                          <Clock size={12} className="text-slate-400" />
                          <span>{formatTime12hr(ev.event_time)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{ev.location || 'Biratnagar International College'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium truncate pt-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Organizer:</span>
                      <span className="truncate" title={ev.organizing_community ? `${ev.organizing_department} (${ev.organizing_community})` : ev.organizing_department}>
                        {ev.organizing_community ? `${ev.organizing_department} · ${ev.organizing_community}` : (ev.organizing_department || 'Campus Department')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium truncate">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Created By:</span>
                      <span className="truncate">{ev.organizer_name || 'Faculty Organizer'}</span>
                    </div>

                    {ev.status === 'cancelled' && (
                      <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-2.5 text-xs text-rose-900 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                        <span className="truncate"><strong>Cancelled:</strong> {ev.cancellation_reason || 'Administrative cancellation'}</span>
                      </div>
                    )}

                    {ev.deletion_request_id && ev.status !== 'cancelled' && (
                      <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50/95 p-3 text-xs text-rose-900 space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 text-rose-800">
                            <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                            Deletion Requested
                          </span>
                          <span className="rounded-full bg-rose-200/90 px-2 py-0.5 text-[10px] font-black uppercase text-rose-900">
                            Pending Review
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-700 line-clamp-1 font-medium">
                          <strong>Reason:</strong> {ev.deletion_reason || 'Administrative reason'}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewRequestEvent(ev);
                            setAdminNotes('');
                          }}
                          className="w-full mt-1 rounded-lg bg-rose-600 py-1.5 text-center text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 active:scale-95"
                        >
                          Review Problem Statement & Resolve →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Admin Action Footers */}
                  <div className="mt-auto pt-3.5 border-t border-slate-100 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${ev.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/events/${ev.id}/edit`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 py-2 text-xs font-bold text-primary-800 shadow-2xs transition hover:bg-primary-100 active:scale-95"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDirectDeleteEvent(ev);
                        setDirectDeleteReason('');
                      }}
                      className="skeuo-btn-secondary inline-flex items-center justify-center gap-1.5 rounded-xl !border-rose-200 !bg-rose-50/70 py-1.5 text-xs font-bold !text-rose-700 cursor-pointer"
                      title="Permanently remove event and notify organizer"
                    >
                      <Trash2 size={13} /> Delete Event Permanently
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 1. Review Event Deletion Request Modal */}
      {reviewRequestEvent &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Review Event Deletion Request</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested by <strong className="text-slate-800">{reviewRequestEvent.organizer_name || 'Faculty Organizer'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewRequestEvent(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 text-sm">{reviewRequestEvent.title}</span>
                  <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                    {reviewRequestEvent.registration_count || 0} Registered
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Reason Category:</span>
                  <span className="font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 inline-block">
                    {reviewRequestEvent.deletion_reason || 'Administrative reason'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Problem Statement from Faculty:</span>
                  <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200/90 whitespace-pre-wrap leading-relaxed">
                    {reviewRequestEvent.deletion_problem || 'No problem statement provided.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Response Notes <span className="text-slate-400 font-normal">(Sent in notification to requester)</span>
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Optional notes explaining your decision..."
                  className="skeuo-input w-full rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewRequestEvent(null)}
                  className="skeuo-btn-secondary rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resolvingRequest}
                  onClick={() => handleResolveRequest(false)}
                  className="skeuo-btn-secondary flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  disabled={resolvingRequest}
                  onClick={() => handleResolveRequest(true)}
                  className="skeuo-btn-primary !bg-rose-700 !border-rose-900 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer disabled:opacity-50"
                  title="Soft deletes / cancels event with documented reason"
                >
                  {resolvingRequest ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Approve & Cancel Event
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 2. Direct Permanent Event Deletion Modal with Reason */}
      {directDeleteEvent &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Delete Event Permanently</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Organized by <strong className="text-slate-800">{directDeleteEvent.organizer_name || 'Faculty Organizer'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectDeleteEvent(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 space-y-2 text-xs">
                <p className="font-bold text-rose-950 text-sm">{directDeleteEvent.title}</p>
                <div className="flex items-center gap-2 text-slate-600">
                  <span>{directDeleteEvent.category}</span>
                  <span>•</span>
                  <span>{directDeleteEvent.registration_count || 0} Registered Attendees</span>
                </div>
                <p className="text-[11px] text-rose-700 font-medium">
                  ⚠️ Deleting this event is permanent. The faculty organizer and all registered attendees will receive an automated notification explaining why this event was removed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Deletion <span className="text-rose-500 font-bold">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={directDeleteReason}
                  onChange={(e) => setDirectDeleteReason(e.target.value)}
                  placeholder="Explain why this event is being removed (e.g., Content policy violation, venue unavailable, duplicate submission)..."
                  className="skeuo-input w-full rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDirectDeleteEvent(null)}
                  className="skeuo-btn-secondary rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting || !directDeleteReason.trim()}
                  onClick={handleDirectDelete}
                  className="skeuo-btn-primary !bg-rose-700 !border-rose-900 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  Confirm Permanent Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}