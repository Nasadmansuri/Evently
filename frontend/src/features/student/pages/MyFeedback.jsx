import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare, Star, CheckCircle2, AlertCircle, Inbox, CalendarDays,
  FileQuestion, ArrowRight, Clock, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../shared/services/api';
import EventCard from '../../../shared/components/EventCard';
import { isEventPast } from '../../../shared/utils/eventStatus';

export default function MyFeedback() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pastEvents, setPastEvents] = useState([]);
  const [feedbackForms, setFeedbackForms] = useState({}); // { [eventId]: { form, alreadySubmitted } }

  const activeTab = searchParams.get('tab') || 'all'; // 'all' | 'submitted' | 'pending' | 'unavailable'

  async function loadFeedbackDashboard() {
    setLoading(true);
    setError('');
    try {
      const regRes = await api.get('/registrations/my');
      const allRegs = regRes.data || [];

      // Filter to events that have started or completed
      const past = allRegs.filter((r) => isEventPast(r.event_date, r.event_time));
      setPastEvents(past);

      // Check feedback forms status for all past events
      const formData = {};
      await Promise.all(
        past.map(async (ev) => {
          try {
            const formRes = await api.get(`/feedback/forms/event/${ev.id}`);
            formData[ev.id] = {
              hasForm: !!formRes.data?.form,
              form: formRes.data?.form,
              alreadySubmitted: !!formRes.data?.alreadySubmitted,
            };
          } catch {
            formData[ev.id] = { hasForm: false, form: null, alreadySubmitted: false };
          }
        })
      );
      setFeedbackForms(formData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedbackDashboard();
  }, []);

  const { submitted, pending, unavailable } = useMemo(() => {
    const sub = [];
    const pen = [];
    const unav = [];

    pastEvents.forEach((ev) => {
      const info = feedbackForms[ev.id];
      if (!info || !info.hasForm) {
        unav.push(ev);
      } else if (info.alreadySubmitted) {
        sub.push(ev);
      } else {
        pen.push(ev);
      }
    });

    return { submitted: sub, pending: pen, unavailable: unav };
  }, [pastEvents, feedbackForms]);

  const displayedEvents = useMemo(() => {
    switch (activeTab) {
      case 'submitted':
        return submitted;
      case 'pending':
        return pending;
      case 'unavailable':
        return unavailable;
      default:
        return pastEvents;
    }
  }, [activeTab, pastEvents, submitted, pending, unavailable]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-800 border border-primary-100/80">
              Student Reviews
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            My Event Feedback
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Review your ratings, complete pending evaluations, and share suggestions for campus events.
          </p>
        </div>

        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
        >
          Explore All Events <ArrowRight size={14} />
        </button>
      </div>

      {/* 2. Interactive KPI Tab Cards (Click card to filter view) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Eligible - Clean Typographic Treatment */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'all' })}
          className={`relative rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'all'
              ? 'border-2 border-primary-700 bg-primary-50/40 shadow-xs ring-4 ring-primary-100/60'
              : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'all' ? 'text-primary-800' : 'text-slate-400'}`}>
              Eligible Events
            </p>
            {activeTab === 'all' && (
              <span className="text-[10px] font-extrabold text-primary-800 bg-primary-100/80 px-2 py-0.5 rounded-md">
                Active View
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : pastEvents.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Attended campus events</p>
          </div>
        </button>

        {/* Metric 2: Pending Feedback - Single Priority Actionable Highlight */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'pending' })}
          className={`relative rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
            activeTab === 'pending'
              ? 'border-2 border-primary-700 bg-primary-50/40 shadow-xs ring-4 ring-primary-100/60'
              : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'pending' ? 'text-primary-800' : 'text-slate-500'}`}>
              Pending Reviews
            </p>
            <div className="flex items-center gap-1.5">
              {pending.length > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {pending.length} Action Needed
                </span>
              )}
              {activeTab === 'pending' && (
                <span className="text-[10px] font-extrabold text-primary-800 bg-primary-100/80 px-2 py-0.5 rounded-md">
                  Active View
                </span>
              )}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : pending.length}</p>
            <p className="mt-1 text-xs text-amber-800 font-semibold">
              {pending.length > 0 ? `${pending.length} evaluations awaiting input` : 'All reviews submitted'}
            </p>
          </div>
        </button>

        {/* Metric 3: Submitted - Clean Typographic Treatment */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'submitted' })}
          className={`relative rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'submitted'
              ? 'border-2 border-primary-700 bg-primary-50/40 shadow-xs ring-4 ring-primary-100/60'
              : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'submitted' ? 'text-primary-800' : 'text-slate-400'}`}>
              Submitted
            </p>
            {activeTab === 'submitted' && (
              <span className="text-[10px] font-extrabold text-primary-800 bg-primary-100/80 px-2 py-0.5 rounded-md">
                Active View
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : submitted.length}</p>
            <p className="mt-1 text-xs text-emerald-700 font-medium">Completed evaluations</p>
          </div>
        </button>

        {/* Metric 4: No Form Yet - Clean Typographic Treatment */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'unavailable' })}
          className={`relative rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'unavailable'
              ? 'border-2 border-primary-700 bg-primary-50/40 shadow-xs ring-4 ring-primary-100/60'
              : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'unavailable' ? 'text-primary-800' : 'text-slate-400'}`}>
              Awaiting Forms
            </p>
            {activeTab === 'unavailable' && (
              <span className="text-[10px] font-extrabold text-primary-800 bg-primary-100/80 px-2 py-0.5 rounded-md">
                Active View
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : unavailable.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Not yet released by faculty</p>
          </div>
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 shadow-xs">
          <span className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            {error}
          </span>
          <button onClick={loadFeedbackDashboard} className="font-bold underline hover:text-rose-900">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100" />
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-6 text-center shadow-2xs"
        >
          <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 border border-primary-100">
            <Inbox size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {activeTab === 'submitted'
              ? 'No Submitted Feedback Yet'
              : activeTab === 'pending'
              ? 'All Caught Up! No Pending Feedback'
              : activeTab === 'unavailable'
              ? 'No Events Awaiting Forms'
              : 'No Attended Events Found'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            {activeTab === 'pending'
              ? 'You have completed all active feedback forms for the events you attended!'
              : 'Once events conclude, you can submit star ratings and detailed reviews here.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
            >
              Explore Campus Events
            </button>
            {activeTab !== 'all' && (
              <button
                onClick={() => setSearchParams({ tab: 'all' })}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
              >
                View All ({pastEvents.length})
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedEvents.map((ev, idx) => {
            const info = feedbackForms[ev.id] || { hasForm: false, alreadySubmitted: false };

            return (
              <motion.div
                key={ev.registration_id || ev.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
              >
                <EventCard
                  event={ev}
                  isPast={true}
                  onViewDetails={() => navigate(`/events/${ev.id}`)}
                  footer={
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500">
                        {info.alreadySubmitted
                          ? 'Review Recorded'
                          : info.hasForm
                          ? 'Feedback Open'
                          : 'Awaiting Form'}
                      </span>

                      {info.alreadySubmitted ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${ev.id}/feedback`);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <CheckCircle2 size={13} /> View Response
                        </button>
                      ) : info.hasForm ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${ev.id}/feedback`);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95"
                        >
                          <Star size={12} className="fill-white" /> Give Feedback
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${ev.id}`);
                          }}
                          className="text-xs font-bold text-slate-500 hover:text-slate-900 transition"
                        >
                          Details →
                        </button>
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