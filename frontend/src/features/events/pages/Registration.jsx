import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, AlertCircle, Loader2, FileX, Users, CheckCircle2, Download, ExternalLink, Ban } from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { showToast } from '../../../shared/utils/toast';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { getEventStatus } from '../../../shared/utils/eventStatus';
import { getGoogleCalendarUrl, downloadIcsFile } from '../../../shared/utils/calendarIntegration';
import { fireCelebrationConfetti } from '../../../shared/utils/confetti';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

export default function Registration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const [teamMembers, setTeamMembers] = useState('');
  const [teamChoice, setTeamChoice] = useState(null); // null | 'individual' | 'team'
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/events/${id}`);
        setEvent(data.event || data);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (event?.is_team_event) {
      if (!teamChoice) {
        return setError("Please choose whether you're registering individually or as a team.");
      }
      if (teamChoice === 'team' && !teamMembers.trim()) {
        return setError('Please enter your team name and members.');
      }
    }

    if (!agreed) {
      return setError('Please agree to the event rules & eligibility to continue');
    }

    setSubmitting(true);
    try {
      await api.post('/registrations', {
        eventId: id,
        teamMembers: event?.is_team_event && teamChoice === 'team' ? teamMembers : undefined,
      });
      showToast.success("You're registered!");
      setRegisteredSuccess(true);
      fireCelebrationConfetti();
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again to complete your registration.');
      } else if (err.response?.status === 403) {
        setError(err.response?.data?.message || 'Access restricted: Only student accounts can register for events.');
      } else {
        setError(err.response?.data?.message || 'Registration failed, please try again');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-32 animate-pulse rounded-[24px] border border-slate-200 bg-slate-100" />
        <div className="h-64 animate-pulse rounded-[24px] border border-slate-200 bg-slate-100" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileX className="mb-4 text-slate-300" size={40} />
        <p className="text-sm font-semibold text-slate-700">This event doesn't exist or has been removed</p>
        <Link to="/events" className="mt-2 text-xs font-medium text-primary-600 hover:underline">← Back to All Events</Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg text-center space-y-6 py-8 animate-in fade-in duration-200">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8 shadow-lg space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 shadow-2xs border border-primary-100">
            <Users size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign In to Register</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Please log in with your student account (or sign up as a guest participant) to register for <strong className="text-slate-800">{event.title}</strong>.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/events/${id}`)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              ← Back to Event
            </button>
            <Link
              to={`/login?redirect=/events/${id}/register`}
              className="w-full sm:w-auto rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
            >
              Sign In to Register →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role !== 'student') {
    return (
      <div className="mx-auto max-w-lg text-center space-y-6 py-8 animate-in fade-in duration-200">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8 shadow-lg space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 shadow-2xs border border-amber-100">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Student Registration Only</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Event registrations are open to students and guest attendees. You are currently signed in as a <strong className="text-slate-800 capitalize">{user.role}</strong> account.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/events/${id}`)}
              className="rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
            >
              ← View Event Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  const liveStatus = event ? getEventStatus(event.event_date, event.event_time, event.status, event.publish_at) : 'upcoming';
  const isFull = Boolean(event?.max_participants && (event.registered_count ?? event.registration_count ?? 0) >= event.max_participants);

  if ((registeredSuccess || event.is_registered) && event) {
    return (
      <div className="mx-auto max-w-lg text-center space-y-6 py-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
            <CheckCircle2 size={36} />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {registeredSuccess ? 'Registration Confirmed' : 'You Are Already Registered'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              You're officially registered for <strong className="text-slate-800">{event.title}</strong>.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary-600 shrink-0" />
              <span><strong>Date:</strong> {new Date(event.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-primary-600 shrink-0" />
              <span><strong>Time:</strong> {formatTime12hr(event.event_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-primary-600 shrink-0" />
              <span><strong>Venue:</strong> {event.location || 'Biratnagar International College'}</span>
            </div>
          </div>

          {/* Big Google Calendar & iCal Button */}
          <div className="pt-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Sync with Your Schedule</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <a
                href={getGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition active:scale-95"
              >
                <Calendar size={15} />
                <span>Add to Google Calendar</span>
                <ExternalLink size={12} className="opacity-80" />
              </a>
              <button
                type="button"
                onClick={() => downloadIcsFile(event)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Download size={14} />
                <span>Apple / Outlook (.ics)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(`/events/${id}`)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              View Event Details
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/registrations')}
              className="rounded-xl bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-600 transition cursor-pointer"
            >
              My Registrations →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (event.status === 'cancelled') {
    return (
      <div className="mx-auto max-w-lg text-center space-y-6 py-8 animate-in fade-in duration-200">
        <div className="rounded-[28px] border border-rose-200 bg-white p-6 sm:p-8 shadow-lg space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 shadow-2xs border border-rose-100">
            <Ban size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Event Cancelled</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Registration is closed because <strong className="text-slate-800">{event.title}</strong> has been cancelled.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
            >
              ← Browse Other Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (liveStatus === 'ended') {
    return (
      <div className="mx-auto max-w-lg text-center space-y-6 py-8 animate-in fade-in duration-200">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8 shadow-lg space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 shadow-2xs border border-slate-200">
            <Calendar size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Event Concluded</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Registration is closed because <strong className="text-slate-800">{event.title}</strong> took place on{' '}
            {new Date(event.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} and has already completed.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
            >
              ← Browse Upcoming Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="mx-auto max-w-lg text-center space-y-6 py-8 animate-in fade-in duration-200">
        <div className="rounded-[28px] border border-amber-200 bg-white p-6 sm:p-8 shadow-lg space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 shadow-2xs border border-amber-200">
            <Users size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Event Capacity Full</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            All <strong className="text-slate-800">{event.max_participants}</strong> participant spots for{' '}
            <strong className="text-slate-800">{event.title}</strong> have been filled.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="rounded-xl bg-primary-700 hover:bg-primary-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
            >
              ← Find Other Campus Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const style = getCategoryStyle(event?.category);
  const isBic = Boolean(user?.is_bic_student || user?.college_name?.toLowerCase() === 'bic' || user?.college_name?.toLowerCase()?.includes('biratnagar'));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-0.5 text-xl font-bold text-slate-900 sm:text-2xl">Register for Event</h1>
      <p className="mb-5 text-xs text-slate-500 sm:text-sm">Confirm your details and complete registration</p>

      <div className="mb-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
        {event.banner_image && (
          <div className="h-40 w-full">
            <img
              src={event.banner_image}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: 'center 32%' }}
            />
          </div>
        )}
        <div className="p-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-700">Event Details</h2>
        <h3 className="mb-3 text-lg font-bold text-slate-900">{event.title}</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={15} className="text-slate-400" />
            <span>Date: <strong className="text-slate-900">{new Date(event.event_date).toLocaleDateString()}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock size={15} className="text-slate-400" />
            <span>Time: <strong className="text-slate-900">{formatTime12hr(event.event_time)}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={15} className="text-slate-400" />
            <span>Location: <strong className="text-slate-900">{event.location}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{event.category}</span>
            {event.is_team_event ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                <Users size={12} /> Team Event
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Individual
              </span>
            )}
          </div>
        </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="skeuo-card rounded-[24px] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Personal Information</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <span className="text-slate-500">Full Name</span>
              <span className="font-medium text-slate-900">{user?.full_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-900">{user?.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-1.5">
              <span className="text-slate-500">College</span>
              <span className="font-medium text-slate-900">{user?.college_name}</span>
            </div>
            {isBic ? (
              <>
                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                  <span className="text-slate-500">Course</span>
                  <span className="font-medium text-slate-900">{user?.course_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Level / Semester / Group</span>
                  <span className="font-medium text-slate-900">
                    {user?.academic_level} / {user?.academic_semester} / {user?.academic_group}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-slate-500">Course / Major</span>
                <span className="font-medium text-slate-900">{user?.course_major}</span>
              </div>
            )}
          </div>
        </div>

        {event.is_team_event ? (
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                Registration Type <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">This is a team event — choose how you'd like to register.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTeamChoice('individual'); setTeamMembers(''); }}
                  className={`min-h-[44px] flex items-center justify-center rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer ${
                    teamChoice === 'individual'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Register Individually
                </button>
                <button
                  type="button"
                  onClick={() => setTeamChoice('team')}
                  className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer ${
                    teamChoice === 'team'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users size={16} /> Register as a Team
                </button>
              </div>
            </div>

            {teamChoice === 'team' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Team Name & Members <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(e.target.value)}
                  placeholder="e.g. Team Alpha - John Doe, Sarah Smith, Michael Brown"
                  className="skeuo-input w-full rounded-xl p-3 text-xs sm:text-sm min-h-[90px] resize-y placeholder:text-slate-400"
                />
              </div>
            )}
          </div>
        ) : null}

        <label className="flex items-start gap-3 py-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded-md accent-primary-600 cursor-pointer"
          />
          <span className="text-xs text-slate-600 leading-relaxed font-medium">
            I agree to the event's rules & eligibility criteria and confirm the details above are correct.
          </span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/events/${id}`)}
            className="skeuo-btn-secondary flex-1 min-h-[46px] py-3 rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="skeuo-btn-primary flex-1 min-h-[46px] py-3 rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
            {submitting ? 'Registering...' : 'Register Now'}
          </button>
        </div>
      </form>
    </div>
  );
}