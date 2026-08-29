import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, PlusSquare, ListChecks, Images,
  MessageSquare, X, CalendarHeart, Users, BarChart3, UserCircle, LogOut
} from 'lucide-react';
import { getDashboardPath } from '../utils/navigation';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { label: 'All Events', to: '/admin/events', icon: CalendarDays, roles: ['admin'] },
  { label: 'Create Event', to: '/admin/create-event', icon: PlusSquare, roles: ['admin'] },
  { label: 'User Management', to: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3, roles: ['admin'] },
  { label: 'Gallery', to: '/admin/gallery', icon: Images, roles: ['admin'] },
  { label: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard, roles: ['faculty'] },
  { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard, roles: ['student'] },
  { label: 'All Events', to: '/events', icon: CalendarDays, roles: ['faculty', 'student'] },
  { label: 'Create Event', to: '/faculty/create-event', icon: PlusSquare, roles: ['faculty'] },
  { label: 'My Events', to: '/faculty/my-events', icon: ListChecks, roles: ['faculty'] },
  { label: 'My Registrations', to: '/student/my-registrations', icon: ListChecks, roles: ['student'] },
  { label: 'My Feedback', to: '/student/my-feedback', icon: MessageSquare, roles: ['student'] },
  { label: 'Gallery', to: '/faculty/gallery', icon: Images, roles: ['faculty'] },
  { label: 'Gallery', to: '/student/gallery', icon: Images, roles: ['student'] },
  { label: 'My Profile', to: '/profile', icon: UserCircle, roles: ['admin', 'faculty', 'student'] },
];

export default function Sidebar({ role, open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const dashboardUrl = getDashboardPath({ role });

  const initials = (user?.full_name || '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const displayRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member';

  function handleLogout() {
    logout();
    showToast.info('Logged out successfully');
    navigate('/login');
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/90 bg-white text-slate-800 transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand Header (Seamlessly aligned with TopBar at 64px / h-16) */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <Link to={dashboardUrl} onClick={onClose} className="flex items-center gap-2.5 hover:opacity-90 transition group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-xs group-hover:scale-105 transition-transform">
              <CalendarHeart className="text-white" size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-slate-900 leading-tight group-hover:text-primary-700 transition-colors">Evently</span>
              <span className="text-[10px] font-bold text-primary-700 tracking-wide uppercase">Campus Hub</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Item List */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3.5 py-4 custom-scrollbar">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Navigation</p>

          {items.map(({ label, to, icon: Icon, disabled }) =>
            disabled ? (
              <div
                key={label}
                className="flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs font-medium text-slate-400"
              >
                <span className="flex items-center gap-3">
                  <Icon size={17} strokeWidth={2} />
                  {label}
                </span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Soon
                </span>
              </div>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={to === '/events'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 min-h-[44px] text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-xs shadow-primary-200/50'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </nav>

        {/* Bottom User Profile & Dedicated Sign Out Section */}
        <div className="border-t border-slate-200/90 p-3 bg-slate-50/70 space-y-2">
          {/* User Profile Card */}
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 p-2.5 min-h-[48px] rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-primary-300 hover:shadow-xs transition group cursor-pointer"
          >
            {user?.avatar_url && !avatarError ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'Avatar'}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setAvatarError(true)}
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-primary-100"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-xs font-black text-white shadow-2xs ring-2 ring-primary-100">
                {initials || 'U'}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1 leading-tight">
              <span className="text-xs font-bold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                {user?.full_name || 'My Account'}
              </span>
              <span className="text-[10px] font-bold text-primary-700 truncate mt-0.5">
                {displayRole}
              </span>
            </div>
          </Link>

          {/* Dedicated Sign Out Button Below */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50/70 py-2.5 px-3 min-h-[44px] text-xs font-bold text-rose-600 shadow-2xs transition hover:bg-rose-100/90 hover:border-rose-200 hover:text-rose-700 active:scale-[0.98] cursor-pointer"
            title="Sign Out of Evently"
            aria-label="Sign Out"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}