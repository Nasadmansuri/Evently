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
  const [eligibleEvents, setEligibleEvents] = useState([]);
  const [feedbackForms, setFeedbackForms] = useState({}); // { [eventId]: { form, alreadySubmitted, myResponse } }

  const activeTab = searchParams.get('tab') || 'all'; // 'all' | 'submitted' | 'pending' | 'unavailable'

  async function loadFeedbackDashboard() {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch user's registrations and all submitted feedback event IDs in parallel
      const [regRes, submittedRes] = await Promise.all([
        api.get('/registrations/my').catch(() => ({ data: [] })),
        api.get('/feedback/my-submitted').catch(() => ({ data: { eventIds: [] } })),
      ]);

      const allRegs = (regRes.data || []).filter((r) => r && r.id);
      const rawSubmittedIds = Array.isArray(submittedRes.data?.eventIds)
        ? submittedRes.data.eventIds
        : Array.isArray(submittedRes.data)
        ? submittedRes.data
        : [];
      const validSubmittedIds = rawSubmittedIds.filter((id) => id !== null && id !== undefined && id !== 'undefined' && !isNaN(Number(id)));
      const submittedEventIds = new Set(validSubmittedIds);

      // 2. Fetch any submitted events that might not be in registration list
      const registeredIds = new Set(allRegs.map((r) => r.id));
      const missingSubmittedIds = [...submittedEventIds].filter((id) => !registeredIds.has(id));
      let extraEvents = [];
      if (missingSubmittedIds.length > 0) {
        const extraRes = await Promise.all(
          missingSubmittedIds.map((id) =>
            id ? api.get(`/events/${id}`).then((res) => res.data).catch(() => null) : Promise.resolve(null)
          )
        );
        extraEvents = extraRes.filter((ev) => ev && ev.id);
      }

      const combined = [...allRegs, ...extraEvents];

      // 3. Events eligible for review:
      // - Cancelled events are excluded because they never took place and cannot receive feedback
      // - Events that have started (start <= now)
      // - Events that have concluded / past
      // - Any event where feedback was submitted
      const eligible = combined.filter((r) => {
        if (r.status === 'cancelled') return false;
        const dateStr = r.event_date ? String(r.event_date).slice(0, 10) : '';
        const timeStr = r.event_time ? String(r.event_time).slice(0, 5) : '00:00';
        const hasStarted = dateStr ? new Date() >= new Date(`${dateStr}T${timeStr}:00`) : false;
        const isPast = isEventPast(r.event_date, r.event_time) || r.status === 'ended';
        const hasSubmitted = submittedEventIds.has(r.id);
        return hasStarted || isPast || hasSubmitted;
      });

      setEligibleEvents(eligible);

      // 4. Check feedback forms status for all eligible events
      const formData = {};
      await Promise.all(
        eligible.map(async (ev) => {
          try {
            const formRes = await api.get(`/feedback/forms/event/${ev.id}`);
            formData[ev.id] = {
              hasForm: !!formRes.data?.form,
              form: formRes.data?.form,
              alreadySubmitted: !!formRes.data?.alreadySubmitted || submittedEventIds.has(ev.id),
              myResponse: formRes.data?.myResponse || null,
            };
          } catch {
            formData[ev.id] = {
              hasForm: false,
              form: null,
              alreadySubmitted: submittedEventIds.has(ev.id),
              myResponse: null,
            };
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

    eligibleEvents.forEach((ev) => {
      const info = feedbackForms[ev.id];
      if (!info || !info.hasForm) {
        if (info?.alreadySubmitted) {
          sub.push(ev);
        } else {
          unav.push(ev);
        }
      } else if (info.alreadySubmitted) {
        sub.push(ev);
      } else {
        pen.push(ev);
      }
    });

    return { submitted: sub, pending: pen, unavailable: unav };
  }, [eligibleEvents, feedbackForms]);

  const displayedEvents = useMemo(() => {
    switch (activeTab) {
      case 'submitted':
        return submitted;
      case 'pending':
        return pending;
      case 'unavailable':
        return unavailable;
      default:
        return eligibleEvents;
    }
  }, [activeTab, eligibleEvents, submitted, pending, unavailable]);

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
          className="skeuo-btn-primary inline-flex items-center gap-2 self-start sm:self-auto rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer"
        >
          Explore All Events <ArrowRight size={14} />
        </button>
      </div>

      {/* 2. Interactive KPI Tab Cards (Click card to filter view) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Eligible Events */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'all' })}
          className={`skeuo-card rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'all'
              ? 'ring-2 ring-primary-600 bg-primary-50/30'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'all' ? 'text-primary-800' : 'text-slate-500'}`}>
              Eligible Events
            </p>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : eligibleEvents.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Attended & live campus events</p>
          </div>
        </button>

        {/* Metric 2: Pending Feedback */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'pending' })}
          className={`skeuo-card rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'pending'
              ? 'ring-2 ring-primary-600 bg-primary-50/30'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'pending' ? 'text-primary-800' : 'text-slate-500'}`}>
              Pending Reviews
            </p>
            {pending.length > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                {pending.length} Action Needed
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : pending.length}</p>
            <p className="mt-1 text-xs text-amber-800 font-semibold">
              {pending.length > 0 ? `${pending.length} evaluations awaiting input` : 'All reviews submitted'}
            </p>
          </div>
        </button>

        {/* Metric 3: Submitted */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'submitted' })}
          className={`skeuo-card rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'submitted'
              ? 'ring-2 ring-primary-600 bg-primary-50/30'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'submitted' ? 'text-primary-800' : 'text-slate-500'}`}>
              Submitted
            </p>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : submitted.length}</p>
            <p className="mt-1 text-xs text-emerald-700 font-medium">Completed evaluations</p>
          </div>
        </button>

        {/* Metric 4: No Form Yet */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'unavailable' })}
          className={`skeuo-card rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'unavailable'
              ? 'ring-2 ring-primary-600 bg-primary-50/30'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'unavailable' ? 'text-primary-800' : 'text-slate-500'}`}>
              Awaiting Forms
            </p>
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
          <button onClick={loadFeedbackDashboard} className="font-bold underline hover:text-rose-900 cursor-pointer">Retry</button>
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
          className="skeuo-card flex flex-col items-center justify-center rounded-2xl py-16 px-6 text-center"
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
              : 'Once events conclude or open during sessions, you can submit star ratings and detailed reviews here.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="skeuo-btn-primary rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer"
            >
              Explore Campus Events
            </button>
            {activeTab !== 'all' && (
              <button
                onClick={() => setSearchParams({ tab: 'all' })}
                className="skeuo-btn-secondary rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer"
              >
                View All ({eligibleEvents.length})
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedEvents.map((ev, idx) => {
            const info = feedbackForms[ev.id] || { hasForm: false, alreadySubmitted: false };
            const isPast = isEventPast(ev.event_date, ev.event_time);

            return (
              <motion.div
                key={ev.registration_id || ev.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
              >
                <EventCard
                  event={ev}
                  isPast={isPast}
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
                          className="skeuo-btn-secondary inline-flex items-center gap-1.5 rounded-xl !bg-emerald-50 !border-emerald-200 px-3.5 py-1.5 text-xs font-bold !text-emerald-800 cursor-pointer"
                        >
                          <CheckCircle2 size={13} className="text-emerald-600" /> View Response
                        </button>
                      ) : info.hasForm ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${ev.id}/feedback`);
                          }}
                          className="skeuo-btn-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                        >
                          <Star size={12} className="fill-white" /> Give Feedback
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${ev.id}`);
                          }}
                          className="text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
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