import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Check, X, Loader2, AlertCircle, Inbox, CalendarDays,
  Users, GraduationCap, BarChart3, TrendingUp, Images, Plus, Calendar,
  MapPin, ArrowRight, ChevronRight, UserCheck, Clock, CheckCircle2,
  Building2, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { showToast } from '../../../shared/utils/toast';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { fireCelebrationConfetti } from '../../../shared/utils/confetti';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  async function loadPending() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/pending-faculty');
      setPending(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load pending approvals');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const res = await api.get('/events/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadRecentEvents() {
    setRecentLoading(true);
    try {
      const res = await api.get('/events/admin/all');
      setRecentEvents((res.data || []).slice(0, 4));
    } catch (err) {
      console.error('Failed to load recent events:', err);
    } finally {
      setRecentLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
    loadStats();
    loadRecentEvents();
  }, []);

  async function handleDecision(id, status) {
    setActioningId(id);
    try {
      await api.patch(`/users/${id}/approval`, { status });
      setPending((prev) => prev.filter((f) => f.id !== id));
      if (status === 'approved') {
        fireCelebrationConfetti();
        showToast.success('Faculty approved successfully');
      } else {
        showToast.error('Faculty registration rejected');
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Action failed, try again');
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Profile & Welcome Banner (Enclosed in uniform container card box) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-800 border border-primary-100/80">
                Admin Portal
              </span>
              <span className="text-xs font-semibold text-slate-300">·</span>
              <span className="text-xs font-medium text-slate-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Welcome back, {user?.full_name || 'Admin'}!
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Platform governance, faculty onboarding approvals, event monitoring, and analytics.
              </p>
            </div>

            {/* Academic & Platform Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <Building2 size={13} className="text-slate-500 shrink-0" />
                Biratnagar International College
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 border border-primary-100 px-2.5 py-1 text-xs font-bold text-primary-800">
                <ShieldCheck size={14} className="text-primary-700 shrink-0" />
                System Governance & Administration
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-xs font-medium text-slate-600">
                <Mail size={13} className="text-slate-400 shrink-0" />
                {user?.email || 'admin@bic.edu.np'}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/create-event')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-3 text-xs font-bold text-white shadow-xs hover:shadow-md active:scale-95 transition-all shrink-0 self-start sm:self-center"
          >
            <Plus size={16} /> Create Campus Event
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 shadow-xs">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            {error}
          </span>
          <button onClick={loadPending} className="font-bold underline shrink-0 hover:text-rose-900">
            Retry
          </button>
        </div>
      )}

      {/* 2. Sophisticated 4-KPI Metric Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Events */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Events</p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-100/80">
              <CalendarDays size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{statsLoading ? '—' : stats?.totalEvents || 0}</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">All published events</p>
        </div>

        {/* Metric 2: Total Students */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Students</p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Users size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{statsLoading ? '—' : stats?.totalStudents || 0}</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">Registered students</p>
        </div>

        {/* Metric 3: Total Faculty */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Faculty</p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight text-slate-900">{statsLoading ? '—' : stats?.totalFaculty || 0}</p>
            {!statsLoading && stats?.pendingFaculty > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {stats.pendingFaculty} pending
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Registered faculty members</p>
        </div>

        {/* Metric 4: Total Registrations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registrations</p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <BarChart3 size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{statsLoading ? '—' : stats?.totalParticipants || 0}</p>
          <p className="mt-1 text-xs text-slate-400 font-medium">Total event registrations</p>
        </div>
      </div>

      {/* 3. Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Left Column: Pending Faculty Approvals & Recent Events */}
        <div className="space-y-6">
          {/* Pending Faculty Approvals Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Pending Faculty Approvals</h2>
                  <p className="text-xs text-slate-500">
                    {loading ? 'Loading...' : `${pending.length} account${pending.length === 1 ? '' : 's'} awaiting review`}
                  </p>
                </div>
              </div>

              {pending.length > 0 && (
                <button
                  onClick={() => navigate('/admin/users?role=faculty')}
                  className="text-xs font-bold text-primary-700 hover:underline"
                >
                  Manage Users →
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 border border-emerald-100">
                  <UserCheck size={24} />
                </div>
                <p className="text-sm font-bold text-slate-900">All faculty accounts reviewed</p>
                <p className="text-xs text-slate-500 mt-0.5">No pending registration approvals at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((f, idx) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300 hover:shadow-xs shadow-2xs"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{f.full_name}</p>
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <ShieldCheck size={11} /> Pending Review
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{f.email}{f.phone ? ` · ${f.phone}` : ''}</p>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      {f.faculty_id_code} · {f.department} · {f.designation}
                      {f.community && f.community !== 'N/A' ? ` · ${f.community}` : ''}
                    </p>
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={actioningId === f.id}
                        onClick={() => handleDecision(f.id, 'rejected')}
                        className="flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-bold py-1.5 px-3 rounded-xl text-xs transition disabled:opacity-50"
                      >
                        <X size={13} /> Reject
                      </button>
                      <button
                        type="button"
                        disabled={actioningId === f.id}
                        onClick={() => handleDecision(f.id, 'approved')}
                        className="flex items-center gap-1 bg-primary-700 hover:bg-primary-800 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition shadow-2xs disabled:opacity-50 active:scale-95"
                      >
                        {actioningId === f.id ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />}
                        Approve
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Campus Events Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-100">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Campus Events</h2>
                  <p className="text-xs text-slate-500">
                    {recentLoading ? 'Loading...' : `${recentEvents.length} events listed`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/events')}
                className="text-xs font-bold text-primary-700 hover:underline"
              >
                View All Events →
              </button>
            </div>

            {recentLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CalendarDays className="text-slate-300 mb-2" size={26} />
                <p className="text-xs font-medium text-slate-700">No events yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((ev, idx) => {
                  const isPast = isEventPast(ev.event_date);
                  const liveStatus = getEventStatus(ev.event_date, ev.event_time);
                  const style = getCategoryStyle(ev.category);
                  const dateObj = new Date(ev.event_date);
                  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const dayNum = dateObj.toLocaleDateString('en-US', { day: 'numeric' });

                  return (
                    <motion.div
                      key={ev.id}
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
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            liveStatus === 'ongoing'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPast
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {liveStatus === 'ongoing' ? '● Live Now' : isPast ? 'Ended' : 'Upcoming'}
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
          </div>
        </div>

        {/* Right Column: Quick Action Shortcuts */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900">Admin Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Fast shortcuts for administrative tools</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/create-event')}
                className="w-full flex items-center justify-between rounded-2xl bg-[#023433] p-4 text-left text-white shadow-2xs transition hover:bg-[#034443] hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                    <Plus size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Publish New Event</p>
                    <p className="text-[11px] text-emerald-200/80">Create institutional campus events</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-emerald-300 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/admin/events')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-100">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Manage All Events</p>
                    <p className="text-[11px] text-slate-500">Edit, moderate, or delete campus events</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">User Management</p>
                    <p className="text-[11px] text-slate-500">Student & faculty accounts directory</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/admin/reports')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Analytics & Reports</p>
                    <p className="text-[11px] text-slate-500">Participation data and PDF summaries</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/admin/gallery')}
                className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs transition hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Images size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Campus Photo Gallery</p>
                    <p className="text-[11px] text-slate-500">Manage event photo albums</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}