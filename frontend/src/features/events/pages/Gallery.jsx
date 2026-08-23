import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Images, AlertCircle, Camera } from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

export default function Gallery() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gallery</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Photos from past and upcoming campus events</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </span>
          <button onClick={loadGallery} className="font-medium underline shrink-0">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-56 rounded-[18px] bg-slate-100 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-[18px] border border-slate-100">
          <Images className="text-slate-300 mb-3" size={32} />
          <p className="text-sm font-medium text-slate-700">No photos yet</p>
          <p className="text-xs text-slate-400 mt-1">Photos added to events will show up here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => {
            const style = getCategoryStyle(ev.category);
            return (
              <button
                key={ev.id}
                onClick={() => navigate(`/events/${ev.id}?tab=gallery`)}
                className="text-left overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-40 w-full bg-slate-200">
                  <img
                    src={`${ASSET_BASE_URL}${ev.cover_image}`}
                    alt={ev.title}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: 'center 32%' }}
                  />
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                    <Camera size={11} /> {ev.photo_count}
                  </span>
                </div>
                <div className="p-4">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium mb-2 ${style.bg} ${style.text}`}>
                    {ev.category}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{ev.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(ev.event_date).toLocaleDateString()}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}