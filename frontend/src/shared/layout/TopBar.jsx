import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import bicLogo from '../../assets/bic-logo.png';
import wolverhamptonLogo from '../../assets/wolverhampton-logo.png';

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const [avatarError, setAvatarError] = useState(false);

  const initials = (user?.full_name || '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile Menu Toggle Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 bg-white border border-slate-200 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 lg:hidden cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Right: Institutional Partner Branding, Notification Bell & Profile Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Institutional Partner Branding (Borderless, High-Legibility Lockup) */}
        <div className="hidden sm:flex items-center gap-3.5 pr-2">
          <img
            src={bicLogo}
            alt="Biratnagar International College"
            className="h-8 sm:h-9 w-auto object-contain transition-transform hover:opacity-95 shrink-0"
          />
          <div className="h-5 w-px bg-slate-200 shrink-0" />
          <img
            src={wolverhamptonLogo}
            alt="University of Wolverhampton"
            className="h-6 sm:h-7 w-auto object-contain transition-transform hover:opacity-95 shrink-0"
          />
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200/80 shrink-0" />

        {/* Notifications & Profile */}
        <NotificationBell />

        {/* Minimalist Profile Avatar Button (Links directly to /profile) */}
        <Link
          to="/profile"
          title={`View Profile (${user?.full_name || 'My Account'})`}
          className="group relative flex h-10 w-10 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          {user?.avatar_url && !avatarError ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || 'User Avatar'}
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => setAvatarError(true)}
              className="h-full w-full rounded-full object-cover shadow-2xs border-2 border-white ring-1 ring-slate-200/90 transition-all duration-300 ease-out group-hover:ring-2 group-hover:ring-primary-500 group-hover:shadow-md group-hover:ring-offset-1"
            />
          ) : (
            <div className="h-full w-full rounded-full bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 flex items-center justify-center text-white text-xs sm:text-sm font-black tracking-wider shadow-2xs border-2 border-white ring-1 ring-slate-200/90 transition-all duration-300 ease-out group-hover:ring-2 group-hover:ring-primary-500 group-hover:shadow-md group-hover:ring-offset-1">
              {initials || 'U'}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}