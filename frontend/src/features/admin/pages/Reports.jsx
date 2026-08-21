import { useEffect, useState } from 'react';
import { BarChart3, Calendar, AlertCircle, Inbox, Loader2 } from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { formatTime12hr } from '../../../shared/utils/formatTime';

export default function Reports() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingId, setGeneratingId] = useState(null);

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/events/admin/all');
      setEvents(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleGenerate(ev) {
    setGeneratingId(ev.id);
    try {
      const res = await api.get(`/events/${ev.id}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-report-${ev.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast.error('Failed to generate report');
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Report Generator</h1>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Generate and download event reports</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          <span className="flex items-center gap-2"><AlertCircle size={14} className="shrink-0" />{error}</span>
          <button onClick={loadEvents} className="shrink-0 font-medium underline">Retry</button>
        </div>
      )}

      <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Select Event to Generate Report</h2>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="mb-3 text-slate-300" size={32} />
            <p className="text-sm font-medium text-slate-700">No events on the platform yet</p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:grid">
              <span>Event</span>
              <span>Date & Time</span>
              <span>Category</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {events.map((ev) => (
                <div key={ev.id} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{ev.title}</p>
                    <p className="text-xs text-slate-500">By {ev.organizer_name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Calendar size={12} />
                    {new Date(ev.event_date).toLocaleDateString()} · {formatTime12hr(ev.event_time)}
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                      {ev.category}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <button
                      onClick={() => handleGenerate(ev)}
                      disabled={generatingId === ev.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
                    >
                      {generatingId === ev.id ? (
                        <><Loader2 className="animate-spin" size={12} /> Generating...</>
                      ) : (
                        <><BarChart3 size={12} /> Generate PDF Report</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}