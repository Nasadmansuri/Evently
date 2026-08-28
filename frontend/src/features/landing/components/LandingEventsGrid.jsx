import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, PlayCircle, ArrowRight, ChevronLeft, ChevronRight, Trophy, Target
} from 'lucide-react';

import api from '../../../shared/services/api';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { getEventStatus } from '../../../shared/utils/eventStatus';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

const CATEGORIES = ['All', 'Hackathons', 'Workshops', 'Technical', 'Cultural', 'Sports', 'DevCorps'];

const TINT_STYLES = [
  {
    bg: 'bg-[#fffdf5]',
    border: 'border-amber-200/90',
  },
  {
    bg: 'bg-[#f0fdf9]',
    border: 'border-emerald-200/90',
  },
  {
    bg: 'bg-[#f0f7ff]',
    border: 'border-blue-200/90',
  },
  {
    bg: 'bg-[#fdf8ff]',
    border: 'border-purple-200/90',
  },
];

function formatEventDate(value) {
  if (!value) return 'TBD';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LandingEventsGrid() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const scrollContainerRef = useRef(null);
  const isHoveredRef = useRef(false);
  const hoverTimeoutRef = useRef(null);

  const handleCardMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    isHoveredRef.current = true;
  };

  const handleCardMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      isHoveredRef.current = false;
    }, 100);
  };

  const handleArrowScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const halfWidth = container.scrollWidth / 2;
    const cardWidth = 360;

    if (direction === 'left') {
      if (container.scrollLeft - cardWidth < 0 && halfWidth > 0) {
        container.scrollLeft += halfWidth;
      }
      container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    } else {
      if (halfWidth > 0 && container.scrollLeft + cardWidth >= halfWidth * 2) {
        container.scrollLeft -= halfWidth;
      }
      container.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await api.get('/events');
        const data = Array.isArray(res.data) ? res.data : (res.data?.events || []);
        setEvents(data);
      } catch (err) {
        console.error('Failed to load events for landing grid:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filteredEvents = events
    .filter((ev) => {
      if (activeCategory === 'All') return true;
      if (activeCategory === 'Hackathons') {
        return (
          ev.category?.toLowerCase().includes('hack') ||
          ev.title?.toLowerCase().includes('hack')
        );
      }
      if (activeCategory === 'Workshops') {
        return (
          ev.category?.toLowerCase().includes('work') ||
          ev.title?.toLowerCase().includes('workshop')
        );
      }
      if (activeCategory === 'DevCorps') {
        return (
          ev.organizing_department?.toLowerCase().includes('devcorps') ||
          ev.organizing_community
        );
      }
      return ev.category?.toLowerCase() === activeCategory.toLowerCase();
    })
    .sort((a, b) => {
      const statusA = getEventStatus(a.event_date, a.event_time, a.status, a.publish_at);
      const statusB = getEventStatus(b.event_date, b.event_time, b.status, b.publish_at);
      if ((statusA === 'upcoming' || statusA === 'ongoing') && statusB === 'ended') return -1;
      if (statusA === 'ended' && (statusB === 'upcoming' || statusB === 'ongoing')) return 1;
      return new Date(b.event_date) - new Date(a.event_date);
    });

  // Infinite Marquee Auto-Scroll Animation using requestAnimationFrame
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || filteredEvents.length === 0) return;

    let animationFrameId;
    // Speed 0.5 px per frame (~60fps) for smooth slow 0.25 speed
    const speed = 0.5;

    const animate = () => {
      if (!isHoveredRef.current && container) {
        container.scrollLeft += speed;
        // Halfway point of the duplicated track
        const halfWidth = container.scrollWidth / 2;
        if (halfWidth > 0 && container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [filteredEvents]);

  // Ensure minimum set of items so seamless loop wraps smoothly
  let baseSet = [...filteredEvents];
  while (baseSet.length < 5 && baseSet.length > 0) {
    baseSet = [...baseSet, ...filteredEvents];
  }
  const displayEvents = baseSet.length > 0 ? [...baseSet, ...baseSet] : [];

  return (
    <section id="discover" className="py-16 sm:py-24 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-[1480px] px-6 sm:px-10 md:px-12">
        {/* 1. Top Badge */}
        <div className="mb-3">
          <span className="rounded-full bg-purple-50 px-3.5 py-1 text-[10.5px] font-extrabold uppercase tracking-widest text-purple-600 border border-purple-100 shadow-2xs">
            CAMPUS OPPORTUNITIES
          </span>
        </div>

        {/* 2. Main Headline Row with "View all →" Button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Everything you need <span className="text-[#7c3aed]">to excel.</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium max-w-xl">
              From flagship hackathons and tech workshops to cultural celebrations, discover every campus event happening at BIC.
            </p>
          </div>

          <Link
            to="/events"
            className="self-start md:self-end rounded-full bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition hover:shadow hover:border-slate-300 shrink-0"
          >
            <span>View all</span>
            <ArrowRight size={13} className="text-slate-500" />
          </Link>
        </div>

        {/* 3. Category Filter Tabs & Subtitle */}
        <div className="pt-2 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollLeft = 0;
                    }
                  }}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B0F19] text-white shadow-xs'
                      : 'bg-[#f1f3f7] text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs sm:text-sm text-slate-500 font-medium">
            Explore university-partnered competitions, student chapter summits, and faculty-led initiatives.
          </p>
        </div>

        {/* 4. Infinite Auto-Scroll Event Carousel */}
        <div className="relative mt-8 group/carousel">
          {/* Custom Navigation Arrow Buttons */}
          <button
            onClick={() => handleArrowScroll('left')}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-xl border border-slate-200 hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={() => handleArrowScroll('right')}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-xl border border-slate-200 hover:bg-slate-50 hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* Cards Carousel Container with Instant Pause on Card Hover */}
          {loading ? (
            <div className="flex gap-5 overflow-hidden py-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-[300px] sm:min-w-[320px] h-[390px] rounded-[26px] bg-slate-100 animate-pulse shrink-0"
                />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center my-4">
              <p className="text-sm font-bold text-slate-700">No events found in this category right now.</p>
              <p className="text-xs text-slate-500 mt-1">Check back soon or explore all campus activities.</p>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              data-lenis-prevent
              className="flex gap-6 overflow-x-auto scrollbar-none py-6 px-1 !overflow-y-visible"
              style={{ scrollBehavior: 'auto' }}
            >
              {displayEvents.map((event, index) => {
                const tint = TINT_STYLES[index % TINT_STYLES.length];
                const liveStatus = getEventStatus(
                  event.event_date,
                  event.event_time,
                  event.status,
                  event.publish_at
                );

                return (
                  <div
                    key={`${event.id}-${index}`}
                    onClick={() => navigate(`/events/${event.id}`)}
                    onMouseEnter={handleCardMouseEnter}
                    onMouseLeave={handleCardMouseLeave}
                    className={`w-[290px] sm:w-[320px] md:w-[340px] shrink-0 rounded-[26px] p-4 pb-5 flex flex-col justify-between ${tint.bg} border ${tint.border} shadow-xs cursor-pointer group event-card-hover select-none`}
                  >
                    <div>
                      {/* 1. Poster Inset Banner */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-slate-900 border border-slate-900/10 mb-3.5 shadow-inner group">
                        {event.banner_image ? (
                          <img
                            src={`${ASSET_BASE_URL}${event.banner_image}`}
                            alt={event.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#023433] via-[#035352] to-[#012424] p-4 text-center select-none">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md mb-1.5 border border-white/20">
                              <Calendar size={18} className="text-emerald-300" />
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200/90 line-clamp-1">
                              {event.category || 'Campus Event'}
                            </span>
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                        {/* Status Pill Badge in Top Right */}
                        <span
                          className={`absolute right-2.5 top-2.5 z-10 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${
                            liveStatus === 'ongoing'
                              ? 'bg-emerald-600 text-white flex items-center gap-1 shadow-sm'
                              : liveStatus === 'upcoming'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-900/80 text-slate-300 backdrop-blur-xs'
                          }`}
                        >
                          {liveStatus === 'ongoing' && <PlayCircle size={10} className="animate-pulse" />}
                          {liveStatus === 'ongoing' ? 'Live Now' : liveStatus === 'upcoming' ? 'Upcoming' : 'Ended'}
                        </span>
                      </div>

                      {/* 2. Date & Time Row */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        <span>{formatEventDate(event.event_date)}</span>
                        {event.event_time && (
                          <>
                            <span className="text-slate-300">·</span>
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            <span>{formatTime12hr(event.event_time)}</span>
                          </>
                        )}
                      </div>

                      {/* 3. Event Title */}
                      <h3
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="text-base font-black tracking-tight text-slate-900 line-clamp-1 cursor-pointer hover:text-purple-700 transition"
                      >
                        {event.title}
                      </h3>

                      {/* 4. Description snippet */}
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600 leading-relaxed font-normal">
                        {event.description || 'Join fellow students for this campus opportunity at BIC.'}
                      </p>

                      {/* 5. SheKunj Metadata Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
                          {event.location?.toLowerCase().includes('online') ? 'Online' : 'In-Person'}
                        </span>
                        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
                          {event.is_team_event ? 'Team Event' : 'Individual'}
                        </span>
                        <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
                          {event.category || 'Featured'}
                        </span>
                      </div>

                      {/* 6. Dynamic Real Eligibility / Prize / Registration Info */}
                      <div className="mt-2.5 text-xs font-bold text-slate-800 line-clamp-1">
                        {event.prize_info ? (
                          <span className="text-amber-900 flex items-center gap-1.5 font-bold">
                            <Trophy size={13} className="text-amber-600 shrink-0" />
                            <span className="truncate">{event.prize_info}</span>
                          </span>
                        ) : event.rules_eligibility ? (
                          <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <Target size={13} className="text-purple-600 shrink-0" />
                            <span className="truncate">{event.rules_eligibility}</span>
                          </span>
                        ) : liveStatus === 'ended' ? (
                          <span className="text-slate-400 font-medium">Event Ended</span>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>Registrations Open</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 7. Bottom Row: Organizer & Details CTA Button */}
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 line-clamp-1 max-w-[150px]">
                        {event.organizing_department || 'BIC DevCorps'}
                      </span>

                      <button
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="rounded-full bg-[#0B0F19] hover:bg-slate-800 px-4 py-1.5 text-xs font-bold text-white shadow-xs flex items-center gap-1 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                      >
                        <span>Details</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
