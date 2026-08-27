import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Ticket, Calendar, Clock, MapPin, AlertCircle, Inbox, CalendarDays,
  Sparkles, History, CheckCircle2, ArrowRight, MessageSquare, Plus,
  Layers, Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../shared/services/api';
import EventCard from '../../../shared/components/EventCard';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';

export default function MyRegistrations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState({}); // { eventId: 'none' | 'open' | 'submitted' }

  const activeTab = searchParams.get('tab') || 'upcoming'; // 'upcoming' | 'past' | 'all'

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/registrations/my');
      const data = res.data || [];
      setRegistrations(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your registrations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const { upcoming, past } = useMemo(() => {
    const up = [];
    const pa = [];

    registrations.forEach((r) => {
      const status = getEventStatus(r.event_date, r.event_time, r.status, r.publish_at);
      const isPastDate = isEventPast(r.event_date, r.event_time);

      if (status === 'ongoing') {
        up.push(r);
      } else if (status === 'ended' || isPastDate || r.status === 'cancelled') {
        pa.push(r);
      } else {
        up.push(r);
      }
    });

    return { upcoming: up, past: pa };
  }, [registrations]);

  useEffect(() => {
    let cancelled = false;
    async function checkFeedback() {
      if (past.length === 0) return;
      try {
        const entries = await Promise.all(
          past.map(async (ev) => {
            try {
              const res = await api.get(`/feedback/forms/event/${ev.id}`);
              if (!res.data?.form) return [ev.id, 'none'];
              return [ev.id, res.data.alreadySubmitted ? 'submitted' : 'open'];
            } catch {
              return [ev.id, 'none'];
            }
          })
        );
        if (!cancelled) setFeedbackStatus(Object.fromEntries(entries));
      } catch (err) {
        console.error('Feedback check failed:', err);
      }
    }
    checkFeedback();
    return () => { cancelled = true; };
  }, [past]);

  const items = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : registrations;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-800 border border-primary-100/80">
              Campus Passes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            My Registrations
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Track and manage your registered event entries, participation tickets, and feedback history.
          </p>
        </div>

        <button
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:shadow-md active:scale-95 transition-all"
        >
          <CalendarDays size={16} /> Explore All Events
        </button>
      </div>

      {/* 2. Interactive KPI Tab Cards (Click card to filter view) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Metric 1: Total */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'all' })}
          className={`relative rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer ${
            activeTab === 'all'
              ? 'border-2 border-primary-700 bg-primary-50/40 shadow-sm ring-4 ring-primary-100/60'
              : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'all' ? 'text-primary-800' : 'text-slate-500'}`}>
              All Registrations
            </p>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              activeTab === 'all' ? 'bg-primary-700 text-white border-primary-700' : 'bg-primary-50 text-primary-700 border-primary-100/80'
            }`}>
              <Ticket size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : registrations.length}</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">All-time campus entries</p>
            {activeTab === 'all' && (
              <span className="text-[10.5px] font-bold text-primary-700 bg-primary-100/80 px-2 py-0.5 rounded-md">
                Active View
              </span>
            )}
          </div>
        </button>

        {/* Metric 2: Upcoming */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'upcoming' })}
          className={`relative rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer ${
            activeTab === 'upcoming'
              ? 'border-2 border-amber-600 bg-amber-50/40 shadow-sm ring-4 ring-amber-100/60'
              : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'upcoming' ? 'text-amber-800' : 'text-slate-500'}`}>
              Upcoming Events
            </p>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              activeTab === 'upcoming' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              <Sparkles size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : upcoming.length}</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">Scheduled on your agenda</p>
            {activeTab === 'upcoming' && (
              <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                Active View
              </span>
            )}
          </div>
        </button>

        {/* Metric 3: Past */}
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'past' })}
          className={`relative rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer ${
            activeTab === 'past'
              ? 'border-2 border-slate-700 bg-slate-100/60 shadow-sm ring-4 ring-slate-200'
              : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'past' ? 'text-slate-900' : 'text-slate-500'}`}>
              Past Attended
            </p>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              activeTab === 'past' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              <History size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : past.length}</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">Concluded event history</p>
            {activeTab === 'past' && (
              <span className="text-[10.5px] font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded-md">
                Active View
              </span>
            )}
          </div>
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 shadow-xs">
          <span className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            {error}
          </span>
          <button onClick={load} className="font-bold underline shrink-0 hover:text-rose-900">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
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
            {activeTab === 'upcoming'
              ? 'No Upcoming Event Registrations'
              : activeTab === 'past'
              ? 'No Past Attended Events'
              : 'No Event Registrations Yet'}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            {activeTab === 'upcoming'
              ? 'Explore our upcoming hackathons, guest lectures, and campus festivals to register!'
              : 'Events you attend will appear in your past activity logs once concluded.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
            >
              Browse Campus Events
            </button>
            {activeTab !== 'all' && (
              <button
                onClick={() => setSearchParams({ tab: 'all' })}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
              >
                View All ({registrations.length})
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ev, idx) => {
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
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 size={13} /> Registered
                      </span>

                      {/* Right action button */}
                      {isPast ? (
                        feedbackStatus[ev.id] === 'open' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${ev.id}/feedback`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95"
                          >
                            <MessageSquare size={12} /> Give Feedback
                          </button>
                        ) : feedbackStatus[ev.id] === 'submitted' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${ev.id}/feedback`);
                            }}
                            className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                          >
                            Feedback Done ✓
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${ev.id}`);
                            }}
                            className="text-xs font-bold text-primary-700 hover:underline inline-flex items-center gap-1"
                          >
                            Details <ArrowRight size={12} />
                          </button>
                        )
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${ev.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 hover:bg-primary-800 px-4 py-2 text-xs font-bold text-white shadow-2xs transition active:scale-95"
                        >
                          View Pass <ArrowRight size={12} />
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