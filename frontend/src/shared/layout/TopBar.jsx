import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
      <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <button type="button" className="text-gray-400 hover:text-gray-600 transition" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="w-px h-6 bg-gray-100 hidden sm:block" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-600 ring-2 ring-primary-100 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials || 'U'}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-xs font-semibold text-gray-900">{user?.full_name}</p>
            <span className="inline-block text-[10px] font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded capitalize mt-0.5">
              {user?.role}
            </span>
          </div>
        </div>

        <button type="button" onClick={handleLogout} className="text-gray-400 hover:text-red-600 transition" aria-label="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}