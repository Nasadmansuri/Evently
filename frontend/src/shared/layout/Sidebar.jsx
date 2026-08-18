import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, PlusSquare, ListChecks, Images, MessageSquare, X, CalendarHeart, Users, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { label: 'All Events', to: '/admin/events', icon: CalendarDays, roles: ['admin'] },
  { label: 'Create Event', to: '/admin/create-event', icon: PlusSquare, roles: ['admin'] },
  { label: 'User Management', to: '/admin/users', icon: Users, roles: ['admin'], disabled: true },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3, roles: ['admin'], disabled: true },
  { label: 'Gallery', to: '/admin/gallery', icon: Images, roles: ['admin'], disabled: true },
  { label: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard, roles: ['faculty'] },
  { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard, roles: ['student'] },
  { label: 'All Events', to: '/events', icon: CalendarDays, roles: ['faculty', 'student'] },
  { label: 'Create Event', to: '/faculty/create-event', icon: PlusSquare, roles: ['faculty'] },
  { label: 'My Events', to: '/faculty/my-events', icon: ListChecks, roles: ['faculty'] },
  { label: 'My Registrations', to: '/student/my-registrations', icon: ListChecks, roles: ['student'] },
  { label: 'My Feedback', to: '/student/my-feedback', icon: MessageSquare, roles: ['student'] },
  { label: 'Gallery', to: '/faculty/gallery', icon: Images, roles: ['faculty'], disabled: true },
  { label: 'Gallery', to: '/student/gallery', icon: Images, roles: ['student'], disabled: true },
];

export default function Sidebar({ role, open, onClose }) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {open && <div className="fixed inset-0 bg-slate-900/25 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-sm transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
              <CalendarHeart className="text-white" size={16} />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-slate-900">Evently</span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Menu</p>

          {items.map(({ label, to, icon: Icon, disabled }) =>
            disabled ? (
              <div
                key={label}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300"
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} strokeWidth={2} />
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
                  `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={16} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            )
          )}
        </nav>
      </aside>
    </>
  );
}