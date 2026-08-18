import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, FileX, Images, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { useAuth } from '../../../shared/context/AuthContext';

const TABS = ['Details', 'Gallery', 'Feedback'];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'feedback' ? 'Feedback' : 'Details'
  );
  const [feedbackForm, setFeedbackForm] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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
  const isPastEvent = new Date(event.event_date) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_1.3fr]">
          <div className="relative min-h-[240px] bg-primary-50 p-6">
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
                  {event.status}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                  {event.category}
                </span>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Featured Event</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{event.organizing_department}</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Campus Event</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">{event.title}</h1>
              </div>
              {user?.role === 'student' && (
                event.is_registered ? (
                  <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={16} /> Already Registered
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
            </div>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{event.description}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar size={15} className="text-primary-600 shrink-0" />
                <span><strong className="text-slate-900">Date:</strong> {new Date(event.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={15} className="text-primary-600 shrink-0" />
                <span><strong className="text-slate-900">Time:</strong> {event.event_time?.slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={15} className="text-primary-600 shrink-0" />
                <span><strong className="text-slate-900">Location:</strong> {event.location}</span>
              </div>
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
                    <span className="text-slate-500">Maximum Participants</span>
                    <span className="font-medium text-slate-900">{event.max_participants || 'Unlimited'}</span>
                  </div>
                  {event.organizing_community && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Community</span>
                      <span className="font-medium text-slate-900">{event.organizing_community}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Created By</span>
                    <span className="font-medium text-slate-900">{event.organizer_name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Gallery' && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Images className="mb-3 text-slate-300" size={28} />
              <p className="text-sm text-slate-500">Gallery coming soon</p>
            </div>
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
                  <p className="mt-1 text-xs text-slate-400">"{feedbackForm.title}" — {feedbackForm.questions.length} question{feedbackForm.questions.length === 1 ? '' : 's'}</p>
                </>
              ) : feedbackSubmitted ? (
                <>
                  <CheckCircle2 className="mb-3 text-emerald-500" size={28} />
                  <p className="text-sm font-medium text-slate-700">Feedback Submitted ✓</p>
                </>
              ) : !isPastEvent ? (
                <>
                  <MessageSquare className="mb-3 text-slate-300" size={28} />
                  <p className="text-sm text-slate-500">Feedback opens once this event has taken place</p>
                </>
              ) : (
                <>
                  <MessageSquare className="mb-3 text-primary-400" size={28} />
                  <p className="mb-3 text-sm text-slate-500">Share your thoughts on this event</p>
                  <button
                    onClick={() => navigate(`/events/${id}/feedback`)}
                    className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                  >
                    Give Feedback
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}