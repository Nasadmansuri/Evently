import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

export default function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.full_name || '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationBell />
          
          <div className="hidden h-6 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[11px] font-semibold text-white ring-2 ring-primary-100">
              {initials || 'U'}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-semibold text-slate-800">{user?.full_name}</p>
              <span className="mt-0.5 inline-block rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium capitalize text-primary-600">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}