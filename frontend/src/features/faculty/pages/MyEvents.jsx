import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, AlertCircle, Inbox, Plus, Users,
  Search, Edit3, MessageSquare, FileDown, Loader2, ArrowRight, CheckCircle2,
  Trash2, AlertTriangle, Send, ShieldAlert, X
} from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { showToast } from '../../../shared/utils/toast';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

const STATUS_FILTERS = ['All', 'Upcoming', 'Ongoing', 'Ended'];

const DELETION_REASONS = [
  'Venue or Logistics Conflict',
  'Speaker / Keynote Unavailable',
  'Low Participant Registration',
  'Date / Schedule Conflict',
  'Curricular / Departmental Shift',
  'Other Administrative Reason',
];

export default function MyEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [downloadingReportId, setDownloadingReportId] = useState(null);

  const [requestModalEvent, setRequestModalEvent] = useState(null);
  const [reasonCategory, setReasonCategory] = useState(DELETION_REASONS[0]);
  const [problemStatement, setProblemStatement] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(false);

  async function handlePermanentDelete() {
    if (!deleteConfirmEvent) return;
    setDeletingEvent(true);
    try {
      await api.delete(`/events/${deleteConfirmEvent.id}`);
      setEvents((prev) => prev.filter((ev) => ev.id !== deleteConfirmEvent.id));
      showToast.success('Cancelled event permanently deleted');
      setDeleteConfirmEvent(null);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingEvent(false);
    }
  }

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/events/my-events');
      setEvents(res.data);
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

  async function handleRequestDeletionSubmit(e) {
    e.preventDefault();
    if (!problemStatement.trim()) {
      return showToast.error('Please enter a problem statement explaining why deletion is needed.');
    }
    setSubmittingRequest(true);
    try {
      await api.post(`/events/${requestModalEvent.id}/deletion-request`, {
        reasonCategory,
        problemStatement: problemStatement.trim(),
      });
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === requestModalEvent.id
            ? { ...ev, deletion_request_id: Date.now(), deletion_reason: reasonCategory, deletion_problem: problemStatement.trim() }
            : ev
        )
      );
      showToast.success('Deletion request submitted for administration review');
      setRequestModalEvent(null);
      setProblemStatement('');
      setReasonCategory(DELETION_REASONS[0]);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to submit deletion request');
    } finally {
      setSubmittingRequest(false);
    }
  }

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        !search.trim() ||
        ev.title.toLowerCase().includes(search.toLowerCase().trim()) ||
        ev.category?.toLowerCase().includes(search.toLowerCase().trim()) ||
        ev.location?.toLowerCase().includes(search.toLowerCase().trim());

      const liveStatus = getEventStatus(ev.event_date, ev.event_time);
      const isPast = isEventPast(ev.event_date);
      const computedStatus = liveStatus === 'ongoing' ? 'Ongoing' : isPast ? 'Ended' : 'Upcoming';

      const matchStatus = activeStatus === 'All' || computedStatus === activeStatus;
      return matchSearch && matchStatus;
    });
  }, [events, search, activeStatus]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Create Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">My Organized Events</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            {loading ? 'Loading events...' : `${events.length} event${events.length === 1 ? '' : 's'} organized by you`}
          </p>
        </div>
        <button
          onClick={() => navigate('/faculty/create-event')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] shrink-0"
        >
          <Plus size={16} /> Create New Event
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((status) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your events..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3.5 text-xs font-medium text-slate-900 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-600">
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            {error}
          </span>
          <button onClick={loadEvents} className="font-bold underline hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-[24px] border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
            <Inbox size={28} />
          </div>
          <p className="text-base font-bold text-slate-800">
            {events.length === 0 ? "You haven't created any events yet" : 'No events match your search'}
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {events.length === 0
              ? 'Organize student workshops, technical hackathons, guest lectures, and campus festivals.'
              : 'Try clearing your search query or selecting a different status filter.'}
          </p>
          {events.length === 0 ? (
            <button
              onClick={() => navigate('/faculty/create-event')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-700 shadow-sm"
            >
              <Plus size={14} /> Create your first event
            </button>
          ) : (
            <button
              onClick={() => { setSearch(''); setActiveStatus('All'); }}
              className="mt-4 text-xs font-bold text-primary-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev) => {
            const style = getCategoryStyle(ev.category);
            const isPast = isEventPast(ev.event_date);
            const liveStatus = getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at);
            const isDownloading = downloadingReportId === ev.id;

            return (
              <div
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="group flex flex-col cursor-pointer overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Banner / Poster */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  {ev.banner_image ? (
                    <img
                      src={`${ASSET_BASE_URL}${ev.banner_image}`}
                      alt={ev.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ objectPosition: 'center 30%' }}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-primary-950 to-primary-900 p-4 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-xs mb-1.5 border border-white/10">
                        <Calendar size={20} className="text-emerald-300" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80 line-clamp-1">
                        {ev.category || 'Event'}
                      </span>
                    </div>
                  )}

                  {/* Status Pill on Banner */}
                  <span className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-md ${
                    ev.status === 'cancelled'
                      ? 'bg-rose-600 text-white'
                      : liveStatus === 'scheduled'
                      ? 'bg-amber-600 text-white'
                      : liveStatus === 'ended'
                      ? 'bg-slate-800/90 text-white'
                      : liveStatus === 'ongoing'
                      ? 'bg-amber-500/95 text-white'
                      : 'bg-emerald-500/95 text-white'
                  }`}>
                    {ev.status === 'cancelled' ? 'Cancelled' : liveStatus === 'scheduled' ? 'Scheduled' : liveStatus === 'ongoing' ? 'Ongoing' : isPast ? 'Ended' : 'Upcoming'}
                  </span>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold ${style.bg} ${style.text}`}>
                        {ev.category}
                      </span>
                      {ev.is_team_event ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          <Users size={10} /> Team
                        </span>
                      ) : null}
                    </div>

                    {ev.registration_count !== undefined && (
                      <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                        {ev.registration_count} {ev.registration_count === 1 ? 'Registration' : 'Registrations'}
                      </span>
                    )}
                  </div>

                  <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900 group-hover:text-primary-700 transition">
                    {ev.title}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-primary-600 shrink-0" />
                      <span>{new Date(ev.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {ev.event_time && (
                        <>
                          <span>•</span>
                          <Clock size={13} className="text-primary-600 shrink-0" />
                          <span>{formatTime12hr(ev.event_time)}</span>
                        </>
                      )}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-2 truncate">
                        <MapPin size={13} className="text-primary-600 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                    {ev.status === 'cancelled' && (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/90 p-2 text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                        <span className="truncate">Cancelled: {ev.cancellation_reason || 'Administrative decision'}</span>
                      </div>
                    )}
                    {ev.deletion_request_id && ev.status !== 'cancelled' && (
                      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/90 p-2 text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                        <span>Deletion Requested (Under Admin Review)</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Group */}
                  <div className="mt-auto pt-4 flex items-center gap-2 border-t border-slate-100">
                    {ev.status === 'cancelled' ? (
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-1 py-2 text-center text-xs font-bold text-slate-700 bg-slate-100 rounded-xl border border-slate-200">
                          Cancelled by Administration
                        </span>
                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={(e) => handleDownloadReport(e, ev.id, ev.title)}
                          title="Download official PDF report"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:opacity-50"
                        >
                          {isDownloading ? <Loader2 size={14} className="animate-spin text-primary-600" /> : <FileDown size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmEvent(ev);
                          }}
                          title="Delete this cancelled event permanently"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-rose-600 hover:border-rose-200 transition active:scale-95"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/faculty/events/${ev.id}/edit`);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 active:scale-95"
                        >
                          <Edit3 size={13} /> Edit
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/faculty/events/${ev.id}/feedback`);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-700 transition hover:bg-primary-100 active:scale-95"
                        >
                          <MessageSquare size={13} /> Feedback
                        </button>

                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={(e) => handleDownloadReport(e, ev.id, ev.title)}
                          title="Download official PDF report"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:opacity-50"
                        >
                          {isDownloading ? <Loader2 size={14} className="animate-spin text-primary-600" /> : <FileDown size={14} />}
                        </button>

                        {/* Request Deletion Button */}
                        {!ev.deletion_request_id ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRequestModalEvent(ev);
                              setReasonCategory(DELETION_REASONS[0]);
                              setProblemStatement('');
                            }}
                            title="Request event deletion"
                            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 active:scale-95"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Faculty Request Event Deletion Modal */}
      {requestModalEvent &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Request Event Deletion</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submit a formal cancellation request for <strong className="text-slate-800">{requestModalEvent.title}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRequestModalEvent(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRequestDeletionSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason Category *
                  </label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-red-500 focus:bg-white focus:outline-hidden"
                  >
                    {DELETION_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Problem Statement & Context *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    placeholder="Explain why this event needs to be deleted or cancelled (e.g., keynote speaker cancelled at short notice, auditorium double-booked, or major campus schedule change). This problem statement is sent to campus administration for review."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-red-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-800">
                  ⚠️ If approved by administration, the event will be cancelled and registered participants will receive an official cancellation alert.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRequestModalEvent(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 active:scale-95 disabled:opacity-50"
                  >
                    {submittingRequest ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    Submit Deletion Request
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Permanent Delete Modal for Cancelled Event */}
      {deleteConfirmEvent &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Event Permanently?</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Are you sure you want to permanently remove <strong className="text-slate-800">"{deleteConfirmEvent.title}"</strong> from your events? This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={deletingEvent}
                  onClick={() => setDeleteConfirmEvent(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingEvent}
                  onClick={handlePermanentDelete}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                >
                  {deletingEvent ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  {deletingEvent ? 'Deleting...' : 'Yes, Delete Permanently'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}