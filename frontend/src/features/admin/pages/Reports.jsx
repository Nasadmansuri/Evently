import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, AlertCircle, Inbox, Loader2, FileDown, FileText,
  Search, CheckCircle2, History, Trash2, PlayCircle, AlertTriangle, X, Clock
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { isEventPast, getEventStatus } from '../../../shared/utils/eventStatus';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

const RECENT_REPORTS_STORAGE_KEY = 'evently_recent_generated_reports';

export default function Reports() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'concluded' | 'upcoming' | 'cancelled'
  const [recentReports, setRecentReports] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_REPORTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/events/admin/all');
      setEvents(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load platform events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function saveRecentReport(ev) {
    const newEntry = {
      eventId: ev.id,
      title: ev.title,
      category: ev.category,
      organizerName: ev.organizer_name || ev.organizing_department || 'Faculty',
      generatedAt: new Date().toISOString(),
    };

    setRecentReports((prev) => {
      const filtered = prev.filter((r) => r.eventId !== ev.id);
      const updated = [newEntry, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(RECENT_REPORTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }

  function clearRecentReports() {
    setRecentReports([]);
    try {
      localStorage.removeItem(RECENT_REPORTS_STORAGE_KEY);
      showToast.success('Recent report history cleared');
    } catch (e) {
      console.error(e);
    }
  }

  async function handleGenerate(ev) {
    setGeneratingId(ev.id);
    try {
      const res = await api.get(`/events/${ev.id}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-report-${ev.id}-${ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      saveRecentReport(ev);
      showToast.success(`Report downloaded for "${ev.title}"`);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to generate PDF report');
    } finally {
      setGeneratingId(null);
    }
  }

  const { concludedCount, upcomingCount, scheduledCount, cancelledCount, filteredEvents } = useMemo(() => {
    const concluded = events.filter((e) => {
      const st = getEventStatus(e.event_date, e.event_time, e.status, e.publish_at);
      return st === 'ended';
    });
    const scheduled = events.filter((e) => {
      const st = getEventStatus(e.event_date, e.event_time, e.status, e.publish_at);
      return st === 'scheduled';
    });
    const upcoming = events.filter((e) => {
      const st = getEventStatus(e.event_date, e.event_time, e.status, e.publish_at);
      return st === 'upcoming' || st === 'ongoing';
    });
    const cancelled = events.filter((e) => {
      const st = getEventStatus(e.event_date, e.event_time, e.status, e.publish_at);
      return st === 'cancelled';
    });

    let list = events;
    if (filterTab === 'concluded') list = concluded;
    if (filterTab === 'upcoming') list = upcoming;
    if (filterTab === 'scheduled') list = scheduled;
    if (filterTab === 'cancelled') list = cancelled;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.title?.toLowerCase().includes(q) ||
        (e.organizer_name && e.organizer_name.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.organizing_department && e.organizing_department.toLowerCase().includes(q)) ||
        (e.organizing_community && e.organizing_community.toLowerCase().includes(q))
      );
    }

    return {
      concludedCount: concluded.length,
      upcomingCount: upcoming.length,
      scheduledCount: scheduled.length,
      cancelledCount: cancelled.length,
      filteredEvents: list,
    };
  }, [events, filterTab, search]);

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Authentic Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Event Reports</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Export official PDF participant rosters, attendance statistics, and feedback summaries
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 shadow-xs">
          <span className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            {error}
          </span>
          <button onClick={loadEvents} className="font-bold underline hover:text-rose-900 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Events */}
        <div className="skeuo-card rounded-2xl p-5 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Events</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
              <Calendar size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : events.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Across all departments</p>
          </div>
        </div>

        {/* Concluded Events */}
        <div className="skeuo-card rounded-2xl p-5 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Concluded</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : concludedCount}</p>
            <p className="mt-1 text-xs text-emerald-700 font-medium">Ready for report export</p>
          </div>
        </div>

        {/* Active & Upcoming */}
        <div className="skeuo-card rounded-2xl p-5 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-800">Upcoming / Live</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-200/80 shadow-2xs">
              <PlayCircle size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{loading ? '—' : upcomingCount}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Scheduled on campus</p>
          </div>
        </div>

        {/* Recent Exports */}
        <div className="skeuo-card rounded-2xl p-5 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recent Exports</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
              <History size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{recentReports.length}</p>
            <p className="mt-1 text-xs text-slate-500 font-medium">Generated in this session</p>
          </div>
        </div>
      </div>

      {/* Recently Generated Reports Tray */}
      {recentReports.length > 0 && (
        <div className="skeuo-card rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <History size={15} className="text-primary-700" />
              <span>Recent Report Session History ({recentReports.length})</span>
            </div>
            <button
              onClick={clearRecentReports}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer"
              title="Clear recent report history"
            >
              <Trash2 size={12} /> Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
            {recentReports.map((rec) => (
              <div
                key={rec.eventId}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 hover:border-slate-300 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{rec.title}</p>
                  <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                    {new Date(rec.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {rec.category}
                  </p>
                </div>
                <button
                  onClick={() => handleGenerate({ id: rec.eventId, title: rec.title })}
                  disabled={generatingId === rec.eventId}
                  className="skeuo-btn-secondary flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                  title="Re-download PDF report"
                >
                  {generatingId === rec.eventId ? (
                    <Loader2 size={12} className="animate-spin text-primary-700" />
                  ) : (
                    <FileDown size={12} className="text-primary-700" />
                  )}
                  <span>Re-download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Event Table Card */}
      <div className="skeuo-card overflow-hidden rounded-[24px]">
        {/* Controls Toolbar */}
        <div className="flex flex-col gap-3.5 border-b border-slate-100 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between bg-slate-50/40">
          {/* Status Tabs */}
          <div className="skeuo-tray flex flex-wrap items-center gap-1 rounded-xl p-1">
            {[
              { id: 'all', label: `All Events (${events.length})` },
              { id: 'concluded', label: `Concluded (${concludedCount})` },
              { id: 'upcoming', label: `Upcoming & Live (${upcomingCount})` },
              ...(scheduledCount > 0 ? [{ id: 'scheduled', label: `Scheduled (${scheduledCount})` }] : []),
              ...(cancelledCount > 0 ? [{ id: 'cancelled', label: `Cancelled (${cancelledCount})` }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  filterTab === tab.id ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filterTab === tab.id && (
                  <motion.div
                    layoutId="reportsFilterPill"
                    className="absolute inset-0 rounded-lg skeuo-pill-active"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event title, organizer, dept..."
              className="skeuo-input w-full rounded-xl py-2 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Inbox size={22} />
            </div>
            <p className="text-sm font-bold text-slate-800">No events found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {search
                ? `No event matches "${search}". Try clearing your search query.`
                : 'There are no events matching this filter.'}
            </p>
            {(search || filterTab !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterTab('all');
                }}
                className="skeuo-btn-secondary mt-3.5 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table Headers */}
            <div className="hidden grid-cols-[2.2fr_1.2fr_1.1fr_1.4fr] gap-3 border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 sm:grid">
              <span>Event & Organizer</span>
              <span>Date & Schedule</span>
              <span>Category & Status</span>
              <span className="text-right">Export Action</span>
            </div>

            {/* Event List Items */}
            <div className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => {
                const style = getCategoryStyle(ev.category);
                const liveStatus = getEventStatus(ev.event_date, ev.event_time, ev.status, ev.publish_at);
                const isPast = isEventPast(ev.event_date, ev.event_time) || ev.status === 'ended';
                const isGenerating = generatingId === ev.id;

                return (
                  <div
                    key={ev.id}
                    className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-[2.2fr_1.2fr_1.1fr_1.4fr] sm:items-center hover:bg-slate-50/70 transition"
                  >
                    {/* Event & Organizer */}
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">
                        {ev.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        By {ev.organizing_community ? `${ev.organizing_department} · ${ev.organizing_community}` : (ev.organizing_department || ev.organizer_name || 'Faculty')}
                      </p>
                    </div>

                    {/* Date & Schedule */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Calendar size={14} className="text-primary-700 shrink-0" />
                      <span className="truncate">
                        {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {ev.event_time ? ` · ${formatTime12hr(ev.event_time)}` : ''}
                      </span>
                    </div>

                    {/* Category & Status */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`skeuo-badge-embossed inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}>
                        {ev.category || 'General'}
                      </span>
                      {ev.status === 'cancelled' || liveStatus === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          <AlertTriangle size={10} /> Cancelled
                        </span>
                      ) : liveStatus === 'scheduled' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Clock size={10} /> Scheduled
                        </span>
                      ) : liveStatus === 'ongoing' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <PlayCircle size={10} /> Live
                        </span>
                      ) : isPast || liveStatus === 'ended' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          <CheckCircle2 size={10} /> Concluded
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-primary-50 border border-primary-200 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                          Upcoming
                        </span>
                      )}
                    </div>

                    {/* Export Action */}
                    <div className="flex justify-start sm:justify-end">
                      <button
                        onClick={() => handleGenerate(ev)}
                        disabled={isGenerating}
                        className="skeuo-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50 shadow-2xs active:scale-95 transition"
                        title={`Generate PDF Report for ${ev.title}`}
                      >
                        {isGenerating ? (
                          <Loader2 size={13} className="animate-spin text-white" />
                        ) : (
                          <FileText size={13} className="text-white" />
                        )}
                        <span>{isGenerating ? 'Generating...' : 'Generate PDF Report'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}