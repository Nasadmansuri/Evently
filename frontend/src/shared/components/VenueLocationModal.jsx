import { useState } from 'react';
import { MapPin, ExternalLink, Copy, Check, X, Navigation, Landmark } from 'lucide-react';
import { showToast } from '../utils/toast';

const BIC_MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1785.417746225668!2d87.27367!3d26.46400!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ef75c8a92d5f6d%3A0xda07323ea9c724e4!2sBiratnagar%20International%20College!5e0!3m2!1sen!2snp!4v1716900000000!5m2!1sen!2snp';

const BIC_MAP_EXTERNAL_URL = 'https://maps.app.goo.gl/sHAF4fZnPGWHwu3L7';
const BIC_FULL_ADDRESS = 'Biratnagar International College (BIC), Bhrikuti Chowk, Biratnagar, Morang, Koshi Province, Nepal';

export default function VenueLocationModal({ isOpen, onClose, locationName, eventTitle }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const displayVenue = locationName?.trim() || 'Biratnagar International College';

  function handleCopy() {
    navigator.clipboard.writeText(`${displayVenue} — ${BIC_FULL_ADDRESS}`);
    setCopied(true);
    showToast.success('Location copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenMaps() {
    window.open(BIC_MAP_EXTERNAL_URL, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <MapPin size={22} className="text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Event Campus Venue</h3>
              <p className="text-xs text-slate-500 line-clamp-1">
                {eventTitle ? `Location details for "${eventTitle}"` : 'Biratnagar International College venue map'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Venue Info Card */}
        <div className="my-4 space-y-3">
          <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary-900 mb-1">
              <Landmark size={15} className="text-primary-700 shrink-0" />
              <span>Biratnagar International College (BIC)</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Venue / Room: <span className="text-primary-700 font-bold">{displayVenue}</span>
            </p>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
              📍 Bhrikuti Chowk, Biratnagar, Morang, Koshi Province, Nepal
            </p>
          </div>

          {/* Embedded Google Maps Box */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner">
            <iframe
              title="Biratnagar International College Map"
              src={BIC_MAP_EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied Location' : 'Copy Address'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenMaps}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-600 active:scale-95 transition"
          >
            <Navigation size={14} />
            <span>Get Directions</span>
            <ExternalLink size={12} className="opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
}
