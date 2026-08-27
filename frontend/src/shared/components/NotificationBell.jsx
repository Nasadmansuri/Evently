import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Trash2, X, CheckCheck, Inbox, Sparkles } from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/notification.service';

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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

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

  const handleMarkReadAndClear = async (id, e) => {
    e?.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
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
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition active:scale-95 focus:outline-none"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : 'Notifications'
        }
      >
        <Bell size={19} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-[-40px] sm:right-0 mt-2.5 w-[320px] sm:w-[360px] rounded-[22px] border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/90 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-extrabold text-primary-700">
                  {unreadCount}
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
          <div className="max-h-88 overflow-y-auto divide-y divide-slate-100">
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
                  onClick={(e) => handleMarkReadAndClear(n.id, e)}
                  className="group relative flex items-start justify-between gap-2.5 p-3 text-left transition hover:bg-slate-50/80 cursor-pointer"
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-600 shrink-0" />
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {n.title}
                      </p>
                    </div>
                    <p className="mt-1 text-[11.5px] text-slate-600 leading-snug line-clamp-2">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      {timeAgo(n.created_at)}
                    </p>
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