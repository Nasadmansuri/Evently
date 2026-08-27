import { useState } from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatTime12hr } from '../utils/formatTime';
import { getEventStatus } from '../utils/eventStatus';
import VenueLocationModal from './VenueLocationModal';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

// Soft gradient background per category, tinted from the category's own
// color so each card feels distinct while staying inside the brand's
// restrained, editorial palette (never competing with the teal primary).
const CARD_GRADIENT = {
  Technical: 'from-blue-50 via-blue-50/40 to-white',
  Cultural: 'from-slate-100 via-slate-50/40 to-white',
  Workshop: 'from-orange-50 via-orange-50/40 to-white',
  Competition: 'from-purple-50 via-purple-50/40 to-white',
  Seminar: 'from-amber-50 via-amber-50/40 to-white',
  Sports: 'from-pink-50 via-pink-50/40 to-white',
  Conference: 'from-slate-100 via-slate-50/40 to-white',
};
const DEFAULT_GRADIENT = 'from-primary-50 via-primary-50/30 to-white';

const CATEGORY_TEXT = {
  Technical: 'text-blue-700 bg-white/80',
  Cultural: 'text-slate-700 bg-white/80',
  Workshop: 'text-orange-700 bg-white/80',
  Competition: 'text-purple-700 bg-white/80',
  Seminar: 'text-amber-800 bg-white/80',
  Sports: 'text-pink-700 bg-white/80',
  Conference: 'text-slate-700 bg-white/80',
};
const DEFAULT_CATEGORY_TEXT = 'text-primary-700 bg-white/80';

function formatEventDate(value) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Editorial-style event card: soft gradient background, inset poster-style
 * banner image, pill badges, dark "Details" button. Reusable across Browse
 * Events, Gallery, and anywhere else events are displayed as cards.
 */
export default function EventCard({ event, isPast, onViewDetails, onRegister, showRegisterAction, footer }) {
  const [imgError, setImgError] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const gradient = CARD_GRADIENT[event.category] || DEFAULT_GRADIENT;
  const categoryStyle = CATEGORY_TEXT[event.category] || DEFAULT_CATEGORY_TEXT;
  const liveStatus = getEventStatus(event.event_date, event.event_time, event.status, event.publish_at);
  const statusText =
    liveStatus === 'cancelled'
      ? 'Cancelled'
      : liveStatus === 'scheduled'
      ? 'Scheduled'
      : liveStatus === 'ended'
      ? 'Ended'
      : liveStatus === 'ongoing'
      ? 'Ongoing'
      : 'Upcoming';

  return (
    <>
      <article className={`flex flex-col overflow-hidden rounded-[24px] bg-gradient-to-br ${gradient} p-3 shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}>
        {/* Poster-style inset banner - larger, sharper crop, subtle ring for definition */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-slate-100 ring-1 ring-black/5">
          {event.banner_image && !imgError ? (
            <img
              src={`${ASSET_BASE_URL}${event.banner_image}`}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
              style={{ objectPosition: 'center 25%' }}
            />
          ) : (
            /* Dynamic decorative backdrop only when no image exists */
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-primary-950 to-primary-900 p-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-xs mb-1.5 border border-white/10">
                <Calendar size={20} className="text-emerald-300" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80 line-clamp-1">
                {event.category || 'Campus Event'}
              </span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent z-5" />
          <span className={`absolute right-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${
            liveStatus === 'cancelled'
              ? 'bg-rose-600 text-white'
              : liveStatus === 'scheduled'
              ? 'bg-amber-600 text-white'
              : liveStatus === 'ended'
              ? 'bg-slate-800/90 text-white'
              : liveStatus === 'ongoing'
              ? 'bg-amber-500/95 text-white'
              : 'bg-emerald-500/95 text-white'
          }`}>
            {statusText}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 px-1.5 pt-3.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1"><Calendar size={12} />{formatEventDate(event.event_date)}</span>
            {event.event_time && (
              <span className="flex items-center gap-1"><Clock size={12} />{formatTime12hr(event.event_time)}</span>
            )}
          </div>

          <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-900">
            {event.title}
          </h3>

          <p className="line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">
            {event.description}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${categoryStyle}`}>
              {event.category}
            </span>
            {!!event.is_team_event && (
              <span className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10.5px] font-semibold text-primary-700">
                <Users size={10} /> Team Event
              </span>
            )}
          </div>

          {/* Interactive Location Link */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowLocationModal(true);
            }}
            className="group/loc mt-1 flex w-fit items-center gap-1.5 text-[11.5px] font-medium text-slate-500 hover:text-primary-700 transition"
            title="Click to view campus location & map directions"
          >
            <MapPin size={13} className="shrink-0 text-slate-400 group-hover/loc:text-primary-600 group-hover/loc:scale-110 transition" />
            <span className="truncate group-hover/loc:underline">{event.location || 'Biratnagar International College'}</span>
          </button>

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            {footer || (
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Organizer</p>
                <p
                  className="truncate text-xs font-semibold text-slate-700"
                  title={event.organizing_community ? `${event.organizing_department} (${event.organizing_community})` : (event.organizing_department || event.organizer_name || '')}
                >
                  {event.organizing_community ? `${event.organizing_department} · ${event.organizing_community}` : (event.organizing_department || event.organizer_name || 'Campus Department')}
                </p>
              </div>
            )}

            {liveStatus === 'cancelled' ? (
              <button
                onClick={onViewDetails}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
              >
                Cancelled · Details <ArrowRight size={13} />
              </button>
            ) : showRegisterAction && event.is_registered ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={13} /> Registered
              </span>
            ) : showRegisterAction && !isPast ? (
              <button
                onClick={onRegister}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-[0.97]"
              >
                {liveStatus === 'ongoing' ? 'Join Now' : 'Register'} <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={onViewDetails}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.97]"
              >
                Details <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Location Modal */}
      <VenueLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        locationName={event.location}
        eventTitle={event.title}
      />
    </>
  );
}