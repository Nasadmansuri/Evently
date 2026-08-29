import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar, CalendarDays, Clock, MapPin, User, FileX, Images, MessageSquare, CheckCircle2,
  Loader2, BarChart3, Navigation, Landmark, Edit3, FileDown, Star,
  Trash2, AlertTriangle, ShieldAlert, X, Send, ArrowRight, Trophy, Award,
  ClipboardCheck, PlayCircle, Maximize2, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { useAuth } from '../../../shared/context/AuthContext';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { getEventStatus, isEventPast } from '../../../shared/utils/eventStatus';
import VenueLocationModal from '../../../shared/components/VenueLocationModal';
import AddToCalendarButton from '../../../shared/components/AddToCalendarButton';
import ImageLightboxModal from '../../../shared/components/ImageLightboxModal';

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
  const [imgError, setImgError] = useState(false);
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

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
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Breadcrumb / Back Bar */}
      <div className="flex items-center justify-between pb-2">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <span>← Back to all events</span>
        </Link>
        <span className="text-xs font-semibold text-slate-400">
          Campus Portal • Event #{event.id}
        </span>
      </div>

      {/* 1. Full-Width Hero Poster Banner */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-900">
        {event.banner_image && !imgError ? (
          <>
            <img
              src={`${ASSET_BASE_URL}${event.banner_image}`}
              alt={event.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#023433] via-[#035352] to-[#012424] flex flex-col items-center justify-center p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md mb-3 border border-white/20 shadow-md">
              <CalendarDays size={32} className="text-emerald-300" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200/90">
              {event.category || 'Campus Event'}
            </p>
          </div>
        )}

        {/* Floating Pills on Top of Banner */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span
            className={`pointer-events-auto rounded-full px-3.5 py-1 text-xs font-bold shadow-md backdrop-blur-md ${
              event.status === 'cancelled'
                ? 'bg-rose-600/90 text-white'
                : liveStatus === 'ongoing'
                ? 'bg-emerald-500/90 text-white animate-pulse'
                : isPastEvent
                ? 'bg-slate-900/80 text-slate-200'
                : 'bg-white/90 text-slate-900'
            }`}
          >
            {event.status === 'cancelled'
              ? 'Cancelled'
              : liveStatus === 'ongoing'
              ? '● Live Now'
              : isPastEvent
              ? 'Event Ended'
              : 'Upcoming Event'}
          </span>

          <div className="flex items-center gap-2 pointer-events-auto">
            {event.is_team_event ? (
              <span className="rounded-full bg-black/60 border border-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                Team Event
              </span>
            ) : null}
            <span className={`rounded-full px-3 py-1 text-xs font-bold shadow-md ${style.bg} ${style.text}`}>
              {event.category}
            </span>
          </div>
        </div>

        {/* Bottom Banner Title Overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-white z-10">
          {event.organizing_community && (
            <span className="inline-block mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-300/30">
              {event.organizing_community}
            </span>
          )}
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md line-clamp-2">
            {event.title}
          </h1>
        </div>
      </div>

      {/* 2. Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Event Body & Tabs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Cancelled Alert Banner */}
          {event.status === 'cancelled' && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4.5 text-xs text-rose-900 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                <AlertTriangle size={17} className="text-rose-600" />
                <span>Event Cancelled</span>
              </div>
              <p className="text-slate-700">
                <strong>Reason:</strong> {event.cancellation_reason || 'This event was cancelled following administrative review.'}
              </p>
            </div>
          )}

          {/* Pending Deletion Request Notice */}
          {event.deletion_request_id && event.status !== 'cancelled' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  Event Deletion Requested
                </span>
                <span className="rounded-full bg-amber-200/90 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-900">
                  Under Review
                </span>
              </div>
              <p className="text-xs text-amber-800 font-medium">
                <strong>Reason:</strong> {event.deletion_reason || 'Administrative conflict'}
              </p>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 gap-6 text-sm font-bold">
            {(event.status === 'cancelled' ? ['Details', 'Gallery'] : TABS).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 relative transition-colors ${
                  activeTab === tab ? 'text-primary-700 font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab}</span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="pt-2">
            {activeTab === 'Details' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* About Event */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
                  <h2 className="text-base font-black text-slate-900">About This Event</h2>
                  <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap font-normal">
                    {event.description || 'No detailed description provided.'}
                  </p>
                </div>

                {/* Rules & Eligibility Section */}
                {event.rules_eligibility && (
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-700 border border-primary-100">
                        <ClipboardCheck size={16} />
                      </div>
                      <span>Rules & Eligibility</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600 whitespace-pre-wrap pl-9">
                      {event.rules_eligibility}
                    </p>
                  </div>
                )}

                {/* Prize Information Card */}
                {event.prize_info && (
                  <div className="rounded-3xl border border-amber-200/90 bg-amber-50/60 p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                        <Trophy size={16} />
                      </div>
                      <span>Awards & Prizes</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-amber-950 whitespace-pre-wrap pl-9 font-medium">
                      {event.prize_info}
                    </p>
                  </div>
                )}

                {/* Venue Location Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-slate-50 p-5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-xs border border-slate-200">
                      <Landmark size={22} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Biratnagar International College Campus</h4>
                      <p className="text-[11px] text-slate-600">Bhrikuti Chowk, Biratnagar • Room: {event.location || 'Main Hall'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Navigation size={13} />
                    <span>View Map</span>
                  </button>
                </div>
              </motion.div>
            )}

          {activeTab === 'Gallery' && (
            imagesLoading ? (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 px-6 text-center">
                <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 border border-primary-100 shadow-2xs">
                  <Camera size={26} />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Photos Added Yet</h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                  Photos from this event will be showcased here in the campus memory archive.
                </p>
                {isOrganizerOrAdmin && (
                  <button
                    onClick={() => navigate(`/${user.role === 'admin' ? 'admin' : 'faculty'}/events/${id}/edit`)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-700 hover:bg-primary-800 px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition"
                  >
                    <Camera size={14} />
                    <span>Upload Event Photos</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Gallery Header Row */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {images.length} {images.length === 1 ? 'Photo' : 'Photos'}
                    </span>
                    <span className="text-[11px] text-slate-400">• Click any photo to expand in HD</span>
                  </div>

                  {isOrganizerOrAdmin && (
                    <button
                      onClick={() => navigate(`/${user.role === 'admin' ? 'admin' : 'faculty'}/events/${id}/edit`)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-800 hover:underline"
                    >
                      <Camera size={13} />
                      <span>Manage Photos</span>
                    </button>
                  )}
                </div>

                {/* If single photo: Featured Hero Frame */}
                {images.length === 1 ? (
                  <div
                    onClick={() => openLightbox(0)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-xs hover:shadow-lg transition-all duration-300 max-h-[420px] flex items-center justify-center"
                  >
                    <img
                      src={`${ASSET_BASE_URL}${images[0].image_url}`}
                      alt={event?.title || 'Event photo'}
                      className="max-h-[420px] w-full object-contain sm:object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                    {images[0].is_banner === 1 && (
                      <span className="absolute top-3 left-3 rounded-full bg-emerald-600/90 backdrop-blur-md px-3 py-1 text-[10.5px] font-extrabold uppercase text-white shadow-md">
                        Cover Banner
                      </span>
                    )}

                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white shadow-lg group-hover:bg-black/90 transition">
                      <Maximize2 size={13} className="text-emerald-300" />
                      <span>Click to view full size</span>
                    </div>
                  </div>
                ) : (
                  /* Multi-photo Responsive Grid */
                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        onClick={() => openLightbox(idx)}
                        className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-2xs hover:shadow-md hover:border-primary-300 hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <img
                          src={`${ASSET_BASE_URL}${img.image_url}`}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {img.is_banner === 1 && (
                          <span className="absolute top-2 left-2 rounded-full bg-primary-700/90 backdrop-blur-xs px-2 py-0.5 text-[9px] font-extrabold uppercase text-white shadow-sm">
                            Cover
                          </span>
                        )}

                        <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 size={13} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                      <MessageSquare size={14} className="text-primary-700" /> Student Submissions ({feedbackResponses.length})
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

        {/* Right Column: Sticky "HOSTED BY" Registration Card (4 cols) */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
            {/* Header */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                HOSTED BY
              </span>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-800 font-black text-sm shadow-xs border border-primary-200">
                  {event.organizer_name ? event.organizer_name.charAt(0) : 'B'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {event.organizer_name || 'Faculty Organizer'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {event.organizing_community || event.organizing_department || 'Biratnagar International College'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Spec List */}
            <div className="divide-y divide-slate-100 border-y border-slate-100 py-1 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Date</span>
                <span className="font-bold text-slate-900">
                  {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Time</span>
                <span className="font-bold text-slate-900">
                  {formatTime12hr(event.event_time)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Format</span>
                <span className="font-bold text-slate-900">
                  {event.is_team_event ? 'Team Registration' : 'Individual'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Seats</span>
                <span className="font-bold text-slate-900">
                  {event.registered_count ?? event.registration_count ?? 0} / {event.max_participants || '∞'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Venue</span>
                <span className="font-bold text-primary-700 max-w-[55%] text-right truncate">
                  {event.location || 'BIC Campus'}
                </span>
              </div>
            </div>

            {/* Registration Action Area */}
            <div className="space-y-2.5 pt-1">
              {event.status === 'cancelled' ? (
                <div className="w-full text-center py-2.5 px-4 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  This Event Has Been Cancelled
                </div>
              ) : (
                <>
                  {user?.role === 'student' && (
                    event.is_registered ? (
                      <div className="w-full text-center py-2.5 px-4 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>You're registered. See you there!</span>
                      </div>
                    ) : liveStatus === 'ended' ? (
                      <div className="w-full text-center py-2.5 px-4 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                        Event Completed
                      </div>
                    ) : event.max_participants && (event.registered_count ?? event.registration_count ?? 0) >= event.max_participants ? (
                      <div className="w-full text-center py-2.5 px-4 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                        Event Full ({event.max_participants} / {event.max_participants} Seats Filled)
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/events/${id}/register`)}
                        className="w-full rounded-full bg-primary-700 hover:bg-primary-800 py-3 text-xs font-bold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span>{liveStatus === 'ongoing' ? 'Join Event Now' : 'Register For Event'}</span>
                        <ArrowRight size={14} />
                      </button>
                    )
                  )}

                  {!user && (
                    liveStatus === 'ended' ? (
                      <div className="w-full text-center py-2.5 px-4 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                        Event Completed
                      </div>
                    ) : (
                      <Link
                        to={`/login?redirect=/events/${id}/register`}
                        className="w-full rounded-full bg-slate-900 hover:bg-slate-800 py-3 text-xs font-bold text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span>{liveStatus === 'ongoing' ? 'Sign In to Join' : 'Sign In to Register'}</span>
                        <ArrowRight size={14} />
                      </Link>
                    )
                  )}

                  {/* Add To Calendar Button */}
                  <div className="w-full">
                    <AddToCalendarButton event={event} />
                  </div>

                  {/* Host / Admin Actions */}
                  {isOrganizerOrAdmin && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => navigate(`/${user.role === 'admin' ? 'admin' : 'faculty'}/events/${id}/edit`)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition"
                      >
                        <Edit3 size={13} /> Edit Event Details
                      </button>

                      <button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition disabled:opacity-50"
                      >
                        {generatingReport ? <Loader2 className="animate-spin" size={13} /> : <FileDown size={13} />}
                        {generatingReport ? 'Generating Report...' : 'Download PDF Report'}
                      </button>

                      {user?.role === 'faculty' && !event.deletion_request_id && (
                        <button
                          onClick={() => {
                            setShowDeleteRequestModal(true);
                            setProblemStatement('');
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 py-2 text-xs font-bold text-red-700 transition"
                        >
                          <Trash2 size={13} /> Request Deletion
                        </button>
                      )}

                      {user?.role === 'admin' && (
                        <button
                          onClick={() => setShowPermanentDeleteModal(true)}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 py-2 text-xs font-bold text-red-700 transition"
                        >
                          <Trash2 size={13} /> Delete Event
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-700 shrink-0 mt-0.5" />
                  <span>If approved by administration, the event will be cancelled and registered participants will receive an official cancellation alert.</span>
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

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
        eventTitle={event?.title}
      />
    </div>
  );
}