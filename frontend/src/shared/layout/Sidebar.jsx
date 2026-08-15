import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, PlusSquare, ListChecks, Images, X, CalendarHeart } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Approvals', to: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { label: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard, roles: ['faculty'] },
  { label: 'All Events', to: '/events', icon: CalendarDays, roles: ['faculty', 'student'] },
  { label: 'Create Event', to: '/faculty/create-event', icon: PlusSquare, roles: ['faculty'] },
  { label: 'My Events', to: '/faculty/my-events', icon: ListChecks, roles: ['faculty'] },
  { label: 'Gallery', to: '/faculty/gallery', icon: Images, roles: ['faculty'], disabled: true },
];

export default function Sidebar({ role, open, onClose }) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-100 flex flex-col overflow-y-auto transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
              <CalendarHeart className="text-white" size={16} />
            </div>
            <span className="text-[15px] font-bold text-gray-900 tracking-tight">Evently</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 tracking-wider uppercase">Menu</p>
          {items.map(({ label, to, icon: Icon, disabled }) =>
            disabled ? (
              <div
                key={label}
                className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 cursor-not-allowed"
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={17} strokeWidth={2} />
                  {label}
                </span>
                <span className="text-[9px] font-semibold bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">SOON</span>
              </div>
            ) : (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={17} strokeWidth={2} />
                {label}
              </NavLink>
            )
          )}
        </nav>
      </aside>
    </>
  );
}