import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, FileX, Images, MessageSquare, CheckCircle2, Loader2, BarChart3, Navigation, Landmark } from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { useAuth } from '../../../shared/context/AuthContext';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { getEventStatus } from '../../../shared/utils/eventStatus';
import VenueLocationModal from '../../../shared/components/VenueLocationModal';

const TABS = ['Details', 'Gallery', 'Feedback'];
const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'feedback' ? 'Feedback' : searchParams.get('tab') === 'gallery' ? 'Gallery' : 'Details'
  );
  const [feedbackForm, setFeedbackForm] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

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
    } catch (err) {
      showToast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
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
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-72 rounded-[28px] border border-slate-200 bg-slate-100 animate-pulse" />
        <div className="h-32 rounded-[28px] border border-slate-200 bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (notFound) {
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
  const liveStatus = getEventStatus(event.event_date, event.event_time);
  const isPastEvent = liveStatus === 'ended';
  const hasEventStarted = liveStatus !== 'upcoming';

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative min-h-[320px] overflow-hidden p-6 sm:p-8">
            {event.banner_image ? (
              <>
                <img
                  src={`${ASSET_BASE_URL}${event.banner_image}`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: 'center 20%' }}
                />
                <div className="absolute inset-0 bg-black/35" />
              </>
            ) : (
              <div className="absolute inset-0 bg-primary-50" />
            )}
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] shadow-sm ${
                  liveStatus === 'ongoing' ? 'bg-amber-500/95 text-white' : 'bg-white/90 text-slate-600'
                }`}>
                  {liveStatus === 'ongoing' ? 'Ongoing' : isPastEvent ? 'Ended' : event.status}
                </span>
                <div className="flex items-center gap-1.5">
                  {event.is_team_event ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
                      <User size={11} /> Team
                    </span>
                  ) : null}
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                    {event.category}
                  </span>
                </div>
              </div>
              {event.organizing_community && (
                <div className="self-start inline-block rounded-2xl border border-white/80 bg-white/70 p-3.5 backdrop-blur-sm shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">Featured Event</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{event.organizing_community}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Campus Event</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">{event.title}</h1>
              </div>
              {user?.role === 'student' && (
                event.is_registered ? (
                  <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={16} /> Already Registered
                  </span>
                ) : isPastEvent ? (
                  <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500">
                    Event Ended
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(`/events/${id}/register`)}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98]"
                  >
                    Register Now
                  </button>
                )
              )}
              {user?.role === 'admin' && (
                <button
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {generatingReport ? <Loader2 className="animate-spin" size={16} /> : <BarChart3 size={16} />}
                  {generatingReport ? 'Generating...' : 'Generate Report'}
                </button>
              )}
            </div>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{event.description}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar size={15} className="text-primary-600 shrink-0" />
                <span><strong className="text-slate-900">Date:</strong> {new Date(event.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={15} className="text-primary-600 shrink-0" />
                <span><strong className="text-slate-900">Time:</strong> {formatTime12hr(event.event_time)}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="group/loc flex items-center gap-2 text-sm text-slate-600 hover:text-primary-700 transition text-left"
                title="Click to view campus map & venue directions"
              >
                <MapPin size={15} className="text-primary-600 shrink-0 group-hover/loc:scale-110 transition" />
                <span>
                  <strong className="text-slate-900">Location:</strong>{' '}
                  <span className="underline decoration-dotted underline-offset-2">{event.location || 'Biratnagar International College'}</span>
                </span>
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User size={15} className="text-primary-600 shrink-0" />
                <span><strong className="text-slate-900">Organizer:</strong> {event.organizing_department}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200 bg-slate-50/80">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-5 py-3 text-sm font-medium transition sm:flex-none ${
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
                  {user?.role === 'student' && event.is_registered && event.is_team_event && (
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
                  {event.organizing_community && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Community</span>
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
                    <span className="font-medium text-slate-900">{event.organizer_name}</span>
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
                <p className="text-sm text-slate-500">No photos have been added to this event yet</p>
                {(user?.role === 'admin' || event.created_by === user?.id) && (
                  <p className="mt-1 text-xs text-slate-400">Add photos from Edit Event</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                    <img
                      src={`${ASSET_BASE_URL}${img.image_url}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {img.is_banner === 1 && (
                      <span className="absolute bottom-1 left-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        Banner
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'Feedback' && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              {feedbackLoading ? (
                <Loader2 className="mb-3 animate-spin text-slate-300" size={28} />
              ) : !feedbackForm && (user?.role === 'admin' || event.created_by === user?.id) ? (
                <>
                  <MessageSquare className="mb-3 text-slate-300" size={28} />
                  <p className="mb-3 text-sm text-slate-500">No feedback form yet for this event</p>
                  <button
                    onClick={() => navigate(`/${user.role}/events/${id}/feedback`)}
                    className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    Create Feedback Form
                  </button>
                </>
              ) : !feedbackForm ? (
                <>
                  <MessageSquare className="mb-3 text-slate-300" size={28} />
                  <p className="text-sm text-slate-500">Feedback isn't open for this event yet</p>
                </>
              ) : user?.role !== 'student' ? (
                <>
                  <CheckCircle2 className="mb-3 text-emerald-500" size={28} />
                  <p className="text-sm font-medium text-slate-700">Feedback collection is live for this event</p>
                </>
              ) : feedbackSubmitted ? (
                <>
                  <CheckCircle2 className="mb-3 text-emerald-500" size={28} />
                  <p className="text-sm font-medium text-slate-700">Feedback Submitted ✓</p>
                  <button
                    onClick={() => navigate('/student/my-feedback')}
                    className="mt-3 text-xs font-medium text-primary-600 hover:underline"
                  >
                    View in My Feedback →
                  </button>
                </>
              ) : !event.is_registered ? (
                <>
                  <MessageSquare className="mb-3 text-slate-300" size={28} />
                  <p className="text-sm font-medium text-slate-700">Registration Required</p>
                  <p className="mt-1 text-xs text-slate-500">You must be registered for this event to leave feedback.</p>
                </>
              ) : !hasEventStarted ? (
                <>
                  <MessageSquare className="mb-3 text-slate-300" size={28} />
                  <p className="text-sm font-medium text-slate-700">Feedback opens once the event begins</p>
                  <p className="mt-1 text-xs text-slate-500">Come back once the event is underway to share your thoughts.</p>
                </>
              ) : (
                <>
                  <MessageSquare className="mb-3 text-primary-400" size={28} />
                  <p className="mb-3 text-sm font-medium text-slate-700">Share your thoughts on this event</p>
                  <button
                    onClick={() => navigate(`/events/${id}/feedback`)}
                    className="mt-3 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98]"
                  >
                    Give Feedback
                  </button>
                </>
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
    </div>
  );
}