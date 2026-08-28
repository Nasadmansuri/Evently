import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck, History, AlertCircle, Inbox, Image, ListChecks, MessageSquare,
  Users, CalendarDays, TrendingUp, ArrowRight, PlayCircle, ChevronRight,
  MapPin, Clock, CheckCircle2, Award, Building2, GraduationCap, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { getStudentCourseLabel } from '../../../shared/utils/studentInfo';
import { getEventStatus, isEventPast } from '../../../shared/utils/eventStatus';
import { formatTime12hr } from '../../../shared/utils/formatTime';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  async function loadRegistrations() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/registrations/my');
      setRegistrations(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your registrations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
  }, []);

  const { upcoming, past, ongoing } = useMemo(() => {
    const up = [];
    const pa = [];
    const live = [];

    registrations.forEach((r) => {
      const status = getEventStatus(r.event_date, r.event_time, r.status, r.publish_at);
      if (status === 'ongoing') {
        live.push(r);
        up.push(r); // Active ongoing events remain in current view
      } else if (status === 'ended' || isEventPast(r.event_date, r.event_time) || r.status === 'cancelled') {
        pa.push(r);
      } else {
        up.push(r);
      }
    });

    return { upcoming: up, past: pa, ongoing: live };
  }, [registrations]);

  const displayedEvents = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Integrated Welcome Header with Distinct Surface Treatment */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white via-slate-50/40 to-primary-50/20 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-800 border border-primary-100/80">
                Student Portal
              </span>
              <span className="text-xs font-semibold text-slate-300">·</span>
              <span className="text-xs font-medium text-slate-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}!
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                View your registered events, discover campus activities, and submit feedback.
              </p>
            </div>

            {/* Clean, Uniform Academic Credentials Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                <Building2 size={13} className="text-slate-500 shrink-0" />
                {user?.is_bic_student || user?.college_name?.toLowerCase() === 'bic' ? 'Biratnagar International College' : (user?.college_name || 'Affiliated Campus')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-800">
                <GraduationCap size={14} className="text-emerald-700 shrink-0" />
                {getStudentCourseLabel(user) || 'Computing & IT'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/90 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
                <Mail size={13} className="text-slate-400 shrink-0" />
                {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-700 hover:bg-primary-800 active:bg-primary-900 px-5 py-3 text-xs font-bold text-white shadow-xs hover:shadow-md active:scale-95 transition-all shrink-0 self-start sm:self-center"
          >
            <CalendarDays size={16} /> Explore All Events
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 shadow-xs">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            {error}
          </span>
          <button onClick={loadRegistrations} className="font-bold underline shrink-0 hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* 2. Stat Metric Cards with Genuine Visual Hierarchy */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Registered - Clean Typographic Treatment */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all duration-150 flex flex-col justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : registrations.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">All-time registrations</p>
          </div>
        </div>

        {/* Upcoming Events - Clean Typographic Treatment */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all duration-150 flex flex-col justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Upcoming</p>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : upcoming.length}</p>
            <p className="mt-1 text-xs text-primary-700 font-semibold">Scheduled on calendar</p>
          </div>
        </div>

        {/* Live / Ongoing - Urgent Visual Hierarchy with Live Indicator */}
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-50/50 via-white to-white p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Happening Now</p>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">LIVE</span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : ongoing.length}</p>
            <p className="mt-1 text-xs text-emerald-700 font-bold">
              {ongoing.length > 0 ? `${ongoing.length} event in progress` : 'None in session right now'}
            </p>
          </div>
        </div>

        {/* Attended / Past - Clean Typographic Treatment */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 transition-all duration-150 flex flex-col justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attended & Past</p>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : past.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Past events attended</p>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Left Column: Registered Events with Elevated Card Canvas */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Registered Events</h2>
              </div>

              {/* Fluid Sliding Tab Selector */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/80">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    activeTab === 'upcoming'
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {activeTab === 'upcoming' && (
                    <motion.div
                      layoutId="studentDashRegTab"
                      className="absolute inset-0 rounded-lg bg-primary-700 shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">Upcoming ({loading ? '—' : upcoming.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    activeTab === 'past'
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {activeTab === 'past' && (
                    <motion.div
                      layoutId="studentDashRegTab"
                      className="absolute inset-0 rounded-lg bg-primary-700 shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">Past ({loading ? '—' : past.length})</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : displayedEvents.length === 0 ? (
              <div className="py-10 px-5 text-center flex flex-col items-center justify-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200/90">
                <div className="w-11 h-11 rounded-full bg-white border border-slate-200 text-primary-700 flex items-center justify-center mb-3 shadow-2xs">
                  <CalendarDays size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeTab === 'upcoming' ? 'No Upcoming Registrations' : 'No Past Event History'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                  {activeTab === 'upcoming'
                    ? 'Explore upcoming campus hackathons, workshops, and competitions to sign up.'
                    : 'Events you participate in will appear in your history once concluded.'}
                </p>
                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => navigate('/events')}
                    className="mt-4 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs px-4 py-2.5 shadow-xs active:scale-95 transition-all"
                  >
                    Browse Campus Events
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedEvents.slice(0, 4).map((ev, idx) => {
                  const style = getCategoryStyle(ev.category);
                  const status = getEventStatus(ev.event_date, ev.event_time);
                  const dateObj = new Date(ev.event_date);
                  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const dayNum = dateObj.toLocaleDateString('en-US', { day: 'numeric' });

                  return (
                    <motion.div
                      key={ev.registration_id || ev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-xs active:scale-[0.99]"
                    >
                      {/* Ticket-Style Date Block */}
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-800 transition group-hover:bg-primary-50 group-hover:border-primary-200">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-primary-700">
                          {monthName}
                        </span>
                        <span className="text-base font-black leading-none text-slate-900">
                          {dayNum}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}>
                            {ev.category}
                          </span>
                          {ev.team_members && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 border border-primary-200 px-1.5 py-0.5 text-[9.5px] font-bold text-primary-700">
                              <Users size={9} /> Team
                            </span>
                          )}
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            status === 'ongoing'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'ended'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {status === 'ongoing' ? '● Live Now' : status}
                          </span>
                        </div>

                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary-700 transition">
                          {ev.title}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          {ev.event_time && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              {formatTime12hr(ev.event_time)}
                            </span>
                          )}
                          {ev.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Chevron */}
                      <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-primary-50 flex items-center justify-center text-slate-400 group-hover:text-primary-700 transition border border-slate-200/80 shrink-0">
                        <ChevronRight size={15} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {displayedEvents.length > 4 && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  onClick={() => navigate(`/student/my-registrations?tab=${activeTab}`)}
                  className="text-xs font-bold text-primary-700 hover:underline inline-flex items-center gap-1"
                >
                  View All ({displayedEvents.length}) Registrations <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          <RecommendedEvents />
        </div>

        {/* Right Column: Quick Action Shortcuts with Inset Slate Well Canvas */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 sm:p-6 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 mb-3.5">Quick Actions</h2>

            <div className="space-y-2.5">
              {/* Primary Action Button */}
              <button
                onClick={() => navigate('/events')}
                className="w-full flex items-center justify-between rounded-xl bg-primary-700 hover:bg-primary-800 active:bg-primary-900 p-4 text-left text-white shadow-xs hover:shadow-md active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-primary-200 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">Browse All Campus Events</p>
                    <p className="text-[11px] text-primary-100/80">Discover upcoming workshops & activities</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-primary-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Secondary Navigation Items without bulky icon boxes */}
              <button
                onClick={() => navigate('/student/my-registrations')}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 p-3.5 text-left shadow-2xs active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <ListChecks size={18} className="text-slate-400 group-hover:text-primary-700 transition-colors shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Manage My Registrations</p>
                    <p className="text-[11px] text-slate-500">Track entry status & team tickets</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => navigate('/student/my-feedback')}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 p-3.5 text-left shadow-2xs active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={18} className="text-slate-400 group-hover:text-primary-700 transition-colors shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-primary-700 transition-colors">My Feedback & Reviews</p>
                    <p className="text-[11px] text-slate-500">Share ratings on completed events</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              <button
                onClick={() => navigate('/gallery')}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 p-3.5 text-left shadow-2xs active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Image size={18} className="text-slate-400 group-hover:text-primary-700 transition-colors shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Campus Photo Gallery</p>
                    <p className="text-[11px] text-slate-500">View event photography & highlights</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendedEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events/recommended')
      .then((res) => setEvents(res.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900">Recommended For You</h2>
        <p className="text-xs text-slate-500">Personalized events based on your department</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {events.map((ev) => {
            const style = getCategoryStyle(ev.category);
            return (
              <button
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}`)}
                className="group rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-left transition-all duration-200 hover:bg-white hover:border-primary-300 hover:shadow-xs active:scale-[0.98]"
              >
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}>
                  {ev.category}
                </span>
                <p className="mt-2 text-sm font-bold text-slate-900 truncate group-hover:text-primary-700 transition">
                  {ev.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{new Date(ev.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {ev.location && <span>· {ev.location}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}