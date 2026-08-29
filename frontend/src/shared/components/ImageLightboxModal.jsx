import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Maximize2, Camera, Calendar } from 'lucide-react';

const ASSET_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

export default function ImageLightboxModal({
  isOpen,
  onClose,
  images = [],
  currentIndex = 0,
  onIndexChange,
  eventTitle = '',
}) {
  const currentImage = images[currentIndex];
  const lastWheelTimeRef = useRef(0);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const nextIdx = (currentIndex - 1 + images.length) % images.length;
    onIndexChange(nextIdx);
  }, [currentIndex, images.length, onIndexChange]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const nextIdx = (currentIndex + 1) % images.length;
    onIndexChange(nextIdx);
  }, [currentIndex, images.length, onIndexChange]);

  const handleWheel = useCallback(
    (e) => {
      if (images.length <= 1) return;
      const now = Date.now();
      if (now - lastWheelTimeRef.current < 260) return; // debounce mouse wheel events

      if (e.deltaY > 15 || e.deltaX > 15) {
        lastWheelTimeRef.current = now;
        handleNext();
      } else if (e.deltaY < -15 || e.deltaX < -15) {
        lastWheelTimeRef.current = now;
        handlePrev();
      }
    },
    [images.length, handleNext, handlePrev]
  );

  const handleThumbnailWheel = useCallback((e) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY * 1.5;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    }

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentImage) return null;

  const imageUrl = currentImage.image_url?.startsWith('http')
    ? currentImage.image_url
    : `${ASSET_BASE_URL}${currentImage.image_url}`;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-black/90 backdrop-blur-md p-3 sm:p-6 select-none overscroll-contain"
        onClick={onClose}
        onWheel={handleWheel}
      >
        {/* Top Control Bar */}
        <div
          className="w-full max-w-7xl flex items-center justify-between z-10 pt-1 pb-3 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-300 border border-white/15 backdrop-blur-md shrink-0">
              <Camera size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                {eventTitle || 'Campus Photo Album'}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Photo {currentIndex + 1} of {images.length}
                {currentImage.is_banner === 1 && (
                  <span className="ml-2 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                    Cover Banner
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Button */}
            <a
              href={imageUrl}
              download={`event-photo-${currentImage.id || currentIndex + 1}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 border border-white/15 cursor-pointer"
              title="Download full resolution photo"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={16} />
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-rose-600/80 text-white transition active:scale-95 border border-white/15 cursor-pointer"
              title="Close viewer (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Image Display Area */}
        <div
          className="relative flex-1 w-full max-w-6xl flex items-center justify-center overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Previous Arrow Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Previous photo"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Active Image */}
          <motion.div
            key={currentImage.id || currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[78vh] max-w-full flex items-center justify-center"
          >
            <img
              src={imageUrl}
              alt={eventTitle || 'Campus event photo'}
              className="max-h-[75vh] sm:max-h-[78vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 ring-1 ring-black/40"
            />
          </motion.div>

          {/* Next Arrow Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Next photo"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Strip (if multiple photos) */}
        {images.length > 1 && (
          <div
            className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2 z-10 scrollbar-none"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleThumbnailWheel}
          >
            {images.map((img, idx) => {
              const thumbUrl = img.image_url?.startsWith('http')
                ? img.image_url
                : `${ASSET_BASE_URL}${img.image_url}`;
              const isSelected = idx === currentIndex;

              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => onIndexChange(idx)}
                  className={`relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-xl overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 scale-105 opacity-100 shadow-lg'
                      : 'opacity-50 hover:opacity-90 hover:scale-100 ring-1 ring-white/20'
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
