import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, Calendar, AlertCircle, Inbox, Loader2, FileDown,
  Clock, Search, CheckCircle2, History, Trash2, ArrowRight, ShieldCheck
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
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'concluded' | 'upcoming'
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
      // Remove any existing entry for same event to push new to top
      const filtered = prev.filter((r) => r.eventId !== ev.id);
      const updated = [newEntry, ...filtered].slice(0, 5); // Keep top 5
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

  const { concludedCount, upcomingCount, filteredEvents } = useMemo(() => {
    const concluded = events.filter((e) => isEventPast(e.event_date, e.event_time) || e.status === 'ended');
    const upcoming = events.filter((e) => !isEventPast(e.event_date, e.event_time) && e.status !== 'ended');

    let list = events;
    if (filterTab === 'concluded') list = concluded;
    if (filterTab === 'upcoming') list = upcoming;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        (e.organizer_name && e.organizer_name.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.organizing_department && e.organizing_department.toLowerCase().includes(q))
      );
    }

    return {
      concludedCount: concluded.length,
      upcomingCount: upcoming.length,
      filteredEvents: list,
    };
  }, [events, filterTab, search]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Event Report Generator</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Generate and export official PDF participant rosters, registration statistics, and feedback summaries.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            {error}
          </span>
          <button onClick={loadEvents} className="font-bold underline shrink-0">Retry</button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Total Events</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Calendar size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{loading ? '—' : events.length}</p>
          <p className="mt-0.5 text-[11.5px] text-slate-500">Across all campus departments</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-800">Concluded Events</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-950">{loading ? '—' : concludedCount}</p>
          <p className="mt-0.5 text-[11.5px] text-emerald-700">Ready for complete post-event reporting</p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-800">Recently Exported</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <History size={15} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-primary-950">{recentReports.length}</p>
          <p className="mt-0.5 text-[11.5px] text-primary-700">Saved in recent report session history</p>
        </div>
      </div>

      {/* Recently Generated Reports Tray */}
      {recentReports.length > 0 && (
        <div className="rounded-2xl border border-primary-200/80 bg-gradient-to-r from-primary-50/70 via-white to-primary-50/30 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-primary-100">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-950">
              <History size={16} className="text-primary-700" />
              <span>Recently Generated Reports ({recentReports.length})</span>
            </div>
            <button
              onClick={clearRecentReports}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition"
              title="Clear recent history"
            >
              <Trash2 size={12} /> Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
            {recentReports.map((rec) => (
              <div
                key={rec.eventId}
                className="flex items-center justify-between gap-2 rounded-xl border border-primary-100/90 bg-white p-3 shadow-2xs hover:shadow-xs transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">{rec.title}</p>
                  <p className="text-[10.5px] text-slate-500 truncate">
                    {new Date(rec.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {rec.category}
                  </p>
                </div>
                <button
                  onClick={() => handleGenerate({ id: rec.eventId, title: rec.title })}
                  disabled={generatingId === rec.eventId}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-primary-50 border border-primary-200 px-2.5 py-1.5 text-[11px] font-bold text-primary-700 hover:bg-primary-100 active:scale-95 transition"
                  title="Re-download PDF"
                >
                  {generatingId === rec.eventId ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <FileDown size={12} />
                  )}
                  <span>Re-download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Event Table Section */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-xs">
        {/* Controls Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setFilterTab('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterTab === 'all'
                  ? 'bg-white text-primary-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setFilterTab('concluded')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterTab === 'concluded'
                  ? 'bg-white text-primary-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Concluded ({concludedCount})
            </button>
            <button
              onClick={() => setFilterTab('upcoming')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterTab === 'upcoming'
                  ? 'bg-white text-primary-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event title, organizer..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Inbox className="mb-3 text-slate-300" size={32} />
            <p className="text-sm font-bold text-slate-800">No events found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {search ? 'No events matched your search query. Try clearing the search box.' : 'There are no events in this category yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[2fr_1.2fr_1fr_1.3fr] gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 sm:grid">
              <span>Event & Organizer</span>
              <span>Date & Time</span>
              <span>Category & Status</span>
              <span className="text-right">Export Actions</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => {
                const style = getCategoryStyle(ev.category);
                const isPast = isEventPast(ev.event_date, ev.event_time) || ev.status === 'ended';
                return (
                  <div
                    key={ev.id}
                    className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[2fr_1.2fr_1fr_1.3fr] sm:items-center hover:bg-slate-50/60 transition"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{ev.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        By {ev.organizing_community ? `${ev.organizing_department} · ${ev.organizing_community}` : (ev.organizing_department || ev.organizer_name || 'Campus Faculty')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Calendar size={13} className="text-primary-700 shrink-0" />
                      <span>
                        {new Date(ev.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {formatTime12hr(ev.event_time)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${style.bg} ${style.text}`}>
                        {ev.category}
                      </span>
                      {isPast ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Ended
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="sm:text-right">
                      <button
                        onClick={() => handleGenerate(ev)}
                        disabled={generatingId === ev.id}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-50 ${
                          isPast
                            ? 'bg-primary-700 text-white hover:bg-primary-800'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {generatingId === ev.id ? (
                          <><Loader2 className="animate-spin" size={13} /> Generating...</>
                        ) : (
                          <><FileDown size={13} /> Generate PDF Report</>
                        )}
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