import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, AlertCircle, Loader2, FileX, Users } from 'lucide-react';
import api from '../../../shared/services/api';
import { useAuth } from '../../../shared/context/AuthContext';
import { showToast } from '../../../shared/utils/toast';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

export default function Registration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [teamMembers, setTeamMembers] = useState('');
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
    if (!agreed) {
      return setError('Please agree to the event rules & eligibility to continue');
    }

    setSubmitting(true);
    try {
      await api.post('/registrations', { eventId: id, teamMembers: teamMembers || undefined });
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
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <FileX className="text-gray-300 mb-4" size={40} />
        <p className="text-sm font-semibold text-gray-700">This event doesn't exist or has been removed</p>
        <Link to="/events" className="text-xs text-primary-600 font-medium hover:underline mt-2">← Back to All Events</Link>
      </div>
    );
  }

  const style = getCategoryStyle(event.category);
  const isBic = event ? user?.is_bic_student : false;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">Register for Event</h1>
      <p className="text-xs sm:text-sm text-gray-500 mb-5">Confirm your details and complete registration</p>

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{event.category}</span>
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-2">{event.title}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Calendar size={12} />{new Date(event.event_date).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><Clock size={12} />{event.event_time?.slice(0, 5)}</span>
          <span className="flex items-center gap-1"><MapPin size={12} />{event.location}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Personal Information</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-500">Full Name</span>
              <span className="font-medium text-gray-900">{user?.full_name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-1.5">
              <span className="text-gray-500">College</span>
              <span className="font-medium text-gray-900">{user?.college_name}</span>
            </div>
            {isBic ? (
              <>
                <div className="flex justify-between border-b border-gray-50 pb-1.5">
                  <span className="text-gray-500">Course</span>
                  <span className="font-medium text-gray-900">{user?.course_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Level / Semester / Group</span>
                  <span className="font-medium text-gray-900">
                    {user?.academic_level} / {user?.academic_semester} / {user?.academic_group}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-500">Course / Major</span>
                <span className="font-medium text-gray-900">{user?.course_major}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <Users size={15} /> Team Information <span className="text-xs font-normal text-gray-400">(optional)</span>
          </h2>
          <textarea
            value={teamMembers}
            onChange={(e) => setTeamMembers(e.target.value)}
            placeholder="List your team members' names, if registering as a team..."
            className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
          />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary-600"
          />
          <span className="text-xs text-gray-600">
            I agree to the event's rules & eligibility criteria and confirm the details above are correct.
          </span>
        </label>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate(`/events/${id}`)}
            className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-lg text-sm transition"
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