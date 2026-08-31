import { useState } from 'react';
import { Calendar, CalendarDays, Clock, MapPin, Users, ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react';
import { formatTime12hr } from '../utils/formatTime';
import { getEventStatus } from '../utils/eventStatus';
import { getCategoryStyle } from '../utils/categoryColors';
import VenueLocationModal from './VenueLocationModal';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

function formatEventDate(value) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * World-class Academic Prestige Event Card:
 * Consistent 16:10 poster banner, elegant Deep Teal backdrop when no photo is uploaded,
 * high-contrast Manrope typography, and tactile Deep Teal CTA action buttons.
 */
export default function EventCard({ event, isPast, onViewDetails, onRegister, showRegisterAction, footer }) {
  const [imgError, setImgError] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const style = getCategoryStyle(event.category);
  const liveStatus = getEventStatus(event.event_date, event.event_time, event.status, event.publish_at);
  const hasBanner = event.banner_image && !imgError;

  return (
    <>
      <article className="group skeuo-card skeuo-card-interactive flex flex-col rounded-[22px] p-3.5">
        {/* Poster Inset Banner (Consistent 16:10 Ratio) */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-slate-950 border border-slate-900/10 shadow-inner">
          {hasBanner ? (
            <img
              src={event.banner_image}
              alt={event.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{ objectPosition: 'center 25%' }}
            />
          ) : (
            /* Branded Deep Teal Academic Poster Backdrop */
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#012424] via-[#035352] to-[#046c6a] p-4 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md mb-2 border border-white/20 shadow-sm">
                <CalendarDays size={20} className="text-teal-200" />
              </div>
              <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-teal-100 line-clamp-1">
                {event.category || 'Campus Event'}
              </span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-5" />

          {/* Status Badge in Top Right */}
          <span className={`absolute right-2.5 top-2.5 z-10 skeuo-badge-embossed rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm border ${
            liveStatus === 'cancelled'
              ? 'bg-rose-600 text-white border-rose-700'
              : liveStatus === 'scheduled'
              ? 'bg-amber-500 text-white border-amber-600'
              : liveStatus === 'ended'
              ? 'bg-slate-800 text-slate-200 border-slate-700'
              : liveStatus === 'ongoing'
              ? 'bg-emerald-600 text-white border-emerald-500 flex items-center gap-1'
              : 'bg-primary-700 text-white border-primary-600'
          }`}>
            {liveStatus === 'ongoing' && <PlayCircle size={10} />}
            {liveStatus === 'ongoing' ? 'Live Now' : liveStatus === 'ended' ? 'Ended' : liveStatus === 'upcoming' ? 'Upcoming' : liveStatus}
          </span>
        </div>

        {/* Card Content */}
        <div className="flex flex-1 flex-col pt-3.5 px-1">
          {/* Date & Time Row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-primary-700" />
              {formatEventDate(event.event_date)}
            </span>
            {event.event_time && (
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-primary-700" />
                {formatTime12hr(event.event_time)}
              </span>
            )}
          </div>

          {/* Event Title */}
          <h3
            onClick={onViewDetails}
            className="cursor-pointer mt-1.5 text-base sm:text-lg font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 group-hover:text-primary-700 transition"
          >
            {event.title}
          </h3>

          {/* Description snippet */}
          {event.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 font-medium">
              {event.description}
            </p>
          )}

          {/* Category & Team Badges */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className={`skeuo-badge-embossed rounded-md px-2.5 py-0.5 text-[10.5px] font-bold ${style.bg} ${style.text}`}>
              {event.category}
            </span>
            {!!event.is_team_event && (
              <span className="skeuo-badge-embossed inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 text-[10.5px] font-bold text-primary-800">
                <Users size={10} /> Team Event
              </span>
            )}
          </div>

          {/* Interactive Campus Location Link */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowLocationModal(true);
            }}
            className="group/loc mt-2 flex w-fit items-center gap-1.5 text-xs text-slate-600 hover:text-primary-800 transition cursor-pointer"
            title="Click to view campus venue & map"
          >
            <MapPin size={13} className="shrink-0 text-primary-700 group-hover/loc:scale-110 transition" />
            <span className="truncate group-hover/loc:underline text-[11.5px] font-medium">
              {event.location || 'Biratnagar International College'}
            </span>
          </button>

          {/* Card Footer */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
            {footer ? (
              footer
            ) : (
              <>
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Organizer</p>
                  <p
                    className="truncate text-xs font-semibold text-slate-700"
                    title={event.organizing_community ? `${event.organizing_department} (${event.organizing_community})` : (event.organizing_department || event.organizer_name || '')}
                  >
                    {event.organizing_community ? `${event.organizing_department} · ${event.organizing_community}` : (event.organizing_department || event.organizer_name || 'Campus Department')}
                  </p>
                </div>

                {liveStatus === 'cancelled' ? (
                  <button
                    onClick={onViewDetails}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold px-3.5 py-1.5 text-xs hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
                  >
                    Cancelled · Details <ArrowRight size={13} />
                  </button>
                ) : showRegisterAction && event.is_registered ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold shadow-2xs">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Registered
                  </span>
                ) : showRegisterAction && event.max_participants && (event.registered_count ?? event.registration_count ?? 0) >= event.max_participants ? (
                  <button
                    onClick={onViewDetails}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 px-3.5 py-1.5 text-xs font-bold hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
                  >
                    Full · Details <ArrowRight size={13} />
                  </button>
                ) : showRegisterAction && !isPast ? (
                  <button
                    onClick={onRegister}
                    className="skeuo-btn-primary flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs cursor-pointer"
                  >
                    {liveStatus === 'ongoing' ? 'Join Now' : 'Register'} <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    onClick={onViewDetails}
                    className="skeuo-btn-primary flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs cursor-pointer"
                  >
                    Details <ArrowRight size={13} />
                  </button>
                )}
              </>
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