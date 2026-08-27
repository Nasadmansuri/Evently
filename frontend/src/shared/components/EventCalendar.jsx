import { useEffect, useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarX2, CalendarPlus } from 'lucide-react';
import { getGoogleCalendarUrl } from '../utils/calendarIntegration';

const CATEGORY_STYLE = {
  Technical: { dot: 'bg-primary-600', chip: 'bg-primary-50 text-primary-700' },
  Cultural: { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600' },
  Workshop: { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700' },
  Competition: { dot: 'bg-violet-600', chip: 'bg-violet-50 text-violet-700' },
  Seminar: { dot: 'bg-amber-700', chip: 'bg-amber-50 text-amber-800' },
  Sports: { dot: 'bg-pink-500', chip: 'bg-pink-50 text-pink-700' },
  Conference: { dot: 'bg-slate-600', chip: 'bg-slate-100 text-slate-700' },
};
const DEFAULT_STYLE = { dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/**
 * Shared month-grid calendar used by both BrowseEvents.jsx (faculty/student)
 * and ManageEvents.jsx (admin). Parent owns its own filtering - this
 * component just renders whatever `events` array it's given.
 */
export default function EventCalendar({ events, onDayClick, onEventClick }) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [expandedDay, setExpandedDay] = useState(null);
  const expandedPopupRef = useRef(null);

  useEffect(() => {
    if (!expandedDay) return;
    function handleClickOutside(e) {
      if (expandedPopupRef.current && !expandedPopupRef.current.contains(e.target)) {
        setExpandedDay(null);
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setExpandedDay(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [expandedDay]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = dateKey(ev.event_date);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

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

  const monthHasEvents = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    return events.some((ev) => {
      const d = new Date(ev.event_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [events, monthCursor]);

  function goToToday() {
    const d = new Date();
    setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  function handleDayClick(key) {
    setExpandedDay(null);
    onDayClick(key);
  }

  const today = new Date();
  const todayKey = dateKey(today);
  const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isCurrentMonth = isSameDay(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1), new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-4 py-3.5 sm:px-5">
        <button
          onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            {monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[10px] font-semibold text-primary-700 transition hover:bg-primary-100"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-b border-slate-100 px-4 py-2.5 sm:px-5">
        {Object.entries(CATEGORY_STYLE).map(([cat, style]) => (
          <span key={cat} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} /> {cat}
          </span>
        ))}
      </div>

      <div className="p-3 sm:p-4">
        {!monthHasEvents && (
          <div className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-xs font-medium text-slate-400">
            <CalendarX2 size={14} /> No events this month
          </div>
        )}

        {/* Weekday row */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="pb-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {wd}
            </div>
          ))}

          {calendarCells.map((cellDate, i) => {
            if (!cellDate) return <div key={i} className="min-h-[72px] sm:min-h-[104px]" />;
            const key = dateKey(cellDate);
            const dayEvents = eventsByDate[key] || [];
            const isToday = isSameDay(cellDate, today);
            const isPast = key < todayKey;
            const hasEvents = dayEvents.length > 0;

            return (
              <div
                key={i}
                onClick={() => hasEvents && handleDayClick(key)}
                onKeyDown={(e) => {
                  if (hasEvents && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleDayClick(key);
                  }
                }}
                role={hasEvents ? 'button' : undefined}
                tabIndex={hasEvents ? 0 : undefined}
                aria-label={hasEvents ? `${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'} on ${cellDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : undefined}
                className={`group relative flex min-h-[72px] flex-col rounded-xl border p-1.5 transition sm:min-h-[104px] sm:p-2 ${
                  isToday
                    ? 'border-primary-400 bg-primary-50/60 ring-1 ring-primary-200'
                    : 'border-slate-100 bg-white'
                } ${isPast && !isToday ? 'opacity-60' : ''} ${
                  hasEvents
                    ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-400'
                    : ''
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold sm:h-6 sm:w-6 sm:text-xs ${
                    isToday ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {cellDate.getDate()}
                </span>

                <div className="mt-1 flex flex-1 flex-col gap-1">
                  {dayEvents.slice(0, 2).map((ev) => {
                    const style = CATEGORY_STYLE[ev.category] || DEFAULT_STYLE;
                    return (
                      <div
                        key={ev.id}
                        title={ev.title}
                        className={`truncate rounded-md px-1.5 py-0.5 text-left text-[9px] font-semibold sm:text-[10.5px] ${style.chip}`}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedDay(expandedDay === key ? null : key); }}
                      className="mt-auto self-start px-1.5 text-[9px] font-bold text-primary-600 hover:underline sm:text-[10.5px]"
                    >
                      +{dayEvents.length - 2} more
                    </button>
                  )}
                </div>

                {expandedDay === key && (
                  <div
                    ref={expandedPopupRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full z-10 mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl"
                  >
                    <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {dayEvents.map((ev) => {
                        const style = CATEGORY_STYLE[ev.category] || DEFAULT_STYLE;
                        return (
                          <div
                            key={ev.id}
                            className="group/item flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
                          >
                            <button
                              type="button"
                              onClick={() => { setExpandedDay(null); onEventClick(ev.id); }}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs font-medium text-slate-700"
                            >
                              <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                              <span className="truncate">{ev.title}</span>
                            </button>
                            <a
                              href={getGoogleCalendarUrl(ev)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Add to Google Calendar"
                              className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition shrink-0"
                            >
                              <CalendarPlus size={13} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handleDayClick(key)}
                      className="mt-2 w-full rounded-lg bg-primary-600 px-2 py-1.5 text-[10.5px] font-bold text-white transition hover:bg-primary-700"
                    >
                      View all in List →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}