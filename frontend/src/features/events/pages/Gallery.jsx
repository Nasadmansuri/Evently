import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Images, AlertCircle, Camera, Search, Calendar, ArrowRight,
  Sparkles, Filter, Layers, Eye
} from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Workshop', 'Competition', 'Seminar', 'Sports', 'Conference'];

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

export default function Gallery() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  async function loadGallery() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/events/gallery-summary');
      setEvents(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load gallery');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGallery();
  }, []);

  const totalPhotos = useMemo(() => {
    return events.reduce((acc, ev) => acc + (Number(ev.photo_count) || 0), 0);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        !search.trim() ||
        ev.title?.toLowerCase().includes(search.toLowerCase().trim()) ||
        ev.category?.toLowerCase().includes(search.toLowerCase().trim());
      const matchCategory = activeCategory === 'All' || ev.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [events, search, activeCategory]);

  return (
    <div className="pb-10">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Campus Gallery</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {loading ? 'Loading photos...' : `${totalPhotos} photos captured across ${events.length} event albums`}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search albums..."
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-900 shadow-2xs transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mb-6 flex flex-wrap gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-primary-700 text-white shadow-sm shadow-primary-700/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600">
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            {error}
          </span>
          <button onClick={loadGallery} className="font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-[24px] border border-slate-200/80 bg-slate-100" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200/80 bg-white py-16 text-center shadow-xs">
          <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Images size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Photo Albums Found</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {search || activeCategory !== 'All'
              ? 'No event albums match your current filters. Try selecting a different category or clearing search.'
              : 'Photos uploaded to events by organizers will automatically show up here.'}
          </p>
          {(search || activeCategory !== 'All') && (
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); }}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev) => {
            const style = getCategoryStyle(ev.category);
            const gradient = CARD_GRADIENT[ev.category] || DEFAULT_GRADIENT;
            const photoCount = Number(ev.photo_count) || 0;

            return (
              <article
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}?tab=gallery`)}
                className={`group flex cursor-pointer flex-col overflow-hidden rounded-[24px] bg-gradient-to-br ${gradient} p-3 shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
              >
                {/* Inset Photo Banner with Glossy Badge */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-slate-100 ring-1 ring-black/5">
                  {ev.cover_image ? (
                    <img
                      src={`${ASSET_BASE_URL}${ev.cover_image}`}
                      alt={ev.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ objectPosition: 'center 30%' }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200">
                      <Images size={28} className="text-slate-400" />
                    </div>
                  )}

                  {/* Photo Count Badge */}
                  <span className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                    <Camera size={12} className="text-emerald-300" />
                    <span>{photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}</span>
                  </span>
                </div>

                {/* Card Content & Action */}
                <div className="flex flex-1 flex-col gap-2 px-1.5 pt-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${style.bg} ${style.text}`}>
                      {ev.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Calendar size={12} />
                      {new Date(ev.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-slate-900 group-hover:text-primary-800 transition-colors">
                    {ev.title}
                  </h3>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Event Photo Album
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition group-hover:bg-primary-700">
                      View Photos <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}