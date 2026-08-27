import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Type, AlignLeft, Tag, MapPin, CalendarDays, Clock, Landmark, Users,
  ClipboardList, Trophy, UserCheck, Image, AlertCircle, Loader2, ChevronDown, X, Upload, UsersRound, Map, ExternalLink,
  RotateCcw, FileText, CheckCircle2, Info, Lock, CalendarClock
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { ACADEMIC_STRUCTURE } from '../../../shared/utils/academicCascade';
import { COMMUNITIES, DEPARTMENT_DESIGNATIONS } from '../../../shared/utils/facultyStructure';
import { isEventPast } from '../../../shared/utils/eventStatus';
import VenueLocationModal from '../../../shared/components/VenueLocationModal';

const CATEGORIES = ['Technical', 'Cultural', 'Workshop', 'Competition', 'Seminar', 'Sports', 'Conference'];
const ORGANIZING_DEPARTMENTS = [
  ...Object.keys(ACADEMIC_STRUCTURE),
  ...Object.keys(DEPARTMENT_DESIGNATIONS),
  'DevCorps',
];
const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

export default function CreateEvent() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const isEditMode = !!eventId;
  const { user } = useAuth();
  const dashboardPath = user?.role === 'admin' ? '/admin/events' : '/faculty/dashboard';
  const [loadingEvent, setLoadingEvent] = useState(isEditMode);
  const [isConcludedEvent, setIsConcludedEvent] = useState(false);
  const todayString = new Date().toISOString().split('T')[0];

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
  const [isTeamEvent, setIsTeamEvent] = useState(false);

  const [publishType, setPublishType] = useState('now'); // 'now' | 'scheduled'
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]); // [{ file, previewUrl }]
  const [bannerIndex, setBannerIndex] = useState(null); // index into newImages, only relevant when existingImages is empty
  const [imageError, setImageError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLocationPreview, setShowLocationPreview] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore unsaved draft on mount for new events
  useEffect(() => {
    if (isEditMode) return;
    try {
      const saved = localStorage.getItem('evently_event_draft');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.description) setDescription(d.description);
        if (d.category) setCategory(d.category);
        if (d.location) setLocation(d.location);
        if (d.eventDate) setEventDate(d.eventDate);
        if (d.eventTime) setEventTime(d.eventTime);
        if (d.organizingDepartment) setOrganizingDepartment(d.organizingDepartment);
        if (d.organizingCommunity) setOrganizingCommunity(d.organizingCommunity);
        if (d.rulesEligibility) setRulesEligibility(d.rulesEligibility);
        if (d.prizeInfo) setPrizeInfo(d.prizeInfo);
        if (d.maxParticipants) setMaxParticipants(d.maxParticipants);
        if (d.isTeamEvent !== undefined) setIsTeamEvent(d.isTeamEvent);
        setDraftRestored(true);
      }
    } catch (e) {
      console.error('Failed to restore draft:', e);
    }
  }, [isEditMode]);

  // Real-time auto-save draft to localStorage
  useEffect(() => {
    if (isEditMode) return;
    const hasAnyContent =
      title.trim() || description.trim() || category || location.trim() || eventDate || eventTime || organizingDepartment;
    if (hasAnyContent) {
      const draft = {
        title, description, category, location, eventDate, eventTime,
        organizingDepartment, organizingCommunity, rulesEligibility,
        prizeInfo, maxParticipants, isTeamEvent,
      };
      localStorage.setItem('evently_event_draft', JSON.stringify(draft));
    }
  }, [
    isEditMode, title, description, category, location, eventDate,
    eventTime, organizingDepartment, organizingCommunity, rulesEligibility,
    prizeInfo, maxParticipants, isTeamEvent
  ]);

  function handleDiscardDraft() {
    localStorage.removeItem('evently_event_draft');
    setTitle('');
    setDescription('');
    setCategory('');
    setLocation('');
    setEventDate('');
    setEventTime('');
    setOrganizingDepartment('');
    setOrganizingCommunity('');
    setRulesEligibility('');
    setPrizeInfo('');
    setMaxParticipants('');
    setIsTeamEvent(false);
    setDraftRestored(false);
    showToast.info('Draft cleared');
  }

  useEffect(() => {
    if (!isEditMode) return;
    async function loadEvent() {
      try {
        const res = await api.get(`/events/${eventId}`);
        const ev = res.data;
        setTitle(ev.title);
        setDescription(ev.description);
        setCategory(ev.category);
        setLocation(ev.location);
        setEventDate(ev.event_date?.slice(0, 10));
        setEventTime(ev.event_time?.slice(0, 5));
        setOrganizingDepartment(ev.organizing_department);
        setOrganizingCommunity(ev.organizing_community || '');
        setRulesEligibility(ev.rules_eligibility || '');
        setPrizeInfo(ev.prize_info || '');
        setMaxParticipants(ev.max_participants || '');
        setIsTeamEvent(!!ev.is_team_event);
        if (ev.status === 'cancelled') {
          setError('This event was cancelled by administration and cannot be modified.');
        }
        const concluded = isEventPast(ev.event_date, ev.event_time) || ev.status === 'ended';
        setIsConcludedEvent(concluded);
      } catch (err) {
        setError('Failed to load event for editing');
      } finally {
        setLoadingEvent(false);
      }
    }
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (!isEditMode) return;
    async function loadImages() {
      try {
        const res = await api.get(`/events/${eventId}/images`);
        setExistingImages(res.data);
      } catch (err) {
        // non-critical, silent
      }
    }
    loadImages();
  }, [eventId]);

  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setImageError('');

    const totalCount = existingImages.length + newImages.length + files.length;
    if (totalCount > MAX_IMAGES) {
      setImageError(`You can have a maximum of ${MAX_IMAGES} images per event`);
      return;
    }

    const oversized = files.find((f) => f.size > MAX_IMAGE_SIZE);
    if (oversized) {
      setImageError(`"${oversized.name}" is over 5MB`);
      return;
    }

    const notImage = files.find((f) => !f.type.startsWith('image/'));
    if (notImage) {
      setImageError(`"${notImage.name}" is not an image file`);
      return;
    }

    const withPreviews = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setNewImages((prev) => {
      const updated = [...prev, ...withPreviews];
      if (bannerIndex === null && existingImages.length === 0) setBannerIndex(prev.length);
      return updated;
    });
  }

  function removeNewImage(index) {
    setNewImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
    setImageError('');
    setBannerIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      return prev > index ? prev - 1 : prev;
    });
  }

  async function handleDeleteExistingImage(imageId) {
    setDeletingImageId(imageId);
    try {
      await api.delete(`/events/${eventId}/images/${imageId}`);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      showToast.success('Image deleted');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSetBanner(imageId) {
    try {
      const res = await api.patch(`/events/${eventId}/images/${imageId}/banner`);
      setExistingImages(res.data);
      showToast.success('Banner image updated');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to set banner image');
    }
  }

  function handleSelectNewBanner(index) {
    setBannerIndex(index);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Please enter an event title');
    if (!description.trim()) return setError('Please enter a description');
    if (!category) return setError('Please select a category');
    if (!location.trim()) return setError('Please enter a location');
    if (!eventDate) return setError('Please select an event date');
    if (!isEditMode && eventDate < todayString) {
      return setError('Event date cannot be in the past. Please select today or a future date.');
    }
    if (!eventTime) return setError('Please select an event time');
    if (!organizingDepartment) return setError('Please select the organizing department');
    if (organizingDepartment === 'DevCorps' && !organizingCommunity) {
      return setError('Please select the DevCorps community organizing this event');
    }

    if (!isEditMode && publishType === 'scheduled') {
      if (!publishDate) return setError('Please select a scheduled publish date');
      if (!publishTime) return setError('Please select a scheduled publish time');
      const schedTime = new Date(`${publishDate}T${publishTime}`);
      const evStart = new Date(`${eventDate}T${eventTime}`);
      if (schedTime <= new Date()) {
        return setError('Scheduled publish time must be in the future.');
      }
      if (schedTime > evStart) {
        return setError(`Scheduled publish date (${publishDate}) cannot be after the event takes place (${eventDate}). Please update your Event Date or choose an earlier publish date.`);
      }
    }

    setLoading(true);
    try {
      const payload = {
        title, description, category, location, eventDate, eventTime,
        organizingDepartment,
        organizingCommunity: organizingCommunity || undefined,
        rulesEligibility: rulesEligibility || undefined,
        prizeInfo: prizeInfo || undefined,
        maxParticipants: maxParticipants || undefined,
        isTeamEvent: isTeamEvent,
        publishType,
        publishDate: publishType === 'scheduled' ? publishDate : undefined,
        publishTime: publishType === 'scheduled' ? publishTime : undefined,
      };

      let targetEventId = eventId;
      if (isEditMode) {
        await api.patch(`/events/${eventId}`, payload);
      } else {
        const res = await api.post('/events', payload);
        targetEventId = res.data.eventId;
        localStorage.removeItem('evently_event_draft');
        setDraftRestored(false);
        if (res.data.isScheduled) {
          showToast.success('Event scheduled for automatic release!');
        } else {
          showToast.success('Event created and published successfully!');
        }
      }

      if (newImages.length > 0) {
        setUploadingImages(true);
        try {
          const formData = new FormData();
          newImages.forEach(({ file }) => formData.append('images', file));
          const uploadRes = await api.post(`/events/${targetEventId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (!isEditMode && bannerIndex !== null && uploadRes.data[bannerIndex]) {
            await api.patch(`/events/${targetEventId}/images/${uploadRes.data[bannerIndex].id}/banner`);
          }
        } catch (imgErr) {
          showToast.error(
            imgErr.response?.data?.message || 'Event saved, but photo upload failed. You can retry from Edit Event.'
          );
        } finally {
          setUploadingImages(false);
        }
      }

      if (isEditMode) {
        showToast.success('Event updated successfully');
        navigate(`/events/${eventId}`);
      } else {
        navigate(`/events/${targetEventId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-slate-200 bg-slate-50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white';
  const selectClass =
    'w-full appearance-none border border-slate-200 bg-slate-50 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white';
  const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400';
  const chevronClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';
  const labelClass = 'block text-xs font-medium text-slate-700 mb-1';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-0.5 text-xl font-bold text-slate-900">{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
            <p className="mb-5 text-xs text-slate-500">
              {isEditMode ? 'Update the event details below' : 'Fill in the details below to create an event'}
            </p>
          </div>
          {!isEditMode && (title || description || location) && (
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Clear all fields"
            >
              <RotateCcw size={12} /> Clear Form
            </button>
          )}
        </div>

        {draftRestored && !isEditMode && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 text-xs text-emerald-900 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Restored unsaved draft automatically</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
              >
                Clear Inputs
              </button>
              <button
                type="button"
                onClick={() => setDraftRestored(false)}
                className="rounded-md p-1 text-emerald-700 hover:bg-emerald-100 transition"
                title="Dismiss message"
                aria-label="Dismiss message"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {isEditMode && isConcludedEvent && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs font-medium text-amber-900 animate-in fade-in duration-200">
            <Lock size={16} className="text-amber-600 shrink-0" />
            <span>
              This is a concluded event record. Date and time are locked to preserve historical accuracy. You can update the title, description, rules, prizes, and gallery photos.
            </span>
          </div>
        )}

        {loadingEvent && (
          <div className="mb-4 h-40 animate-pulse rounded-xl bg-slate-100" />
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Basic Information</h2>
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
          </div>

          {/* Campus Location & Venue Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Campus Venue & Location</h2>
                <p className="text-[11px] text-slate-500">Biratnagar International College (Bhrikuti Chowk, Biratnagar)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationPreview(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-800 transition"
              >
                <Map size={13} />
                <span>Preview Map</span>
              </button>
            </div>

            <div>
              <label className={labelClass}>Venue / Hall / Room Name *</label>
              <div className="relative">
                <MapPin className={iconClass} size={16} />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Wulfruna, SR-Wolves, SR-Compton"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Date & Time</h2>
              {isConcludedEvent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10.5px] font-bold text-slate-600 border border-slate-200">
                  <Lock size={11} /> Locked (Concluded Event)
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Event Date *</label>
                <div className="relative">
                  <CalendarDays className={iconClass} size={16} />
                  <input
                    type="date"
                    disabled={isConcludedEvent}
                    min={todayString}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className={`${inputClass} ${isConcludedEvent ? 'bg-slate-100/90 text-slate-500 cursor-not-allowed border-slate-200 opacity-90' : ''}`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Event Time *</label>
                <div className="relative">
                  <Clock className={iconClass} size={16} />
                  <input
                    type="time"
                    disabled={isConcludedEvent}
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className={`${inputClass} ${isConcludedEvent ? 'bg-slate-100/90 text-slate-500 cursor-not-allowed border-slate-200 opacity-90' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Event Details</h2>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              
              <div>
                <label className={labelClass}>Registration Type</label>
                <div 
                  className={`relative flex items-center justify-between cursor-pointer rounded-lg border px-4 py-2 transition-colors ${
                    isTeamEvent 
                      ? 'border-primary-500 bg-primary-50/50' 
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsTeamEvent(!isTeamEvent)}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} className={isTeamEvent ? 'text-primary-600' : 'text-slate-400'} />
                    <span className={`text-sm font-medium ${isTeamEvent ? 'text-primary-700' : 'text-slate-700'}`}>
                      Team Event
                    </span>
                  </div>
                  <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out ${isTeamEvent ? 'bg-primary-600' : 'bg-slate-300'}`}>
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isTeamEvent ? 'translate-x-2' : '-translate-x-2'}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Event Images</h2>
              <span className="text-[11px] text-slate-400">Optional · up to {MAX_IMAGES}, 5MB each</span>
            </div>

            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {existingImages.map((img) => (
                  <button
                    type="button"
                    key={img.id}
                    onClick={() => !img.is_banner && handleSetBanner(img.id)}
                    className={`group relative aspect-square overflow-hidden rounded-lg border-2 text-left transition ${
                      img.is_banner ? 'border-primary-500 ring-2 ring-primary-200 cursor-default' : 'border-slate-200 cursor-pointer'
                    }`}
                  >
                    <img
                      src={`${ASSET_BASE_URL}${img.image_url}`}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                    {img.is_banner && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                        Cover
                      </span>
                    )}

                    <span
                      onClick={(e) => { e.stopPropagation(); handleDeleteExistingImage(img.id); }}
                      title="Delete image"
                      role="button"
                      tabIndex={0}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 shadow-sm transition duration-150 hover:bg-red-600 group-hover:opacity-100"
                    >
                      {deletingImageId === img.id ? <Loader2 className="animate-spin" size={12} /> : <X size={12} />}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {newImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {newImages.map((img, i) => {
                  const isCover = existingImages.length === 0 && bannerIndex === i;
                  return (
                    <button
                      type="button"
                      key={img.previewUrl}
                      onClick={() => existingImages.length === 0 && handleSelectNewBanner(i)}
                      className={`group relative aspect-square overflow-hidden rounded-lg border-2 text-left transition ${
                        isCover ? 'border-primary-500 ring-2 ring-primary-200' : 'border-slate-200'
                      } ${existingImages.length === 0 ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                      {isCover && (
                        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                          Cover
                        </span>
                      )}

                      <span
                        onClick={(e) => { e.stopPropagation(); removeNewImage(i); }}
                        title="Remove"
                        role="button"
                        tabIndex={0}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 shadow-sm transition duration-150 hover:bg-red-600 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-8 text-center transition hover:border-primary-300 hover:bg-primary-50/30">
              <Upload className="mb-2 text-slate-400" size={24} />
              <p className="text-sm font-medium text-slate-600">Click to add photos</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Not required — you can skip this</p>
              <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
            </label>

            {imageError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                <AlertCircle size={14} className="shrink-0" />
                {imageError}
              </div>
            )}
          </div>

          {/* Publishing Schedule Card (Only on Create Event) */}
          {!isEditMode && (
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <CalendarClock size={16} className="text-primary-600" />
                    Publishing Options
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Decide when this event should become visible to campus students
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  publishType === 'scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {publishType === 'scheduled' ? '🕒 Scheduled Release' : '⚡ Instant Publish'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPublishType('now')}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                    publishType === 'now'
                      ? 'border-primary-500 bg-white shadow-xs ring-2 ring-primary-100'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    publishType === 'now' ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-300'
                  }`}>
                    {publishType === 'now' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Publish Immediately</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Visible right now to all students</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishType('scheduled')}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                    publishType === 'scheduled'
                      ? 'border-amber-500 bg-white shadow-xs ring-2 ring-amber-100'
                      : 'border-slate-200 bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    publishType === 'scheduled' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                  }`}>
                    {publishType === 'scheduled' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Schedule for Later</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Automatically goes live at scheduled time</p>
                  </div>
                </button>
              </div>

              {publishType === 'scheduled' && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 space-y-3 animate-in fade-in duration-150">
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-600" />
                    Set Scheduled Release Date & Time
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Publish Date *</label>
                      <div className="relative">
                        <CalendarDays className={iconClass} size={15} />
                        <input
                          type="date"
                          min={todayString}
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Publish Time *</label>
                      <div className="relative">
                        <Clock className={iconClass} size={15} />
                        <input
                          type="time"
                          value={publishTime}
                          onChange={(e) => setPublishTime(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {publishDate && publishTime && (
                    publishDate > eventDate ? (
                      <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[11.5px] font-medium text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-rose-950">Publish Date is after Event Date:</strong>
                            <p className="mt-0.5 text-rose-800">
                              Event occurs on <strong>{eventDate}</strong>, but scheduled release is set to <strong>{publishDate}</strong>.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEventDate(publishDate)}
                          className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-95 transition text-center"
                        >
                          Sync Event Date to {publishDate}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] font-semibold text-amber-800">
                        ✓ This event will be automatically published on {new Date(`${publishDate}T${publishTime}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {publishTime}.
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(isEditMode ? `/events/${eventId}` : dashboardPath)}
              className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-2.5 rounded-xl text-xs transition"
            >
              {isEditMode ? 'Back to Event Page' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className={`flex-1 ${
                publishType === 'scheduled' && !isEditMode
                  ? 'bg-amber-600 hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-200'
                  : 'bg-primary-700 hover:bg-primary-800 hover:shadow-lg hover:shadow-primary-200'
              } active:scale-[0.98] text-white font-bold py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {(loading || uploadingImages) ? <Loader2 className="animate-spin" size={15} /> : null}
              {uploadingImages
                ? 'Uploading photos...'
                : loading
                ? (isEditMode ? 'Saving...' : publishType === 'scheduled' ? 'Scheduling...' : 'Creating...')
                : (isEditMode ? 'Save Changes' : publishType === 'scheduled' ? 'Schedule Event' : 'Create & Publish Event')}
            </button>
          </div>
        </form>
      </div>

      {/* Venue Location Preview Modal */}
      <VenueLocationModal
        isOpen={showLocationPreview}
        onClose={() => setShowLocationPreview(false)}
        locationName={location || 'BIC Main Auditorium'}
        eventTitle={title || 'New Event'}
      />
    </div>
  );
}