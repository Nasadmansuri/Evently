import { useEffect, useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DOT_TONE = {
  Technical: 'bg-primary-600',
  Cultural: 'bg-slate-400',
  Workshop: 'bg-orange-500',
  Competition: 'bg-violet-600',
  Seminar: 'bg-amber-700',
  Sports: 'bg-pink-500',
  Conference: 'bg-slate-600',
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/**
 * Shared month-grid calendar used by both BrowseEvents.jsx (faculty/student)
 * and ManageEvents.jsx (admin). Previously this ~150-line block was
 * duplicated in both files; extracted here so a fix only needs to happen
 * once. Parent is responsible for its own filtering - this component just
 * renders whatever `events` array it's given.
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

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">
            {monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={goToToday}
            className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 transition hover:border-primary-300 hover:text-primary-600"
          >
            Today
          </button>
        </div>
        <button
          onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 border-b border-slate-100 pb-3">
        {Object.entries(DOT_TONE).map(([cat, tone]) => (
          <span key={cat} className="flex items-center gap-1 text-[10px] text-slate-500">
            <span className={`h-1.5 w-1.5 rounded-full ${tone}`} /> {cat}
          </span>
        ))}
      </div>

      {!monthHasEvents && (
        <p className="mb-2 text-center text-xs text-slate-400">No events this month</p>
      )}

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="pb-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {wd}
          </div>
        ))}

        {calendarCells.map((cellDate, i) => {
          if (!cellDate) return <div key={i} className="min-h-[64px] sm:min-h-[92px]" />;
          const key = dateKey(cellDate);
          const dayEvents = eventsByDate[key] || [];
          const isToday = isSameDay(cellDate, today);
          const isPast = key < todayKey;

          return (
            <div
              key={i}
              onClick={() => dayEvents.length > 0 && handleDayClick(key)}
              className={`relative min-h-[64px] rounded-lg border p-1 transition sm:min-h-[92px] sm:p-1.5 ${
                isToday ? 'border-primary-300 bg-primary-50/40' : 'border-slate-100'
              } ${isPast ? 'opacity-50' : ''} ${dayEvents.length > 0 ? 'cursor-pointer hover:border-primary-200 hover:bg-slate-50' : ''}`}
            >
              <span className={`text-[10px] font-semibold sm:text-[11px] ${isToday ? 'text-primary-700' : 'text-slate-500'}`}>
                {cellDate.getDate()}
              </span>

              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[9px] font-medium text-slate-700 sm:text-[10px]"
                    title={ev.title}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_TONE[ev.category] || 'bg-slate-400'}`} />
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedDay(expandedDay === key ? null : key); }}
                    className="px-1 text-[9px] font-semibold text-primary-600 hover:underline sm:text-[10px]"
                  >
                    +{dayEvents.length - 2} more
                  </button>
                )}
              </div>

              {expandedDay === key && (
                <div
                  ref={expandedPopupRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full z-10 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                >
                  <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <div className="max-h-48 space-y-0.5 overflow-y-auto">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => { setExpandedDay(null); onEventClick(ev.id); }}
                        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_TONE[ev.category] || 'bg-slate-400'}`} />
                        <span className="truncate">{ev.title}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDayClick(key)}
                    className="mt-1.5 w-full rounded-lg bg-primary-50 px-2 py-1.5 text-[10px] font-semibold text-primary-700 hover:bg-primary-100"
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
  );
}