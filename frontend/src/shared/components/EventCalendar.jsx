import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users,
  CalendarX2, CalendarPlus, X, ExternalLink, Sparkles, Filter
} from 'lucide-react';
import { getGoogleCalendarUrl } from '../utils/calendarIntegration';
import { CATEGORY_COLORS, ALL_CATEGORIES } from '../utils/categoryColors';
import { formatTime12hr } from '../utils/formatTime';
import { getEventStatus } from '../utils/eventStatus';

const DEFAULT_STYLE = { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700', bg: 'bg-slate-50', text: 'text-slate-700' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/**
 * World-Class Academic Event Calendar Component (UI/UX Pro Design System)
 * Features:
 * - Tactile Month Header with month event counters & quick "Today" jump
 * - Interactive Category Filter Legend
 * - Responsive 7-Column Grid with hover lifts & elevated "Today" pill
 * - Rich Day Overview Modal with direct event deep-links & calendar sync
 */
export default function EventCalendar({ events = [], onDayClick, onEventClick }) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [selectedDayModal, setSelectedDayModal] = useState(null); // { date: Date, dateKey: string, events: [] }

  const today = new Date();
  const todayKey = dateKey(today);

  // Filter events by selected category if applicable
  const displayEvents = useMemo(() => {
    if (activeCategoryFilter === 'All') return events;
    return events.filter((ev) => ev.category === activeCategoryFilter);
  }, [events, activeCategoryFilter]);

  const eventsByDate = useMemo(() => {
    const map = {};
    displayEvents.forEach((ev) => {
      const key = dateKey(ev.event_date);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [displayEvents]);

  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstOfMonth.getDay();

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthCursor]);

  const monthEventCount = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    return displayEvents.filter((ev) => {
      const d = new Date(ev.event_date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }, [displayEvents, monthCursor]);

  function goToToday() {
    const d = new Date();
    setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  const isSameDay = (a, b) =>
    a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isCurrentMonth = isSameDay(
    new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1),
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  function openDayDetails(cellDate, key, dayEvents) {
    if (!dayEvents || dayEvents.length === 0) return;
    setSelectedDayModal({
      date: cellDate,
      dateKey: key,
      events: dayEvents,
    });
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-sm space-y-0">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 border border-primary-100 shadow-2xs">
            <Calendar size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                {monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold text-primary-700 transition hover:bg-primary-100 cursor-pointer"
                >
                  Today
                </button>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500">
              {monthEventCount === 0
                ? 'No events scheduled this month'
                : `${monthEventCount} campus event${monthEventCount === 1 ? '' : 's'} scheduled`}
            </p>
          </div>
        </div>

        {/* Month Switcher Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 2. Interactive Category Filter Legend */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 bg-white px-4 py-2.5 text-xs scrollbar-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <Filter size={11} /> Filter:
        </span>
        <button
          type="button"
          onClick={() => setActiveCategoryFilter('All')}
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
            activeCategoryFilter === 'All'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          All Categories
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const style = CATEGORY_COLORS[cat] || DEFAULT_STYLE;
          const isSelected = activeCategoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategoryFilter(isSelected ? 'All' : cat)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                isSelected
                  ? 'bg-primary-800 text-white shadow-2xs ring-1 ring-primary-900'
                  : `${style.bg} ${style.text} hover:opacity-90 border border-slate-200/60`
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Calendar Grid Body */}
      <div className="p-3 sm:p-5">
        {/* Weekday Row Header */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1.5">
          {WEEKDAYS.map((wd, idx) => (
            <div
              key={wd}
              className={`py-1.5 text-center text-[11px] font-black uppercase tracking-wider ${
                idx === 0 || idx === 6 ? 'text-primary-700/80' : 'text-slate-400'
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day Cells Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {calendarCells.map((cellDate, i) => {
            if (!cellDate) {
              return (
                <div
                  key={i}
                  className="min-h-[85px] sm:min-h-[110px] rounded-2xl bg-slate-50/40 border border-transparent"
                />
              );
            }

            const key = dateKey(cellDate);
            const dayEvents = eventsByDate[key] || [];
            const isToday = isSameDay(cellDate, today);
            const isPast = key < todayKey;
            const hasEvents = dayEvents.length > 0;

            return (
              <div
                key={i}
                onClick={() => hasEvents && openDayDetails(cellDate, key, dayEvents)}
                onKeyDown={(e) => {
                  if (hasEvents && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    openDayDetails(cellDate, key, dayEvents);
                  }
                }}
                role={hasEvents ? 'button' : undefined}
                tabIndex={hasEvents ? 0 : undefined}
                aria-label={
                  hasEvents
                    ? `${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'} on ${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                    : undefined
                }
                className={`group relative flex min-h-[85px] sm:min-h-[112px] flex-col rounded-2xl border p-1.5 sm:p-2 transition-all duration-200 select-none ${
                  isToday
                    ? 'border-primary-500 bg-primary-50/40 shadow-xs ring-1.5 ring-primary-400/80'
                    : hasEvents
                    ? 'border-slate-200/90 bg-white hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5'
                    : 'border-slate-100/90 bg-slate-50/30'
                } ${isPast && !isToday ? 'opacity-70' : ''} ${hasEvents ? 'cursor-pointer' : ''}`}
              >
                {/* Date Number Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[11px] sm:text-xs font-black transition ${
                      isToday
                        ? 'bg-primary-700 text-white shadow-xs'
                        : hasEvents
                        ? 'text-slate-900 group-hover:text-primary-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {cellDate.getDate()}
                  </span>

                  {hasEvents && (
                    <span className="text-[10px] font-bold text-primary-700 bg-primary-100/70 px-1.5 py-0.2 rounded-md hidden sm:inline-block">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Chips List Inside Cell */}
                <div className="mt-1 flex flex-1 flex-col gap-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => {
                    const style = CATEGORY_COLORS[ev.category] || DEFAULT_STYLE;
                    return (
                      <div
                        key={ev.id}
                        title={ev.title}
                        className={`truncate rounded-lg px-1.5 py-0.5 text-left text-[9.5px] sm:text-[10px] font-bold transition flex items-center gap-1 ${style.bg} ${style.text} border border-slate-200/50 shadow-2xs hover:scale-[1.02]`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                        <span className="truncate">{ev.title}</span>
                      </div>
                    );
                  })}

                  {dayEvents.length > 2 && (
                    <div className="mt-auto self-start">
                      <span className="inline-flex items-center rounded-md bg-primary-50 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-primary-700 hover:underline">
                        +{dayEvents.length - 2} more
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Rich Day Overview Modal (Portal) */}
      {selectedDayModal &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 p-5 text-white">
                <button
                  type="button"
                  onClick={() => setSelectedDayModal(null)}
                  className="absolute top-4 right-4 rounded-full bg-white/10 p-1.5 text-white/80 backdrop-blur-xs transition hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white font-black text-lg border border-white/20 shadow-md">
                    {selectedDayModal.date.getDate()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {selectedDayModal.events.length} Event{selectedDayModal.events.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {selectedDayModal.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Event Cards List */}
              <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-5 space-y-3">
                {selectedDayModal.events.map((ev) => {
                  const style = CATEGORY_COLORS[ev.category] || DEFAULT_STYLE;
                  const liveStatus = getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at);

                  return (
                    <div
                      key={ev.id}
                      className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:border-primary-300 hover:shadow-md transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider ${style.bg} ${style.text} border border-slate-200/60`}>
                              {ev.category}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                                liveStatus === 'ongoing'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : liveStatus === 'ended'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-primary-50 text-primary-700'
                              }`}
                            >
                              {liveStatus === 'ongoing' ? '● Live Now' : liveStatus === 'ended' ? 'Concluded' : 'Upcoming'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-primary-700 transition">
                            {ev.title}
                          </h4>
                        </div>

                        <a
                          href={getGoogleCalendarUrl(ev)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Add to Google Calendar"
                          className="shrink-0 p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition"
                        >
                          <CalendarPlus size={15} />
                        </a>
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        {ev.event_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-primary-600" />
                            {formatTime12hr(ev.event_time)}
                          </span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin size={12} className="text-primary-600 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-primary-600" />
                          {ev.registered_count ?? ev.registration_count ?? 0} {ev.max_participants ? `/ ${ev.max_participants}` : ''} registered
                        </span>
                      </div>

                      {/* Action Button */}
                      <div className="pt-1.5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDayModal(null);
                            onEventClick(ev.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                        >
                          <span>View Event Details</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedDayModal(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const key = selectedDayModal.dateKey;
                    setSelectedDayModal(null);
                    onDayClick(key);
                  }}
                  className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  View in List →
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}