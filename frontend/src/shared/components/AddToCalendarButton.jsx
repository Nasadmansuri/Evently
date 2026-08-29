import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Download, ExternalLink } from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarIntegration';

export default function AddToCalendarButton({ event, className = '', variant = 'dropdown', size = 'md', direction = 'down' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!event || event.status === 'cancelled') return null;

  const gcalUrl = getGoogleCalendarUrl(event);

  if (variant === 'direct-google') {
    return (
      <a
        href={gcalUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-95 ${className}`}
      >
        <Calendar size={14} className="text-blue-600" />
        <span>Add to Google Calendar</span>
        <ExternalLink size={11} className="text-slate-400" />
      </a>
    );
  }

  const isSmall = size === 'sm';
  const isUp = direction === 'up';

  return (
    <div
      className={`relative inline-block text-left ${className}`}
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`skeuo-btn-secondary inline-flex items-center justify-center gap-1.5 rounded-xl font-bold cursor-pointer ${isSmall ? 'px-3 py-1.5 text-[11.5px]' : 'px-4 py-2.5 text-xs'
          }`}
      >
        <Calendar size={isSmall ? 13 : 14} className="text-slate-600 shrink-0" />
        <span>Add to Calendar</span>
        <ChevronDown size={isSmall ? 12 : 13} className={`text-slate-400 transition-transform duration-200 ${isOpen ? (isUp ? '-rotate-180' : 'rotate-180') : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`skeuo-card absolute ${isUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} left-0 sm:left-auto sm:right-0 w-56 rounded-2xl p-1.5 shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-150`}
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Calendar size={13} />
              </span>
              <span>Google Calendar</span>
            </span>
            <ExternalLink size={12} className="text-slate-400" />
          </a>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadIcsFile(event);
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition text-left"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Download size={13} />
              </span>
              <span>Apple / Outlook (.ics)</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
