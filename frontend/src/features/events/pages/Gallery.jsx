import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Images, AlertCircle, Camera, Search, Calendar, ArrowRight, X, Tag, ChevronDown, Filter, RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

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
      setEvents(res.data || []);
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

  // Dynamic category filter list: only show categories that actually have albums + their live counts
  const availableCategories = useMemo(() => {
    const counts = {};
    events.forEach((ev) => {
      if (ev.category) {
        counts[ev.category] = (counts[ev.category] || 0) + 1;
      }
    });

    const list = [{ id: 'All', label: 'All Categories', count: events.length }];
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort most popular categories first
      .forEach(([cat, count]) => {
        list.push({ id: cat, label: cat, count });
      });

    return list;
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

  function resetFilters() {
    setSearch('');
    setActiveCategory('All');
  }

  const hasActiveFilters = activeCategory !== 'All' || !!search.trim();

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Unified Filter Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-primary-800 border border-primary-100/80">
              Campus Media Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Campus Photo Gallery
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            {loading ? 'Loading photos...' : `${totalPhotos} photos captured across ${events.length} campus event albums.`}
          </p>
        </div>

        {/* Unified Search & Category Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Category Dropdown */}
          <div className="relative w-full sm:w-56">
            <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="skeuo-input w-full appearance-none rounded-xl py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-800 cursor-pointer shadow-2xs"
            >
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id === 'All' ? `All Categories (${c.count})` : `${c.label} (${c.count})`}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search albums, hackathons..."
              className="skeuo-input w-full rounded-xl py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Chips & Results Count Strip */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500">Active Filters:</span>
            {activeCategory !== 'All' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 border border-primary-200/80 px-2.5 py-1 text-xs font-bold text-primary-800">
                <Tag size={12} />
                <span>{activeCategory}</span>
                <button
                  onClick={() => setActiveCategory('All')}
                  className="hover:bg-primary-100 rounded p-0.5 text-primary-600 cursor-pointer"
                  title="Remove category filter"
                >
                  <X size={11} />
                </button>
              </span>
            )}
            {search.trim() && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                <span>"{search}"</span>
                <button
                  onClick={() => setSearch('')}
                  className="hover:bg-slate-200 rounded p-0.5 text-slate-500 cursor-pointer"
                  title="Clear search keyword"
                >
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 font-bold text-primary-700 hover:underline shrink-0 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset All</span>
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 shadow-xs">
          <span className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            {error}
          </span>
          <button onClick={loadGallery} className="font-bold underline hover:text-rose-900">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-6 text-center shadow-2xs"
        >
          <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 border border-primary-100">
            <Images size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Photo Albums Found</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            {search || activeCategory !== 'All'
              ? 'No event albums match your current filters. Try selecting a different category or clearing search.'
              : 'Photos uploaded to events by organizers will automatically show up here.'}
          </p>
          {(search || activeCategory !== 'All') && (
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); }}
              className="skeuo-btn-secondary mt-4 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((ev, idx) => {
            const style = getCategoryStyle(ev.category);
            const photoCount = Number(ev.photo_count) || 0;
            const dateObj = new Date(ev.event_date);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <motion.article
                key={ev.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                onClick={() => navigate(`/events/${ev.id}?tab=gallery`)}
                className="skeuo-card skeuo-card-interactive group flex cursor-pointer flex-col overflow-hidden rounded-[22px] p-3.5"
              >
                {/* 1. Inset Poster Frame */}
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
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#023433] via-[#035352] to-[#012424] p-4 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md mb-1.5 border border-white/15">
                        <Images size={18} className="text-emerald-300" />
                      </div>
                      <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-emerald-200/90 line-clamp-1">
                        {ev.category || 'Event'}
                      </span>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-5" />

                  {/* Category Badge on top-left */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className={`skeuo-badge-embossed rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
                      {ev.category}
                    </span>
                  </div>

                  {/* Photo Count on bottom-right */}
                  <span className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                    <Camera size={12} className="text-emerald-300" />
                    <span>{photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}</span>
                  </span>
                </div>

                {/* 2. Card Content */}
                <div className="flex flex-1 flex-col pt-3.5 px-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Calendar size={12} className="text-slate-400" />
                      {dateStr}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                      Album
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 group-hover:text-primary-700 transition">
                    {ev.title}
                  </h3>

                  {/* 3. Card Footer */}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Organizer</p>
                      <p
                        className="truncate text-xs font-semibold text-slate-700"
                        title={ev.organizing_community ? `${ev.organizing_department} (${ev.organizing_community})` : (ev.organizing_department || '')}
                      >
                        {ev.organizing_community ? `${ev.organizing_department} · ${ev.organizing_community}` : (ev.organizing_department || 'Campus Department')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${ev.id}?tab=gallery`);
                      }}
                      className="skeuo-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs cursor-pointer shrink-0"
                    >
                      View Photos <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}