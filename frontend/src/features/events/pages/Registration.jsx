import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, AlertCircle, Loader2, FileX, Users } from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { showToast } from '../../../shared/utils/toast';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { formatTime12hr } from '../../../shared/utils/formatTime';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

export default function Registration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [teamMembers, setTeamMembers] = useState('');
  const [teamChoice, setTeamChoice] = useState(null); // null | 'individual' | 'team'
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
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

async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (event.is_team_event) {
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
        teamMembers: event.is_team_event && teamChoice === 'team' ? teamMembers : undefined,
      });
      showToast.success("You're registered!");
      navigate(`/events/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed, please try again');
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

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileX className="mb-4 text-slate-300" size={40} />
        <p className="text-sm font-semibold text-slate-700">This event doesn't exist or has been removed</p>
        <Link to="/events" className="mt-2 text-xs font-medium text-primary-600 hover:underline">← Back to All Events</Link>
      </div>
    );
  }

  const style = getCategoryStyle(event.category);
  const isBic = event ? user?.is_bic_student : false;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-0.5 text-xl font-bold text-slate-900 sm:text-2xl">Register for Event</h1>
      <p className="mb-5 text-xs text-slate-500 sm:text-sm">Confirm your details and complete registration</p>

      <div className="mb-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
        {event.banner_image && (
          <div className="h-40 w-full">
            <img
              src={`${ASSET_BASE_URL}${event.banner_image}`}
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
            {event.is_team_event && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                <Users size={12} /> Team Event
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

      <form onSubmit={handleSubmit} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTeamChoice('individual'); setTeamMembers(''); }}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    teamChoice === 'individual'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Register Individually
                </button>
                <button
                  type="button"
                  onClick={() => setTeamChoice('team')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    teamChoice === 'team'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users size={16} /> Register as a Team
                </button>
              </div>
            </div>

            {teamChoice === 'team' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Team Name & Members <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(e.target.value)}
                  placeholder="e.g. Team Alpha - John, Sarah, Mike"
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                />
              </div>
            )}
          </div>
        ) : null}

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary-600"
          />
          <span className="text-xs text-slate-600">
            I agree to the event's rules & eligibility criteria and confirm the details above are correct.
          </span>
        </label>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate(`/events/${id}`)}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-2.5 rounded-lg text-sm transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] text-white font-medium py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
            {submitting ? 'Registering...' : 'Register Now'}
          </button>
        </div>
      </form>
    </div>
  );
}