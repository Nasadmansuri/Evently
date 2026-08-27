import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, User, FileX, Images, MessageSquare, CheckCircle2,
  Loader2, BarChart3, Navigation, Landmark, Edit3, FileDown, Star, Sparkles,
  Trash2, AlertTriangle, ShieldAlert, X, Send, ArrowRight
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { useAuth } from '../../../shared/context/AuthContext';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { getEventStatus } from '../../../shared/utils/eventStatus';
import VenueLocationModal from '../../../shared/components/VenueLocationModal';
import AddToCalendarButton from '../../../shared/components/AddToCalendarButton';

const TABS = ['Details', 'Gallery', 'Feedback'];
const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

const DELETION_REASONS = [
  'Venue or Logistics Conflict',
  'Speaker / Keynote Unavailable',
  'Low Participant Registration',
  'Date / Schedule Conflict',
  'Curricular / Departmental Shift',
  'Other Administrative Reason',
];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
  const [reasonCategory, setReasonCategory] = useState(DELETION_REASONS[0]);
  const [problemStatement, setProblemStatement] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'feedback' ? 'Feedback' : searchParams.get('tab') === 'gallery' ? 'Gallery' : 'Details'
  );
  const [feedbackForm, setFeedbackForm] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackResponses, setFeedbackResponses] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  async function handlePermanentDelete() {
    setDeletingEvent(true);
    try {
      await api.delete(`/events/${id}`);
      showToast.success('Event permanently deleted');
      navigate(user?.role === 'admin' ? '/admin/events' : '/faculty/my-events');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingEvent(false);
      setShowPermanentDeleteModal(false);
    }
  }

  async function handleGenerateReport() {
    setGeneratingReport(true);
    try {
      const res = await api.get(`/events/${id}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-report-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast.success('Event PDF report downloaded');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handleRequestDeletionSubmit(e) {
    e.preventDefault();
    if (!problemStatement.trim()) {
      return showToast.error('Please enter a problem statement explaining why deletion is needed.');
    }
    setSubmittingRequest(true);
    try {
      await api.post(`/events/${id}/deletion-request`, {
        reasonCategory,
        problemStatement: problemStatement.trim(),
      });
      setEvent((prev) => ({
        ...prev,
        deletion_request_id: Date.now(),
        deletion_reason: reasonCategory,
        deletion_problem: problemStatement.trim(),
      }));
      showToast.success('Deletion request submitted for administration review');
      setShowDeleteRequestModal(false);
      setProblemStatement('');
      setReasonCategory(DELETION_REASONS[0]);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to submit deletion request');
    } finally {
      setSubmittingRequest(false);
    }
  }

  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  useEffect(() => {
    async function loadFeedbackForm() {
      setFeedbackLoading(true);
      try {
        const res = await api.get(`/feedback/forms/event/${id}`);
        setFeedbackForm(res.data.form);
        setFeedbackSubmitted(res.data.alreadySubmitted);
        setFeedbackResponses(res.data.responses || []);
      } catch (err) {
        console.error('Failed to load feedback form:', err);
      } finally {
        setFeedbackLoading(false);
      }
    }
    loadFeedbackForm();
  }, [id]);

  useEffect(() => {
    async function loadImages() {
      setImagesLoading(true);
      try {
        const res = await api.get(`/events/${id}/images`);
        setImages(res.data);
      } catch (err) {
        console.error('Failed to load images:', err);
      } finally {
        setImagesLoading(false);
      }
    }
    loadImages();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-72 rounded-[28px] border border-slate-200 bg-slate-100 animate-pulse" />
        <div className="h-32 rounded-[28px] border border-slate-200 bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileX className="mb-4 text-slate-300" size={40} />
        <p className="text-sm font-semibold text-slate-700">This event doesn't exist or has been removed</p>
        <Link to="/events" className="mt-2 text-xs font-medium text-primary-600 hover:underline">
          ← Back to All Events
        </Link>
      </div>
    );
  }

  const style = getCategoryStyle(event.category);
  const liveStatus = getEventStatus(event.event_date, event.event_time, event.status, event.publish_at);
  const isPastEvent = liveStatus === 'ended';
  const hasEventStarted = liveStatus !== 'upcoming';
  const isOrganizerOrAdmin = user?.role === 'admin' || event.created_by === user?.id;

  const avgRating = feedbackResponses.length > 0
    ? (feedbackResponses.reduce((acc, r) => acc + (Number(r.star_rating) || 0), 0) / feedbackResponses.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {event.banner_image ? (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative min-h-[260px] lg:min-h-[320px] overflow-hidden p-6 sm:p-8 flex flex-col justify-between">
              <img
                src={`${ASSET_BASE_URL}${event.banner_image}`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: 'center 20%' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/40" />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] shadow-sm ${
                  event.status === 'cancelled'
                    ? 'bg-rose-600 text-white'
                    : liveStatus === 'ongoing'
                    ? 'bg-amber-500 text-white'
                    : isPastEvent
                    ? 'bg-slate-900/90 text-white'
                    : 'bg-white/90 text-slate-800'
                }`}>
                  {event.status === 'cancelled'
                    ? 'Cancelled'
                    : liveStatus === 'ongoing'
                    ? 'Ongoing'
                    : isPastEvent
                    ? 'Ended'
                    : event.status}
                </span>
                <div className="flex items-center gap-1.5">
                  {event.is_team_event ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-600/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                      <User size={11} /> Team
                    </span>
                  ) : null}
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs ${style.bg} ${style.text}`}>
                    {event.category}
                  </span>
                </div>
              </div>
              {event.organizing_community && (
                <div className="relative z-10 self-start inline-block rounded-2xl border border-white/20 bg-black/40 p-3 backdrop-blur-md shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300">Featured Event</p>
                  <p className="mt-0.5 text-base font-bold text-white">{event.organizing_community}</p>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-7 flex flex-col justify-between">
              {/* Cancelled by Administration Official Banner */}
              {event.status === 'cancelled' && (
                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          Cancelled by Administration
                        </h3>
                        {event.cancelled_at && (
                          <span className="text-[11px] font-medium text-slate-400">
                            {new Date(String(event.cancelled_at).replace(' ', 'T')).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-800 font-semibold">Official Reason:</strong> {event.cancellation_reason || 'This event was cancelled following administrative review.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Deletion Request Notice */}
              {event.deletion_request_id && event.status !== 'cancelled' && (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                      Event Deletion Requested
                    </span>
                    <span className="rounded-full bg-amber-200/90 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-900">
                      Under Admin Review
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium">
                    <strong>Reason:</strong> {event.deletion_reason || 'Administrative conflict'}
                  </p>
                  {event.deletion_problem && (
                    <p className="text-xs text-amber-800 bg-white/90 p-3 rounded-xl border border-amber-200/80 leading-relaxed whitespace-pre-wrap">
                      <strong>Problem Statement:</strong> {event.deletion_problem}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Campus Event</p>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.85rem] leading-tight">{event.title}</h1>
                </div>

                {/* Action Buttons based on Role & Ownership */}
                <div className="flex flex-wrap items-center gap-2">
                  {event.status === 'cancelled' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate('/events')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition"
                      >
                        ← Back to Events
                      </button>
                      {isOrganizerOrAdmin && (
                        <>
                          <button
                            onClick={handleGenerateReport}
                            disabled={generatingReport}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-700 active:scale-95 disabled:opacity-50"
                          >
                            {generatingReport ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                            {generatingReport ? 'Generating...' : 'PDF Report'}
                          </button>
                          <button
                            onClick={() => setShowPermanentDeleteModal(true)}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-50 hover:border-rose-200 active:scale-95 transition"
                          >
                            <Trash2 size={14} /> Delete Event
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {user?.role === 'student' && (
                        event.is_registered ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={15} /> Already Registered
                            </span>
                            <AddToCalendarButton event={event} />
                          </div>
                        ) : isPastEvent ? (
                          <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-500">
                            Event Ended
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => navigate(`/events/${id}/register`)}
                              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98]"
                            >
                              Register Now
                            </button>
                            <AddToCalendarButton event={event} />
                          </div>
                        )
                      )}

                      {isOrganizerOrAdmin && (
                        <>
                          <button
                            onClick={() => navigate(`/${user.role === 'admin' ? 'admin' : 'faculty'}/events/${id}/edit`)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition"
                          >
                            <Edit3 size={14} /> Edit Event
                          </button>

                          <button
                            onClick={handleGenerateReport}
                            disabled={generatingReport}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50"
                          >
                            {generatingReport ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                            {generatingReport ? 'Generating...' : 'PDF Report'}
                          </button>

                          <AddToCalendarButton event={event} />

                          {user?.role === 'faculty' && !event.deletion_request_id && (
                            <button
                              onClick={() => {
                                setShowDeleteRequestModal(true);
                                setProblemStatement('');
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 shadow-xs hover:bg-red-100 active:scale-95 transition"
                            >
                              <Trash2 size={14} /> Request Deletion
                            </button>
                          )}
                        </>
                      )}

                      {!user && <AddToCalendarButton event={event} />}
                    </>
                  )}
                </div>
              </div>

              <p className="mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-600 line-clamp-3">{event.description}</p>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Calendar size={14} className="text-primary-600 shrink-0" />
                  <span><strong className="text-slate-900">Date:</strong> {new Date(event.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock size={14} className="text-primary-600 shrink-0" />
                  <span><strong className="text-slate-900">Time:</strong> {formatTime12hr(event.event_time)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="group/loc flex items-center gap-2 text-xs text-slate-600 hover:text-primary-700 transition text-left truncate"
                  title="Click to view campus map & venue directions"
                >
                  <MapPin size={14} className="text-primary-600 shrink-0 group-hover/loc:scale-110 transition" />
                  <span className="truncate">
                    <strong className="text-slate-900">Location:</strong>{' '}
                    <span className="underline decoration-dotted underline-offset-2">{event.location || 'Biratnagar International College'}</span>
                  </span>
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                  <User size={14} className="text-primary-600 shrink-0" />
                  <span className="truncate"><strong className="text-slate-900">Organizer:</strong> {event.organizing_community ? `${event.organizing_department} (${event.organizing_community})` : (event.organizing_department || event.organizer_name || 'Campus Faculty')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Sleek, full-width header card when no banner image exists */
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          {/* Cancelled by Administration Official Banner */}
          {event.status === 'cancelled' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Cancelled by Administration
                    </h3>
                    {event.cancelled_at && (
                      <span className="text-[11px] font-medium text-slate-400">
                        {new Date(String(event.cancelled_at).replace(' ', 'T')).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800 font-semibold">Official Reason:</strong> {event.cancellation_reason || 'This event was cancelled following administrative review.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Deletion Request Notice */}
          {event.deletion_request_id && event.status !== 'cancelled' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  Event Deletion Requested
                </span>
                <span className="rounded-full bg-amber-200/90 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-900">
                  Under Admin Review
                </span>
              </div>
              <p className="text-xs text-amber-800 font-medium">
                <strong>Reason:</strong> {event.deletion_reason || 'Administrative conflict'}
              </p>
              {event.deletion_problem && (
                <p className="text-xs text-amber-800 bg-white/90 p-3 rounded-xl border border-amber-200/80 leading-relaxed whitespace-pre-wrap">
                  <strong>Problem Statement:</strong> {event.deletion_problem}
                </p>
              )}
            </div>
          )}

          {/* Badges Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] shadow-2xs ${
                event.status === 'cancelled'
                  ? 'bg-rose-600 text-white'
                  : liveStatus === 'ongoing'
                  ? 'bg-amber-500 text-white'
                  : isPastEvent
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {event.status === 'cancelled'
                  ? 'Cancelled'
                  : liveStatus === 'ongoing'
                  ? 'Ongoing'
                  : isPastEvent
                  ? 'Ended'
                  : event.status}
              </span>
              <span className={`rounded-full px-3 py-1 text-[10.5px] font-bold ${style.bg} ${style.text}`}>
                {event.category}
              </span>
              {!!event.is_team_event && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-200 px-2.5 py-1 text-[10.5px] font-bold text-primary-700">
                  <User size={11} /> Team Event
                </span>
              )}
            </div>
            {event.organizing_community && (
              <span className="rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-800 shadow-2xs">
                Featured · {event.organizing_community}
              </span>
            )}
          </div>

          {/* Title & Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pt-1">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Campus Event</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{event.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {event.status === 'cancelled' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate('/events')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition"
                  >
                    ← Back to Events
                  </button>
                  {isOrganizerOrAdmin && (
                    <>
                      <button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-700 active:scale-95 disabled:opacity-50"
                      >
                        {generatingReport ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                        {generatingReport ? 'Generating...' : 'PDF Report'}
                      </button>
                      <button
                        onClick={() => setShowPermanentDeleteModal(true)}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-50 hover:border-rose-200 active:scale-95 transition"
                      >
                        <Trash2 size={14} /> Delete Event
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {user?.role === 'student' && (
                    event.is_registered ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 size={15} /> Already Registered
                        </span>
                        <AddToCalendarButton event={event} />
                      </div>
                    ) : isPastEvent ? (
                      <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-500">
                        Event Ended
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => navigate(`/events/${id}/register`)}
                          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98]"
                        >
                          Register Now
                        </button>
                        <AddToCalendarButton event={event} />
                      </div>
                    )
                  )}

                  {isOrganizerOrAdmin && (
                    <>
                      <button
                        onClick={() => navigate(`/${user.role === 'admin' ? 'admin' : 'faculty'}/events/${id}/edit`)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition"
                      >
                        <Edit3 size={14} /> Edit Event
                      </button>

                      <button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50"
                      >
                        {generatingReport ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                        {generatingReport ? 'Generating...' : 'PDF Report'}
                      </button>

                      <AddToCalendarButton event={event} />

                      {user?.role === 'faculty' && !event.deletion_request_id && (
                        <button
                          onClick={() => {
                            setShowDeleteRequestModal(true);
                            setProblemStatement('');
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 shadow-xs hover:bg-red-100 active:scale-95 transition"
                        >
                          <Trash2 size={14} /> Request Deletion
                        </button>
                      )}
                    </>
                  )}

                  {!user && <AddToCalendarButton event={event} />}
                </>
              )}
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{event.description}</p>

          {/* Metadata Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar size={14} className="text-primary-600 shrink-0" />
              <span><strong className="text-slate-900">Date:</strong> {new Date(event.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock size={14} className="text-primary-600 shrink-0" />
              <span><strong className="text-slate-900">Time:</strong> {formatTime12hr(event.event_time)}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="group/loc flex items-center gap-2 text-xs text-slate-600 hover:text-primary-700 transition text-left truncate"
              title="Click to view campus map & venue directions"
            >
              <MapPin size={14} className="text-primary-600 shrink-0 group-hover/loc:scale-110 transition" />
              <span className="truncate">
                <strong className="text-slate-900">Location:</strong>{' '}
                <span className="underline decoration-dotted underline-offset-2">{event.location || 'Biratnagar International College'}</span>
              </span>
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
              <User size={14} className="text-primary-600 shrink-0" />
              <span className="truncate"><strong className="text-slate-900">Organizer:</strong> {event.organizing_community ? `${event.organizing_department} (${event.organizing_community})` : (event.organizing_department || event.organizer_name || 'Campus Faculty')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Content */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50/80">
          {(event.status === 'cancelled' ? ['Details', 'Gallery'] : TABS).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-5 py-3.5 text-xs sm:text-sm font-bold transition sm:flex-none ${
                activeTab === tab
                  ? 'border-b-2 border-primary-600 bg-white text-primary-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

          <div className="p-5 sm:p-7">
            {activeTab === 'Details' && (
              <div className="space-y-5">
                <div>
                  <h2 className="mb-1.5 text-sm font-semibold text-slate-900">Description</h2>
                  <p className="text-sm leading-7 text-slate-600">{event.description}</p>
                </div>

                {event.rules_eligibility && (
                  <div>
                    <h2 className="mb-1.5 text-sm font-semibold text-slate-900">Rules & Eligibility</h2>
                    <p className="text-sm leading-7 text-slate-600">{event.rules_eligibility}</p>
                  </div>
                )}

              {event.prize_info && (
                <div>
                  <h2 className="mb-1.5 text-sm font-semibold text-slate-900">Prize Information</h2>
                  <p className="text-sm leading-7 text-slate-600">{event.prize_info}</p>
                </div>
              )}

              <div>
                <h2 className="mb-2 text-sm font-semibold text-slate-900">Event Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Registration Type</span>
                    <span className="font-medium text-slate-900">
                      {event.is_team_event ? 'Team Event' : 'Individual'}
                    </span>
                  </div>
                  {user?.role === 'student' && event.is_registered && !!event.is_team_event && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Your Registration</span>
                      <span className="max-w-[60%] text-right font-medium text-slate-900">
                        {event.my_team_members ? event.my_team_members : 'Registered Individually'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Maximum Participants</span>
                    <span className="font-medium text-slate-900">{event.max_participants || 'Unlimited'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Organizing Department</span>
                    <span className="font-medium text-slate-900">{event.organizing_department || 'General Campus'}</span>
                  </div>
                  {event.organizing_community && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Organizing Community</span>
                      <span className="font-medium text-slate-900">{event.organizing_community}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Venue / Location</span>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline"
                    >
                      <MapPin size={13} />
                      <span>{event.location || 'Biratnagar International College'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Created By</span>
                    <span className="font-medium text-slate-900">{event.organizer_name || 'Faculty Organizer'}</span>
                  </div>
                </div>
              </div>

              {/* Campus Venue Quick Action Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-700 shadow-xs border border-primary-200">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Biratnagar International College Campus</h4>
                    <p className="text-[11px] text-slate-600">Bhrikuti Chowk, Biratnagar • Room: {event.location || 'Main Auditorium'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-600 active:scale-95 transition"
                >
                  <Navigation size={13} />
                  <span>View Map & Directions</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Gallery' && (
            imagesLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-lg bg-slate-100 animate-pulse" />)}
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Images className="mb-3 text-slate-300" size={28} />
                <p className="text-sm font-semibold text-slate-700">No photos added yet</p>
                {isOrganizerOrAdmin && (
                  <button
                    onClick={() => navigate(`/${user.role === 'admin' ? 'admin' : 'faculty'}/events/${id}/edit`)}
                    className="mt-3 text-xs font-bold text-primary-600 hover:underline"
                  >
                    + Add Event Photos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                    <img
                      src={`${ASSET_BASE_URL}${img.image_url}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {img.is_banner === 1 && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                        Cover Banner
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'Feedback' && (
            <div>
              {feedbackLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-primary-600" size={28} />
                </div>
              ) : !feedbackForm && isOrganizerOrAdmin ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
                    <MessageSquare size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No feedback form created yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                    Create a customized feedback survey for students to evaluate this event.
                  </p>
                  <button
                    onClick={() => navigate(`/${user.role === 'admin' ? 'admin' : 'faculty'}/events/${id}/feedback`)}
                    className="rounded-xl bg-primary-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700"
                  >
                    + Create Feedback Form
                  </button>
                </div>
              ) : !feedbackForm ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare className="mb-3 text-slate-300" size={28} />
                  <p className="text-sm font-semibold text-slate-700">Feedback isn't open for this event yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">The organizer has not published a feedback form.</p>
                </div>
              ) : user?.role !== 'student' ? (
                /* Rich Faculty & Admin Feedback Analytics View */
                <div className="space-y-6">
                  {/* Feedback Summary KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Total Responses
                      </span>
                      <span className="text-2xl font-black text-slate-900">
                        {feedbackResponses.length}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                        Average Rating
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-black text-amber-950">
                          {avgRating ? `${avgRating} / 5` : '—'}
                        </span>
                        <div className="flex items-center text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={s <= Math.round(Number(avgRating) || 0) ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary-50/80 border border-primary-200">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary-800 block mb-1">
                        Form Questions
                      </span>
                      <span className="text-2xl font-black text-primary-950">
                        {feedbackForm.questions?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Submissions List */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-primary-600" /> Student Submissions ({feedbackResponses.length})
                    </h3>

                    {feedbackResponses.length === 0 ? (
                      <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
                        No participant feedback submitted yet. Feedback will appear here once attendees submit the form.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {feedbackResponses.map((res) => (
                          <div key={res.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <div>
                                <span className="font-bold text-slate-900 text-xs">{res.full_name || 'Participant'}</span>
                                <span className="text-[11px] text-slate-400 ml-2">
                                  {new Date(res.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Star size={11} className="fill-amber-400 text-amber-400" /> {res.star_rating}/5
                              </span>
                            </div>

                            <div className="space-y-2 text-xs">
                              {feedbackForm.questions?.map((q) => {
                                const ans = res.answers?.[q.id];
                                if (ans === undefined || ans === null || ans === '') return null;
                                return (
                                  <div key={q.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <p className="font-bold text-slate-700 text-[11px]">{q.question_text}</p>
                                    <p className="text-slate-900 mt-1 font-medium">{String(ans)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : feedbackSubmitted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="mb-3 text-emerald-500" size={32} />
                  <p className="text-sm font-semibold text-slate-700">Feedback Submitted ✓</p>
                  <p className="text-xs text-slate-400 mt-0.5">Thank you for sharing your feedback on this event.</p>
                  <button
                    onClick={() => navigate('/student/my-feedback')}
                    className="mt-3 text-xs font-medium text-primary-600 hover:underline"
                  >
                    View in My Feedback →
                  </button>
                </div>
              ) : !event.is_registered ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare className="mb-3 text-slate-300" size={28} />
                  <p className="text-sm font-medium text-slate-700">Registration Required</p>
                  <p className="mt-1 text-xs text-slate-500">You must be registered for this event to leave feedback.</p>
                </div>
              ) : !hasEventStarted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare className="mb-3 text-slate-300" size={28} />
                  <p className="text-sm font-medium text-slate-700">Feedback opens once the event begins</p>
                  <p className="mt-1 text-xs text-slate-500">Come back once the event is underway to share your thoughts.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare className="mb-3 text-primary-400" size={28} />
                  <p className="mb-3 text-sm font-medium text-slate-700">Share your thoughts on this event</p>
                  <button
                    onClick={() => navigate(`/events/${id}/feedback`)}
                    className="mt-3 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98]"
                  >
                    Give Feedback
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Venue & Map Modal */}
      <VenueLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        locationName={event.location}
        eventTitle={event.title}
      />

      {/* Faculty Request Event Deletion Modal */}
      {showDeleteRequestModal &&
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
                      Submit a formal deletion request for <strong className="text-slate-800">{event.title}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteRequestModal(false)}
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
                    placeholder="Explain why this event needs to be deleted or cancelled. This problem statement is sent to campus administration for review."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-red-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-800">
                  ⚠️ If approved by administration, the event will be cancelled and registered participants will receive an official cancellation alert.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteRequestModal(false)}
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

      {/* Permanent Delete Confirmation Modal */}
      {showPermanentDeleteModal &&
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
                    Are you sure you want to permanently delete <strong className="text-slate-800">"{event.title}"</strong>? This will permanently remove the event and all associated records.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={deletingEvent}
                  onClick={() => setShowPermanentDeleteModal(false)}
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