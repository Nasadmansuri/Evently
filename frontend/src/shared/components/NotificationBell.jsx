import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Trash2, X, CheckCheck, Inbox, ChevronRight,
  ShieldAlert, AlertTriangle, Calendar, CheckCircle2, Ticket
} from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/notification.service';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../utils/navigation';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getNotificationIcon(title = '', message = '') {
  const t = (title + ' ' + message).toLowerCase();
  if (t.includes('deletion request') || t.includes('deletion')) {
    return <ShieldAlert size={14} className="text-rose-600 shrink-0" />;
  }
  if (t.includes('cancel') || t.includes('suspend') || t.includes('reject')) {
    return <AlertTriangle size={14} className="text-amber-600 shrink-0" />;
  }
  if (t.includes('registration') || t.includes('ticket') || t.includes('confirmed')) {
    return <Ticket size={14} className="text-emerald-600 shrink-0" />;
  }
  if (t.includes('event') || t.includes('published') || t.includes('scheduled')) {
    return <Calendar size={14} className="text-primary-600 shrink-0" />;
  }
  return <Bell size={14} className="text-primary-600 shrink-0" />;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || !localStorage.getItem('evently_token')) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count);
    } catch (err) {
      if (err.response?.status === 401) {
        setUnreadCount(0);
      } else {
        console.error('Failed to fetch unread count:', err);
      }
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user || !localStorage.getItem('evently_token')) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setNotifications([]);
      } else {
        console.error('Failed to fetch notifications:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleDismiss = async (id, isRead, e) => {
    e?.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    // 1. Mark as read in local state
    setNotifications((prev) => prev.filter((item) => item.id !== n.id));
    if (!n.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);

    // 2. Mark as read on backend
    try {
      await markNotificationRead(n.id);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }

    // 3. Direct routing if notification has link or event_id
    if (n.link) {
      navigate(n.link);
      return;
    }
    if (n.event_id) {
      navigate(`/events/${n.event_id}`);
      return;
    }

    // 4. Smart fallback routing based on notification content and user role
    const title = (n.title || '').toLowerCase();
    const message = (n.message || '').toLowerCase();

    if (title.includes('deletion request') || message.includes('deletion request')) {
      if (user?.role === 'admin') {
        navigate('/admin/events');
      } else {
        navigate('/faculty/my-events');
      }
    } else if (title.includes('deletion') || title.includes('cancelled')) {
      if (user?.role === 'faculty') {
        navigate('/faculty/my-events');
      } else if (user?.role === 'admin') {
        navigate('/admin/events');
      } else {
        navigate('/events');
      }
    } else if (title.includes('registration') || title.includes('registered') || title.includes('ticket')) {
      if (user?.role === 'student' || user?.role === 'guest') {
        navigate('/student/registrations');
      } else if (user?.role === 'faculty') {
        navigate('/faculty/my-events');
      } else {
        navigate('/admin/events');
      }
    } else if (title.includes('faculty') && (title.includes('approval') || title.includes('approved'))) {
      if (user?.role === 'admin') {
        navigate('/admin/users');
      } else {
        navigate('/faculty/dashboard');
      }
    } else if (title.includes('event') || message.includes('event')) {
      const extracted = (n.title || '').replace(/^(new event|event live|event cancelled|event deletion request):\s*/i, '').trim();
      if (user?.role === 'admin') {
        navigate('/admin/events');
      } else if (user?.role === 'faculty') {
        navigate('/faculty/my-events');
      } else if (extracted) {
        navigate(`/events?search=${encodeURIComponent(extracted)}`);
      } else {
        navigate('/events');
      }
    } else {
      navigate(getDashboardPath(user));
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await clearAllNotifications();
    } catch (err) {
      console.error('Failed to clear all:', err);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={toggleOpen}
        className="group relative flex h-10 w-10 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-2xs transition-all duration-300 ease-out hover:bg-slate-50 hover:border-slate-300/90 hover:text-primary-700 hover:shadow-xs hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : 'Notifications'
        }
      >
        <Bell size={19} className="text-slate-600 group-hover:text-primary-700 transition-colors duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 sm:right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] rounded-[22px] border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150" style={{ right: 'max(-40px, calc(-50vw + 50%))' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/90 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-extrabold text-primary-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-primary-700 transition active:scale-95"
                title="Clear all notifications"
              >
                <CheckCheck size={13} className="text-primary-600" />
                <span>Clear all</span>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="px-4 py-10 text-center text-xs text-slate-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-9 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 mb-2.5 shadow-2xs">
                  <Inbox size={20} className="text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-slate-800">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No new notifications right now
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className="group relative flex items-start justify-between gap-2.5 p-3.5 text-left transition hover:bg-slate-50/90 cursor-pointer"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-1">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition">
                      {getNotificationIcon(n.title, n.message)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {n.title}
                        </p>
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11.5px] text-slate-600 leading-snug line-clamp-2">
                        {n.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10.5px] font-semibold text-primary-600 group-hover:text-primary-700">
                        <span>Click to view details</span>
                        <ChevronRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Dismiss Button */}
                  <button
                    onClick={(e) => handleDismiss(n.id, n.is_read, e)}
                    className="shrink-0 p-1 text-slate-300 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition"
                    title="Dismiss"
                    aria-label="Dismiss"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}