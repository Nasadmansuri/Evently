import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Inbox, Plus, Search, Edit3, MessageSquare, FileDown, Loader2, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../shared/services/api';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';
import { showToast } from '../../../shared/utils/toast';
import EventCard from '../../../shared/components/EventCard';

const STATUS_FILTERS = ['All', 'Upcoming', 'Live Now', 'Past & Concluded'];

export default function MyEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [downloadingReportId, setDownloadingReportId] = useState(null);

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/events/my-events');
      setEvents(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleDownloadReport(e, eventId, eventTitle) {
    e.stopPropagation();
    setDownloadingReportId(eventId);
    try {
      const res = await api.get(`/events/${eventId}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-report-${eventId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast.success(`Report downloaded for "${eventTitle}"`);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to download event report');
    } finally {
      setDownloadingReportId(null);
    }
  }

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        !search.trim() ||
        ev.title?.toLowerCase().includes(search.toLowerCase().trim()) ||
        ev.category?.toLowerCase().includes(search.toLowerCase().trim()) ||
        ev.location?.toLowerCase().includes(search.toLowerCase().trim());

      const liveStatus = getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at);
      const isPast = isEventPast(ev.event_date, ev.event_time);
      const computedStatus = liveStatus === 'ongoing' ? 'Live Now' : isPast || liveStatus === 'ended' ? 'Past & Concluded' : 'Upcoming';

      const matchStatus = activeStatus === 'All' || computedStatus === activeStatus;
      return matchSearch && matchStatus;
    });
  }, [events, search, activeStatus]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Create Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-800 border border-primary-100/80">
              Organizer Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            My Organized Events
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {loading ? 'Loading events...' : `${events.length} campus event${events.length === 1 ? '' : 's'} managed by you.`}
          </p>
        </div>

        <button
          onClick={() => navigate('/faculty/create-event')}
          className="skeuo-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Create New Event
        </button>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="skeuo-card flex flex-col sm:flex-row items-center justify-between gap-3.5 p-3.5 rounded-2xl">
        {/* Fluid Status Filter Pills in Skeuomorphic Tray */}
        <div className="skeuo-tray flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 rounded-xl">
          {STATUS_FILTERS.map((status) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="myEventsStatusPill"
                    className="absolute inset-0 rounded-lg skeuo-pill-active"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {status === 'Live Now' && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className={`relative inline-flex h-2 w-2 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`} />
                    </span>
                  )}
                  <span>{status}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, venue, category..."
            className="skeuo-input w-full rounded-xl py-2.5 pl-9 pr-8 text-xs font-medium text-slate-900 placeholder:text-slate-400"
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

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 shadow-xs">
          <span className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            {error}
          </span>
          <button onClick={loadEvents} className="font-bold underline hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-6 text-center shadow-2xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-700 mb-3 border border-primary-100">
            <Inbox size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {events.length === 0 ? "You haven't created any events yet" : 'No events match your criteria'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
            {events.length === 0
              ? 'Organize student workshops, technical hackathons, guest lectures, and campus festivals.'
              : 'Try clearing your search query or selecting a different status filter.'}
          </p>
          {events.length === 0 ? (
            <button
              onClick={() => navigate('/faculty/create-event')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition"
            >
              <Plus size={15} /> Create your first event
            </button>
          ) : (
            <button
              onClick={() => { setSearch(''); setActiveStatus('All'); }}
              className="mt-4 rounded-xl bg-primary-700 hover:bg-primary-800 px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition"
            >
              Reset Filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev, idx) => {
            const isPast = isEventPast(ev.event_date, ev.event_time);
            const isDownloading = downloadingReportId === ev.id;

            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
              >
                <EventCard
                  event={ev}
                  isPast={isPast}
                  onViewDetails={() => navigate(`/events/${ev.id}`)}
                  footer={
                    <div className="flex w-full items-center justify-between gap-1.5">
                      {ev.status !== 'cancelled' ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/faculty/events/${ev.id}/edit`);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition active:scale-95"
                              title="Edit event details"
                            >
                              <Edit3 size={12} /> Edit
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/events/${ev.id}?tab=feedback`);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition active:scale-95"
                              title="View student feedback"
                            >
                              <MessageSquare size={12} /> Feedback
                            </button>

                            <button
                              onClick={(e) => handleDownloadReport(e, ev.id, ev.title)}
                              disabled={isDownloading}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary-700 hover:bg-primary-800 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 disabled:opacity-50"
                              title="Download PDF report"
                            >
                              {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
                              PDF
                            </button>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${ev.id}`);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-800 hover:underline ml-auto"
                          >
                            Manage →
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-rose-600">
                            Cancelled
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${ev.id}`);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 ml-auto"
                          >
                            View Notice →
                          </button>
                        </>
                      )}
                    </div>
                  }
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}