import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Type, AlignLeft, Tag, MapPin, CalendarDays, Clock, Landmark, Users,
  ClipboardList, Trophy, UserCheck, Image, AlertCircle, Loader2, ChevronDown,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { ACADEMIC_STRUCTURE } from '../../../shared/utils/academicCascade';
import { COMMUNITIES, DEPARTMENT_DESIGNATIONS } from '../../../shared/utils/facultyStructure';

const CATEGORIES = ['Technical', 'Cultural', 'Workshop', 'Competition', 'Seminar', 'Sports', 'Conference'];
const ORGANIZING_DEPARTMENTS = [
  ...Object.keys(ACADEMIC_STRUCTURE),
  ...Object.keys(DEPARTMENT_DESIGNATIONS),
  'DevCorps',
];

export default function CreateEvent() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [organizingDepartment, setOrganizingDepartment] = useState('');
  const [organizingCommunity, setOrganizingCommunity] = useState('');
  const [rulesEligibility, setRulesEligibility] = useState('');
  const [prizeInfo, setPrizeInfo] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Please enter an event title');
    if (!description.trim()) return setError('Please enter a description');
    if (!category) return setError('Please select a category');
    if (!location.trim()) return setError('Please enter a location');
    if (!eventDate) return setError('Please select an event date');
    if (!eventTime) return setError('Please select an event time');
    if (!organizingDepartment) return setError('Please select the organizing department');
    if (organizingDepartment === 'DevCorps' && !organizingCommunity) {
      return setError('Please select the DevCorps community organizing this event');
    }

    setLoading(true);
    try {
      await api.post('/events', {
        title, description, category, location, eventDate, eventTime,
        organizingDepartment,
        organizingCommunity: organizingCommunity || undefined,
        rulesEligibility: rulesEligibility || undefined,
        prizeInfo: prizeInfo || undefined,
        maxParticipants: maxParticipants || undefined,
      });
      showToast.success('Event created successfully');
      navigate('/faculty/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-gray-200 bg-gray-50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white';
  const selectClass =
    'w-full appearance-none border border-gray-200 bg-gray-50 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white';
  const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400';
  const chevronClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none';
  const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
        <h1 className="text-xl font-bold text-gray-900 mb-0.5">Create New Event</h1>
        <p className="text-xs text-gray-500 mb-5">Fill in the details below to create an event</p>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
            <div>
              <label className={labelClass}>Event Title *</label>
              <div className="relative">
                <Type className={iconClass} size={16} />
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Enter event title" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Description *</label>
              <div className="relative">
                <AlignLeft className={`${iconClass} top-4 translate-y-0`} size={16} />
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} min-h-[90px] resize-y`}
                  placeholder="Describe the event in detail..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Category *</label>
                <div className="relative">
                  <Tag className={iconClass} size={16} />
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className={chevronClass} size={14} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Location *</label>
                <div className="relative">
                  <MapPin className={iconClass} size={16} />
                  <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Venue address" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Date & Time</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Event Date *</label>
                <div className="relative">
                  <CalendarDays className={iconClass} size={16} />
                  <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Event Time *</label>
                <div className="relative">
                  <Clock className={iconClass} size={16} />
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Event Details</h2>
            <div>
              <label className={labelClass}>Organizing Department *</label>
              <div className="relative">
                <Landmark className={iconClass} size={16} />
                <select
                  value={organizingDepartment}
                  onChange={(e) => {
                    setOrganizingDepartment(e.target.value);
                    if (e.target.value !== 'DevCorps') setOrganizingCommunity('');
                  }}
                  className={selectClass}
                >
                  <option value="">Select department</option>
                  {ORGANIZING_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <ChevronDown className={chevronClass} size={14} />
              </div>
            </div>
            {organizingDepartment === 'DevCorps' && (
              <div>
                <label className={labelClass}>DevCorps Community *</label>
                <div className="relative">
                  <Users className={iconClass} size={16} />
                  <select value={organizingCommunity} onChange={(e) => setOrganizingCommunity(e.target.value)} className={selectClass}>
                    <option value="">Select community</option>
                    {COMMUNITIES.filter((c) => c !== 'N/A').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className={chevronClass} size={14} />
                </div>
              </div>
            )}
            <div>
              <label className={labelClass}>Rules & Eligibility</label>
              <div className="relative">
                <ClipboardList className={`${iconClass} top-4 translate-y-0`} size={16} />
                <textarea
                  value={rulesEligibility} onChange={(e) => setRulesEligibility(e.target.value)}
                  className={`${inputClass} min-h-[70px] resize-y`}
                  placeholder="Who can participate, any restrictions..."
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Prize Information</label>
              <div className="relative">
                <Trophy className={`${iconClass} top-4 translate-y-0`} size={16} />
                <textarea
                  value={prizeInfo} onChange={(e) => setPrizeInfo(e.target.value)}
                  className={`${inputClass} min-h-[70px] resize-y`}
                  placeholder="Prizes or certificates, if any..."
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Maximum Participants</label>
              <div className="relative">
                <UserCheck className={iconClass} size={16} />
                <input
                  type="number" min="1" value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className={inputClass} placeholder="Leave blank for unlimited"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">Event Images</h2>
            <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center justify-center text-center opacity-50 cursor-not-allowed">
              <Image className="text-gray-400 mb-2" size={28} />
              <p className="text-sm font-medium text-gray-500">Coming soon</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Image upload will be available in a future update</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button" onClick={() => navigate('/faculty/dashboard')}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-2.5 rounded-lg text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] text-white font-medium py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}