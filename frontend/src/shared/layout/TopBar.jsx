import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Menu, User, ChevronDown, ShieldCheck, Landmark, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { showToast } from '../utils/toast';
import bicLogo from '../../assets/bic-logo.png';
import wolverhamptonLogo from '../../assets/wolverhampton-logo.png';

export default function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef(null);

  const initials = (user?.full_name || '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    showToast.info('Logged out successfully');
    navigate('/login');
  }

  const isAffiliated =
    user?.is_affiliated ||
    (user?.role === 'student' && (
      user?.college_name?.toLowerCase().includes('biratnagar') ||
      user?.college_name?.toLowerCase().includes('bic') ||
      user?.college_name?.toLowerCase().includes('herald') ||
      user?.college_name?.toLowerCase().includes('fishtail') ||
      user?.faculty_name ||
      user?.course_name
    ));
  const isGuest = user?.role === 'student' && !isAffiliated;
  const displayRole = isGuest ? 'Guest Student' : user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-sm flex items-center justify-between">
      {/* Left: Menu toggle & College Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Institutional Partner Branding Badge */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-1.5 shadow-2xs">
            <img
              src={bicLogo}
              alt="Biratnagar International College"
              className="h-8 w-auto object-contain transition-transform hover:scale-105"
            />
            <div className="h-5 w-px bg-slate-200" />
            <img
              src={wolverhamptonLogo}
              alt="University of Wolverhampton"
              className="h-6 w-auto object-contain transition-transform hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Right: Notifications & Rock-Solid Profile Trigger */}
      <div className="flex items-center gap-3 sm:gap-4">
        <NotificationBell />

        <div className="hidden h-6 w-px bg-slate-200 sm:block" />

        {/* User Profile Pill Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white py-1 pl-1 pr-3 shadow-2xs transition hover:border-primary-300 hover:bg-slate-50 hover:shadow-xs active:scale-[0.98] text-left focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {user?.avatar_url && !avatarError ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'User Avatar'}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setAvatarError(true)}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-primary-100"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#023433] text-[11px] font-bold text-white shadow-2xs ring-2 ring-emerald-100">
                {initials || 'U'}
              </div>
            )}

            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {user?.full_name || 'My Account'}
              </span>
              <span className={`text-[9.5px] font-bold tracking-tight ${
                user?.role === 'admin'
                  ? 'text-violet-600'
                  : user?.role === 'faculty'
                  ? 'text-primary-700'
                  : isGuest
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}>
                {displayRole}
              </span>
            </div>

            <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-slate-700' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 bg-slate-50 rounded-xl mb-1 border border-slate-100/80">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                  <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${
                    isGuest ? 'bg-amber-100 text-amber-800' : 'bg-primary-100 text-primary-700'
                  }`}>
                    {displayRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                {user?.college_name && (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-600 mt-2">
                    <Landmark size={12} className="text-primary-600 shrink-0" />
                    <span className="truncate">{user.college_name}</span>
                  </div>
                )}
              </div>

              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition"
              >
                <User size={15} />
                <span>View Full Profile</span>
              </Link>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition text-left"
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}