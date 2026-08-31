import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Type, AlignLeft, Tag, MapPin, CalendarDays, Clock, Landmark, Users,
  ClipboardList, Trophy, UserCheck, Image, AlertCircle, Loader2, ChevronDown, X, Upload, UsersRound, Map, ExternalLink,
  RotateCcw, FileText, CheckCircle2, Info, Lock, CalendarClock, Check, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { useAuth } from '../../../shared/context/AuthContext';
import { ACADEMIC_STRUCTURE } from '../../../shared/utils/academicCascade';
import { COMMUNITIES, DEPARTMENT_DESIGNATIONS } from '../../../shared/utils/facultyStructure';
import { isEventPast } from '../../../shared/utils/eventStatus';
import { fireCelebrationConfetti } from '../../../shared/utils/confetti';
import VenueLocationModal from '../../../shared/components/VenueLocationModal';
import { ALL_CATEGORIES as CATEGORIES } from '../../../shared/utils/categoryColors';
const ORGANIZING_DEPARTMENTS = [
  ...new Set([
    ...Object.keys(ACADEMIC_STRUCTURE),
    ...Object.keys(DEPARTMENT_DESIGNATIONS),
  ]),
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

  const isDevCorpsAuthorized = user?.role === 'admin' || user?.department === 'DevCorps';
  const availableDepartments = useMemo(() => {
    if (isDevCorpsAuthorized) {
      return ORGANIZING_DEPARTMENTS;
    }
    return ORGANIZING_DEPARTMENTS.filter((d) => d !== 'DevCorps');
  }, [isDevCorpsAuthorized]);

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
      setLoadingEvent(true);
      try {
        const res = await api.get(`/events/${eventId}`);
        const ev = res.data;
        setTitle(ev.title || '');
        setDescription(ev.description || '');
        const rawCat = (ev.category || '').trim();
        const matchedCat = CATEGORIES.find((c) => c.toLowerCase() === rawCat.toLowerCase());
        setCategory(matchedCat || rawCat);
        setLocation(ev.location || '');
        setEventDate(ev.event_date ? ev.event_date.slice(0, 10) : '');
        setEventTime(ev.event_time ? ev.event_time.slice(0, 5) : '');
        setOrganizingDepartment(ev.organizing_department || '');
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
  }, [eventId, isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;
    async function loadImages() {
      try {
        const res = await api.get(`/events/${eventId}/images`);
        setExistingImages(res.data || []);
      } catch (err) {
        console.error('Failed to load images:', err);
      }
    }
    loadImages();
  }, [eventId]);

  function handleFileSelect(e) {
    setImageError('');
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentTotal = existingImages.length + newImages.length;
    if (currentTotal + files.length > MAX_IMAGES) {
      setImageError(`You can upload at most ${MAX_IMAGES} images (currently ${currentTotal})`);
      return;
    }

    const invalid = files.find((f) => f.size > MAX_IMAGE_SIZE);
    if (invalid) {
      setImageError(`"${invalid.name}" exceeds the 5MB size limit`);
      return;
    }

    const added = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImages((prev) => {
      const next = [...prev, ...added];
      if (existingImages.length === 0 && bannerIndex === null) {
        setBannerIndex(0);
      }
      return next;
    });
    e.target.value = '';
  }

  function removeNewImage(index) {
    setNewImages((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((_, i) => i !== index);
      if (bannerIndex === index) {
        setBannerIndex(next.length > 0 ? 0 : null);
      } else if (bannerIndex > index) {
        setBannerIndex(bannerIndex - 1);
      }
      return next;
    });
  }

  async function handleDeleteExistingImage(imageId) {
    if (deletingImageId) return;
    setDeletingImageId(imageId);
    try {
      await api.delete(`/events/${eventId}/images/${imageId}`);
      try {
        const res = await api.get(`/events/${eventId}/images`);
        setExistingImages(res.data || []);
      } catch {
        setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      }
      showToast.success('Photo removed');
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSetBanner(imageId) {
    if (deletingImageId) return;
    try {
      await api.patch(`/events/${eventId}/images/${imageId}/banner`);
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, is_banner: img.id === imageId ? 1 : 0 }))
      );
      showToast.success('Cover photo updated');
    } catch (err) {
      showToast.error('Failed to set cover image');
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
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        eventDate,
        eventTime,
        organizingDepartment,
        organizingCommunity: organizingCommunity || undefined,
        rulesEligibility: rulesEligibility.trim() || undefined,
        prizeInfo: prizeInfo.trim() || undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
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
        fireCelebrationConfetti();
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
    'skeuo-input w-full rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-medium text-slate-800';
  const selectClass =
    'skeuo-input w-full appearance-none rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm font-semibold text-slate-800';
  const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 text-slate-400';
  const chevronClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5';

  if (isEditMode && loadingEvent) {
    return (
      <div className="mx-auto max-w-3xl pb-16 flex flex-col items-center justify-center min-h-[350px]">
        <Loader2 size={32} className="animate-spin text-primary-700" />
        <p className="mt-3 text-xs font-bold text-slate-600">Loading event details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="skeuo-card rounded-2xl p-6 sm:p-8">
        {/* Header Strip */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="skeuo-badge-embossed rounded-full bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-800">
                {isEditMode ? 'Event Management' : 'Publishing Wizard'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {isEditMode ? 'Edit Campus Event' : 'Create New Event'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              {isEditMode ? 'Update event parameters, schedule, venue, or media.' : 'Publish workshops, hackathons, seminars, or festivals to the student portal.'}
            </p>
          </div>

          {!isEditMode && (title || description || location) && (
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition"
              title="Clear all fields"
            >
              <RotateCcw size={13} /> Clear Draft
            </button>
          )}
        </div>

        {draftRestored && !isEditMode && (
          <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 animate-in fade-in duration-200 shadow-2xs">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Restored unsaved draft automatically</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => setDraftRestored(false)}
                className="rounded-md p-1 text-emerald-700 hover:bg-emerald-100 transition"
                title="Dismiss message"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {isEditMode && isConcludedEvent && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs font-medium text-amber-900 shadow-2xs">
            <Lock size={18} className="text-amber-600 shrink-0" />
            <span>
              This is a concluded event record. Date and time are locked to preserve historical record integrity. You can still modify the description, guidelines, and photo gallery.
            </span>
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-800 shadow-2xs">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* 1. Essential Information */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[10px] text-white font-black">1</span>
              Event Essentials
            </h2>

            <div>
              <label className={labelClass}>Event Title *</label>
              <div className="relative">
                <Type className={iconClass} size={15} />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. AI & Cloud Innovation Summit 2026"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <div className="relative">
                <AlignLeft className={`${iconClass} top-4 translate-y-0`} size={15} />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} min-h-[100px] resize-y`}
                  placeholder="Provide an overview of the event, key themes, speakers, and student takeaways..."
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <div className="relative">
                <Tag className={iconClass} size={15} />
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  {category && !CATEGORIES.includes(category) && (
                    <option value={category}>{category}</option>
                  )}
                </select>
                <ChevronDown className={chevronClass} size={14} />
              </div>
            </div>
          </div>

          {/* 2. Campus Location & Timing */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[10px] text-white font-black">2</span>
                Venue & Timing
              </h2>
              <button
                type="button"
                onClick={() => setShowLocationPreview(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:underline"
              >
                <Map size={13} />
                <span>Preview Campus Map</span>
              </button>
            </div>

            <div>
              <label className={labelClass}>Venue / Campus Room *</label>
              <div className="relative">
                <MapPin className={iconClass} size={15} />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Main Auditorium, Wulfruna Hall, Lab 304"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Event Date *</label>
                <div className="relative">
                  <CalendarDays className={iconClass} size={15} />
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
                  <Clock className={iconClass} size={15} />
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

          {/* 3. Department & Participation Scope */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[10px] text-white font-black">3</span>
              Academic Department & Capacity
            </h2>

            <div>
              <label className={labelClass}>Organizing Department *</label>
              <div className="relative">
                <Landmark className={iconClass} size={15} />
                <select
                  value={organizingDepartment}
                  onChange={(e) => {
                    setOrganizingDepartment(e.target.value);
                    if (e.target.value !== 'DevCorps') setOrganizingCommunity('');
                  }}
                  className={selectClass}
                >
                  <option value="">Select department</option>
                  {ORGANIZING_DEPARTMENTS.map((dept) => {
                    const isDevCorps = dept === 'DevCorps';
                    const isDisabled = isDevCorps && !isDevCorpsAuthorized;
                    return (
                      <option
                        key={dept}
                        value={dept}
                        disabled={isDisabled}
                        className={isDisabled ? 'text-slate-400 bg-slate-50' : ''}
                      >
                        {dept}{isDisabled ? ' 🔒 (DevCorps Head only)' : ''}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className={chevronClass} size={14} />
              </div>
              {!isDevCorpsAuthorized && (
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Info size={12} className="shrink-0 text-slate-400" />
                  DevCorps events require DevCorps Head or Admin authorization.
                </p>
              )}
            </div>

            {organizingDepartment === 'DevCorps' && (
              <div>
                <label className={labelClass}>DevCorps Community *</label>
                <div className="relative">
                  <Users className={iconClass} size={15} />
                  <select value={organizingCommunity} onChange={(e) => setOrganizingCommunity(e.target.value)} className={selectClass}>
                    <option value="">Select community</option>
                    {COMMUNITIES.filter((c) => c !== 'N/A').map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className={chevronClass} size={14} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Maximum Seats</label>
                <div className="relative">
                  <UserCheck className={iconClass} size={15} />
                  <input
                    type="number" min="1" value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    className={inputClass} placeholder="Leave blank for unlimited"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Entry Format</label>
                <button
                  type="button"
                  onClick={() => setIsTeamEvent(!isTeamEvent)}
                  className={`skeuo-card w-full flex items-center justify-between rounded-xl p-2.5 transition-all ${
                    isTeamEvent
                      ? '!border-primary-600 !bg-primary-50/70'
                      : '!bg-white hover:!bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users size={15} className={isTeamEvent ? 'text-primary-700' : 'text-slate-400'} />
                    <span className={`text-xs font-bold ${isTeamEvent ? 'text-primary-900' : 'text-slate-700'}`}>
                      {isTeamEvent ? 'Team Participation' : 'Individual Entry'}
                    </span>
                  </div>
                  <div className={`skeuo-switch-track relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${isTeamEvent ? 'bg-primary-700' : 'bg-slate-300'}`}>
                    <span className={`skeuo-switch-knob inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${isTeamEvent ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Rules & Awards */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[10px] text-white font-black">4</span>
              Guidelines & Awards
            </h2>

            <div>
              <label className={labelClass}>Rules & Eligibility</label>
              <div className="relative">
                <ClipboardList className={`${iconClass} top-4 translate-y-0`} size={15} />
                <textarea
                  value={rulesEligibility}
                  onChange={(e) => setRulesEligibility(e.target.value)}
                  className={`${inputClass} min-h-[80px] resize-y`}
                  placeholder="Eligibility criteria, code of conduct, prerequisites..."
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Awards & Prize Information</label>
              <div className="relative">
                <Trophy className={`${iconClass} top-4 translate-y-0`} size={15} />
                <textarea
                  value={prizeInfo}
                  onChange={(e) => setPrizeInfo(e.target.value)}
                  className={`${inputClass} min-h-[80px] resize-y`}
                  placeholder="Cash prizes, certificates, medals, or sponsor giveaways..."
                />
              </div>
            </div>
          </div>

          {/* 5. Photos & Cover Media */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[10px] text-white font-black">5</span>
                Event Media
              </h2>
              <span className="text-[11px] font-medium text-slate-400">Up to {MAX_IMAGES} photos (5MB each)</span>
            </div>

            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {existingImages.map((img) => (
                  <div
                    key={img.id}
                    className={`group relative aspect-square overflow-hidden rounded-xl border-2 text-left transition ${
                      img.is_banner ? 'border-primary-600 ring-2 ring-primary-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      onClick={() => !img.is_banner && !deletingImageId && handleSetBanner(img.id)}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                    />
                    {img.is_banner ? (
                      <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-primary-700 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                        Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetBanner(img.id)}
                        disabled={!!deletingImageId}
                        className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100 hover:bg-primary-700 cursor-pointer shadow-sm"
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingImage(img.id)}
                      disabled={deletingImageId === img.id}
                      title="Delete image"
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition hover:bg-rose-600 group-hover:opacity-100 shadow-xs cursor-pointer z-10"
                    >
                      {deletingImageId === img.id ? <Loader2 className="animate-spin" size={12} /> : <X size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {newImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {newImages.map((img, i) => {
                  const isCover = existingImages.length === 0 && bannerIndex === i;
                  return (
                    <button
                      type="button"
                      key={img.previewUrl}
                      onClick={() => existingImages.length === 0 && handleSelectNewBanner(i)}
                      className={`group relative aspect-square overflow-hidden rounded-xl border-2 text-left transition ${
                        isCover ? 'border-primary-600 ring-2 ring-primary-200' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {isCover && (
                        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-primary-700 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                          Cover
                        </span>
                      )}
                      <span
                        onClick={(e) => { e.stopPropagation(); removeNewImage(i); }}
                        title="Remove"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition hover:bg-rose-600 group-hover:opacity-100 shadow-xs"
                      >
                        <X size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-8 text-center transition hover:border-primary-400 hover:bg-primary-50/20">
              <Upload className="mb-2 text-slate-400" size={24} />
              <p className="text-xs font-bold text-slate-700">Click or drag to add photos</p>
              <p className="mt-0.5 text-[11px] text-slate-400">JPG, PNG, or WebP up to 5MB</p>
              <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
            </label>

            {imageError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                <span>{imageError}</span>
              </div>
            )}
          </div>

          {/* 6. Publishing Schedule */}
          {!isEditMode && (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[10px] text-white font-black">6</span>
                  Publishing Options
                </h2>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  publishType === 'scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {publishType === 'scheduled' ? 'Scheduled Release' : 'Instant Publish'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPublishType('now')}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    publishType === 'now'
                      ? 'border-primary-600 bg-white shadow-xs ring-2 ring-primary-100'
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
                    <p className="text-[11px] text-slate-500 mt-0.5">Goes live immediately to all campus students</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishType('scheduled')}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    publishType === 'scheduled'
                      ? 'border-amber-600 bg-white shadow-xs ring-2 ring-amber-100'
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
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 space-y-3 animate-in fade-in duration-150">
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
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(isEditMode ? `/events/${eventId}` : dashboardPath)}
              className="skeuo-btn-secondary flex-1 py-3 rounded-xl text-xs"
            >
              {isEditMode ? 'Back to Event Page' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className={`flex-1 ${
                publishType === 'scheduled' && !isEditMode
                  ? 'skeuo-btn-gold'
                  : 'skeuo-btn-primary'
              } py-3 rounded-xl text-xs disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {(loading || uploadingImages) ? <Loader2 className="animate-spin" size={15} /> : null}
              {uploadingImages
                ? 'Uploading photos...'
                : loading
                ? (isEditMode ? 'Saving...' : publishType === 'scheduled' ? 'Scheduling...' : 'Creating...')
                : (isEditMode ? 'Save Changes' : publishType === 'scheduled' ? 'Schedule Event Release' : 'Create & Publish Event')}
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